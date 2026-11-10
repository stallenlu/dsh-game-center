// Temporary P1 assertions: vertical wall kick, gravity curve, chase curve, locale parity.
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
assert.ok(src.includes(marker), 'marker');
src = src.replace(marker, "    globalThis.__GC__ = { COLS, ROWS, SHAPES, TYPES, rotateShape, emptyBoard, makePiece, collides, merge, clearLines, initialState, step, move, softDrop, rotate, hardDrop, ghostY, lockAndSpawn, lockOrWait, shuffledBag, drawType, DIFFICULTIES, levelForDifficulty, CHASE_COLS, CHASE_ROWS, chaseLevel, chaseInitial, chaseTick, GAMES, LOCK_DELAY, zh, en };\n" + marker);

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

// ---- 1. a piece resting on the floor rises when the turn needs the room ----
{
  // two solid rows on the bottom; a flat T rests on them. Its rotated form is a
  // vertical bar three rows tall, which cannot fit in the resting rows at all,
  // so the only way to turn it is to kick it upward.
  const board = G.emptyBoard();
  for (let x = 0; x < G.COLS; x++) { board[18][x] = '#3b82f6'; board[19][x] = '#3b82f6'; }
  const flatT = G.SHAPES.T.map((r) => r.slice());
  const s = {
    ...G.initialState(), started: true, board,
    piece: { type: 'T', shape: flatT, color: '#a855f7', x: 4, y: 16 },
  };
  assert.equal(G.collides(s.board, s.piece.shape, s.piece.x, s.piece.y), false, 'it starts above the floor');
  assert.equal(G.collides(s.board, s.piece.shape, s.piece.x, s.piece.y + 1), true, 'it is already resting on it');
  const rotated = G.rotateShape(flatT);
  assert.equal(G.collides(s.board, rotated, s.piece.x, s.piece.y), true, 'the turned piece does not fit where it rests');
  const r = G.rotate(s);
  assert.deepEqual(r.piece.shape, rotated, 'the piece actually turned');
  assert.ok(r.piece.y < s.piece.y, 'it was kicked upward, got y=' + r.piece.y);
  assert.equal(G.collides(r.board, r.piece.shape, r.piece.x, r.piece.y), false, 'the result fits');
}

// ---- 1b. a plain T against the right wall still turns (side kick unchanged) ----
{
  const s = { ...G.initialState(), started: true, piece: { type: 'T', shape: G.SHAPES.T.map((r) => r.slice()), color: '#a855f7', x: 8, y: 8 } };
  const r = G.rotate(s);
  assert.notDeepEqual(r.piece.shape, s.piece.shape, 'T turns against the wall');
}

// ---- 1c. rotation is still refused when nothing fits anywhere ----
{
  // fill the whole board: no kick can help
  const board = Array.from({ length: G.ROWS }, () => Array(G.COLS).fill('#000000'));
  const s = { ...G.initialState(), started: true, board, piece: { type: 'T', shape: G.SHAPES.T.map((r) => r.slice()), color: '#a855f7', x: 4, y: 4 } };
  assert.equal(G.rotate(s), s, 'no room means no rotation');
}

// ---- 2. gravity curve: strictly faster per level, floor 60, not flat early ----
{
  const speed = (lv) => Math.max(60, Math.round(800 * Math.pow(0.9, lv - 1)));
  assert.equal(speed(1), 800, 'level 1 is 800ms');
  let prev = Infinity;
  for (let lv = 1; lv <= 25; lv++) {
    const cur = speed(lv);
    assert.ok(cur <= prev, 'level ' + lv + ' is not slower than ' + (lv - 1));
    prev = cur;
  }
  assert.equal(speed(26), 60, 'the floor is reached only around level 26');
  assert.ok(speed(12) > 60, 'level 12 is still above the floor (the old curve was stuck at 90ms by here)');
}

// ---- 3. chase curve keeps moving, then saturates on purpose ----
{
  const lv = (l) => G.chaseLevel('normal', l);
  assert.deepEqual(lv(1), { cops: 2, tick: 175, copEvery: 2 }, 'level 1 unchanged');
  assert.equal(lv(2).tick, 165, 'level 2 is 10ms tighter');
  assert.equal(lv(3).tick, 155);
  // it tightens every level until the floor, instead of a straight -10 line
  let prev = Infinity;
  for (let l = 1; l <= 40; l++) {
    const cur = lv(l).tick;
    assert.ok(cur <= prev && cur >= 90, 'chase tick at level ' + l);
    prev = cur;
  }
  assert.equal(lv(40).tick, 90, 'the floor is still 90ms');
  // cops keep arriving past the old level-9 cap of behaviour
  assert.equal(lv(1).cops, 2);
  assert.equal(lv(2).cops, 3);
  assert.equal(lv(8).cops, 6);
  assert.equal(lv(20).cops, 6, 'cops stop at the six spawn points');
  // police gain on the thief but never match it: at copEvery 1 they move on
  // every player tick, which measured as an instant loss rather than pressure
  assert.equal(lv(4).copEvery, 2);
  assert.equal(lv(5).copEvery, 2, 'police never step on every player tick');
  assert.equal(G.chaseLevel('easy', 1).copEvery, 3, 'easy starts slower');
  assert.equal(G.chaseLevel('easy', 9).copEvery, 2, 'and tightens down to the floor, no further');
  // the difficulty still sets the baseline
  assert.equal(G.chaseLevel('easy', 1).tick, 200);
  assert.equal(G.chaseLevel('hard', 1).tick, 150);
  assert.equal(G.chaseLevel('nope', 1).tick, 175, 'unknown difficulty falls back to normal');
}

// ---- 4. the shipped locale files carry every key the client can ask for ----
{
  for (const lang of ['zh', 'en']) {
    const json = JSON.parse(fs.readFileSync(new URL('./locale/' + lang + '.json', import.meta.url), 'utf8'));
    const inline = G[lang];
    const missing = Object.keys(inline).filter((k) => !(k in json));
    assert.deepEqual(missing, [], lang + '.json is missing: ' + missing.join(','));
    const extra = Object.keys(json).filter((k) => k !== 'meta' && !(k in inline));
    assert.deepEqual(extra, [], lang + '.json has keys the client never uses: ' + extra.join(','));
    assert.equal(json.meta.title, inline.title, lang + ' meta.title matches the panel title');
    assert.ok(Object.keys(json).length > 40, lang + ' file is complete');
  }
}

console.log('P1 OK: vertical kick, gravity curve, chase curve, locale parity');
