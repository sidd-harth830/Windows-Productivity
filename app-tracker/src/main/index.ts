import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let trackingInterval: NodeJS.Timeout | null = null;
let lastApp: string | null = null;
let lastTime: number = Date.now();

const dataPath = join(app.getPath('userData'), 'usage-data.json');
let appUsage: Record<string, number> = {};

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
    
    trackingInterval = setInterval(async () => {
      try {
        const windowInfo = await activeWin();
        if (windowInfo && mainWindow) {
          const currentApp = windowInfo.owner.name;
          const now = Date.now();

          if (lastApp && lastApp !== currentApp) {
            const timeSpent = Math.floor((now - lastTime) / 1000);
            appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
            
            // APPLIED THE CODE ASSIST FIX: Asynchronous saving!
            await fs.promises.writeFile(dataPath, JSON.stringify(appUsage));
          }

          if (lastApp !== currentApp) {
            lastApp = currentApp;
            lastTime = now;
          }

          const currentSessionTime = Math.floor((now - lastTime) / 1000);
          const totalFocusSeconds = (appUsage[currentApp] || 0) + currentSessionTime;
          
          // Create a real-time clone of the database to send to the chart
          const liveUsageData = { ...appUsage };
          liveUsageData[currentApp] = totalFocusSeconds;

          mainWindow.webContents.send('window-update', {
            name: currentApp,
            title: windowInfo.title,
            focusTime: totalFocusSeconds,
            allUsage: liveUsageData // Sending all data to React!
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

app.on('before-quit', () => {
  if (lastApp) {
    const timeSpent = Math.floor((Date.now() - lastTime) / 1000);
    appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
    fs.writeFileSync(dataPath, JSON.stringify(appUsage));
  }
});

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1000, // Widened the window slightly to fit the chart nicely
    height: 750,
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