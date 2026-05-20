import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let trackingInterval: NodeJS.Timeout | null = null;
let lastApp: string | null = null;
let lastTime: number = Date.now();

const dataPath = join(app.getPath('userData'), 'usage-data.json');
let appUsage: Record<string, number> = {};

// Dynamic tracking variables
let isFocusModeEnabled = false;
let currentBlockList: string[] = ['chrome.exe', 'msedge.exe']; // Default fallback apps

if (fs.existsSync(dataPath)) {
  try {
    appUsage = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    console.error("Failed to read usage data", e);
  }
}

// IPC Listeners
ipcMain.on('toggle-focus-mode', (_event, enabled: boolean) => {
  isFocusModeEnabled = enabled;
  console.log(`[System Sync] Focus Mode toggled to: ${enabled}`);
});

// NEW: Dynamically update the backend blocklist array when the user types in the UI
ipcMain.on('update-block-list', (_event, list: string[]) => {
  currentBlockList = list.map(app => app.toLowerCase());
  console.log(`[System Sync] Blocklist updated:`, currentBlockList);
});

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

          // --- DYNAMIC FOCUS MODE ENFORCEMENT ENGINE ---
          if (isFocusModeEnabled) {
            const appName = currentApp.toLowerCase();
            let processToKill: string | null = null;

            // Check if the current app name or executable matches anything in the custom blocklist
            const matchesBlocklist = currentBlockList.some(blockedItem => {
              const cleanedItem = blockedItem.replace('.exe', '');
              return appName.includes(cleanedItem);
            });

            if (matchesBlocklist) {
              // Ensure we extract the exact executable extension format for taskkill
              processToKill = appName.endsWith('.exe') ? appName : `${appName}.exe`;
              
              // Custom safety maps for browsers that mask their internal process names
              if (appName.includes('chrome')) processToKill = 'chrome.exe';
              if (appName.includes('edge')) processToKill = 'msedge.exe';
              if (appName.includes('brave')) processToKill = 'brave.exe';

              console.log(`[Focus Block] Guard caught restricted target: ${appName}. Shutting down ${processToKill}...`);
              
              exec(`taskkill /F /IM ${processToKill} /T`, (err) => {
                if (err) console.error(`Failed to close application: ${processToKill}`, err);
              });
              return;
            }
          }
          // ---------------------------------------------

          if (lastApp && lastApp !== currentApp) {
            const timeSpent = Math.floor((now - lastTime) / 1000);
            appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
            await fs.promises.writeFile(dataPath, JSON.stringify(appUsage));
          }

          if (lastApp !== currentApp) {
            lastApp = currentApp;
            lastTime = now;
          }

          const currentSessionTime = Math.floor((now - lastTime) / 1000);
          const totalFocusSeconds = (appUsage[currentApp] || 0) + currentSessionTime;
          
          const liveUsageData = { ...appUsage };
          liveUsageData[currentApp] = totalFocusSeconds;

          mainWindow.webContents.send('window-update', {
            name: currentApp,
            title: windowInfo.title,
            focusTime: totalFocusSeconds,
            allUsage: liveUsageData
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
    width: 1000,
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