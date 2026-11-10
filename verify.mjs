/* Minimal check: wiring + the two games' core logic. Run: node game-center/verify.mjs */
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
// Version governance: the single display constant must track package.json.
const pkgVersion = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
const versionMatch = src.match(/const VERSION = 'v([\d.]+)'/);
assert.ok(versionMatch, 'client.js is missing the VERSION constant');
assert.equal(versionMatch[1], pkgVersion, 'client.js VERSION must match package.json version');
// Expose the pure helpers from inside the factory for assertions.
const marker = "    return {\n      inject: ['slots', 'locale'],";
assert.ok(src.includes(marker), 'factory return marker not found');
src = src.replace(marker, "    globalThis.__GC__ = { COLS, ROWS, SHAPES, rotateShape, emptyBoard, makePiece, collides, merge, clearLines, initialState, step, move, softDrop, rotate, hardDrop, ghostY, lockAndSpawn, CHASE_COLS, CHASE_ROWS, CHASE_WALL, CHASE_LOOT, CHASE_THIEF_START, CHASE_COP_STARTS, chaseWalkable, chaseLevel, chaseStep, chaseInitial, chaseReset, chaseTick, GAMES };\n" + marker);

const React = {
  createElement: () => ({}),
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {}, useMemo: (f) => f(), useRef: () => ({ current: undefined }),
};
let captured;
globalThis.window = {
  __ModuleLoader__: { load: (o) => { captured = o; } },
  addEventListener: () => {}, removeEventListener: () => {},
};
globalThis.document = { createElement: () => ({ dataset: {} }), head: { appendChild: () => {} }, querySelector: () => null };
new Function('require', src)(() => React);

assert.equal(captured.id, 'dsh-game-center');
const mod = captured.factory(() => React);
assert.ok(Array.isArray(mod.inject) && mod.inject.includes('slots') && mod.inject.includes('locale'));
assert.equal(typeof mod.apply, 'function');

// --- wiring: apply() must register both slots + locales + styles ---
const registrations = [];
const effects = [];
const ctx = {
  get: (k) => (k === 'locale' ? { register: (...a) => effects.push(['locale', ...a]), bind: () => () => 'Game Center', getSnapshot: () => ({ active: 'en' }), subscribe: () => () => {} } : null),
  effect: (fn) => { effects.push(['effect']); fn(); },
  slots: {
    inject: (slot, cb) => { const r = cb(); registrations.push({ slot, options: r && r.options }); },
    register: (options) => ({ options }),
  },
};
mod.apply(ctx);
const side = registrations.find((r) => r.slot === 'sidebar.panellist');
const main = registrations.find((r) => r.slot === 'main');
assert.ok(side && side.options.id === 'game-center', 'sidebar.panellist id');
assert.ok(main && main.options.key === 'game-center', 'main key');
assert.ok(effects.some((e) => e[0] === 'locale' && e[2] === 'zh'), 'zh locale');
assert.ok(effects.some((e) => e[0] === 'locale' && e[2] === 'en'), 'en locale');

// --- Tetris logic ---
const G = globalThis.__GC__;
assert.equal(G.COLS, 10); assert.equal(G.ROWS, 20);
// emptyBoard is 20x10 of null
assert.equal(G.emptyBoard().length, 20); assert.equal(G.emptyBoard()[0].length, 10);
// rotateShape(I) 4x4: horizontal row -> vertical col
const rI = G.rotateShape(G.SHAPES.I);
assert.equal(rI[0][2], 1); assert.equal(rI[1][2], 1); assert.equal(rI[2][2], 1); assert.equal(rI[3][2], 1);
// rotate 4x returns to original
assert.deepEqual(G.rotateShape(G.rotateShape(G.rotateShape(G.rotateShape(G.SHAPES.T)))), G.SHAPES.T);
// collides: wall + floor + stack
const board = G.emptyBoard();
assert.equal(G.collides(board, G.SHAPES.O, -1, 0), true, 'left wall');
assert.equal(G.collides(board, G.SHAPES.O, 9, 0), true, 'right wall');
assert.equal(G.collides(board, G.SHAPES.O, 0, 19), true, 'floor');
board[5][4] = '#fff';
assert.equal(G.collides(board, G.SHAPES.O, 4, 4), true, 'stack');
// clearLines: one full row removed, new empty row on top
const full = G.emptyBoard(); full[19] = Array(10).fill('#fff'); full[18][0] = '#a855f7';
const cl = G.clearLines(full);
assert.equal(cl.cleared, 1);
assert.equal(cl.board.length, 20);
assert.equal(cl.board[19][0], '#a855f7', 'surviving row shifted down');
assert.equal(cl.board[0].every((c) => c === null), true, 'fresh top row');
// merge places piece color
const p = { type: 'O', shape: G.SHAPES.O, color: '#f59e0b', x: 3, y: 0 };
const merged = G.merge(G.emptyBoard(), p);
assert.equal(merged[0][3], '#f59e0b'); assert.equal(merged[1][4], '#f59e0b');
// initialState sanity
const s0 = G.initialState();
assert.equal(s0.board.length, 20); assert.ok(s0.piece && s0.next); assert.equal(s0.score, 0);
// step: gravity moves down; softDrop adds point; hardDrop lands at bottom & spawns
const s1 = G.step({ ...s0, started: true });
assert.equal(s1.piece.y, 1, 'gravity');
const sd = G.softDrop({ ...s0, started: true });
assert.equal(sd.score, 1, 'soft drop point');
const hd = G.hardDrop({ ...s0, started: true, piece: { ...s0.piece, shape: G.SHAPES.O, color: '#f59e0b', x: 0, y: 0 } });
assert.equal(hd.board[19][0], '#f59e0b', 'hard drop landed piece locked');
assert.equal(hd.board[18][1], '#f59e0b');
assert.equal(hd.score > 0, true, 'hard drop scored');
assert.ok(hd.next, 'spawned a next piece');
// move respects walls
const mv = G.move({ ...s0, started: true, piece: { ...s0.piece, x: 0, y: 5, shape: G.SHAPES.O } }, -1);
assert.equal(mv.piece.x, 0, 'blocked at left wall');
// rotate with wall kick
const rot = G.rotate({ ...s0, started: true });
assert.ok(rot.piece.shape, 'rotate returns a shape');
// ghostY is >= piece.y and collision-free above landing
const gy = G.ghostY({ ...s0, started: true, piece: { ...s0.piece, shape: G.SHAPES.O, x: 0, y: 0 } });
assert.ok(gy >= 18, 'ghost lands near bottom');

