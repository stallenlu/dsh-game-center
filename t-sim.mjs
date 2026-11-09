// Full-play simulation: the real reducer path, many pieces, many runs.
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
src = src.replace(marker, "    globalThis.__GC__ = { initialState, step, move, softDrop, rotate, hardDrop, levelForDifficulty, DIFFICULTIES, TYPES, lockAndSpawn, merge, SHAPES, LOCK_DELAY };\n" + marker);

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

const now0 = Date.now;
let clock = 1_000_000;
Date.now = () => clock;

let totalPieces = 0;
let locked = 0;
const repeats = [];
const startLevels = new Map();

for (const diff of G.DIFFICULTIES) {
  for (let run = 0; run < 12; run++) {
    let s = { ...G.initialState(G.levelForDifficulty(diff.id)), started: true };
    startLevels.set(diff.id, s.level);
    assert.equal(s.level, diff.level, 'start level');
    let guard = 0;
    let prevType = null;
    while (!s.over && guard++ < 4000) {
      // random-but-legal play: shuffle the piece around, then hard drop
      if (s.piece.type === prevType) repeats.push(diff.id + ':' + s.piece.type);
      prevType = s.piece.type;
      for (let i = 0; i < 4; i++) {
        const k = Math.floor(Math.random() * 4);
        if (k === 0) s = G.move(s, -1);
        else if (k === 1) s = G.move(s, 1);
        else s = G.rotate(s);
      }
      const before = s.piece.type;
      s = G.hardDrop(s);
      if (s.piece.type !== before) locked += 1;
      totalPieces += 1;
      assert.equal(s.level, (s.startLevel || 1) + Math.floor(s.lines / 10), 'level formula holds');
      assert.ok(s.level >= diff.level, diff.id + ': level never falls below its start');
      clock += 10;
    }
    assert.equal(s.over, true, 'a random game eventually tops out');
  }
}

// lock delay must be reachable in normal gravity: a piece resting on the floor
// stays put for the window, then locks.
{
  clock = 5_000_000;
  let s = { ...G.initialState(), started: true, piece: { ...G.SHAPES.O && { type: 'O', shape: G.SHAPES.O, color: '#facc15', x: 4, y: 18 } } };
  s = G.step(s);
  assert.ok(s.groundedAt > 0, 'timer armed on the floor');
  const held = s;
  clock += G.LOCK_DELAY - 50;
  assert.equal(G.step(s), s, 'still held just before the window ends');
  clock += 100;
  const after = G.step(s);
  assert.notEqual(after, held, 'locked after the window');
  assert.equal(after.groundedAt, 0);
}

Date.now = now0;
console.log('SIM OK: ' + totalPieces + ' pieces, ' + locked + ' locks, back-to-back repeats: ' + repeats.length);
if (repeats.length) { console.log(repeats.slice(0, 10).join(', ')); process.exitCode = 1; }

// gravity only (no hard drop): the lock delay must not stall a game forever
{
  let clock2 = 9_000_000;
  Date.now = () => clock2;
  let s = { ...G.initialState(), started: true };
  let ticks = 0;
  while (!s.over && ticks < 20000) { s = G.step(s); clock2 += 100; ticks += 1; }
  Date.now = now0;
  assert.equal(s.over, true, 'gravity-only play tops out');
  assert.ok(ticks < 20000, 'and does it in bounded time, took ' + ticks + ' ticks');
  console.log('gravity-only: topped out after ' + ticks + ' gravity ticks (' + s.lines + ' lines)');
}
