window.__ModuleLoader__.load({
  id: 'dsh-game-center',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    const NS = 'gameCenter';
    const PANEL_ID = 'game-center';
    // Single source for the version shown on game cards. Bump together with package.json.
    const VERSION = 'v1.2.1';

    const zh = {
      open: '游戏中心',
      title: '游戏中心',
      subtitle: '所有小游戏，一处集合',
      games: '游戏列表',
      gameCount: '共 {n} 款游戏',
      play: '开始游戏',
      backToGames: '返回列表',
      nowPlaying: '正在游玩',
      controls: '操作说明',
      score: '得分',
      lines: '消行',
      level: '等级',
      next: '下一个',
      paused: '已暂停',
      gameOver: '游戏结束',
      finalScore: '最终得分',
      newGame: '新游戏',
      pause: '暂停',
      resume: '继续',
      restart: '重新开始',
      start: '开始游戏',
      ctrlMove: '移动',
      ctrlRotate: '旋转',
      ctrlSoftDrop: '软降',
      ctrlHardDrop: '硬降',
      ctrlPause: '暂停',
      keySpace: '空格',
      difficulty: '难度',
      diffEasy: '简单',
      diffNormal: '普通',
      diffHard: '困难',
      tetris: '俄罗斯方块',
      tetrisDesc: '经典落块益智游戏。消除整行、提升等级、刷新最高分。',
      chase: '警察抓小偷',
      chaseDesc: '扮演小偷，把赃物全部捡走就能过关，同时别让警察抓住。每过一关警察都会更多、更快。',
      category: '益智',
      categoryAction: '动作',
      lives: '命数',
      loot: '剩余赃物',
      combo: '连击',
      tspins: 'T 旋',
      stun: '眩晕',
      stunHint: '捡到闪光弹可以短暂定住全部警察。',
      status: '可游玩',
      empty: '后续开发的小游戏会自动出现在这里。',
      best: '最高分',
      settings: '插件设置',
      settingsTitle: '设置',
      sidebarShow: '在侧边栏显示入口',
      sidebarShowHint: '关闭后，游戏中心入口将从侧边栏隐藏。可在此面板内随时重新开启。',
      reset: '恢复默认',
    };
    const en = {
      open: 'Game Center',
      title: 'Game Center',
      subtitle: 'All mini-games in one place',
      games: 'Games',
      gameCount: '{n} game(s) available',
      play: 'Play',
      backToGames: 'Back to games',
      nowPlaying: 'Now playing',
      controls: 'Controls',
      score: 'Score',
      lines: 'Lines',
      level: 'Level',
      next: 'Next',
      paused: 'Paused',
      gameOver: 'Game Over',
      finalScore: 'Final score',
      newGame: 'New Game',
      pause: 'Pause',
      resume: 'Resume',
      restart: 'Restart',
      start: 'Start',
      ctrlMove: 'Move',
      ctrlRotate: 'Rotate',
      ctrlSoftDrop: 'Soft drop',
      ctrlHardDrop: 'Hard drop',
      ctrlPause: 'Pause',
      keySpace: 'Space',
      difficulty: 'Difficulty',
      diffEasy: 'Easy',
      diffNormal: 'Normal',
      diffHard: 'Hard',
      tetris: 'Tetris',
      tetrisDesc: 'The classic falling-block puzzle. Clear lines, level up, chase a high score.',
      chase: 'Cops & Robbers',
      chaseDesc: 'Be the thief: grab every piece of loot to clear the level before the police catch you. Each level sends more of them, and they get faster.',
      category: 'Puzzle',
      categoryAction: 'Action',
      lives: 'Lives',
      loot: 'Loot left',
      combo: 'Combo',
      tspins: 'T-spins',
      stun: 'Stun',
      stunHint: 'Pick up a flashbang to freeze every cop for a moment.',
      status: 'Ready',
      empty: 'More mini-games will show up here as they are added.',
      best: 'Best',
      settings: 'Plugin Settings',
      settingsTitle: 'Settings',
      sidebarShow: 'Show entry in sidebar',
      sidebarShowHint: 'When off, the Game Center entry is hidden from the sidebar. You can re-enable it here anytime.',
      reset: 'Reset',
    };

    const CSS = `
      .gc-root { box-sizing: border-box; height: 100%; overflow: auto; padding: 26px 30px 44px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
      .gc-root *, .gc-root *::before, .gc-root *::after { box-sizing: border-box; }
      .gc-root.gc-play-root { display: flex; flex-direction: column; }
      .gc-root.gc-play-root .gc-crumbs { flex: none; }
      .gc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 26px; }
      .gc-title { font-size: 22px; font-weight: 650; line-height: 30px; letter-spacing: .01em; }
      .gc-sub { margin-top: 5px; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
      .gc-count { flex: none; font-size: 12px; color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; padding: 5px 12px; background: var(--dsw-alias-bg-layer-1); }
      .gc-head-actions { display: flex; align-items: center; gap: 8px; flex: none; }
      .gc-settings-wrap { position: relative; }
      .gc-settings-btn { display: inline-flex; align-items: center; gap: 6px; appearance: none; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; padding: 5px 12px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 20px; cursor: pointer; }
      .gc-settings-btn:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-brand-primary); }
      .gc-settings-pop { position: absolute; right: 0; top: calc(100% + 8px); width: 264px; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 10px 28px rgba(0, 0, 0, .3); z-index: 10; }
      .gc-settings-title { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
      .gc-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .gc-setting-label { font-size: 13px; line-height: 20px; }
      .gc-setting-hint { margin-top: 8px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
      .gc-switch { position: relative; display: inline-flex; flex: 0 0 auto; width: 36px; height: 20px; padding: 2px; border: 0; border-radius: 999px; background: var(--dsw-alias-border-l3); cursor: pointer; transition: background .12s ease; }
      .gc-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
      .gc-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
      .gc-switch::after { content: ''; display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-primary-foreground); transition: transform .12s ease; }
      .gc-switch[aria-checked="false"]::after { background: var(--dsw-alias-switch-thumb); }
      .gc-switch[aria-checked="true"]::after { transform: translateX(16px); }
      .gc-settings-reset { margin-top: 12px; }
      .gc-bundle-config { display: flex; flex-direction: column; gap: 4px; }
      .gc-diff { display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .gc-diff-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--dsw-alias-label-secondary); }
      .gc-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 3px; border-radius: 8px; background: var(--dsw-alias-interactive-bg-hover); }
      .gc-seg-btn { appearance: none; border: 0; border-radius: 6px; padding: 5px 10px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; white-space: nowrap; transition: color .12s ease, background .12s ease; }
      .gc-seg-btn:hover { color: var(--dsw-alias-label-primary); }
      .gc-seg-btn[aria-pressed="true"] { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0, 0, 0, .18); }
      .gc-section-title { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); text-transform: uppercase; letter-spacing: .07em; margin: 0 0 14px; }
      .gc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 16px; }
      .gc-card { display: flex; flex-direction: column; gap: 12px; padding: 18px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); transition: border-color .15s ease, transform .15s ease; }
      .gc-card:hover { border-color: var(--dsw-alias-brand-primary); transform: translateY(-2px); }
      .gc-thumb { height: 104px; border-radius: 10px; background: var(--dsw-alias-bg-layer-2); display: grid; place-content: center; overflow: hidden; }
      .gc-thumb-cell { border-radius: 2px; opacity: .95; }
      .gc-thumb-cell.off { background: transparent; }
      .gc-thumb-empty { height: 104px; border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }
      .gc-card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .gc-name { font-size: 16px; font-weight: 600; line-height: 22px; }
      .gc-badge { font-size: 11px; line-height: 16px; padding: 2px 9px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); }
      .gc-badge.ready { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
      .gc-desc { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); flex: 1; min-height: 40px; }
      .gc-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .gc-meta { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .gc-btn { appearance: none; border: 1px solid transparent; border-radius: 9px; padding: 8px 16px; font: inherit; font-size: 13px; font-weight: 600; line-height: 20px; cursor: pointer; background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); }
      .gc-btn:hover { filter: brightness(1.06); }
      .gc-btn.ghost { background: transparent; color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l1); }
      .gc-btn.small { padding: 6px 12px; font-size: 12px; }
      .gc-empty { margin-top: 18px; font-size: 12px; line-height: 20px; color: var(--dsw-alias-label-secondary); border: 1px dashed var(--dsw-alias-border-l2); border-radius: 12px; padding: 16px 20px; text-align: center; }
      .gc-crumbs { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
      .gc-playing { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .gc-playing b { display: block; margin-top: 2px; font-size: 17px; font-weight: 650; color: var(--dsw-alias-label-primary); }
      .gc-play { display: flex; gap: 26px; flex-wrap: wrap; align-items: stretch; justify-content: center; margin: auto 0; flex: none; }
      .gc-board-wrap { position: relative; flex: none; align-self: flex-start; }
      .gc-board { display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(20, 1fr); gap: 1px; width: 300px; height: 600px; padding: 6px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; }
      .gc-cell { background: var(--dsw-alias-bg-layer-1); border-radius: 2px; }
      .gc-cell.ghost { background: transparent; box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2); }
      .gc-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: var(--dsw-alias-bg-overlay); border-radius: 12px; }
      .gc-overlay-title { font-size: 20px; font-weight: 650; }
      .gc-overlay-sub { font-size: 13px; color: var(--dsw-alias-label-secondary); }
      .gc-side { width: 224px; display: flex; flex-direction: column; gap: 14px; }
      .gc-panel { padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
      .gc-panel-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--dsw-alias-label-secondary); margin-bottom: 10px; }
      .gc-stat { display: flex; align-items: baseline; justify-content: space-between; padding: 5px 0; }
      .gc-stat + .gc-stat { border-top: 1px solid var(--dsw-alias-border-l2); }
      .gc-stat-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .gc-stat-value { font-size: 19px; font-weight: 650; font-variant-numeric: tabular-nums; }
      .gc-next-grid { display: grid; grid-template-columns: repeat(4, 20px); grid-auto-rows: 20px; gap: 1px; justify-content: center; }
      .gc-controls { display: grid; grid-template-columns: auto auto; justify-content: center; align-items: center; gap: 7px 14px; }
      .gc-keys { display: inline-flex; gap: 4px; justify-content: flex-end; }
      .gc-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 7px; border: 1px solid var(--dsw-alias-border-l2); border-bottom-width: 2px; border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 11px; font-weight: 600; line-height: 1; }
      .gc-ctrl-label { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .gc-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
      .gc-actions .gc-btn { flex: 1; }
      .gc-chase-board { display: grid; grid-template-columns: repeat(15, 28px); grid-auto-rows: 28px; gap: 1px; padding: 6px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; }
      .gc-chase-cell { display: flex; align-items: center; justify-content: center; border-radius: 3px; background: var(--dsw-alias-bg-layer-1); font-size: 17px; line-height: 1; user-select: none; }
      .gc-chase-cell.wall { background: var(--dsw-alias-border-l3); }
      .gc-chase-cell.frozen { opacity: .45; }
    `;

    function insertStyles(css) {
      const el = document.createElement('style');
      el.dataset.plugin = PANEL_ID;
      el.textContent = css;
      document.head.appendChild(el);
      return () => {
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    }

    function useTranslate(locale) {
      const [active, setActive] = useState(() => (locale ? locale.getSnapshot().active : 'en'));
      useEffect(() => {
        if (!locale) return undefined;
        setActive(locale.getSnapshot().active);
        return locale.subscribe(() => setActive(locale.getSnapshot().active));
      }, [locale]);
      return useMemo(() => {
        const bound = locale ? locale.bind(NS) : null;
        return (key, vars) => {
          const value = typeof bound === 'function' ? bound(key) : undefined;
          const base = typeof value === 'string' ? value : key;
          if (!vars) return base;
          return base.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
        };
      }, [locale, active]);
    }

    /* ------------------------------------------------------------------ *
     * Settings — the panel's own setting (where its entry shows), persisted
     * in localStorage. Difficulty is NOT here: it belongs to each game and is
     * stored per game id below.
     * ------------------------------------------------------------------ */
    // Difficulty sets the starting level (the level still rises as you play) and,
    // for the chase, how many police start on the board, how fast they step
    // (tick, ms) and how many player steps pass between their moves (copEvery).
    const DIFFICULTIES = [
      { id: 'easy', labelKey: 'diffEasy', level: 1, police: 1, tick: 200, copEvery: 3 },
      { id: 'normal', labelKey: 'diffNormal', level: 3, police: 2, tick: 175, copEvery: 2 },
      { id: 'hard', labelKey: 'diffHard', level: 5, police: 3, tick: 150, copEvery: 2 },
    ];
    function levelForDifficulty(id) {
      const d = DIFFICULTIES.find((x) => x.id === id);
      return d ? d.level : 1;
    }
    const SETTINGS_KEY = 'gc-settings';
    let settings = null;
    const settingsListeners = new Set();
    function loadSettings() {
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { sidebar: parsed.sidebar !== false };
        }
      } catch (e) { /* private mode or bad json — fall through to default */ }
      return { sidebar: true };
    }
    function getSettings() {
      if (!settings) settings = loadSettings();
      return settings;
    }
    function setSettings(patch) {
      settings = { ...getSettings(), ...patch };
      try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* private mode */ }
      for (const fn of Array.from(settingsListeners)) { try { fn(settings); } catch (e) { /* ignore listener errors */ } }
    }
    function subscribeSettings(fn) {
      settingsListeners.add(fn);
      return () => settingsListeners.delete(fn);
    }
    function useSettings() {
      const [s, setS] = useState(getSettings);
      useEffect(() => subscribeSettings(setS), []);
      return s;
    }

    // Difficulty is each game's own property: stored per game id, chosen on that
    // game's own screen, and defaulted per game rather than by the panel.
    const DIFFICULTY_KEY = 'gc-difficulty';
    let difficulties = null;
    function getDifficulty(gameId) {
      if (!difficulties) {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(DIFFICULTY_KEY) || '{}');
          difficulties = parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) { difficulties = {}; }
      }
      const id = difficulties[gameId];
      return DIFFICULTIES.some((d) => d.id === id) ? id : 'normal';
    }
    function setDifficulty(gameId, id) {
      const next = { ...difficulties, [gameId]: id };
      difficulties = next;
      try { window.localStorage.setItem(DIFFICULTY_KEY, JSON.stringify(next)); } catch (e) { /* private mode */ }
    }
    function useDifficulty(gameId) {
      const [value, setValue] = useState(() => getDifficulty(gameId));
      return [value, (id) => { setDifficulty(gameId, id); setValue(id); }];
    }

    /* ------------------------------------------------------------------ *
     * Tetris — pure reducer-shaped helpers; the component only holds state.
     * ------------------------------------------------------------------ */
    const COLS = 10;
    const ROWS = 20;
    const SHAPES = {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      O: [[1, 1], [1, 1]],
      S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    };
    const COLORS = { I: '#38bdf8', J: '#3b82f6', L: '#f59e0b', O: '#facc15', S: '#22c55e', T: '#a855f7', Z: '#ef4444' };
    const TYPES = Object.keys(SHAPES);
    const LINE_SCORE = [0, 100, 300, 500, 800];
    // A T-spin is scored from the same clear count but at a higher rate: the
    // rotation that squeezes the piece into a gap is the hard part, so it pays
    // more than a plain clear. Index 0 is a T-spin that cleared nothing.
    const TSPIN_SCORE = [400, 800, 1200, 1600];
    // Each clear in an unbroken run pays a little more; the run is worth 0 for
    // its first clear and grows from there.
    const COMBO_STEP = 50;
    const BLOCK_SHADE = 'inset 0 -3px 0 rgba(0,0,0,.22), inset 0 2px 0 rgba(255,255,255,.28)';

    function rotateShape(m) {
      const n = m.length;
      const out = Array.from({ length: n }, () => Array(n).fill(0));
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][n - 1 - r] = m[r][c];
      return out;
    }
    function emptyBoard() {
      return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }
    // 7-bag: every bag holds each of the seven pieces once, so the longest wait
    // for a piece is bounded and the board cannot be flooded by one shape.
    // A fresh bag never opens with the piece that just landed, which removes the
    // only repeat a plain bag still allows.
    function shuffledBag(avoid) {
      const bag = TYPES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
      if (bag[0] === avoid) {
        const k = 1 + Math.floor(Math.random() * (bag.length - 1));
        const t = bag[0]; bag[0] = bag[k]; bag[k] = t;
      }
      return bag;
    }
    // Draw the next piece, refilling the bag when it runs out.
    function drawType(bag, avoid) {
      const pool = Array.isArray(bag) && bag.length ? bag : shuffledBag(avoid);
      return { type: pool[0], bag: pool.slice(1) };
    }
    // A piece that has landed may still be slid or turned for this long…
    const LOCK_DELAY = 500;
    // …and every such nudge re-arms the timer, up to this many times.
    const LOCK_RESETS = 15;
    // Any successful nudge on the ground restarts the lock timer, a bounded
    // number of times so a piece cannot be hovered forever.
    function rearm(s) {
      if (!s.groundedAt || s.lockResets >= LOCK_RESETS) return s;
      return { ...s, groundedAt: Date.now(), lockResets: s.lockResets + 1 };
    }
    function makePiece(type) {
      const shape = SHAPES[type].map((row) => row.slice());
      return { type, shape, color: COLORS[type], x: Math.floor((COLS - shape.length) / 2), y: 0 };
    }
    function collides(board, shape, x, y) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape.length; c++) {
          if (!shape[r][c]) continue;
          const bx = x + c;
          const by = y + r;
          if (bx < 0 || bx >= COLS || by >= ROWS) return true;
          if (by >= 0 && board[by][bx]) return true;
        }
      }
      return false;
    }
    function merge(board, piece) {
      const out = board.map((row) => row.slice());
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape.length; c++) {
          if (!piece.shape[r][c]) continue;
          const by = piece.y + r;
          const bx = piece.x + c;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) out[by][bx] = piece.color;
        }
      }
      return out;
    }
    function clearLines(board) {
      let cleared = 0;
      const kept = board.filter((row) => {
        if (row.every(Boolean)) { cleared++; return false; }
        return true;
      });
      while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
      return { board: kept, cleared };
    }
    // A T-spin is a T piece that was turned into its slot and then locked
    // without being slid: three of the four corners around the piece's centre
    // are blocked. It is checked at lock time, because only then is the final
    // position of the piece known.
    function isTSpin(board, piece, rotated) {
      if (!rotated || piece.type !== 'T') return false;
      const cx = piece.x + 1;
      const cy = piece.y + 1;
      const blocked = (x, y) => x < 0 || x >= COLS || y < 0 || y >= ROWS || Boolean(board[y][x]);
      let corners = 0;
      if (blocked(cx - 1, cy - 1)) corners += 1;
      if (blocked(cx + 1, cy - 1)) corners += 1;
      if (blocked(cx - 1, cy + 1)) corners += 1;
      if (blocked(cx + 1, cy + 1)) corners += 1;
      return corners >= 3;
    }
    function initialState(startLevel) {
      const first = drawType([], null);
      const second = drawType(first.bag, first.type);
      const level = startLevel || 1;
      return {
        board: emptyBoard(), piece: makePiece(first.type), next: makePiece(second.type),
        bag: second.bag, startLevel: level,
        score: 0, lines: 0, level, over: false, paused: false, started: false,
        groundedAt: 0, lockResets: 0,
        rotated: false, combo: 0, tspins: 0,
      };
    }
    // The piece has landed: hold it for the lock delay, then commit it. A hard
    // drop skips the wait and commits at once.
    function lockOrWait(s) {
      if (!s.groundedAt) return { ...s, groundedAt: Date.now(), lockResets: 0 };
      if (Date.now() - s.groundedAt < LOCK_DELAY) return s;
      return lockAndSpawn(s, merge(s.board, s.piece));
    }
    function lockAndSpawn(s, boardWithPiece) {
      const { board, cleared } = clearLines(boardWithPiece);
      const lines = s.lines + cleared;
      // The chosen difficulty sets the *starting* level; clearing lines raises it
      // from there. Recomputing from lines alone used to throw the start away.
      const level = (s.startLevel || 1) + Math.floor(lines / 10);
      // A T-spin pays the T-spin table instead of the plain one; a clear in an
      // unbroken run of clears adds a combo bonus on top of either.
      const tspin = isTSpin(s.board, s.piece, s.rotated);
      const base = tspin
        ? TSPIN_SCORE[Math.min(cleared, TSPIN_SCORE.length - 1)]
        : LINE_SCORE[cleared];
      const combo = cleared ? (s.combo || 0) + 1 : 0;
      const bonus = combo > 1 ? COMBO_STEP * (combo - 1) : 0;
      const score = s.score + (base + bonus) * s.level;
      const piece = s.next;
      const draw = drawType(s.bag, piece.type);
      const over = collides(board, piece.shape, piece.x, piece.y);
      return {
        ...s, board, piece, next: makePiece(draw.type), bag: draw.bag,
        score, lines, level, over, groundedAt: 0, lockResets: 0,
        rotated: false, combo, tspins: (s.tspins || 0) + (tspin ? 1 : 0),
      };
    }
    function step(s) {
      if (!s.started || s.over || s.paused) return s;
      if (!collides(s.board, s.piece.shape, s.piece.x, s.piece.y + 1)) {
        const piece = { ...s.piece, y: s.piece.y + 1 };
        const landed = collides(s.board, piece.shape, piece.x, piece.y + 1);
        // Falling or sliding after a turn means the piece was not turned into
        // its slot, so the T-spin flag only survives a piece that stays put.
        return { ...s, piece, groundedAt: landed ? Date.now() : 0, lockResets: 0, rotated: false };
      }
      return lockOrWait(s);
    }
    function move(s, dx) {
      if (!s.started || s.over || s.paused) return s;
      if (collides(s.board, s.piece.shape, s.piece.x + dx, s.piece.y)) return s;
      return rearm({ ...s, piece: { ...s.piece, x: s.piece.x + dx }, rotated: false });
    }
    function softDrop(s) {
      if (!s.started || s.over || s.paused) return s;
      if (!collides(s.board, s.piece.shape, s.piece.x, s.piece.y + 1)) {
        return { ...s, piece: { ...s.piece, y: s.piece.y + 1 }, score: s.score + 1, rotated: false };
      }
      return lockOrWait(s);
    }
    // Wall kicks, tried in order: in place, sideways off a wall, then one row up
    // off the floor. The upward ones are what let a vertical bar turn once it is
    // resting — with side kicks alone that rotation is simply refused. They are
    // capped at a single row so a piece cannot be rotated upward for free.
    const ROTATE_KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];
    function rotate(s) {
      if (!s.started || s.over || s.paused) return s;
      const shape = rotateShape(s.piece.shape);
      for (const [dx, dy] of ROTATE_KICKS) {
        if (!collides(s.board, shape, s.piece.x + dx, s.piece.y + dy)) {
          // `rotated` is what makes a T-spin possible: the piece must be turned
          // and then locked without being moved again.
          return rearm({ ...s, piece: { ...s.piece, shape, x: s.piece.x + dx, y: s.piece.y + dy }, rotated: true });
        }
      }
      return s;
    }
    function hardDrop(s) {
      if (!s.started || s.over || s.paused) return s;
      let y = s.piece.y;
      let dropped = 0;
      while (!collides(s.board, s.piece.shape, s.piece.x, y + 1)) { y++; dropped++; }
      const piece = { ...s.piece, y };
      // A hard drop that actually travels is a move, so it cancels the turn the
      // same way gravity does; dropping an already resting piece keeps it.
      return lockAndSpawn(
        { ...s, score: s.score + dropped * 2, rotated: dropped === 0 ? s.rotated : false },
        merge(s.board, piece),
      );
    }
    function ghostY(s) {
      let y = s.piece.y;
      while (!collides(s.board, s.piece.shape, s.piece.x, y + 1)) y++;
      return y;
    }
    function buildCells(s) {
      const cells = s.board.map((row) => row.slice());
      if (s.started && !s.over) {
        const gy = ghostY(s);
        const { shape, x } = s.piece;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape.length; c++) {
            if (!shape[r][c]) continue;
            const by = gy + r;
            const bx = x + c;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS && !cells[by][bx]) cells[by][bx] = 'ghost';
          }
        }
      }
      const { shape, x, y, color } = s.piece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape.length; c++) {
          if (!shape[r][c]) continue;
          const by = y + r;
          const bx = x + c;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) cells[by][bx] = color;
        }
      }
      return cells;
    }
    function normalized(shape) {
      const m = Array.from({ length: 4 }, () => Array(4).fill(0));
      const off = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape.length; c++) m[r + off][c + off] = shape[r][c];
      }
      return m;
    }

    function Board({ s }) {
      const cells = buildCells(s);
      const out = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = cells[r][c];
          const ghost = v === 'ghost';
          out.push(h('div', {
            key: r * COLS + c,
            className: 'gc-cell' + (ghost ? ' ghost' : ''),
            style: v && !ghost ? { background: v, boxShadow: BLOCK_SHADE } : null,
          }));
        }
      }
      return h('div', { className: 'gc-board' }, out);
    }

    function NextPreview({ piece }) {
      const m = normalized(piece.shape);
      const out = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const on = m[r][c];
          out.push(h('div', {
            key: r * 4 + c,
            className: 'gc-cell',
            style: on ? { background: piece.color, boxShadow: BLOCK_SHADE } : null,
          }));
        }
      }
      return h('div', { className: 'gc-next-grid' }, out);
    }

    // One row per control: key caps on the left, action on the right.
    // `rows` lets a game supply its own key map; Tetris uses the default.
    const tetrisControlRows = (t) => [
      { keys: ['←', '→'], label: t('ctrlMove') },
      { keys: ['↑', 'X'], label: t('ctrlRotate') },
      { keys: ['↓'], label: t('ctrlSoftDrop') },
      { keys: [t('keySpace')], label: t('ctrlHardDrop') },
      { keys: ['P'], label: t('ctrlPause') },
    ];
    function Controls({ t, rows }) {
      // Flat grid children: the key column right-aligns, so labels line up in one straight column.
      const list = rows || tetrisControlRows(t);
      const cells = [];
      list.forEach((row) => {
        cells.push(h('span', { className: 'gc-keys', key: row.label + '-k' },
          row.keys.map((k, i) => h('kbd', { className: 'gc-kbd', key: i }, k))));
        cells.push(h('span', { className: 'gc-ctrl-label', key: row.label }, row.label));
      });
      return h('div', { className: 'gc-controls' }, cells);
    }

    // A game's own difficulty selector, shown on that game's start screen.
    function DifficultyPicker({ t, value, onChange }) {
      return h('div', { className: 'gc-diff' },
        h('div', { className: 'gc-diff-label' }, t('difficulty')),
        h('div', { className: 'gc-seg', role: 'group', 'aria-label': t('difficulty') },
          DIFFICULTIES.map((d) => h('button', {
            key: d.id, className: 'gc-seg-btn', type: 'button',
            'aria-pressed': value === d.id,
            onClick: () => onChange(d.id),
          }, t(d.labelKey)))));
    }

    // Shared by the in-panel gear popover and this bundle's page in the plugin
    // manager. Only the panel's own settings belong here — a game's difficulty
    // is picked on that game's screen, not from the panel.
    function SettingsBody({ t }) {
      const settings = useSettings();
      return h('div', { className: 'gc-set-body' },
        h('div', { className: 'gc-setting-row' },
          h('span', { className: 'gc-setting-label' }, t('sidebarShow')),
          h('button', {
            className: 'gc-switch', type: 'button', role: 'switch',
            'aria-checked': settings.sidebar, 'aria-label': t('sidebarShow'),
            onClick: () => setSettings({ sidebar: !settings.sidebar }),
          })),
        h('div', { className: 'gc-setting-hint' }, t('sidebarShowHint')),
        h('div', { className: 'gc-settings-reset' },
          h('button', { className: 'gc-btn ghost small', type: 'button', onClick: () => setSettings({ sidebar: true }) }, t('reset'))));
    }

    function TetrisGame({ t }) {
      const [s, setS] = useState(initialState);
      const [difficulty, setDifficultyValue] = useDifficulty('tetris');
      const [best, setBest] = useState(() => {
        try { return Number(window.localStorage.getItem('gc-tetris-best')) || 0; } catch (e) { return 0; }
      });
      const sRef = useRef(s);
      sRef.current = s;
      const rootRef = useRef(null);

      useEffect(() => {
        if (s.score > best) {
          setBest(s.score);
          try { window.localStorage.setItem('gc-tetris-best', String(s.score)); } catch (e) { /* private mode */ }
        }
      }, [s.score, best]);

      // Gravity keeps tightening with the level instead of flattening out at a
      // floor after ~11 levels: a fixed 10% cut per level still reaches the
      // 60ms floor, but only around level 25, so late levels stay distinguishable.
      const speed = Math.max(60, Math.round(800 * Math.pow(0.9, s.level - 1)));
      useEffect(() => {
        if (!s.started || s.over || s.paused) return undefined;
        const id = setInterval(() => setS(step), speed);
        return () => clearInterval(id);
      }, [s.started, s.over, s.paused, speed]);

      useEffect(() => {
        const onKey = (e) => {
          const root = rootRef.current;
          if (!root || !root.contains(e.target)) return;
          const el = e.target;
          if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return;
          const cur = sRef.current;
          let handled = true;
          switch (e.key) {
            case 'ArrowLeft': setS((v) => move(v, -1)); break;
            case 'ArrowRight': setS((v) => move(v, 1)); break;
            case 'ArrowDown': setS(softDrop); break;
            case 'ArrowUp': case 'x': case 'X': setS(rotate); break;
            case ' ': setS(hardDrop); break;
            case 'p': case 'P': setS((v) => (v.started && !v.over ? { ...v, paused: !v.paused } : v)); break;
            default: handled = false;
          }
          if (handled && cur.started) e.preventDefault();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const start = () => {
        setS({ ...initialState(levelForDifficulty(difficulty)), started: true });
        if (rootRef.current) rootRef.current.focus();
      };
      // Back to the start screen, so the difficulty is always reachable.
      const reset = () => setS(initialState());
      let overlay = null;
      if (!s.started) {
        overlay = h('div', { className: 'gc-overlay' },
          h('div', { className: 'gc-overlay-title' }, t('tetris')),
          h(Controls, { t }),
          h(DifficultyPicker, { t, value: difficulty, onChange: setDifficultyValue }),
          h('button', { className: 'gc-btn', type: 'button', onClick: start }, t('start')));
      } else if (s.over) {
        overlay = h('div', { className: 'gc-overlay' },
          h('div', { className: 'gc-overlay-title' }, t('gameOver')),
          h('div', { className: 'gc-overlay-sub' }, t('finalScore') + ': ' + s.score),
          h(DifficultyPicker, { t, value: difficulty, onChange: setDifficultyValue }),
          h('button', { className: 'gc-btn', type: 'button', onClick: start }, t('newGame')));
      } else if (s.paused) {
        overlay = h('div', { className: 'gc-overlay' },
          h('div', { className: 'gc-overlay-title' }, t('paused')),
          h('button', { className: 'gc-btn', type: 'button', onClick: () => setS((v) => ({ ...v, paused: false })) }, t('resume')));
      }

      return h('div', { className: 'gc-play', ref: rootRef, tabIndex: -1 },
        h('div', { className: 'gc-board-wrap' }, h(Board, { s }), overlay),
        h('div', { className: 'gc-side' },
          h('div', { className: 'gc-panel' },
            h('div', { className: 'gc-panel-title' }, t('score')),
            h('div', { className: 'gc-stat' }, h('span', { className: 'gc-stat-label' }, t('score')), h('span', { className: 'gc-stat-value' }, s.score)),
            h('div', { className: 'gc-stat' }, h('span', { className: 'gc-stat-label' }, t('best')), h('span', { className: 'gc-stat-value' }, best)),
            h('div', { className: 'gc-stat' }, h('span', { className: 'gc-stat-label' }, t('lines')), h('span', { className: 'gc-stat-value' }, s.lines)),
            h('div', { className: 'gc-stat' }, h('span', { className: 'gc-stat-label' }, t('level')), h('span', { className: 'gc-stat-value' }, s.level)),
            h('div', { className: 'gc-stat' }, h('span', { className: 'gc-stat-label' }, t('combo')), h('span', { className: 'gc-stat-value' }, s.combo || 0)),
            h('div', { className: 'gc-stat' }, h('span', { className: 'gc-stat-label' }, t('tspins')), h('span', { className: 'gc-stat-value' }, s.tspins || 0))),
          h('div', { className: 'gc-panel' },
            h('div', { className: 'gc-panel-title' }, t('next')),
            h(NextPreview, { piece: s.next })),
          h('div', { className: 'gc-panel' },
            h('div', { className: 'gc-panel-title' }, t('controls')),
            h(Controls, { t })),
          h('div', { className: 'gc-actions' },
            h('button', {
              className: 'gc-btn ghost small', type: 'button',
              disabled: !s.started || s.over,
              onClick: () => setS((v) => ({ ...v, paused: !v.paused })),
            }, s.paused ? t('resume') : t('pause')),
            h('button', { className: 'gc-btn ghost small', type: 'button', onClick: reset }, t('restart')))));
    }

    /* ------------------------------------------------------------------ *
     * Cops & Robbers — you are the thief. Collect every piece of loot to
     * clear the level while the police hunt you down. Everyone moves one
     * cell at a time on a fixed grid, so the whole game is plain data in /
     * data out: no timers or DOM inside the rules, which makes it testable
     * headlessly from verify.mjs.
     * ------------------------------------------------------------------ */
    // '#' wall, '.' floor. Loot and spawn points are listed separately so the
    // map stays readable and every position is checkable from verify.mjs.
    const CHASE_MAP = [
      '###############',
      '#.............#',
      '#.###.###.###.#',
      '#.............#',
      '#.###.#.#.###.#',
      '#.....#.#.....#',
      '###.#.#.#.#.###',
      '#.....#.#.....#',
      '#.###.#.#.###.#',
      '#.............#',
      '#.###.###.###.#',
      '#.............#',
      '###############',
    ];
    const CHASE_COLS = CHASE_MAP[0].length;
    const CHASE_ROWS = CHASE_MAP.length;
    const CHASE_WALL = CHASE_MAP.map((row) => Array.from(row, (ch) => ch === '#'));
    const CHASE_LOOT = [[3, 3], [7, 3], [11, 3], [3, 9], [7, 6], [11, 9]];
    // One flashbang per level, on a floor cell no loot and no spawn uses. It is
    // the only way to break a tightening encirclement, so it is worth a detour.
    const CHASE_STUN_CELL = { x: 7, y: 5 };
    // How many player ticks the police stay frozen after a flashbang.
    const CHASE_STUN_TICKS = 12;
    const CHASE_THIEF_START = { x: 7, y: 9 };
    const CHASE_COP_STARTS = [
      { x: 1, y: 1 }, { x: 13, y: 1 }, { x: 7, y: 1 },
      { x: 1, y: 11 }, { x: 13, y: 11 }, { x: 7, y: 11 },
    ];
    const CHASE_STEPS = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }];
    const CHASE_KEYS = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    };

    function chaseWalkable(x, y) {
      return x >= 0 && x < CHASE_COLS && y >= 0 && y < CHASE_ROWS && !CHASE_WALL[y][x];
    }

    // Level N of the chase: how many police, how fast they step, how often.
    // The clock decays by a fixed ratio instead of subtracting a flat 10ms, so
    // it keeps tightening all the way to its floor (with the old straight-line
    // drop the clock and the cop count both bottomed out around level 7 and
    // every later level played identically).
    //
    // copEvery is floored at 2 on purpose: at 1 the police step on every single
    // player tick, so a thief can never outrun them and the round ends in about
    // half the ticks no matter how well it is played (measured: 27 vs 54 ticks
    // of survival at level 10). Police may gain on the thief, never match it.
    const CHASE_TICK_FLOOR = 90;
    const CHASE_COP_EVERY_FLOOR = 2;
    function chaseLevel(difficulty, level) {
      const d = DIFFICULTIES.find((x) => x.id === difficulty) || DIFFICULTIES[1];
      return {
        cops: Math.min(CHASE_COP_STARTS.length, d.police + Math.floor(level / 2)),
        tick: Math.max(CHASE_TICK_FLOOR, Math.round(d.tick * Math.pow(0.94, level - 1))),
        copEvery: Math.max(CHASE_COP_EVERY_FLOOR, d.copEvery - Math.floor((level - 1) / 4)),
      };
    }

    // One BFS step from `from` toward `to`; null when already there or cut off.
    // The first move out of `from` is remembered and carried along the walk, so
    // the police always take the shortest route around walls.
    function chaseStep(from, to) {
      const key = (p) => p.y * CHASE_COLS + p.x;
      if (key(from) === key(to)) return null;
      const head = new Map();
      const seen = new Set([key(from)]);
      let frontier = [from];
      while (frontier.length) {
        const next = [];
        for (let i = 0; i < frontier.length; i++) {
          const cell = frontier[i];
          for (let s = 0; s < CHASE_STEPS.length; s++) {
            const nx = cell.x + CHASE_STEPS[s].x;
            const ny = cell.y + CHASE_STEPS[s].y;
            const nk = ny * CHASE_COLS + nx;
            if (!chaseWalkable(nx, ny) || seen.has(nk)) continue;
            seen.add(nk);
            head.set(nk, cell === from ? { x: nx, y: ny } : head.get(key(cell)));
            if (nx === to.x && ny === to.y) return head.get(nk);
            next.push({ x: nx, y: ny });
          }
        }
        frontier = next;
      }
      return null;
    }

    // Put the thief and the police back on their spawn points (a new level, or
    // after being caught — where the loot already collected stays collected).
    function chaseReset(s) {
      const cfg = chaseLevel(s.difficulty, s.level);
      return {
        ...s,
        thief: { x: CHASE_THIEF_START.x, y: CHASE_THIEF_START.y },
        dir: null,
        want: null,
        ticks: 0,
        stun: 0,
        cops: CHASE_COP_STARTS.slice(0, cfg.cops).map((c) => ({ x: c.x, y: c.y })),
      };
    }
    function chaseRespawn(s) {
      return {
        ...chaseReset(s),
        loot: CHASE_LOOT.map((p) => ({ x: p[0], y: p[1] })),
        item: { x: CHASE_STUN_CELL.x, y: CHASE_STUN_CELL.y },
      };
    }
    function chaseInitial(difficulty) {
      return chaseRespawn({
        started: false, over: false, paused: false,
        level: 1, score: 0, lives: 3, difficulty, ticks: 0, loot: [],
      });
    }
    function chaseCaught(s) {
      if (s.lives <= 1) return { ...s, lives: 0, over: true, paused: false };
      return chaseReset({ ...s, lives: s.lives - 1 });
    }

    // One step of the chase. Pure: same state in, same state out.
    function chaseTick(s) {
      if (!s.started || s.over || s.paused) return s;
      const cfg = chaseLevel(s.difficulty, s.level);
      const next = { ...s, ticks: s.ticks + 1 };

      // The thief keeps running the way it was headed; a key only turns it when
      // that direction is open, so held keys feel continuous like Pac-Man.
      let dir = next.dir;
      if (next.want && chaseWalkable(next.thief.x + next.want.x, next.thief.y + next.want.y)) dir = next.want;
      let thief = next.thief;
      if (dir && chaseWalkable(thief.x + dir.x, thief.y + dir.y)) thief = { x: thief.x + dir.x, y: thief.y + dir.y };
      next.dir = dir;
      next.thief = thief;

      const picked = next.loot.findIndex((l) => l.x === thief.x && l.y === thief.y);
      if (picked >= 0) {
        next.loot = next.loot.filter((l, i) => i !== picked);
        next.score = next.score + 100;
        if (!next.loot.length) {
          next.level = next.level + 1;
          next.score = next.score + 250 * (next.level - 1);   // clear bonus
          return chaseRespawn(next);
        }
      }
      // A flashbang freezes every cop for a few ticks — a way out of a corner
      // once the net has closed, but it does not touch the loot or the clock.
      if (next.item && next.item.x === thief.x && next.item.y === thief.y) {
        next.item = null;
        next.stun = CHASE_STUN_TICKS;
        next.score = next.score + 50;
      }

      if (next.cops.some((c) => c.x === thief.x && c.y === thief.y)) return chaseCaught(next);
      if (next.stun > 0) return { ...next, stun: next.stun - 1 };
      if (next.ticks % cfg.copEvery !== 0) return next;
      next.cops = next.cops.map((cop) => chaseStep(cop, thief) || cop);
      if (next.cops.some((c) => c.x === thief.x && c.y === thief.y)) return chaseCaught(next);
      return next;
    }

    function ChaseBoard({ s }) {
      const key = (p) => p.y * CHASE_COLS + p.x;
      const copAt = new Set(s.cops.map(key));
      const lootAt = new Set(s.loot.map(key));
      const thiefAt = key(s.thief);
      const itemAt = s.item ? key(s.item) : -1;
      // While stunned the police still hold their cells; the class dims them so
      // the freeze is visible instead of looking like a bug.
      const stunned = s.stun > 0;
      const cells = [];
      for (let r = 0; r < CHASE_ROWS; r++) {
        for (let c = 0; c < CHASE_COLS; c++) {
          const wall = CHASE_WALL[r][c];
          const k = r * CHASE_COLS + c;
          let glyph = null;
          let extra = '';
          if (!wall) {
            if (copAt.has(k)) { glyph = '👮'; if (stunned) extra = ' frozen'; }
            else if (k === thiefAt) glyph = '🥷';
            else if (lootAt.has(k)) glyph = '💰';
            else if (k === itemAt) glyph = '💥';
          }
          cells.push(h('div', { key: k, className: 'gc-chase-cell' + (wall ? ' wall' : '') + extra }, glyph));
        }
      }
      return h('div', { className: 'gc-chase-board' }, cells);
    }

    const chaseControlRows = (t) => [
      { keys: ['W', 'A', 'S', 'D'], label: t('ctrlMove') },
      { keys: ['←', '↑', '↓', '→'], label: t('ctrlMove') },
      { keys: ['P'], label: t('ctrlPause') },
    ];

    function ChaseGame({ t }) {
      const [difficulty, setDifficultyValue] = useDifficulty('chase');
      const [s, setS] = useState(() => chaseInitial(getDifficulty('chase')));
      const [best, setBest] = useState(() => {
        try { return Number(window.localStorage.getItem('gc-chase-best')) || 0; } catch (e) { return 0; }
      });
      const sRef = useRef(s);
      sRef.current = s;
      const rootRef = useRef(null);

      useEffect(() => {
        if (s.score > best) {
          setBest(s.score);
          try { window.localStorage.setItem('gc-chase-best', String(s.score)); } catch (e) { /* private mode */ }
        }
      }, [s.score, best]);

      const tick = chaseLevel(s.difficulty, s.level).tick;
      useEffect(() => {
        if (!s.started || s.over || s.paused) return undefined;
        const id = setInterval(() => setS(chaseTick), tick);
        return () => clearInterval(id);
      }, [s.started, s.over, s.paused, tick]);

      useEffect(() => {
        const onKey = (e) => {
          const root = rootRef.current;
          if (!root || !root.contains(e.target)) return;
          const el = e.target;
          if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return;
          const cur = sRef.current;
          const name = e.key.length === 1 ? e.key.toLowerCase() : e.key;
          const dir = CHASE_KEYS[name];
          if (dir) setS((v) => ({ ...v, want: dir }));
          else if (name === 'p') setS((v) => (v.started && !v.over ? { ...v, paused: !v.paused } : v));
          else return;
          if (cur.started) e.preventDefault();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const start = () => {
        setS({ ...chaseInitial(difficulty), started: true });
        if (rootRef.current) rootRef.current.focus();
      };
      // Back to the start screen, so the difficulty is always reachable.
      const reset = () => setS(chaseInitial(difficulty));
      let overlay = null;
      if (!s.started) {
        overlay = h('div', { className: 'gc-overlay' },
          h('div', { className: 'gc-overlay-title' }, t('chase')),
          h(Controls, { t, rows: chaseControlRows(t) }),
          h('div', { className: 'gc-overlay-sub' }, t('stunHint')),
          h(DifficultyPicker, { t, value: difficulty, onChange: setDifficultyValue }),
          h('button', { className: 'gc-btn', type: 'button', onClick: start }, t('start')));
      } else if (s.over) {
        overlay = h('div', { className: 'gc-overlay' },
          h('div', { className: 'gc-overlay-title' }, t('gameOver')),
          h('div', { className: 'gc-overlay-sub' }, t('finalScore') + ': ' + s.score),
          h(DifficultyPicker, { t, value: difficulty, onChange: setDifficultyValue }),
          h('button', { className: 'gc-btn', type: 'button', onClick: start }, t('newGame')));
      } else if (s.paused) {
        overlay = h('div', { className: 'gc-overlay' },
          h('div', { className: 'gc-overlay-title' }, t('paused')),
          h('button', {
            className: 'gc-btn', type: 'button',
            onClick: () => setS((v) => ({ ...v, paused: false })),
          }, t('resume')));
      }

      return h('div', { className: 'gc-play', ref: rootRef, tabIndex: -1 },
        h('div', { className: 'gc-board-wrap' }, h(ChaseBoard, { s }), overlay),
        h('div', { className: 'gc-side' },
          h('div', { className: 'gc-panel' },
            h('div', { className: 'gc-panel-title' }, t('score')),
            h('div', { className: 'gc-stat' },
              h('span', { className: 'gc-stat-label' }, t('score')),
              h('span', { className: 'gc-stat-value' }, s.score)),
            h('div', { className: 'gc-stat' },
              h('span', { className: 'gc-stat-label' }, t('best')),
              h('span', { className: 'gc-stat-value' }, best)),
            h('div', { className: 'gc-stat' },
              h('span', { className: 'gc-stat-label' }, t('level')),
              h('span', { className: 'gc-stat-value' }, s.level)),
            h('div', { className: 'gc-stat' },
              h('span', { className: 'gc-stat-label' }, t('lives')),
              h('span', { className: 'gc-stat-value' }, s.lives)),
            h('div', { className: 'gc-stat' },
              h('span', { className: 'gc-stat-label' }, t('loot')),
              h('span', { className: 'gc-stat-value' }, s.loot.length)),
            h('div', { className: 'gc-stat' },
              h('span', { className: 'gc-stat-label' }, t('stun')),
              h('span', { className: 'gc-stat-value' }, s.stun > 0 ? s.stun : '—'))),
          h('div', { className: 'gc-panel' },
            h('div', { className: 'gc-panel-title' }, t('controls')),
            h(Controls, { t, rows: chaseControlRows(t) })),
          h('div', { className: 'gc-actions' },
            h('button', {
              className: 'gc-btn ghost small', type: 'button',
              disabled: !s.started || s.over,
              onClick: () => setS((v) => ({ ...v, paused: !v.paused })),
            }, s.paused ? t('resume') : t('pause')),
            h('button', { className: 'gc-btn ghost small', type: 'button', onClick: reset }, t('restart')))));
    }

    /* ------------------------------------------------------------------ *
     * Registry — one entry per mini-game. The built-ins are listed here; any
     * other bundle loaded beside this one can append its own through the
     * exported `registerGame` and this panel picks it up without a reload.
     * ------------------------------------------------------------------ */
    // Card artwork is built from each game's own data, so the picture on the
    // card cannot drift from what the game actually is.
    function tetrisThumb() {
      const board = emptyBoard();
      const drop = (type, x) => {
        const shape = SHAPES[type];
        let y = 0;
        while (!collides(board, shape, x, y + 1)) y += 1;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape.length; c++) {
            if (shape[r][c]) board[y + r][x + c] = COLORS[type];
          }
        }
      };
      drop('I', 0); drop('J', 4); drop('O', 7); drop('T', 3); drop('S', 6);
      return board.slice(ROWS - 8);
    }

    function chaseThumb() {
      const loot = new Set(CHASE_LOOT.map((p) => p[0] + ',' + p[1]));
      return CHASE_MAP.map((row, y) => Array.from(row, (ch, x) => {
        if (ch === '#') return '#f59e0b';
        if (x === CHASE_THIEF_START.x && y === CHASE_THIEF_START.y) return '#f8fafc';
        if (loot.has(x + ',' + y)) return '#fde68a';
        return 0;
      }));
    }

    const GAMES = [
      {
        id: 'tetris',
        nameKey: 'tetris',
        descKey: 'tetrisDesc',
        categoryKey: 'category',
        version: VERSION,
        statusKey: 'status',
        thumb: tetrisThumb(),
        thumbCell: 11,
        thumbGap: 1,
        render: (t) => h(TetrisGame, { t }),
      },
      {
        id: 'chase',
        nameKey: 'chase',
        descKey: 'chaseDesc',
        categoryKey: 'categoryAction',
        version: VERSION,
        statusKey: 'status',
        thumb: chaseThumb(),
        thumbCell: 6,
        thumbGap: 1,
        render: (t) => h(ChaseGame, { t }),
      },
    ];

    // Games registered by other bundles. They are kept apart from the built-in
    // list so a bad entry can never take the two shipped games down with it, and
    // so the screens read from one array (`allGames()`).
    const extraGames = [];
    const gameListeners = new Set();
    // A game entry needs, at minimum, a unique id and a render function; the
    // thumb is optional and a plain badge is drawn when it is missing.
    function registerGame(entry) {
      if (!entry || typeof entry !== 'object') return () => {};
      if (typeof entry.id !== 'string' || !entry.id) return () => {};
      if (typeof entry.render !== 'function') return () => {};
      if (GAMES.some((g) => g.id === entry.id) || extraGames.some((g) => g.id === entry.id)) return () => {};
      extraGames.push(entry);
      for (const fn of Array.from(gameListeners)) { try { fn(); } catch (e) { /* ignore listener errors */ } }
      return () => {
        const i = extraGames.indexOf(entry);
        if (i < 0) return;
        extraGames.splice(i, 1);
        for (const fn of Array.from(gameListeners)) { try { fn(); } catch (e) { /* ignore */ } }
      };
    }
    function allGames() {
      return GAMES.concat(extraGames);
    }
    function subscribeGames(fn) {
      gameListeners.add(fn);
      return () => gameListeners.delete(fn);
    }
    function useGames() {
      const [games, setGames] = useState(allGames);
      useEffect(() => subscribeGames(() => setGames(allGames())), []);
      return games;
    }

    // Draws a game.thumb matrix (falsy = empty, else a colour) as a grid, sized
    // per game so a 15x13 maze and a 10x8 tetris board both fit the card.
    function GameThumb({ game }) {
      const rows = game.thumb;
      // A game registered from outside may ship no artwork; the card still works.
      if (!Array.isArray(rows) || !rows.length || !Array.isArray(rows[0])) {
        return h('div', { className: 'gc-thumb gc-thumb-empty' });
      }
      const cols = rows[0].length;
      const cell = game.thumbCell || 19;
      const gap = game.thumbGap === undefined ? 3 : game.thumbGap;
      const out = [];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols; c++) {
          const v = rows[r][c];
          const style = {
            width: cell + 'px', height: cell + 'px',
            borderRadius: Math.max(1, Math.min(3, Math.round(cell / 4))) + 'px',
          };
          if (v) {
            style.background = v;
            if (cell >= 10) style.boxShadow = BLOCK_SHADE;
          }
          out.push(h('div', { key: r * cols + c, className: 'gc-thumb-cell' + (v ? '' : ' off'), style }));
        }
      }
      return h('div', {
        className: 'gc-thumb',
        style: { gridTemplateColumns: 'repeat(' + cols + ', ' + cell + 'px)', gap: gap + 'px' },
      }, out);
    }

    function GameCard({ game, t, onPlay }) {
      // nameKey/descKey let a bundled game reuse the panel's own translations;
      // a game registered from outside can carry plain `name`/`desc` strings.
      const name = game.nameKey ? t(game.nameKey) : String(game.name || game.id);
      const desc = game.descKey ? t(game.descKey) : String(game.desc || '');
      const category = game.categoryKey ? t(game.categoryKey) : String(game.category || '');
      return h('div', { className: 'gc-card' },
        h(GameThumb, { game }),
        h('div', { className: 'gc-card-top' },
          h('span', { className: 'gc-name' }, name),
          category ? h('span', { className: 'gc-badge' }, category) : null,
          h('span', { className: 'gc-badge ready' }, game.statusKey ? t(game.statusKey) : t('status'))),
        h('div', { className: 'gc-desc' }, desc),
        h('div', { className: 'gc-card-foot' },
          h('span', { className: 'gc-meta' }, String(game.version || VERSION)),
          h('button', { className: 'gc-btn', type: 'button', onClick: onPlay }, t('play'))));
    }

    function GameCenterRoot({ locale }) {
      const t = useTranslate(locale);
      const [selected, setSelected] = useState(null);
      const [showSettings, setShowSettings] = useState(false);
      const games = useGames();
      const game = selected ? games.find((g) => g.id === selected) : null;

      if (game) {
        return h('div', { className: 'gc-root gc-play-root' },
          h('div', { className: 'gc-crumbs' },
            h('button', { className: 'gc-btn ghost small', type: 'button', onClick: () => setSelected(null) }, '← ' + t('backToGames')),
            h('div', { className: 'gc-playing' }, t('nowPlaying'), h('b', null, game.nameKey ? t(game.nameKey) : String(game.name || game.id)))),
          game.render(t));
      }

      const gear = h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('circle', { cx: 12, cy: 12, r: 3 }),
        h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }));
      const settingsPop = showSettings ? h('div', { className: 'gc-settings-pop' },
        h('div', { className: 'gc-settings-title' }, t('settingsTitle')),
        h(SettingsBody, { t })) : null;

      return h('div', { className: 'gc-root' },
        h('div', { className: 'gc-head' },
          h('div', null,
            h('div', { className: 'gc-title' }, t('title')),
            h('div', { className: 'gc-sub' }, t('subtitle'))),
          h('div', { className: 'gc-head-actions' },
            h('div', { className: 'gc-count' }, t('gameCount', { n: games.length })),
            h('div', { className: 'gc-settings-wrap' },
              h('button', {
                className: 'gc-settings-btn', type: 'button', 'aria-expanded': showSettings,
                onClick: () => setShowSettings((v) => !v),
              }, gear, t('settings')),
              settingsPop))),
        h('div', { className: 'gc-section-title' }, t('games')),
        h('div', { className: 'gc-grid' },
          games.map((g) => h(GameCard, { key: g.id, game: g, t, onPlay: () => setSelected(g.id) }))),
        h('div', { className: 'gc-empty' }, t('empty')));
    }

    function PanelIcon({ size }) {
      const s = size || 18;
      return h('svg', {
        width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { display: 'block' },
      },
        h('rect', { x: 3, y: 5, width: 18, height: 14, rx: 3 }),
        h('path', { d: 'M7 12h0M17 12h0' }),
        h('path', { d: 'M9 9v6M12 9v6M15 9v6' }));
    }

    // Rendered on this bundle's page in the plugin manager (plugins.bundle.config).
    function BundleConfig({ locale }) {
      const t = useTranslate(locale);
      return h('div', { className: 'gc-bundle-config' }, h(SettingsBody, { t }));
    }

    return {
      inject: ['slots', 'locale'],
      // Games shipped by other bundles attach through this. It is deliberately a
      // plain function on the module, not a slot: a game is data + a render
      // function, and the panel owns the frame around it.
      registerGame,
      listGames: allGames,
      apply(ctx) {
        try {
          const locale = ctx.get('locale');
          if (locale) {
            ctx.effect(() => locale.register(NS, 'zh', zh), 'game-center: locale zh');
            ctx.effect(() => locale.register(NS, 'en', en), 'game-center: locale en');
          }
          ctx.effect(() => insertStyles(CSS), 'game-center: styles');

          const label = () => {
            if (!locale) return 'Game Center';
            const bound = locale.bind(NS);
            const value = typeof bound === 'function' ? bound('open') : undefined;
            return typeof value === 'string' ? value : 'Game Center';
          };

          let disposeSidebar = null;
          const injectSidebar = () => {
            if (disposeSidebar) { try { disposeSidebar(); } catch (e) { /* already disposed */ } disposeSidebar = null; }
            if (!getSettings().sidebar) return;
            disposeSidebar = ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                { name: 'sidebar.panellist', id: PANEL_ID, order: 60, label },
                (props) => h(PanelIcon, { size: props && props.size }),
              ),
            );
          };
          injectSidebar();
          ctx.effect(() => subscribeSettings(injectSidebar), 'game-center: settings');

          ctx.slots.inject('main', () =>
            ctx.slots.register({ name: 'main', key: PANEL_ID }, () => h(GameCenterRoot, { locale })),
          );

          ctx.slots.inject('plugins.bundle.config', () =>
            ctx.slots.register(
              { name: 'plugins.bundle.config', key: 'dsh-game-center' },
              (props) => h(BundleConfig, { locale, view: props && props.view }),
            ),
          );
        } catch (err) {
          try { console.error('[game-center] apply failed', err); } catch (e) { /* no console */ }
        }
      },
    };
  },
});
