// One-off playability probe: a perfect player (knows every owner instantly,
// never misdeposits) must be able to keep the belt clear and climb levels.
import fs from 'node:fs';

let src = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
src = src.replace(marker, "    globalThis.__GC__ = { SOCK_MEMBERS, socksMembers, socksLevel, socksInitial, socksTick, socksGrab, socksDeposit, socksMoveClaw, socksMoveSel, SOCKS_BELT };\n" + marker);
const React = { createElement: () => ({}), useState: (v) => [typeof v === 'function' ? v() : v, () => {}], useEffect: () => {}, useMemo: (f) => f(), useRef: () => ({}) };
let captured;
globalThis.window = { __ModuleLoader__: { load: (o) => { captured = o; } }, addEventListener: () => {}, removeEventListener: () => {}, localStorage: { getItem: () => null, setItem: () => {} } };
globalThis.document = { createElement: () => ({ dataset: {} }), head: { appendChild: () => {} } };
new Function('require', src)(() => React);
captured.factory(() => React);
const G = globalThis.__GC__;

function play(difficulty, ticks) {
  let s = { ...G.socksInitial(difficulty), started: true };
  const members = () => G.socksMembers(s.difficulty);
  for (let i = 0; i < ticks && !s.over; i++) {
    if (!s.held) {
      // walk to the rightmost sock (closest to falling off) and grab it
      let target = -1;
      for (let x = G.SOCKS_BELT - 1; x >= 0; x--) if (s.belt[x]) { target = x; break; }
      if (target >= 0) {
        while (s.claw !== target) s = G.socksMoveClaw(s, s.claw < target ? 1 : -1);
        s = G.socksGrab(s);
      } else s = G.socksTick(s);
    }
    if (s.held) {
      const owner = members().findIndex((m) => m.id === s.held.mid);
      if (owner >= 0) {
        while (s.sel !== owner) s = G.socksMoveSel(s, s.sel < owner ? 1 : -1);
        s = G.socksDeposit(s);
      } else {
        // swapped sock: socksGrab already filed it; should not reach here
        throw new Error('perfect player mis-filed?');
      }
    }
    s = G.socksTick(s);   // a tick of thinking time per action pair
  }
  return s;
}

for (const d of ['easy', 'normal', 'hard']) {
  for (const ticks of [600, 3000]) {
    const s = play(d, ticks);
    console.log(`${d.padEnd(6)} ${String(ticks).padStart(4)} ticks -> level ${s.level}, pairs ${s.pairs}, score ${s.score}, lives ${s.lives}, over ${s.over}`);
  }
}
