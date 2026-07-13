<div align="center">

# 🎵 youtube-music-cli

**A blazing-fast Terminal User Interface (TUI) music player for YouTube Music**
Built with React/Ink — keyboard-driven, plugin-extensible, works offline.

<p align="center">
  <img src="assets/player-preview.gif" alt="youtube-music-cli terminal preview" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@netflyapp/youtube-music-cli.svg?style=flat-square)](https://www.npmjs.com/package/@netflyapp/youtube-music-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Runtime-Bun%20%7C%20Node-black?style=flat-square&logo=bun)](https://bun.sh/)
[![Fork of involvex/youtube-music-cli](https://img.shields.io/badge/Fork%20of-involvex%2Fyoutube--music--cli-orange?style=flat-square)](https://github.com/involvex/youtube-music-cli)
[![Personal Use Only](https://img.shields.io/badge/Use-Personal%20%2F%20Hobby%20Only-red?style=flat-square)](DISCLAIMER.md)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Keyboard Shortcuts](#️-keyboard-shortcuts) • [Configuration](#️-configuration) • [Plugins](#-plugins) • [Contributing](#-contributing)

</div>

---

> **Fork notice:** This is a community fork of [involvex/youtube-music-cli](https://github.com/involvex/youtube-music-cli), maintained by [Miłosz Zając](https://github.com/netflyapp). It adds new features and bug fixes on top of the original work.

> [!WARNING]
> **Legal notice:** This is an independent hobby project, not affiliated with Google or YouTube. Using it likely violates [YouTube's Terms of Service](https://www.youtube.com/t/terms). It is intended **for personal, non-commercial use only** by people with an active YouTube Music subscription. You use this software entirely at your own risk. See [DISCLAIMER.md](DISCLAIMER.md) for full details.

---

## ✨ Features

| Feature                  | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| 🎨 **Beautiful TUI**     | Rich terminal interface built with React and Ink                        |
| 🔍 **Search**            | Find songs, albums, artists, and playlists instantly                    |
| 📋 **Queue Management**  | Build and manage your playback queue with ease                          |
| ❤️ **Favorites**         | Mark tracks with `f`, view them with `Shift+F`                          |
| 🔀 **Shuffle & Repeat**  | Multiple playback modes: off, all, one                                  |
| 🎚️ **Volume Control**    | Fine-grained volume adjustment per-session                              |
| 💡 **Smart Suggestions** | Discover related tracks and radio stations                              |
| 🎨 **Themes**            | Dark, Light, Midnight, Matrix — switch on the fly                       |
| 🔌 **Plugin System**     | Extend with adblock, lyrics, Last.fm scrobbling, Discord RPC            |
| ⌨️ **Keyboard-Driven**   | Efficient vim-style navigation — no mouse needed                        |
| 🖥️ **Immersive Mode**    | Fullscreen Windows TUI with audio visualizer and disco effects          |
| 💾 **Downloads**         | Save tracks/playlists/artists with `Shift+D`, auto-tagged with metadata |
| 📴 **Offline Mode**      | Cache tracks locally with LRU eviction, toggle with `Shift+O`           |
| 🏷️ **Metadata Tagging**  | Auto-tag title/artist/album with optional cover art                     |
| ⚡️ **Shell Completions** | Tab-complete via `ymc completions <bash\|zsh\|fish\|powershell>`        |
| 📊 **Listening Stats**   | Track your listening habits with a built-in dashboard                   |

---

## 📋 Prerequisites

**Required:**

- [mpv](https://mpv.io/) — media player backend for audio playback
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — YouTube audio stream extraction

<details>
<summary><b>🍎 macOS</b></summary>

```bash
brew install mpv yt-dlp
```

</details>

<details>
<summary><b>🐧 Linux</b></summary>

```bash
# Ubuntu / Debian
sudo apt install mpv && pip install yt-dlp

# Arch Linux
sudo pacman -S mpv yt-dlp

# Fedora
sudo dnf install mpv yt-dlp
```

</details>

<details>
<summary><b>🪟 Windows</b></summary>

```bash
scoop install mpv yt-dlp   # Scoop (recommended)
choco install mpv yt-dlp   # Chocolatey
```

</details>

---

## 🚀 Installation

### npm (Recommended)

Requires [Node.js](https://nodejs.org) 18+ or [Bun](https://bun.sh/) 1.0+.

```bash
npm install -g @netflyapp/youtube-music-cli
```

### Bun

```bash
bun install -g @netflyapp/youtube-music-cli
```

### Homebrew (macOS / Linux)

```bash
brew tap netflyapp/youtube-music-cli https://github.com/netflyapp/youtube-music-cli.git
brew install youtube-music-cli
```

### From Source

```bash
git clone https://github.com/netflyapp/youtube-music-cli.git
cd youtube-music-cli
bun install && bun run build && bun link
```

### Quick Install Script

```bash
# bash / zsh
curl -fsSL https://raw.githubusercontent.com/netflyapp/youtube-music-cli/main/scripts/install.sh | bash

# PowerShell (Windows)
iwr https://raw.githubusercontent.com/netflyapp/youtube-music-cli/main/scripts/install.ps1 | iex
```

---

## 🎮 Usage

```bash
youtube-music-cli   # or the short alias:
ymc
```

### CLI Commands

```bash
ymc play <video-id|youtube-url>   # play a specific track
ymc search "artist or song"       # search
ymc playlist <playlist-id>        # play a playlist
ymc suggestions                   # get suggestions for current track
ymc pause / resume / skip / back  # playback control
```

### Launch Options

| Flag         | Short | Description                           |
| ------------ | ----- | ------------------------------------- |
| `--theme`    | `-t`  | `dark`, `light`, `midnight`, `matrix` |
| `--volume`   | `-v`  | Initial volume 0–100                  |
| `--shuffle`  | `-s`  | Enable shuffle on startup             |
| `--repeat`   | `-r`  | `off`, `all`, `one`                   |
| `--headless` |       | Run without TUI                       |
| `--win32`    |       | Immersive fullscreen (Windows only)   |
| `--help`     | `-h`  | Show help                             |

```bash
ymc --theme=matrix --volume=80
ymc search "lofi beats" --headless
ymc play dQw4w9WgXcQ --shuffle
```

### Shell Completions

```bash
source <(ymc completions bash)                               # Bash
source <(ymc completions zsh)                                # Zsh
ymc completions fish > ~/.config/fish/completions/ymc.fish   # Fish
ymc completions powershell | Out-File -Encoding utf8 $PROFILE # PowerShell
```

---

## ⌨️ Keyboard Shortcuts

### Global

| Key       | Action              |
| --------- | ------------------- |
| `?`       | Show help           |
| `/`       | Search              |
| `p`       | Plugin manager      |
| `Shift+F` | Favorites view      |
| `g`       | Suggestions / Radio |
| `,`       | Settings            |
| `q`       | Quit                |

### Playback

| Key       | Action                             |
| --------- | ---------------------------------- |
| `Space`   | Play / Pause                       |
| `n` / `→` | Next track                         |
| `b` / `←` | Previous track                     |
| `Shift+→` | Seek forward 10s                   |
| `Shift+←` | Seek backward 10s                  |
| `=` / `-` | Volume up / down                   |
| `f`       | Toggle favorite                    |
| `s`       | Toggle shuffle                     |
| `r`       | Cycle repeat mode                  |
| `Shift+O` | Toggle Offline Mode                |
| `Shift+D` | Download selected track / playlist |

### Navigation

| Key       | Action    |
| --------- | --------- |
| `↑` / `k` | Move up   |
| `↓` / `j` | Move down |
| `Enter`   | Select    |
| `Esc`     | Back      |

---

## ⚙️ Configuration

Config is stored at `~/.youtube-music-cli/config.json` (created automatically on first run).

```json
{
	"theme": "dark",
	"volume": 70,
	"shuffle": false,
	"repeat": "off",
	"streamQuality": "high",
	"downloadsEnabled": false,
	"downloadDirectory": "~/Music/youtube-music-cli",
	"downloadFormat": "mp3",
	"offlineMode": false,
	"offlineAutoCache": false,
	"maxCacheSizeMB": 500
}
```

### Stream Quality

| Value    | Bitrate   | Best for         |
| -------- | --------- | ---------------- |
| `low`    | ~64 kbps  | Slow connections |
| `medium` | ~128 kbps | Balanced         |
| `high`   | 256 kbps+ | Best quality     |

### Offline Mode

| Option             | Default | Description                             |
| ------------------ | ------- | --------------------------------------- |
| `offlineMode`      | `false` | Force offline — only play cached tracks |
| `offlineAutoCache` | `false` | Auto-cache tracks as you play them      |
| `maxCacheSizeMB`   | `500`   | Max cache size in MB (LRU eviction)     |

Cache lives in `<downloadDirectory>/cache/`. Press `Shift+O` to toggle at runtime.

> [!NOTE]
> `offlineAutoCache` is **disabled by default** — saving audio locally is the most legally sensitive feature. Enable only for personal use with an active subscription. See [DISCLAIMER.md](DISCLAIMER.md).

---

## 🔌 Plugins

### Managing Plugins

Press `p` in the TUI, or use the CLI:

```bash
ymc plugins list
ymc plugins install adblock
ymc plugins install https://github.com/user/my-plugin
ymc plugins enable my-plugin
ymc plugins disable my-plugin
ymc plugins update my-plugin
ymc plugins remove my-plugin
```

### Built-in Plugins

| Plugin          | Description                           |
| --------------- | ------------------------------------- |
| `adblock`       | Block ads and sponsored content       |
| `lyrics`        | Display synchronized lyrics           |
| `scrobbler`     | Scrobble plays to Last.fm             |
| `discord-rpc`   | Discord Rich Presence integration     |
| `notifications` | Desktop notifications on track change |

### Developing a Plugin

```bash
cp -r templates/plugin-basic my-plugin
cd my-plugin
# Edit plugin.json and index.ts, then:
ymc plugins install /path/to/my-plugin
```

See [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT.md) and [Plugin API Reference](docs/PLUGIN_API.md).

---

## 🖥️ Immersive Mode (Windows)

A fullscreen visual player with real-time audio visualization and disco effects.

```bash
ymc --win32                         # standard
ymc --win32 --search "artist song"  # search and play immediately
DISCO_MODE=true ymc --win32         # with disco mode
bun run build:win32 && dist/ymc-win32.exe  # compiled binary
```

---

## 🔧 Troubleshooting

**`mpv` not found** — ensure `mpv` is installed and on your PATH: `mpv --version`

**No audio** — check volume (`=` to increase), verify `yt-dlp --version`, try another track.

**TUI rendering issues** — resize your terminal or restart the app.

**Offline Mode shows "No cached tracks"** — tracks cache only when `offlineAutoCache: true` and you played them while online.

---

## 🏗️ Development

```bash
git clone https://github.com/netflyapp/youtube-music-cli.git
cd youtube-music-cli
bun install        # install dependencies
bun run dev        # run in dev mode (hot reload)
bun run build      # production build
bun run lint:fix   # lint
bun run typecheck  # type check
bun run test       # run tests
```

### Project Structure

```
youtube-music-cli/
├── source/
│   ├── cli.tsx                  # CLI entry point
│   ├── app.tsx                  # React app root
│   ├── components/              # Ink/React UI components
│   ├── services/
│   │   ├── player/              # mpv subprocess management
│   │   ├── offline/             # Offline cache & LRU eviction  ← NEW
│   │   ├── youtube-music/       # Innertube API wrapper
│   │   ├── download/            # yt-dlp orchestration
│   │   └── ...
│   ├── stores/                  # Global state (Context + useReducer)
│   ├── hooks/                   # Custom React hooks
│   └── types/                   # TypeScript interfaces
├── plugins/                     # Built-in plugins
├── tests/                       # AVA test suite
└── docs/                        # Extended documentation
```

### Tech Stack

| Layer    | Technology                                                 |
| -------- | ---------------------------------------------------------- |
| Runtime  | Node.js 18+ / [Bun](https://bun.sh/)                       |
| UI       | [Ink](https://github.com/vadimdemedes/ink) (React for CLI) |
| Language | TypeScript 5                                               |
| Audio    | mpv + yt-dlp                                               |
| API      | YouTube Music Innertube (youtubei.js)                      |
| Testing  | AVA                                                        |

---

## 🗺️ Roadmap

See [`TASK.md`](TASK.md) for the full backlog. Next up:

- 🤖 **Smart Recommendations** — AI-powered suggestions based on listening history
- 📻 **Playlist Radio Mode** — endless radio from any playlist
- 📦 **Batch Downloads** — download entire playlists with progress tracking
- 🌊 **ASCII Visualizer** — real-time audio visualization in the terminal
- 🖼️ **Album Art** — display cover art via sixel / kitty protocol

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
git checkout -b feature/my-feature
# make changes
bun run lint:fix && bun run typecheck && bun run test
git commit -m 'feat: add my feature'   # Conventional Commits
git push && open a PR
```

---

## ⚖️ Legal Notice

This project violates [YouTube's Terms of Service](https://www.youtube.com/t/terms) and is intended for **personal, hobby use only**. It is not affiliated with Google or YouTube. You must have an active YouTube Music subscription to use it ethically. The author assumes no responsibility for account bans, legal claims, or any other consequences.

→ Read the full [DISCLAIMER.md](DISCLAIMER.md) before using or distributing this software.

---

## 📜 Credits & Attribution

This project is a fork of [youtube-music-cli](https://github.com/involvex/youtube-music-cli) originally created by **involvex** and released under the MIT License. All original functionality is built on their work. New features are maintained by [Miłosz Zając](https://github.com/netflyapp).

---

## 📄 License

MIT © [Miłosz Zając](https://github.com/netflyapp)

Original work MIT © [involvex](https://github.com/involvex)

---

<div align="center">

**[Report a Bug](https://github.com/netflyapp/youtube-music-cli/issues/new?template=bug_report.md)** • **[Request a Feature](https://github.com/netflyapp/youtube-music-cli/issues/new?template=feature_request.md)** • **[Discussions](https://github.com/netflyapp/youtube-music-cli/discussions)**

Made with ❤️ for music lovers who live in the terminal

⚠️ [Legal Disclaimer](DISCLAIMER.md) — Personal use only • Not affiliated with Google or YouTube

</div>
