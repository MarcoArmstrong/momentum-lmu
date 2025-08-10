# Le Mans Ultimate Telemetry Setup

This application reads telemetry data from Le Mans Ultimate using the rF2SharedMemoryMapPlugin.

## Prerequisites

1. **Le Mans Ultimate** must be installed and running
2. **rF2SharedMemoryMapPlugin** must be installed and enabled in the game

## Installation

1. Install the rF2SharedMemoryMapPlugin:
   - Download from: https://github.com/TheIronWolfModding/rF2SharedMemoryMapPlugin
   - Place `rFactor2SharedMemoryMapPlugin64.dll` in `Le Mans Ultimate\Plugins` folder

2. Enable the plugin in Le Mans Ultimate:
   - Edit `CustomPluginVariables.JSON` file under `Le Mans Ultimate\UserData\player` folder
   - Set `" Enabled"` value to `1` for the rFactor2SharedMemoryMapPlugin64.dll entry
   - If the entry doesn't exist, make sure `VC12 (Visual C++ 2013) runtime` is installed from `Le Mans Ultimate\Support\Runtimes` folder
   - **Restart the game** after enabling the plugin

## Running the Application

1. Start Le Mans Ultimate
2. Run this application:
   ```bash
   npm run dev
   ```

## Features

- **Real-time RPM reading** from the car engine
- **Speed display** in km/h
- **Gear indicator**
- **Connection status** showing if the game is detected

## Data Structure

The application reads basic telemetry data including:
- Engine RPM
- Max RPM
- Vehicle speed
- Current gear

## Troubleshooting

- If "Disconnected" is shown, make sure Le Mans Ultimate is running
- Ensure the rF2SharedMemoryMapPlugin is properly installed and enabled
- Check that the shared memory name matches: `Local\rFactor2SMMPData`
- **Important**: The game must be in `Borderless` or `Windowed` mode. `Fullscreen` mode is not supported
- Check the console output for detailed connection attempts and error messages
- Verify the plugin is enabled in `CustomPluginVariables.JSON` and restart the game

## Notes

- The app polls for data every 100ms
- Speed is converted from m/s to km/h for display
- RPM values are rounded to whole numbers for readability
