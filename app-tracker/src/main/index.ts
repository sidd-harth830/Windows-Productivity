import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog, Notification, powerMonitor, globalShortcut } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as db from './database' // Fully integrated SQLite database!

let lastApp: string | null = null;
let lastCheckTime: number = Date.now();
let lastUiUpdate: number = 0; // 0 forces instant boot update

let appUsage: Record<string, number> = {};
let appIcons: Record<string, string> = {}; 

let isFocusModeEnabled = false;
let currentBlockList: Record<string, 'fully_blocked' | number> = {};
let isQuitting = false;
let tray: Tray | null = null;
let warningSent: Record<string, boolean> = {};

// Preferences
let trackSystemApps = false;
let trackSelf = false;
let hiddenApps: string[] = [];
let stopTrackingOnIdle = true;
let isUserIdle = false;

// Focus Session State
let focusTimerInterval: NodeJS.Timeout | null = null;
let focusActive = false;
let focusTimeLeft = 0;
let focusTotalDuration = 0;
let todayStr = new Date().toISOString().split('T')[0];

// --- 1. Database Initialization ---
appUsage = db.getUsageForDate(todayStr);
const metadata = db.getAppMetadata();
appIcons = metadata.icons;

function checkDateRoll() {
  const currentStr = new Date().toISOString().split('T')[0];
  if (currentStr !== todayStr) {
    todayStr = currentStr;
    appUsage = db.getUsageForDate(todayStr);
    warningSent = {}; // Reset warnings for the new day
  }
}

// --- 1.5 System Tray Dynamic Menu ---
function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Zeitra Engine Live', enabled: false },
    { type: 'separator' },
    { 
      label: 'Focus Mode', 
      type: 'checkbox', 
      checked: isFocusModeEnabled, 
      click: (menuItem) => { 
        isFocusModeEnabled = menuItem.checked; 
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('sync-focus-mode', isFocusModeEnabled));
      } 
    },
    { type: 'separator' },
    { label: 'Show Dashboard', click: () => {
        const wins = BrowserWindow.getAllWindows();
        if (wins.length > 0) wins[0].show();
    } },
    { label: 'Quit Zeitra', click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(contextMenu);
}

// --- 2. IPC Channels ---
ipcMain.handle('get-initial-data', () => {
  return {
    allUsage: appUsage,
    hourlyUsageToday: db.getHourlyUsageForDate(todayStr),
    appIcons: appIcons,
    blockList: currentBlockList,
    isFocusMode: isFocusModeEnabled
  };
});

ipcMain.on('toggle-focus-mode', (_event, enabled: boolean) => {
  isFocusModeEnabled = enabled;
  updateTrayMenu();
});
ipcMain.on('update-block-list', (_event, rules: Record<string, 'fully_blocked' | number>) => currentBlockList = rules);

ipcMain.on('update-preferences', (_event, prefs) => {
  trackSystemApps = prefs.trackSystemApps ?? false;
  trackSelf = prefs.trackSelf ?? false;
  hiddenApps = prefs.hiddenApps ?? [];
  stopTrackingOnIdle = prefs.stopTrackingOnIdle ?? true;
});

// OS Auto-Start Integration
ipcMain.handle('get-auto-start', () => app.getLoginItemSettings().openAtLogin);
ipcMain.on('toggle-auto-start', (_event, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled, args: ['--hidden'] });
});

// Focus Timer Integration
ipcMain.on('start-focus-timer', (_event, minutes: number) => {
  focusActive = true;
  focusTotalDuration = minutes * 60;
  focusTimeLeft = minutes * 60;
  isFocusModeEnabled = true; // Auto-engage global blocking
  updateTrayMenu();
  
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('focus-timer-tick', { active: focusActive, timeLeft: focusTimeLeft, total: focusTotalDuration }));

  if (!focusTimerInterval) {
    focusTimerInterval = setInterval(() => {
      if (focusActive && focusTimeLeft > 0) {
        focusTimeLeft--;
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('focus-timer-tick', { active: focusActive, timeLeft: focusTimeLeft, total: focusTotalDuration }));
      } else if (focusActive && focusTimeLeft <= 0) {
        focusActive = false;
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('focus-timer-tick', { active: false, timeLeft: 0, total: focusTotalDuration }));
        new Notification({ title: 'Session Complete', body: 'Great job! Take a short break to recharge.' }).show();
      }
    }, 1000);
  }
});

