// Balance probe: is the chase curve fair at high levels?
//
// The bot here only tries to survive — it keeps away from the police and stays
// out of dead ends — so its survival time measures how much pressure the police
// actually apply. Each level is played from a fresh level-N state, twice: with
// the shipped curve, and with copEvery floored at 2 (police never move as often
// as the player).
import fs from 'node:fs';

const raw = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const marker = "    return {\n      inject: ['slots', 'locale'],";
const EXPORTS = "    globalThis.__GC__ = { CHASE_COLS, CHASE_ROWS, CHASE_LOOT, CHASE_THIEF_START, CHASE_COP_STARTS, chaseWalkable, chaseLevel, chaseInitial, chaseReset, chaseTick, DIFFICULTIES };\n" + marker;
const COP_EVERY = `copEvery: Math.max(CHASE_COP_EVERY_FLOOR, d.copEvery - Math.floor((level - 1) / 4)),`;

function load(patch) {
  let src = raw.replace(marker, EXPORTS);
  if (patch) {
    if (!src.includes(COP_EVERY)) throw new Error('copEvery line not found — update this probe');
    src = src.replace(COP_EVERY, patch);
  }
  const React = { createElement: () => ({}), useState: (v) => [v, () => {}], useEffect: () => {}, useMemo: (f) => f(), useRef: () => ({}) };
  let captured;
  globalThis.window = { __ModuleLoader__: { load: (o) => { captured = o; } }, addEventListener: () => {}, removeEventListener: () => {}, localStorage: { getItem: () => null, setItem: () => {} } };
  globalThis.document = { createElement: () => ({ dataset: {} }), head: { appendChild: () => {} } };
  new Function('require', src)(() => React);
  captured.factory(() => React);
  return globalThis.__GC__;
}

const STEPS = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

function distFrom(G, from) {
  const dist = Array.from({ length: G.CHASE_ROWS }, () => Array(G.CHASE_COLS).fill(-1));
  if (!G.chaseWalkable(from.x, from.y)) return dist;
  dist[from.y][from.x] = 0;
  let frontier = [from];
  while (frontier.length) {
    const next = [];
    for (const c of frontier) {
      for (const d of STEPS) {
        const x = c.x + d.x, y = c.y + d.y;
        if (!G.chaseWalkable(x, y) || dist[y][x] !== -1) continue;
        dist[y][x] = dist[c.y][c.x] + 1;
        next.push({ x, y });
      }
    }
    frontier = next;
  }
  return dist;
}

// A level-N state: N police on their spawn pads, all loot back, thief at start.
function stateAt(G, difficulty, level) {
  const s = G.chaseInitial(difficulty);
  const cfg = G.chaseLevel(difficulty, level);
  return {
    ...s,
    level,
    started: true,
    cops: G.CHASE_COP_STARTS.slice(0, Math.max(1, cfg.cops)).map((p) => ({ x: p.x, y: p.y })),
    loot: G.CHASE_LOOT.map((p) => ({ x: p.x, y: p.y })),
    thief: { x: G.CHASE_THIEF_START.x, y: G.CHASE_THIEF_START.y },
  };
}

// Pick the move that keeps the most police-distance; ties go to the cell with
// the most exits, which avoids walking into a dead end.
function surviveMove(G, s) {
  const maps = s.cops.map((c) => distFrom(G, c));
  let best = null;
  for (const d of [{ x: 0, y: 0 }, ...STEPS]) {
    const x = s.thief.x + d.x, y = s.thief.y + d.y;
    if (!G.chaseWalkable(x, y)) continue;
    if (s.cops.some((c) => c.x === x && c.y === y)) continue;
    let gap = Infinity;
    for (const m of maps) gap = Math.min(gap, m[y][x] < 0 ? Infinity : m[y][x]);
    const exits = STEPS.filter((e) => G.chaseWalkable(x + e.x, y + e.y)).length;
    const score = gap * 10 + exits;
    if (!best || score > best.score) best = { d, score };
  }
  return best ? best.d : { x: 0, y: 0 };
}

function trial(G, difficulty, level, maxTicks = 4000) {
  let s = stateAt(G, difficulty, level);
  let ticks = 0;
  while (!s.over && ticks < maxTicks) {
    const d = surviveMove(G, s);
    s.want = d;
    s = G.chaseTick(s);
    ticks++;
  }
  return { ticks, dead: s.over, level: s.level, score: s.score };
}

const variants = [
  ['shipped (copEvery floored at 2)', null],
  ['rejected variant (copEvery may reach 1)', COP_EVERY.replace('Math.max(CHASE_COP_EVERY_FLOOR,', 'Math.max(1,')],
];

for (const [label, patch] of variants) {
  const G = load(patch);
  console.log(`\n== ${label} ==`);
  for (const diff of ['easy', 'normal', 'hard']) {
    for (const level of [1, 5, 10, 15, 20]) {
      const cfg = G.chaseLevel(diff, level);
      const runs = [0, 1, 2].map(() => trial(G, diff, level));
      const ticks = runs.map((r) => r.ticks);
      const avg = Math.round(ticks.reduce((a, b) => a + b, 0) / ticks.length);
      const survived = runs.filter((r) => !r.dead).length;
      console.log(`${diff.padEnd(6)} lv${String(level).padStart(2)}  cops=${cfg.cops} tick=${String(cfg.tick).padStart(3)} every=${cfg.copEvery}  survival ${String(avg).padStart(4)} ticks  (${ticks.join('/')})${survived ? `  survived ${survived}/3` : ''}`);
    }
  }
}
