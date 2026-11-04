# Game Center

[English](#english) | [中文](#中文)

![version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.5-blueviolet.svg)
![license](https://img.shields.io/badge/license-MIT-green.svg)

---

## English

A DeepSeek Harness panel plugin that keeps the mini-games built for this harness in one place, and lets you play them without leaving the window. Ships with Tetris.

![The game library](assets/screenshot-1.png)

![Playing Tetris](assets/screenshot-2.png)

### Requirements

| | |
| --- | --- |
| DeepSeek Harness | `0.2.1-rc.5` (Web UI) |
| Node.js | `>= 22` |
| npm dependencies | none at runtime — the panel injects `@deepseek-ai/dsh-client-locale` and `@deepseek-ai/dsh-client-ui-slots`, which the harness provides |

### Install

```sh
dsh plugin add github:stallenlu/dsh-game-center
```

Restart DSH (or refresh the Web UI) afterwards, then open **Game Center** from the sidebar.

### What it does

- **One list for the games.** The panel is a game library: each game is a card with its name, category, version and status, and it plays in the same panel — no new tab or window.
- **Tetris.** A 10×20 board, seven pieces with wall kicks, a ghost piece, a next-piece preview, line-clear scoring, levels that speed the falling piece up, pause/restart, and a best score kept in `localStorage`.
- **Difficulty.** Easy / Normal / Hard start the game at level 1 / 3 / 5; the level still rises as you clear lines.
- **Settings.** Show or hide the sidebar entry, and reset to defaults. Reachable from the gear button in the panel header and from the plugin's page under **Plugins**.
- **Theme.** Colours come from the harness theme tokens (`--dsw-alias-*`), so the panel follows light and dark mode.

### Controls

| Key | Action |
| --- | --- |
| `←` `→` | Move |
| `↑` `X` | Rotate |
| `↓` | Soft drop |
| `Space` | Hard drop |
| `P` | Pause |

### Layout

```
client.js          the Web client plugin: panel, settings, games, Tetris
index.js           host-side entry (no host behaviour)
cordis.patch.yml   the insert row that mounts the bundle
locale/*.json      the plugin-list title and description
icon.svg           the in-app icon
assets/            storefront images
verify.mjs         runnable check (node verify.mjs) — wiring + Tetris core
```

### Adding a game

`client.js` has a `GAMES` registry; an entry declares `{ id, nameKey, descKey, categoryKey, version, statusKey, thumb, thumbColor, render(t) }` and appears in the library automatically. `render` receives the translate function and returns the game's element. A new game also needs its strings added to the `zh` / `en` dictionaries registered at the top of `apply()`.

### Development

`verify.mjs` runs without the harness: it loads `client.js`, captures the module, calls `apply()` against a stub context, asserts the three slots (main panel, sidebar entry, plugin-page config) and the locale registrations, then exercises the Tetris core (rotation, collision, line clearing, drop scoring).

```sh
node verify.mjs
```

### License

MIT

---

## 中文

一个 DeepSeek Harness 面板插件：把为这个 harness 开发的小游戏集中到一处，不用离开当前窗口就能玩。首发游戏：俄罗斯方块。

![游戏库](assets/screenshot-1.png)

![玩俄罗斯方块](assets/screenshot-2.png)

### 环境要求

| | |
| --- | --- |
| DeepSeek Harness | `0.2.1-rc.5`（Web UI） |
| Node.js | `>= 22` |
| npm 依赖 | 运行时无依赖——面板只注入 `@deepseek-ai/dsh-client-locale` 和 `@deepseek-ai/dsh-client-ui-slots`，由 harness 提供 |

### 安装

```sh
dsh plugin add github:stallenlu/dsh-game-center
```

安装后重启 DSH（或刷新 Web UI），从侧边栏打开**游戏中心**。

### 功能

- **一个列表管理游戏。** 面板本身就是游戏库：每款游戏一张卡片，带名称、分类、版本与状态，点开就在同一面板里游玩，不新开标签页或窗口。
- **俄罗斯方块。** 10×20 棋盘、七种方块（含靠墙微调）、落点虚影、下一个方块预览、消行计分、等级越高落得越快、暂停/重开，最高分存在 `localStorage`。
- **难度。** 简单 / 普通 / 困难分别从第 1 / 3 / 5 级开始；等级仍会随消行继续上升。
- **设置。** 可以显示或隐藏侧边栏入口，以及恢复默认。面板右上角的齿轮按钮和插件页都能打开。
- **主题。** 配色取自 harness 主题变量（`--dsw-alias-*`），明暗主题自动跟随。

### 操作

| 按键 | 作用 |
| --- | --- |
| `←` `→` | 移动 |
| `↑` `X` | 旋转 |
| `↓` | 软降 |
| `Space` | 硬降 |
| `P` | 暂停 |

### 目录

```
client.js          Web 客户端插件：面板、设置、游戏、俄罗斯方块
index.js           宿主侧入口（无宿主行为）
cordis.patch.yml   挂载 bundle 的 insert 行
locale/*.json      插件列表的标题与描述
icon.svg           应用内图标
assets/            商店图片
verify.mjs         可运行自检（node verify.mjs）：接线 + 俄罗斯方块核心
```

### 增加小游戏

`client.js` 里有一个 `GAMES` 注册表，一条记录声明 `{ id, nameKey, descKey, categoryKey, version, statusKey, thumb, thumbColor, render(t) }` 后会自动出现在游戏库中。`render` 收到翻译函数并返回游戏元素；新游戏还需要把文案加进 `apply()` 顶部注册的 `zh` / `en` 字典。

### 开发

`verify.mjs` 不依赖 harness 即可运行：加载 `client.js`、捕获模块、用桩上下文调用 `apply()`，断言三个插槽（主面板、侧边栏入口、插件页配置）与语言注册，再跑一遍俄罗斯方块核心逻辑（旋转、碰撞、消行、下落计分）。

```sh
node verify.mjs
```

### 许可

MIT
