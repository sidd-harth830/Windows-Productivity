import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
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

// --- GLOBAL TRACKING STATE ---
let isFocusModeEnabled = false;
let currentBlockList: Record<string, 'fully_blocked' | number> = {};
let isQuitting = false;
let tray: Tray | null = null;

// NEW: Native Icon Storage Dictionary
let appIcons: Record<string, string> = {}; 

if (fs.existsSync(dataPath)) {
  try {
    appUsage = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    console.error("Failed to read usage data", e);
  }
}

ipcMain.on('toggle-focus-mode', (_event, enabled: boolean) => {
  isFocusModeEnabled = enabled;
  console.log(`[System Sync] Focus Mode toggled to: ${enabled}`);
});

ipcMain.on('update-block-list', (_event, rules: Record<string, 'fully_blocked' | number>) => {
  currentBlockList = rules;
  console.log(`[System Sync] Blocklist rules updated:`, currentBlockList);
});

async function startTracking(mainWindow: BrowserWindow) {
  try {
    const activeWin = (await import('active-win')).default;
    console.log("Started tracking Windows applications...");
    
    trackingInterval = setInterval(async () => {
      try {
        const windowInfo = await activeWin();
        if (windowInfo && mainWindow) {
          
          const displayAppName = windowInfo.owner.name; 
          const rawPath = windowInfo.owner.path || '';
          const actualExe = rawPath.split('\\').pop()?.toLowerCase() || displayAppName.toLowerCase();
          const now = Date.now();

          // --- NATIVE ICON EXTRACTION ---
          // If we haven't fetched the icon for this app yet, pull it from Windows!
          if (!appIcons[displayAppName] && rawPath) {
            try {
              const nativeIcon = await app.getFileIcon(rawPath, { size: 'normal' });
              appIcons[displayAppName] = nativeIcon.toDataURL(); // Convert to Base64 for React
            } catch (e) {
              console.error(`Could not fetch icon for ${displayAppName}`, e);
            }
          }
          // ------------------------------

          // --- ADVANCED FOCUS ENFORCEMENT ENGINE ---
          if (isFocusModeEnabled) {
            let ruleToApply: 'fully_blocked' | number | null = null;

            for (const [blockedApp, rule] of Object.entries(currentBlockList)) {
              const term = blockedApp.toLowerCase();
              if (displayAppName.toLowerCase().includes(term) || actualExe.includes(term)) {
                ruleToApply = rule;
                break;
              }
            }

            if (ruleToApply !== null) {
              const timeSpentToday = appUsage[displayAppName] || 0;
              const isHardBlocked = ruleToApply === 'fully_blocked';
              const isTimeExpired = typeof ruleToApply === 'number' && timeSpentToday >= ruleToApply;

              if (isHardBlocked || isTimeExpired) {
                exec(`taskkill /F /IM ${actualExe} /T`, (err) => {
                  if (err) console.error(`Failed to close application: ${actualExe}`, err);
                });
                return; 
              }
            }
          }
          // ---------------------------------------------

          if (lastApp && lastApp !== displayAppName) {
            const timeSpent = Math.floor((now - lastTime) / 1000);
            appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
            await fs.promises.writeFile(dataPath, JSON.stringify(appUsage));
          }

          if (lastApp !== displayAppName) {
            lastApp = displayAppName;
            lastTime = now;
          }

          const currentSessionTime = Math.floor((now - lastTime) / 1000);
          const totalFocusSeconds = (appUsage[displayAppName] || 0) + currentSessionTime;
          
          const liveUsageData = { ...appUsage };
          liveUsageData[displayAppName] = totalFocusSeconds;

          mainWindow.webContents.send('window-update', {
            name: displayAppName, 
            title: windowInfo.title,
            focusTime: totalFocusSeconds,
            allUsage: liveUsageData,
            appIcons: appIcons // Send the icon database to React
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

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const mainWindow = createWindow();

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'ForgePulse Engine Live', enabled: false },
    { type: 'separator' },
    { label: 'Show Dashboard', click: () => mainWindow.show() },
    { 
      label: 'Quit ForgePulse', 
      click: () => {
        isQuitting = true; 
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('ForgePulse - Tracking Active');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
  });

  startTracking(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (lastApp) {
    const timeSpent = Math.floor((Date.now() - lastTime) / 1000);
    appUsage[lastApp] = (appUsage[lastApp] || 0) + timeSpent;
    try {
      fs.writeFileSync(dataPath, JSON.stringify(appUsage));
    } catch (e) {
      console.error("Failed to save final usage data", e);
    }
  }
});