// --- Cops & Robbers: the map is sound ---
assert.equal(G.CHASE_COLS, 15); assert.equal(G.CHASE_ROWS, 13);
G.CHASE_WALL.forEach((row, r) => {
  assert.equal(row.length, 15, 'map row ' + r + ' width');
  assert.equal(row[0] === true && row[14] === true, true, 'map row ' + r + ' side border');
});
assert.equal(G.CHASE_WALL[0].every(Boolean), true, 'top border');
assert.equal(G.CHASE_WALL[12].every(Boolean), true, 'bottom border');
G.CHASE_LOOT.forEach((p) => assert.equal(G.chaseWalkable(p[0], p[1]), true, 'loot on floor ' + p));
G.CHASE_COP_STARTS.forEach((p) => assert.equal(G.chaseWalkable(p.x, p.y), true, 'cop spawn on floor'));
assert.equal(G.chaseWalkable(G.CHASE_THIEF_START.x, G.CHASE_THIEF_START.y), true, 'thief spawn on floor');
assert.equal(G.CHASE_LOOT.some((p) => p[0] === G.CHASE_THIEF_START.x && p[1] === G.CHASE_THIEF_START.y), false, 'no loot under the thief');
G.CHASE_COP_STARTS.forEach((c) => assert.equal(G.CHASE_LOOT.some((p) => p[0] === c.x && p[1] === c.y), false, 'no loot under a cop'));
assert.equal(G.chaseWalkable(0, 0), false, 'the border is wall');
assert.equal(G.chaseWalkable(1, 1), true, 'the corner is floor');
// every floor cell must be reachable from the thief, or loot could be sealed away
const seen = new Set([G.CHASE_THIEF_START.y * 15 + G.CHASE_THIEF_START.x]);
const queue = [G.CHASE_THIEF_START];
while (queue.length) {
  const c = queue.shift();
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach((d) => {
    const nx = c.x + d[0]; const ny = c.y + d[1]; const k = ny * 15 + nx;
    if (!G.chaseWalkable(nx, ny) || seen.has(k)) return;
    seen.add(k); queue.push({ x: nx, y: ny });
  });
}
let floorCells = 0;
G.CHASE_WALL.forEach((row) => row.forEach((w) => { if (!w) floorCells += 1; }));
assert.equal(seen.size, floorCells, 'every floor cell is reachable');

