import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let trackingInterval: NodeJS.Timeout | null = null;
let lastApp: string | null = null;
let lastTime: number = Date.now();

// 1. Setup the secure save location on Windows
const dataPath = join(app.getPath('userData'), 'usage-data.json');
let appUsage: Record<string, number> = {};

// 2. Load existing data if the user has used the app before
if (fs.existsSync(dataPath)) {
  try {
    appUsage = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    console.error("Failed to read usage data", e);
  }
}

async function startTracking(mainWindow: BrowserWindow) {
  try {
    const activeWin = (await import('active-win')).default;
    console.log("Started tracking Windows applications...");
    
    trackingInterval = setInterval(async () => {
      try {
        const windowInfo = await activeWin();
        if (windowInfo && mainWindow) {
          const currentApp = windowInfo.owner.name;
          const now = Date.now();

          // 3. If the user switched to a new app, calculate time spent on the last one
          if (lastApp && lastApp !== currentApp) {
            const timeSpent = Math.floor((now - lastTime) / 1000); // Convert milliseconds to seconds
            appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
            
            // Save to hard drive
            fs.writeFileSync(dataPath, JSON.stringify(appUsage));
          }

          // 4. Update our trackers
          if (lastApp !== currentApp) {
            lastApp = currentApp;
            lastTime = now;
          }

          // 5. Calculate total time (saved history + current active session)
          const currentSessionTime = Math.floor((now - lastTime) / 1000);
          const totalFocusSeconds = (appUsage[currentApp] || 0) + currentSessionTime;

          // 6. Send across the bridge!
          mainWindow.webContents.send('window-update', {
            name: currentApp,
            title: windowInfo.title,
            focusTime: totalFocusSeconds
          });
        }
      } catch (err) {
        console.error("Error reading active window:", err);
      }
    }, 2000);
  } catch (error) {
    console.error("Failed to import active-win:", error);
  }
}

// 7. Save the very last chunk of time when the user closes the app
app.on('before-quit', () => {
  if (lastApp) {
    const timeSpent = Math.floor((Date.now() - lastTime) / 1000);
    appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
    fs.writeFileSync(dataPath, JSON.stringify(appUsage));
  }
});

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  const mainWindow = createWindow()
  startTracking(mainWindow) 

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})