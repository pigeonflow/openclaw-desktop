# OpenClaw Desktop

A Tauri v2 desktop app wrapping the OpenClaw AI assistant platform.

## Phase 1 features

- 5-menu sidebar: Chat, Connected Apps, Skills, Developer, Settings
- Developer tab embeds the OpenClaw gateway UI (`http://localhost:18789`)
- Gateway sidecar: starts `openclaw gateway run` on launch, kills it on exit
- Loading screen shown while waiting for gateway to be ready
- Live gateway status indicator (green/red dot in sidebar)

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [openclaw CLI](https://openclaw.dev) installed at `/opt/homebrew/bin/openclaw` (Mac) or in PATH (Windows)
- Tauri system dependencies (WebView2 on Windows, WebKit on Mac — usually pre-installed)

## Development

```bash
# Install dependencies
npm install

# Start dev server (frontend + Tauri window)
npm run tauri dev
```

This will:
1. Start the Vite dev server on port 1420
2. Launch the Tauri window
3. Start the `openclaw gateway run` sidecar in the background
4. Show a loading screen while the gateway initialises (up to 8 seconds before showing the app anyway)

## Build for production

```bash
npm run tauri build
```

The distributable is output to `src-tauri/target/release/bundle/`.

## Project structure

```
openclaw-desktop/
├── src/                    # React + TypeScript frontend
│   ├── App.tsx             # Main app: sidebar + page routing
│   ├── useGatewayStatus.ts # Polls gateway health, returns up/down/checking
│   ├── icons.tsx           # Inline SVG icons (no external dep)
│   ├── styles.css          # All CSS (dark theme, variables)
│   └── main.tsx            # React entry point
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs          # Tauri setup: spawns openclaw sidecar
│   │   └── main.rs         # Binary entry point
│   ├── binaries/           # Sidecar wrapper script (per platform)
│   ├── icons/              # App icons
│   ├── capabilities/       # Tauri v2 permission system
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Gateway sidecar

The app ships a thin wrapper script (`src-tauri/binaries/openclaw-<triple>`) that:
1. Finds the `openclaw` binary in common locations (`/opt/homebrew/bin`, `/usr/local/bin`, PATH)
2. Proxies all arguments to it

Tauri manages the sidecar lifecycle: spawns on launch, kills on window close.

**For Windows builds:** Add `binaries/openclaw-x86_64-pc-windows-msvc.exe` (or the appropriate triple) pointing to/wrapping the Windows openclaw binary.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Gateway dot stays red | Check `openclaw gateway run` works in a terminal |
| App opens but iframe is blank | Gateway may need a moment — wait for green dot |
| `sidecar not found` error | Ensure `openclaw` is installed; check `binaries/` has the right triple name |
| Tauri build fails on icons | Icons must be RGBA PNG — regenerate with `npm run tauri icon <your-icon.png>` |
