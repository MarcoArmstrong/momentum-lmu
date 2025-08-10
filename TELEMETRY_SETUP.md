# Le Mans Ultimate Telemetry Setup

This application reads telemetry data from Le Mans Ultimate using the rF2SharedMemoryMapPlugin.

## Prerequisites

1. **Le Mans Ultimate** must be installed and running
2. **rF2SharedMemoryMapPlugin** must be installed and enabled in the game

## Installation

1. Install the rF2SharedMemoryMapPlugin:
   - Download from: https://github.com/TheIronWolfModding/rF2SharedMemoryMapPlugin
   - Follow the installation instructions in the plugin repository

2. Enable the plugin in Le Mans Ultimate:
   - The plugin should create shared memory that this app can read

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

## Notes

- The app polls for data every 100ms
- Speed is converted from m/s to km/h for display
- RPM values are rounded to whole numbers for readability
