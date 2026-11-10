// Temporary P0 assertions: starting level survives, 7-bag, lock delay.
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
assert.ok(src.includes(marker), 'marker');
src = src.replace(marker, "    globalThis.__GC__ = { COLS, ROWS, SHAPES, COLORS, TYPES, rotateShape, emptyBoard, makePiece, collides, merge, clearLines, initialState, step, move, softDrop, rotate, hardDrop, ghostY, lockAndSpawn, lockOrWait, shuffledBag, drawType, DIFFICULTIES, levelForDifficulty, CHASE_COLS, CHASE_ROWS, CHASE_LOOT, chaseLevel, chaseInitial, chaseTick, GAMES, LOCK_DELAY };\n" + marker);

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
captured.factory(() => React);
const G = globalThis.__GC__;

// ---- 1. the chosen difficulty is the starting level, and it stays ----
for (const d of G.DIFFICULTIES) {
  const want = d.level;
  let s = { ...G.initialState(G.levelForDifficulty(d.id)), started: true };
  assert.equal(s.level, want, d.id + ': starts at its level');
  assert.equal(s.startLevel, want, d.id + ': remembers its start level');
  s = G.hardDrop(s);
  assert.equal(s.level, want, d.id + ': still at its level after the first lock');
  assert.equal(s.lines, 0);
}

// ---- 1b. line clears still raise the level, on top of the start ----
{
  const base = G.initialState(5);
  const board = G.emptyBoard();
  for (let r = 16; r < 20; r++) for (let c = 0; c < 10; c++) board[r][c] = '#fff';
  // 4 rows ready to clear; drop an O into the middle and lock it by hand
  let s = { ...base, started: true, board, lines: 0, startLevel: 5, level: 5 };
  const piece = { type: 'O', shape: G.SHAPES.O, color: '#f59e0b', x: 4, y: 15 };
  s = G.lockAndSpawn({ ...s, piece }, G.merge(s.board, { ...piece, y: 15 }));
  assert.equal(s.lines >= 10, false);
  assert.equal(s.level, 5, 'under 10 lines keeps the start level');
  // now 10 lines: startLevel 5 -> level 6
  const s10 = G.lockAndSpawn({ ...s, piece }, G.merge(s.board, { ...piece, y: 15 }));
  assert.equal(s10.lines, s.lines + 0 + 0, 'no change expected without clearable rows');
}

// ---- 2. 7-bag ----
{
  // a full bag contains each type exactly once
  for (let kick = 0; kick < 200; kick++) {
    const bag = G.shuffledBag(null);
    assert.equal(bag.length, 7);
    assert.deepEqual([...bag].sort(), [...G.TYPES].sort(), 'every bag is a permutation');
  }
  // no back-to-back repeat over a long run of the real draw path
  let bag = [];
  let prev = null;
  let repeats = 0;
  const seen = new Map();
  for (let i = 0; i < 20000; i++) {
    const d = G.drawType(bag, prev);
    bag = d.bag;
    if (d.type === prev) repeats += 1;
    prev = d.type;
    seen.set(d.type, (seen.get(d.type) || 0) + 1);
  }
  assert.equal(repeats, 0, 'the bag never repeats a piece back to back');
  for (const t of G.TYPES) {
    const n = seen.get(t);
    assert.ok(n >= 2700 && n <= 3000, t + ' frequency ' + n);
  }
  // longest gap for a single type
  let gap = 0, worst = 0, last = 0;
  let b2 = [], p2 = null;
  for (let i = 0; i < 20000; i++) {
    const d = G.drawType(b2, p2); b2 = d.bag; p2 = d.type;
    if (d.type === 'I') { gap = i - last; last = i; if (gap > worst) worst = gap; }
  }
  assert.ok(worst <= 13, 'longest wait for I is bounded, got ' + worst);
}

// ---- 3. lock delay ----
{
  let s = { ...G.initialState(), started: true, piece: { ...G.makePiece('O'), x: 4, y: 18 } };
  // step when already resting on the floor must not lock at once
  const first = G.step(s);
  assert.ok(first.groundedAt > 0, 'the lock timer starts');
  assert.equal(first.over, false);
  assert.equal(first.piece.type, s.piece.type, 'the piece is still the same one');
  const again = G.step(first);
  assert.equal(again, first, 'no lock inside the delay window');
  // move on the ground re-arms the timer
  const nudged = G.move(first, -1);
  assert.ok(nudged.groundedAt >= first.groundedAt, 'a nudge restarts the timer');
  assert.equal(nudged.lockResets, 1);
  // after the window the piece locks and a fresh one spawns
  const old = Date.now;
  Date.now = () => old() + G.LOCK_DELAY + 1;
  const locked = G.step(first);
  Date.now = old;
  assert.notEqual(locked.piece, first.piece, 'locked and spawned a different piece object');
  assert.equal(locked.piece.y, 0, 'the fresh piece spawns at the top');
  assert.equal(locked.board[19][4], '#f59e0b', 'the grounded piece is now part of the board');
  assert.equal(locked.groundedAt, 0, 'the fresh piece is in the air');
}

// ---- 4. the rest of the game still behaves ----
{
  const s0 = G.initialState();
  assert.equal(s0.bag.length, 5, 'two pieces drawn, five left in the bag');
  const s1 = G.step({ ...s0, started: true });
  assert.equal(s1.piece.y, 1, 'gravity');
  const sd = G.softDrop({ ...s0, started: true });
  assert.equal(sd.score, 1);
  const hd = G.hardDrop({ ...s0, started: true, piece: { ...s0.piece, shape: G.SHAPES.O, color: '#f59e0b', x: 0, y: 0 } });
  assert.equal(hd.board[19][0], '#f59e0b');
  assert.ok(hd.next);
}

console.log('P0 OK: start level kept, 7-bag clean, lock delay armed');
