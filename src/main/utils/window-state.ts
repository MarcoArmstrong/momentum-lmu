import { app, Rectangle } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const stateFile = join(app.getPath('userData'), 'telemetry-window-state.json')

export function loadWindowState(
  defaults: Partial<Rectangle> = { x: 0, y: 0 },
): Partial<Rectangle> {
  try {
    if (existsSync(stateFile)) {
      return JSON.parse(readFileSync(stateFile, 'utf-8')) as Partial<Rectangle>
    }
  } catch (e) {
    console.warn('Failed to load window state:', e)
  }
  return defaults
}

export function saveWindowState(bounds: Partial<Rectangle>): void {
  try {
    writeFileSync(stateFile, JSON.stringify(bounds))
  } catch (e) {
    console.warn('Failed to save window state:', e)
  }
}