// --- Cops & Robbers: rules ---
assert.equal(G.chaseStep({ x: 5, y: 11 }, { x: 5, y: 3 }).y, 10, 'one cell up the corridor');
const around = G.chaseStep({ x: 7, y: 11 }, { x: 7, y: 3 });
assert.ok(around, 'a route exists around the wall');
assert.equal(Math.abs(around.x - 7) + Math.abs(around.y - 11), 1, 'still a single step');
assert.ok(around.x !== 7, 'steps aside when the straight line is walled');
assert.equal(G.chaseStep({ x: 7, y: 3 }, { x: 7, y: 3 }), null, 'no step when already there');
const lv1 = G.chaseLevel('normal', 1);
assert.equal(lv1.cops, 2); assert.equal(lv1.copEvery, 2); assert.equal(lv1.tick, 175);
assert.equal(G.chaseLevel('easy', 1).cops, 1);
assert.equal(G.chaseLevel('hard', 1).cops, 3);
assert.equal(G.chaseLevel('normal', 2).cops, 3, 'an extra cop every two levels');
assert.equal(G.chaseLevel('normal', 2).tick, 165, 'levels speed the police up');
assert.ok(G.chaseLevel('normal', 40).tick >= 90, 'the tick has a floor');
assert.equal(G.chaseLevel('nope', 1).cops, 2, 'an unknown difficulty falls back to normal');
// a tick runs the thief, moves the cops on cadence, and collects loot
let cs = { ...G.chaseInitial('normal'), started: true, want: { x: 0, y: -1 } };
cs = G.chaseTick(cs);
assert.equal(cs.thief.y, G.CHASE_THIEF_START.y - 1, 'thief stepped up');
assert.equal(cs.dir.y, -1, 'the turn was committed');
// the thief cannot walk into a wall, and keeps its line when a turn is blocked
const blocked = G.chaseTick({ ...G.chaseInitial('easy'), started: true, thief: { x: 1, y: 5 }, want: { x: -1, y: 0 } });
assert.equal(blocked.thief.x, 1, 'thief stopped by the wall');
// loot scores; taking the last piece clears the level and sends another cop
let one = { ...G.chaseInitial('normal'), started: true, thief: { x: 3, y: 9 }, loot: [{ x: 3, y: 9 }, { x: 11, y: 9 }] };
one = G.chaseTick(one);
assert.equal(one.loot.length, 1, 'one piece collected');
assert.equal(one.score, 100, 'loot scored');
assert.equal(one.level, 1, 'the level continues');
let pick = { ...G.chaseInitial('normal'), started: true, thief: { x: 3, y: 9 }, loot: [{ x: 3, y: 9 }] };
pick = G.chaseTick(pick);
assert.equal(pick.score, 350, 'loot plus clear bonus');
assert.equal(pick.level, 2, 'level cleared');
assert.equal(pick.loot.length, G.CHASE_LOOT.length, 'fresh loot on the next level');
assert.equal(pick.cops.length, 3, 'the next level sends another cop');
// a cop reaching the thief costs a life and resets the board
let caught = { ...G.chaseInitial('normal'), started: true, thief: { x: 5, y: 9 }, cops: [{ x: 5, y: 8 }], ticks: 1 };
caught = G.chaseTick(caught);
assert.equal(caught.lives, 2, 'a life was lost');
assert.equal(caught.thief.x, G.CHASE_THIEF_START.x, 'thief is back at the start');
assert.equal(caught.over, false, 'the run continues');
// losing the last life ends the run; a paused tick changes nothing
let dead = { ...G.chaseInitial('normal'), started: true, lives: 1, thief: { x: 5, y: 9 }, cops: [{ x: 5, y: 8 }], ticks: 1 };
dead = G.chaseTick(dead);
assert.equal(dead.lives, 0); assert.equal(dead.over, true, 'the last life ends the run');
const frozen = { ...G.chaseInitial('normal'), started: true, paused: true };
assert.equal(G.chaseTick(frozen), frozen, 'a paused tick is a no-op');

// --- card artwork: each picture is built from the game's own data ---
assert.equal(G.GAMES.length, 2, 'two games registered');
for (const game of G.GAMES) {
  const cols = game.thumb[0].length;
  assert.ok(cols > 1 && game.thumb.length > 1, game.id + ': the picture is a grid');
  for (const row of game.thumb) assert.equal(row.length, cols, game.id + ': rows are equal width');
  assert.ok(game.thumb.some((row) => row.some(Boolean)), game.id + ': the picture is not blank');
  for (const row of game.thumb) {
    for (const v of row) {
      if (v) assert.match(String(v), /^#[0-9a-f]{6}$/i, game.id + ': cells hold colours');
    }
  }
}
const tetrisArt = G.GAMES.find((g) => g.id === 'tetris').thumb;
const tetrisFloor = tetrisArt[tetrisArt.length - 1].filter(Boolean).length;
assert.ok(tetrisFloor >= G.COLS - 1, 'the tetris picture rests its pieces on the floor');
assert.ok(new Set(tetrisArt.flat().filter(Boolean)).size >= 3, 'the tetris picture uses the real piece colours');
const chaseArt = G.GAMES.find((g) => g.id === 'chase').thumb;
assert.equal(chaseArt.length, G.CHASE_ROWS, 'the chase picture is the real map height');
assert.equal(chaseArt[0].length, G.CHASE_COLS, 'the chase picture is the real map width');
assert.ok(chaseArt[0].every(Boolean) && chaseArt[chaseArt.length - 1].every(Boolean), 'the chase picture keeps its wall border');
assert.ok(chaseArt[G.CHASE_THIEF_START.y][G.CHASE_THIEF_START.x], 'the chase picture marks the thief');

console.log('game-center verify: ALL OK (wiring + ' + registrations.length + ' slots + 2 games)');
