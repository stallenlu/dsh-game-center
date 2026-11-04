/* Minimal check: wiring + Tetris core logic. Run: node game-center/verify.mjs */
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
// Expose the pure helpers from inside the factory for assertions.
const marker = "    return {\n      inject: ['slots', 'locale'],";
assert.ok(src.includes(marker), 'factory return marker not found');
src = src.replace(marker, "    globalThis.__GC__ = { COLS, ROWS, SHAPES, rotateShape, emptyBoard, makePiece, collides, merge, clearLines, initialState, step, move, softDrop, rotate, hardDrop, ghostY, lockAndSpawn };\n" + marker);

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
globalThis.document = { createElement: () => ({ dataset: {} }), head: { appendChild: () => {} } };
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
const full = G.emptyBoard(); full[19] = Array(10).fill('#fff'); full[18][0] = '#abc';
const cl = G.clearLines(full);
assert.equal(cl.cleared, 1);
assert.equal(cl.board.length, 20);
assert.equal(cl.board[19][0], '#abc', 'surviving row shifted down');
assert.equal(cl.board[0].every((c) => c === null), true, 'fresh top row');
// merge places piece color
const p = { type: 'O', shape: G.SHAPES.O, color: '#facc15', x: 3, y: 0 };
const merged = G.merge(G.emptyBoard(), p);
assert.equal(merged[0][3], '#facc15'); assert.equal(merged[1][4], '#facc15');
// initialState sanity
const s0 = G.initialState();
assert.equal(s0.board.length, 20); assert.ok(s0.piece && s0.next); assert.equal(s0.score, 0);
// step: gravity moves down; softDrop adds point; hardDrop lands at bottom & spawns
const s1 = G.step({ ...s0, started: true });
assert.equal(s1.piece.y, 1, 'gravity');
const sd = G.softDrop({ ...s0, started: true });
assert.equal(sd.score, 1, 'soft drop point');
const hd = G.hardDrop({ ...s0, started: true, piece: { ...s0.piece, shape: G.SHAPES.O, color: '#facc15', x: 0, y: 0 } });
assert.equal(hd.board[19][0], '#facc15', 'hard drop landed piece locked');
assert.equal(hd.board[18][1], '#facc15');
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

console.log('game-center verify: ALL OK (wiring + ' + registrations.length + ' slots + Tetris core)');
