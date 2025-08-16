import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { TelemetryReader } from './telemetry-reader'

let telemetryReader: TelemetryReader
let mainWindow: BrowserWindow
let telemetryWindow: BrowserWindow

function createMainWindow(): void {
  // Create the main browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true, // Keep window on top of other applications (like the game)
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTelemetryWindow(): void {
  console.log('🔧 Creating telemetry window...')
  
  // Create the telemetry overlay window.
  telemetryWindow = new BrowserWindow({
    width: 300,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    frame: false, // Remove window frame for overlay look
    transparent: true, // Make background transparent
    resizable: false,
    skipTaskbar: true, // Don't show in taskbar
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  telemetryWindow.on('ready-to-show', () => {
    console.log('✅ Telemetry window ready to show')
    telemetryWindow.show()
  })

  telemetryWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Telemetry window finished loading')
  })

  telemetryWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Telemetry window failed to load:', errorCode, errorDescription)
  })

  // Load the telemetry HTML file
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // In development, load from the dev server
    const telemetryUrl = `${process.env['ELECTRON_RENDERER_URL']}/telemetry.html`
    console.log('📁 Loading telemetry from URL:', telemetryUrl)
    telemetryWindow.loadURL(telemetryUrl)
  } else {
    // In production, load from file
    const telemetryPath = join(__dirname, '../renderer/telemetry.html')
    console.log('📁 Loading telemetry from file:', telemetryPath)
    telemetryWindow.loadFile(telemetryPath)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    
    // Add keyboard shortcuts for window management
    window.webContents.on('before-input-event', (_event, input) => {
      // Toggle always-on-top for main window (Ctrl+Shift+T)
      if (input.control && input.shift && input.key.toLowerCase() === 't') {
        const isOnTop = window.isAlwaysOnTop()
        window.setAlwaysOnTop(!isOnTop)
        console.log(`Main window always on top: ${!isOnTop ? 'enabled' : 'disabled'}`)
      }
      
      // Toggle telemetry window visibility (Ctrl+Shift+H)
      if (input.control && input.shift && input.key.toLowerCase() === 'h') {
        if (telemetryWindow) {
          const isVisible = telemetryWindow.isVisible()
          if (isVisible) {
            telemetryWindow.hide()
            console.log('Telemetry window hidden')
          } else {
            telemetryWindow.show()
            console.log('Telemetry window shown')
          }
        }
      }
      
      // Move telemetry window to top-right corner (Ctrl+Shift+R)
      if (input.control && input.shift && input.key.toLowerCase() === 'r') {
        if (telemetryWindow) {
          const { width } = screen.getPrimaryDisplay().workAreaSize
          telemetryWindow.setPosition(width - 320, 20)
          console.log('Telemetry window moved to top-right')
        }
      }
    })
  })

  // Initialize unified telemetry reader (tries both shared memory and REST API)
  telemetryReader = new TelemetryReader()

  // IPC handlers
  ipcMain.on('ping', () => console.log('pong'))
  
  ipcMain.handle('get-rpm-data', async () => {
    return await telemetryReader.readTelemetryData()
  })
  
  ipcMain.handle('is-game-running', () => {
    return telemetryReader.isGameRunning()
  })
  
  ipcMain.handle('get-connection-status', () => {
    return telemetryReader.getConnectionStatus()
  })
  
  ipcMain.handle('get-connection-method', () => {
    return telemetryReader.getCurrentMethod()
  })
  
  ipcMain.handle('get-debug-info', () => {
    return telemetryReader.getDebugInfo()
  })
  
  // Test IPC handler for telemetry window
  ipcMain.handle('test-telemetry-window', () => {
    console.log('🧪 Test telemetry window IPC called')
    return { success: true, message: 'Telemetry window IPC is working' }
  })

  createMainWindow()
  createTelemetryWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
      createTelemetryWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
