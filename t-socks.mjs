// Temporary Socks assertions: belt physics, spawn pairing, grab/deposit rules.
import fs from 'node:fs';
import assert from 'node:assert/strict';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
assert.ok(src.includes(marker), 'marker');
src = src.replace(marker, "    globalThis.__GC__ = { SOCK_MEMBERS, socksMembers, socksLevel, socksInitial, socksTick, socksGrab, socksDeposit, socksAction, socksMoveClaw, socksMoveSel, socksPlacePair, SOCKS_BELT, SOCKS_PAIRS_PER_LEVEL, socksThumb, GAMES };\n" + marker);

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

// deterministic stream for spawn decisions
const realRandom = Math.random;
let seed = 1;
function fixRandom(v) { Math.random = typeof v === 'function' ? v : () => v; }
function lcgRandom(s0) {
  let s = s0;
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

// ---- 1. difficulty selects the family size, unknown falls back ----
assert.equal(G.socksMembers('easy').length, 3);
assert.equal(G.socksMembers('normal').length, 4);
assert.equal(G.socksMembers('hard').length, 5);
assert.deepEqual(G.socksMembers('nope'), G.socksMembers('normal'), 'unknown difficulty behaves like normal');
// dad and me share the blue bg — the deliberate confusion the game is about
assert.equal(G.SOCK_MEMBERS[3].bg, G.SOCK_MEMBERS[4].bg);
assert.notEqual(G.SOCK_MEMBERS[3].glyph, G.SOCK_MEMBERS[4].glyph);

// ---- 2. the level curve tightens within bounds ----
for (const d of ['easy', 'normal', 'hard']) {
  let prevShift = Infinity, prevSpawn = Infinity;
  for (let lv = 1; lv <= 30; lv++) {
    const c = G.socksLevel(d, lv);
    assert.ok(c.shiftEvery <= prevShift && c.shiftEvery >= 3, d + ' shiftEvery bounds lv' + lv);
    assert.ok(c.spawnEvery <= prevSpawn && c.spawnEvery >= 5, d + ' spawnEvery bounds lv' + lv);
    prevShift = c.shiftEvery; prevSpawn = c.spawnEvery;
  }
  assert.ok(G.socksLevel(d, 30).lostP <= 0.18, d + ' lostP capped');
}
assert.ok(G.socksLevel('normal', 1).lostP < G.socksLevel('hard', 1).lostP, 'hard swaps more socks');
assert.equal(G.socksLevel('easy', 1).lostP, 0, 'easy never swaps');

// ---- 3. initial state, and the difficulty fallback persists ----
{
  const s = G.socksInitial('normal');
  assert.equal(s.belt.length, G.SOCKS_BELT);
  assert.ok(s.belt.every((b) => b === null), 'the belt starts empty');
  assert.equal(s.lives, 3);
  assert.equal(G.socksInitial('weird').difficulty, 'normal', 'unknown difficulty is normalised at init');
  assert.equal(G.socksTick(s), s, 'an unstarted state does not tick');
  assert.equal(G.socksGrab(s), s, 'cannot grab before the start');
  const paused = { ...s, started: true, paused: true };
  assert.equal(G.socksDeposit(paused), paused, 'a paused game ignores deposits');
}

// ---- 4. spawning: books the pair, fills the belt head, respects an occupied head ----
{
  lcgRandom(42);
  let s = { ...G.socksInitial('normal'), started: true };
  const cfg = G.socksLevel('normal', 1);
  for (let i = 0; i < cfg.spawnEvery; i++) s = G.socksTick(s);   // the head spawns exactly on the schedule tick
  assert.ok(s.belt[0], 'a sock spawns when the clock reaches nextAt');
  assert.equal(typeof s.belt[0].pairId, 'string');
  assert.equal(s.nextAt, s.ct + cfg.spawnEvery, 'the next spawn is scheduled');
  const withSock = { ...s, nextAt: s.ct };
  const blocked = G.socksTick({ ...withSock, belt: withSock.belt.map((b, i) => (i === 0 ? withSock.belt[0] || { uid: -1 } : b)) });
  assert.ok(blocked.belt[0], 'an occupied head is not overwritten');
}

// ---- 5. belt shift: socks march right, the dropped one costs a life ----
{
  let s = { ...G.socksInitial('normal'), started: true };
  const cfg = G.socksLevel('normal', 1);
  s.belt[0] = { uid: 1, pairId: 'x', mid: 'mom', look: 'mom' };
  let shifted = s;
  for (let i = 0; i < cfg.shiftEvery; i++) shifted = G.socksTick(shifted);
  assert.ok(shifted.belt[1], 'the sock moved one cell right');
  assert.equal(shifted.belt[0], null);
  assert.equal(shifted.lives, 3, 'moving is free');

  let atEnd = { ...s, ct: 0, belt: s.belt.slice() };
  atEnd.belt[G.SOCKS_BELT - 1] = { uid: 2, pairId: 'y', mid: 'mom', look: 'mom' };
  for (let i = 0; i < cfg.shiftEvery; i++) atEnd = G.socksTick(atEnd);
  assert.equal(atEnd.belt[G.SOCKS_BELT - 1], null, 'the far-end sock fell behind the machine');
  assert.equal(atEnd.lives, 2, 'and cost a life');

  // the last life ends the run
  let doomed = { ...atEnd, lives: 1, ct: 0, nextAt: 100 };
  doomed.belt = s.belt.slice();
  doomed.belt[G.SOCKS_BELT - 1] = { uid: 3, pairId: 'w', mid: 'mom', look: 'mom' };
  for (let i = 0; i < cfg.shiftEvery; i++) doomed = G.socksTick(doomed);
  assert.equal(doomed.lives, 0);
  assert.equal(doomed.over, true, 'losing the last sock-off-line ends the run');
}

// ---- 6. grab / deposit: the core scoring rules ----
{
  const sock = { uid: 7, pairId: 'p7', mid: 'mom', look: 'mom' };
  const base = { ...G.socksInitial('normal'), started: true, belt: Array.from({ length: G.SOCKS_BELT }, () => null) };
  base.belt[2] = sock;
  base.pairsBook.p7 = { mid: 'mom', look: 'mom', spawned: 2, placed: 0 };

  // grab picks up at the claw only
  assert.equal(G.socksGrab({ ...base, claw: 1 }).belt[1], null, 'an empty cell is not grabbed');
  assert.equal(G.socksGrab({ ...base, claw: 1 }).held, null);
  const grabbed = G.socksGrab({ ...base, claw: 2 });
  assert.equal(grabbed.held, sock, 'the claw lifts the sock');
  assert.equal(grabbed.belt[2], null);
  assert.equal(G.socksGrab(grabbed), grabbed, 'a full claw cannot grab again');

  // correct drawer: combo grows, score follows the table
  const sisIdx = G.socksMembers('normal').findIndex((m) => m.id === 'sis');
  const momIdx = G.socksMembers('normal').findIndex((m) => m.id === 'mom');
  let put = G.socksDeposit({ ...grabbed, sel: momIdx });
  assert.equal(put.held, null);
  assert.equal(put.combo, 1);
  assert.equal(put.score, 100 * put.level, 'first clear in a run pays the base');
  assert.equal(put.pairsBook.p7.placed, 1, 'the pair book records the half');

  // wrong drawer: the sock is thrown back to the first free belt cell, combo dies
  const wrong = G.socksDeposit({ ...grabbed, sel: sisIdx });
  assert.equal(wrong.held, null);
  assert.equal(wrong.combo, 0, 'a miss breaks the run');
  assert.equal(wrong.score, 0, 'and pays nothing');
  assert.ok(wrong.belt.some((b) => b && b.uid === 7), 'the sock is back on the belt');

  // second in a row pays the step bonus
  let s2 = { ...put, belt: put.belt.slice(), held: null, claw: 0 };
  s2.belt[0] = { uid: 8, pairId: 'p8', mid: 'gp', look: 'gp' };
  s2.pairsBook.p8 = { mid: 'gp', look: 'gp', spawned: 2, placed: 1 };
  s2 = G.socksGrab(s2);
  const gpIdx = G.socksMembers('normal').findIndex((m) => m.id === 'gp');
  s2 = G.socksDeposit({ ...s2, sel: gpIdx });
  assert.equal(s2.combo, 2);
  assert.equal(s2.score, 100 + 150, 'second in the run adds one step (50 * 1)');
}

// ---- 7. completing a pair, and a pair completing the level ----
{
  const members = G.socksMembers('normal');
  const momIdx = members.findIndex((m) => m.id === 'mom');
  let s = { ...G.socksInitial('normal'), started: true };
  s.pairsBook.pA = { mid: 'mom', look: 'mom', spawned: 2, placed: 1 };   // first half already filed
  s.belt[0] = { uid: 20, pairId: 'pA', mid: 'mom', look: 'mom' };
  s = G.socksGrab({ ...s, claw: 0 });
  s = G.socksDeposit({ ...s, sel: momIdx });
  assert.equal(s.pairs, 1, 'the second half closes the pair');

  // one pair short of a level, then drop it
  let edge = { ...s, pairs: G.SOCKS_PAIRS_PER_LEVEL - 1 };
  edge.pairsBook.pB = { mid: 'mom', look: 'mom', spawned: 2, placed: 1 };
  edge.belt[0] = { uid: 21, pairId: 'pB', mid: 'mom', look: 'mom' };
  edge = G.socksGrab({ ...edge, claw: 0 });
  edge = G.socksDeposit({ ...edge, sel: momIdx });
  assert.equal(edge.pairs, G.SOCKS_PAIRS_PER_LEVEL);
  assert.equal(edge.level, 2, 'every eighth pair the level rises');
}

// ---- 8. the swapped sock: grab reveals the truth and files it away ----
{
  let s = { ...G.socksInitial('hard'), started: true };
  const gpIdx = G.socksMembers('hard').findIndex((m) => m.id === 'gp');
  s.pairsBook.pC = { mid: 'gp', look: 'me', spawned: 2, placed: 0 };
  s.belt[3] = { uid: 30, pairId: 'pC', mid: 'gp', look: 'me' };
  const before = s.belt[3];
  s = G.socksGrab({ ...s, claw: 3 });
  assert.equal(s.held, null, 'the sock never enters the claw — it files itself');
  assert.equal(s.sel, gpIdx, 'the selector shows who really owns it');
  assert.equal(s.score, 25 * s.level, 'it pays the small reveal fee');
  assert.equal(s.belt[3], null);
  assert.equal(s.pairsBook.pC.placed, 1, 'and it counts as placed toward its pair');
  assert.equal(s.pairs, 0, 'one half of a pair is not yet a pair');
  assert.equal(before.look, 'me', '(it had been dressed as someone else)');
}

// ---- 9. movement: claw and selector, with the held swap of control ----
{
  const s = { ...G.socksInitial('normal'), started: true, claw: 3 };
  assert.equal(G.socksMoveClaw(s, 1).claw, 4);
  assert.equal(G.socksMoveClaw(s, -1).claw, 2);
  assert.equal(G.socksMoveClaw({ ...s, claw: 0 }, -1).claw, 0, 'the claw stops at the wall');
  assert.equal(G.socksMoveClaw({ ...s, claw: G.SOCKS_BELT - 1 }, 1).claw, G.SOCKS_BELT - 1);
  const held = { ...s, held: { uid: 9, pairId: 'z', mid: 'mom', look: 'mom' } };
  assert.equal(G.socksMoveClaw(held, 1), held, 'while holding, the claw cannot move');
  assert.equal(G.socksMoveSel(held, 1).sel, 1);
  const last = G.socksMembers('normal').length - 1;
  assert.equal(G.socksMoveSel({ ...held, sel: last }, 1).sel, last, 'the selector stops at the last drawer');
  assert.equal(G.socksMoveSel(s, 1), s, 'with an empty claw the selector is frozen');
}

// ---- 10. soak: a full scripted run never violates the state invariants ----
{
  lcgRandom(7);
  let s = { ...G.socksInitial('normal'), started: true };
  let deposits = 0, misses = 0, grabs = 0;
  for (let i = 0; i < 6000 && !s.over; i++) {
    const r = Math.random();
    if (s.held) {
      if (r < 0.3) {
        const before = s.combo;
        s = G.socksDeposit({ ...s, sel: Math.floor(Math.random() * G.socksMembers(s.difficulty).length) });
        if (s.combo === 0 && before > 0) misses++; else deposits++;
      } else {
        s = G.socksMoveSel(s, Math.random() < 0.5 ? -1 : 1);
      }
    } else if (r < 0.2 && s.belt[s.claw]) {
      s = G.socksGrab(s); grabs++;
    } else {
      s = G.socksTick(G.socksMoveClaw(s, Math.random() < 0.5 ? -1 : 1));
    }
    // invariants, every single step
    assert.equal(s.belt.length, G.SOCKS_BELT);
    assert.ok(s.lives >= 0 && s.lives <= 3);
    assert.ok(s.combo >= 0);
    assert.ok(s.score >= 0);
    assert.ok(s.claw >= 0 && s.claw < G.SOCKS_BELT);
    assert.ok(s.sel >= 0 && s.sel < G.socksMembers(s.difficulty).length);
    if (s.held) assert.ok(typeof s.held.mid === 'string');
  }
  assert.ok(s.over || s.ct > 100, 'the soak actually played');
  assert.ok(deposits > 5 && grabs > 5, 'the soak hit every branch (grabs ' + grabs + ', deposits ' + deposits + ', misses ' + misses + ')');
}

// ---- 11. the card picture is the family's own socks ----
{
  const socksGame = G.GAMES.find((g) => g.id === 'socks');
  assert.ok(socksGame, 'socks is registered');
  const art = G.socksThumb();
  assert.equal(art.length, G.SOCK_MEMBERS.length);
  assert.equal(art[0].length, G.SOCKS_BELT);
  assert.equal(art[3][1], G.SOCK_MEMBERS[3].bg, 'a row is that member\'s real sock colour');
  assert.ok(new Set(art.flat()).size >= 6, 'the picture uses the whole family palette');
}

Math.random = realRandom;
console.log('SOCKS OK: curve, belt, spawn pairing, grab/deposit, swapped sock, soak');