ipcMain.on('stop-focus-timer', () => {
  focusActive = false;
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('focus-timer-tick', { active: false, timeLeft: focusTimeLeft, total: focusTotalDuration }));
});

// Window Controls
ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) win.restore();
    else win.maximize();
  }
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close(); // Triggers the 'close' event which hides it cleanly
});

ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (win) win.setAlwaysOnTop(isAlwaysOnTop);
});

ipcMain.on('show-notification', (_event, title: string, body: string) => {
  new Notification({ title, body }).show();
});

ipcMain.handle('save-csv', async (_event, csvContent: string) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Usage Data',
    defaultPath: `Zeitra-Analytics-${todayStr}.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  if (filePath) {
    const fs = require('fs');
    await fs.promises.writeFile(filePath, csvContent, 'utf-8');
    return true;
  }
  return false;
});

ipcMain.handle('add-offline-time', async (_event, activityName: string, minutes: number) => {
  try {
    const displayAppName = activityName.trim() + ' (Offline)';
    const seconds = minutes * 60;
    db.upsertUsage(todayStr, displayAppName, seconds);
    appUsage = db.getUsageForDate(todayStr); // Sync memory cache
    
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('window-update', { name: lastApp || 'Desktop', title: '', allUsage: { ...appUsage } });
    });
    return true;
  } catch (e) { return false; }
});

ipcMain.handle('remove-app-usage', async (_event, appName: string) => {
  try {
    db.deleteAppUsage(todayStr, appName);
    appUsage = db.getUsageForDate(todayStr); 
    
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('window-update', { name: lastApp || 'Desktop', title: '', allUsage: { ...appUsage } });
    });
    return true;
  } catch (e) { return false; }
});

ipcMain.handle('refresh-app-icon', async (_event, appName: string) => {
  try {
    const exePath = db.getAppPath(appName);
    if (exePath) {
      const nativeIcon = await app.getFileIcon(exePath, { size: 'large' });
      const iconBase64 = nativeIcon.toDataURL();
      appIcons[appName] = iconBase64;
      db.upsertAppMetadata({ appName, iconBase64 });
      
      BrowserWindow.getAllWindows().forEach(win => { win.webContents.send('icon-update', { appName, icon: iconBase64 }); });
      return true;
    }
    return false;
  } catch (e) { return false; }
});

ipcMain.handle('open-file-location', (_event, appName: string) => {
  const exePath = db.getAppPath(appName);
  if (exePath) {
    shell.showItemInFolder(exePath); // Opens Windows Explorer directly to the file!
    return true;
  }
  return false;
});

ipcMain.handle('clear-usage-data', async () => {
  try {
    db.clearAllUsage();
    appUsage = {};
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('window-update', { name: lastApp || 'Desktop', title: '', allUsage: {} });
    });
    return true;
  } catch (e) { return false; }
});

ipcMain.handle('browse-for-exe', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Executable',
    filters: [{ name: 'Applications', extensions: ['exe'] }],
    properties: ['openFile']
  });
  
  if (canceled || filePaths.length === 0) return null;
  
  const exePath = filePaths[0];
  const rawName = exePath.split('\\').pop() || '';
  const displayAppName = cleanAppName(rawName);

  if (!appIcons[displayAppName]) {
    try {
      const nativeIcon = await app.getFileIcon(exePath, { size: 'large' });
      const iconBase64 = nativeIcon.toDataURL();
      appIcons[displayAppName] = iconBase64;
      db.upsertAppMetadata({ appName: displayAppName, exePath, iconBase64 });
      
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('icon-update', { appName: displayAppName, icon: iconBase64 });
      });
    } catch (e) {}
  }
  return displayAppName;
});

ipcMain.handle('get-history', () => ({
  daily: db.getAllUsage(),
  hourly: db.getHourlyUsage()
}));

ipcMain.handle('check-for-updates', async () => {
  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      // checkForUpdatesAndNotify() automatically downloads if available and triggers OS notifications
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return !!result;
    } catch (e) { return false; }
  }
  return false; // Updates don't run in development mode
});

// --- 3. Utilities ---
function cleanAppName(rawName: string): string {
  let clean = rawName.replace(/\.exe$/i, '').trim();
  if (clean.toLowerCase() === 'code') return 'VS Code';
  if (clean.toLowerCase() === 'msedge') return 'Microsoft Edge';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// --- 4. The Precision Tracking Engine ---
async function startTracking(mainWindow: BrowserWindow) {
  try {
    const activeWin = (await import('active-win')).default;
    
    const track = async () => {
      try {
        const windowInfo = await activeWin();
        if (windowInfo && mainWindow) {
          
          const owner = windowInfo.owner || ({} as any);
          const rawName = owner.name || windowInfo.title || 'Unknown Process'; 
          const rawPath = owner.path || '';
          const actualExe = rawPath.split('\\').pop()?.toLowerCase() || rawName.toLowerCase();
          const displayAppName = cleanAppName(rawName);

          const now = Date.now();
          const timeDiff = Math.floor((now - lastCheckTime) / 1000);
          lastCheckTime = now;

          checkDateRoll();

          // INTELLIGENT IDLE TRACKING via Native OS powerMonitor
          const idleSeconds = powerMonitor.getSystemIdleTime();
          isUserIdle = stopTrackingOnIdle && idleSeconds >= 300; // Away for 5 mins

          // Cache missing icons instantly to DB
          if (!appIcons[displayAppName] && rawPath) {
            try {
              const nativeIcon = await app.getFileIcon(rawPath, { size: 'large' });
              const iconDataURL = nativeIcon.toDataURL();
              appIcons[displayAppName] = iconDataURL; 
              db.upsertAppMetadata({ appName: displayAppName, exePath: rawPath, iconBase64: iconDataURL });

              BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('icon-update', { appName: displayAppName, icon: iconDataURL });
              });
            } catch (e) {}
          }

          // Focus Block Logic
          const hasActiveRules = Object.keys(currentBlockList).length > 0;
          if (isFocusModeEnabled && !isUserIdle && hasActiveRules) {
            let ruleToApply: 'fully_blocked' | number | null = null;
            for (const [blockedApp, rule] of Object.entries(currentBlockList)) {
              const term = blockedApp.toLowerCase();
              if (displayAppName.toLowerCase().includes(term) || actualExe.includes(term)) {
                ruleToApply = rule; break;
              }
            }

            if (ruleToApply !== null) {
              const timeSpentToday = appUsage[displayAppName] || 0;
              const isHardBlocked = ruleToApply === 'fully_blocked';
              const isTimeExpired = typeof ruleToApply === 'number' && timeSpentToday >= ruleToApply;

              if (isHardBlocked || isTimeExpired) {
                exec(`taskkill /F /IM ${actualExe} /T`, () => {});
                return; // Guard prevents tracking
              }

              if (!isHardBlocked && typeof ruleToApply === 'number') {
                const timeLeft = ruleToApply - timeSpentToday;
                if (timeLeft <= 300 && timeLeft > 0 && !warningSent[displayAppName]) {
                  new Notification({
                    title: 'Zeitra - Time Limit Approaching',
                    body: `You have less than 5 minutes remaining for ${displayAppName}.`
                  }).show();
                  warningSent[displayAppName] = true;
                }
              }
            }
          }

          const lowerPath = rawPath.toLowerCase();
          const isSystemApp = lowerPath.includes('\\windows\\') || lowerPath.includes('system32') || lowerPath.includes('windowsapps') || displayAppName.toLowerCase() === 'windows explorer' || displayAppName.toLowerCase() === 'searchhost';
          const isSelfApp = displayAppName.toLowerCase().includes('zeitra') || displayAppName.toLowerCase().includes('forgepulse') || displayAppName.toLowerCase().includes('electron') || displayAppName.toLowerCase().includes('app-tracker');

          let shouldTrack = true;
          if (!trackSystemApps && isSystemApp) shouldTrack = false;
          if (!trackSelf && isSelfApp) shouldTrack = false;
          if (hiddenApps.includes(displayAppName)) shouldTrack = false;

          // Track Time to SQLite DB if not idle
          if (!isUserIdle && shouldTrack) {
            db.upsertUsage(todayStr, displayAppName, timeDiff);
            appUsage = db.getUsageForDate(todayStr); // Keep memory synced with DB

            if (tray) {
              const tip = `Zeitra\nActive: ${displayAppName} (${formatTime(appUsage[displayAppName])})`;
              tray.setToolTip(tip.length > 127 ? tip.substring(0, 124) + '...' : tip);
            }
          } else if (tray) {
            tray.setToolTip(isUserIdle ? 'Zeitra - Idle (Tracking Paused)' : 'Zeitra - Tracking System Process');
          }

          const appChanged = lastApp !== displayAppName;
          if (appChanged) lastApp = displayAppName;

          const timeSinceLastUpdate = now - lastUiUpdate;
          if (appChanged || timeSinceLastUpdate >= 60000) {
            mainWindow.webContents.send('window-update', {
              name: displayAppName, 
              title: windowInfo.title,
              allUsage: { ...appUsage },
              hourlyUsageToday: db.getHourlyUsageForDate(todayStr)
            });
            lastUiUpdate = now;
          }
        }
      } catch (err) {}
    };

    await track(); 
    setInterval(track, 2000);
  } catch (error) {}
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280, height: 850, minWidth: 1000, minHeight: 700,
    show: false, autoHideMenuBar: true, frame: false, transparent: true, title: 'Zeitra',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false, contextIsolation: true }
  });

  const isHidden = process.argv.includes('--hidden');
  mainWindow.on('ready-to-show', () => { 
    if (!isHidden) mainWindow.show(); 
  });
  
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' }; });
  mainWindow.on('close', (event) => { if (!isQuitting) { event.preventDefault(); mainWindow.hide(); } });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) { mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']); } 
  else { mainWindow.loadFile(join(__dirname, '../renderer/index.html')); }
  return mainWindow;
}

// --- 5. Boot Sequence ---
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');
  
  // --- Auto Updater Setup ---
  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify();
      autoUpdater.on('update-downloaded', () => {
        new Notification({ title: 'Zeitra Update Ready', body: 'A new version has been downloaded and will install on restart.' }).show();
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-complete'));
      });
      autoUpdater.on('download-progress', (progressObj: any) => {
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-progress', progressObj.percent));
      });
    } catch (e) {
      console.error('Auto-updater module not found:', e);
    }
  }

  // --- Global Keyboard Shortcuts ---
  // Toggle Focus Mode instantly from anywhere in Windows via Ctrl+Shift+F (or Cmd+Shift+F on Mac)
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    isFocusModeEnabled = !isFocusModeEnabled;
    updateTrayMenu();
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('sync-focus-mode', isFocusModeEnabled));
  });

  // Warm-up Cache: Ensure all previously tracked apps have icons loaded to DB
  for (const [appName, exePath] of Object.entries(metadata.paths)) {
    if (exePath && !appIcons[appName]) { 
      app.getFileIcon(exePath, { size: 'large' })
        .then(icon => {
            const iconBase64 = icon.toDataURL();
            appIcons[appName] = iconBase64;
            db.upsertAppMetadata({ appName, iconBase64 });
        })
        .catch(() => {}); 
    }
  }

  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));

  const mainWindow = createWindow();

  tray = new Tray(icon);
  updateTrayMenu();
  tray.setToolTip('Zeitra - Tracking Active');
  tray.on('double-click', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) wins[0].show();
  });

  startTracking(mainWindow);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// Clean up global shortcuts when quitting to free them back to the OS
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });