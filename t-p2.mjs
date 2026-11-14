// Temporary P2 assertions: T-spin scoring, combo scoring, the flashbang item,
// and the game-registry extension point.
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
assert.ok(src.includes(marker), 'marker');
src = src.replace(marker, "    globalThis.__GC__ = { COLS, ROWS, SHAPES, COLORS, TYPES, emptyBoard, makePiece, merge, clearLines, initialState, lockAndSpawn, step, move, softDrop, rotate, hardDrop, CHASE_COLS, CHASE_ROWS, CHASE_WALL, CHASE_LOOT, CHASE_COP_STARTS, CHASE_THIEF_START, chaseWalkable, chaseInitial, chaseTick, chaseReset, GAMES, LOCK_DELAY, TSPIN_SCORE, COMBO_STEP, CHASE_STUN_TICKS, CHASE_STUN_CELL };\n" + marker);

const React = {
  createElement: () => ({}),
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {}, useMemo: (f) => f(), useRef: () => ({ current: undefined }),
};
let captured;
globalThis.window = {
  __ModuleLoader__: { load: (o) => { captured = o; } },
  addEventListener: () => {}, removeEventListener: () => {},
  localStorage: { getItem: () => null, setItem: () => {} },
};
globalThis.document = { createElement: () => ({ dataset: {} }), head: { appendChild: () => {} } };
new Function('require', src)(() => React);
const mod = captured.factory(() => React);
const G = globalThis.__GC__;

// ---- 1. a T turned into a slot with three blocked corners is a T-spin ----
{
  const board = G.emptyBoard();
  // blockers on three corners of the T's 3x3 box, none of them cells the T occupies
  board[16][4] = '#000000';
  board[16][6] = '#000000';
  board[18][4] = '#000000';
  const piece = { type: 'T', shape: G.SHAPES.T.map((r) => r.slice()), color: '#a855f7', x: 4, y: 16 };
  const base = { ...G.initialState(), started: true, board, piece, score: 0, lines: 0, combo: 0, tspins: 0 };

  const spun = G.lockAndSpawn({ ...base, rotated: true }, G.merge(board, piece));
  assert.equal(spun.tspins, 1, 'the turn counts as a T-spin');
  assert.equal(spun.score, G.TSPIN_SCORE[0] * 1, 'a spin that clears nothing still pays the T-spin table');

  const plain = G.lockAndSpawn({ ...base, rotated: false }, G.merge(board, piece));
  assert.equal(plain.tspins, 0, 'the same slot without a turn is not a spin');
  assert.equal(plain.score, 0, 'and pays nothing, because it cleared nothing');
}

// ---- 2. the turn flag survives to the lock, and gravity drops it ----
{
  const s = { ...G.initialState(), started: true };
  const turned = G.rotate(s);
  assert.notEqual(turned.piece.shape, s.piece.shape, 'the piece actually turned');
  assert.equal(turned.rotated, true, 'a turn arms the spin flag');
  assert.equal(G.step(turned).rotated, false, 'falling afterwards disarms it');
  assert.equal(G.move(turned, 1).rotated, false, 'sliding afterwards disarms it');
  const resting = { ...turned, groundedAt: 0 };
  assert.equal(G.hardDrop(resting).tspins >= 0, true, 'an unstoppable hard drop never throws');
  const moved = G.hardDrop(turned);
  assert.equal(moved.rotated, false, 'a hard drop that travels disarms the spin flag');
}

// ---- 3. consecutive clears pay a combo bonus, a miss resets the run ----
{
  const full = G.emptyBoard();
  for (let x = 0; x < G.COLS; x++) full[19][x] = '#f59e0b';
  let s = { ...G.initialState(), started: true, score: 0, lines: 0, combo: 0 };
  s = G.lockAndSpawn(s, full.map((r) => r.slice()));
  assert.equal(s.combo, 1, 'first clear opens a run');
  assert.equal(s.score, 100, 'first clear pays the plain table');
  s = G.lockAndSpawn(s, full.map((r) => r.slice()));
  assert.equal(s.combo, 2, 'second clear extends it');
  assert.equal(s.score, 250, 'and adds the combo step');
  s = G.lockAndSpawn(s, full.map((r) => r.slice()));
  assert.equal(s.combo, 3, 'third clear extends it further');
  assert.equal(s.score, 450, 'the bonus grows with the run');
  const miss = G.lockAndSpawn(s, G.merge(s.board, s.piece));
  assert.equal(miss.combo, 0, 'a piece that clears nothing resets the run');
}

// ---- 4. the flashbang freezes the police and does not touch the loot ----
{
  const item = { x: G.CHASE_STUN_CELL.x, y: G.CHASE_STUN_CELL.y };
  assert.equal(G.CHASE_WALL[item.y][item.x], false, 'the flashbang sits on the floor');
  assert.ok(!G.CHASE_LOOT.some(([x, y]) => x === item.x && y === item.y), 'and not on a piece of loot');
  assert.ok(!G.CHASE_COP_STARTS.some((c) => c.x === item.x && c.y === item.y), 'and not on a police spawn');
  assert.ok(G.chaseWalkable(item.x, item.y), 'and the thief can reach it');

  const start = { ...G.chaseInitial('hard'), started: true, thief: { ...item }, want: null, dir: null };
  const took = G.chaseTick(start);
  assert.equal(took.item, null, 'the item is consumed');
  assert.ok(took.stun > 0, 'the cops are frozen');
  assert.equal(took.score, 50, 'picking it up pays a little');
  assert.deepEqual(took.cops, start.cops, 'and the police do not move on that tick');
  assert.equal(took.loot.length, G.CHASE_LOOT.length, 'no loot was touched');

  // the freeze runs out on its own and the police move again
  let s = took;
  let frozen = 0;
  while (s.stun > 0 && frozen < 40) {
    const before = s.cops;
    s = G.chaseTick(s);
    if (s.stun > 0) assert.deepEqual(s.cops, before, 'still frozen at ' + frozen);
    frozen += 1;
  }
  assert.equal(s.stun, 0, 'the freeze ends');
  assert.ok(frozen <= G.CHASE_STUN_TICKS, 'and lasts no longer than promised');
  // the police resume on their own cadence, which may not be this very tick
  let resumed = s;
  for (let i = 0; i < 4 && resumed.cops.every((c, n) => c.x === s.cops[n].x && c.y === s.cops[n].y); i++) {
    resumed = G.chaseTick(resumed);
  }
  assert.notDeepEqual(resumed.cops, s.cops, 'the police move again once it wears off');
}

// ---- 5. a fresh level brings the flashbang back ----
{
  const picked = { ...G.chaseInitial('normal'), started: true, item: null };
  const respawned = G.chaseReset(picked);
  assert.equal(respawned.stun, 0, 'respawn clears the stun counter');
  const fresh = G.chaseTick({ ...picked, loot: [{ x: 3, y: 9 }], thief: { x: 3, y: 9 } });
  assert.equal(fresh.level, 2, 'the last loot clears the level');
  assert.deepEqual(fresh.item, { x: G.CHASE_STUN_CELL.x, y: G.CHASE_STUN_CELL.y }, 'and the flashbang is back');
}

// ---- 6. the registry takes games from other bundles ----
{
  assert.equal(typeof mod.registerGame, 'function', 'registerGame is exported');
  assert.equal(typeof mod.listGames, 'function', 'listGames is exported');
  assert.equal(mod.listGames().length, 3, 'the three built-in games are listed');
  assert.equal(G.GAMES.length, 3, 'and the built-in array is untouched');

  const off = mod.registerGame({ id: 'demo', name: 'Demo', render: () => null });
  assert.equal(mod.listGames().length, 4, 'an outside game shows up');
  assert.equal(mod.listGames()[3].id, 'demo', 'at the end of the list');
  assert.equal(G.GAMES.length, 3, 'without being mixed into the built-ins');

  mod.registerGame({ id: 'demo', name: 'Again', render: () => null });
  assert.equal(mod.listGames().length, 4, 'a duplicate id is refused');
  mod.registerGame({ id: 'tetris', render: () => null });
  assert.equal(mod.listGames().length, 4, 'and a clash with a built-in is refused');
  mod.registerGame({ id: 'norender' });
  mod.registerGame(null);
  mod.registerGame({ render: () => null });
  assert.equal(mod.listGames().length, 4, 'malformed entries are refused');

  off();
  assert.equal(mod.listGames().length, 3, 'unregistering takes it back out');
  off();
  assert.equal(mod.listGames().length, 3, 'and unregistering twice is harmless');
}

console.log('P2 OK: T-spin, combo, flashbang, registry');
