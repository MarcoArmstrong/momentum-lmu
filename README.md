# Momentum

A Le Mans Ultimate telemetry overlay application built with Electron and TypeScript.

## Features

- **Dual Window System**: Main control window and separate telemetry overlay
- **Real-time Telemetry**: RPM, speed, gear, throttle, and brake data from Le Mans Ultimate
- **Shared Memory Connection**: Direct connection to game's shared memory for low-latency data
- **Always-on-Top Overlay**: Telemetry window stays on top of other applications
- **Keyboard Shortcuts**: Quick window management controls

## Keyboard Shortcuts

- `Ctrl+Shift+T`: Toggle main window always-on-top
- `Ctrl+Shift+H`: Toggle telemetry window visibility
- `Ctrl+Shift+R`: Move telemetry window to top-right corner

## Project Setup

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
