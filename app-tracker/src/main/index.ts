import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog, Notification } from 'electron'
import { join } from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let trackingInterval: NodeJS.Timeout | null = null;
let lastApp: string | null = null;
let lastCheckTime: number = Date.now();

// FIX: Setting this to 0 forces an INSTANT UI update on the very first tick!
let lastUiUpdate: number = 0;

const dataPath = join(app.getPath('userData'), 'usage-data.json');
const pathsDataPath = join(app.getPath('userData'), 'app-paths.json');

let appUsage: Record<string, number> = {};
let appPaths: Record<string, string> = {}; 
let appIcons: Record<string, string> = {}; 

let isFocusModeEnabled = false;
let currentBlockList: Record<string, 'fully_blocked' | number> = {};
let isQuitting = false;
let tray: Tray | null = null;
let warningSent: Record<string, boolean> = {};
let halfWarningSent: Record<string, boolean> = {};

let trackSystemApps = false;
let trackSelf = false;

// --- ENCRYPTION ENGINE ---
const SECRET_KEY = crypto.scryptSync('forgepulse-secure-key-2026', 'salt', 32);
const ALGORITHM = 'aes-256-cbc';

function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptData(data: string): string {
  const parts = data.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function safeReadData(path: string): any {
  if (!fs.existsSync(path)) return {};
  const raw = fs.readFileSync(path, 'utf-8');
  try { return JSON.parse(decryptData(raw)); } catch { try { return JSON.parse(raw); } catch { return {}; } }
}

let allUsageData = safeReadData(dataPath);
let todayStr = new Date().toISOString().split('T')[0];

const isOldFormat = Object.keys(allUsageData).length > 0 && Object.keys(allUsageData).some(key => !key.match(/^\d{4}-\d{2}-\d{2}$/));
if (isOldFormat) {
  const oldData = { ...allUsageData };
  allUsageData = { [todayStr]: oldData };
}
if (!allUsageData[todayStr]) {
  allUsageData[todayStr] = {};
}
appUsage = allUsageData[todayStr];

appPaths = safeReadData(pathsDataPath);

function checkDateRoll() {
  const currentStr = new Date().toISOString().split('T')[0];
  if (currentStr !== todayStr) {
    todayStr = currentStr;
    if (!allUsageData[todayStr]) allUsageData[todayStr] = {};
    appUsage = allUsageData[todayStr];
    warningSent = {};
  }
}

// INSTANT PRE-FETCH CACHE
for (const [appName, exePath] of Object.entries(appPaths)) {
  if (exePath) {
    app.getFileIcon(exePath, { size: 'large' })
      .then(icon => appIcons[appName] = icon.toDataURL())
      .catch(() => {}); 
  }
}

ipcMain.on('toggle-focus-mode', (_event, enabled: boolean) => isFocusModeEnabled = enabled);
ipcMain.on('update-block-list', (_event, rules: Record<string, 'fully_blocked' | number>) => currentBlockList = rules);
ipcMain.on('update-preferences', (_event, prefs) => {
  trackSystemApps = prefs.trackSystemApps ?? false;
  trackSelf = prefs.trackSelf ?? false;
});

ipcMain.handle('save-csv', async (_event, csvContent: string) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Usage Data',
    defaultPath: `ForgePulse-Analytics-${dateStr}.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  if (filePath) {
    await fs.promises.writeFile(filePath, csvContent, 'utf-8');
    return true;
  }
  return false;
});

ipcMain.handle('add-offline-time', async (_event, activityName: string, minutes: number) => {
  try {
    const displayAppName = activityName.trim() + ' (Offline)';
    const seconds = minutes * 60;
    appUsage[displayAppName] = (appUsage[displayAppName] || 0) + seconds;
    allUsageData[todayStr] = appUsage;
    await fs.promises.writeFile(dataPath, encryptData(JSON.stringify(allUsageData)));
    lastUiUpdate = 0; // Trigger an immediate UI refresh on the next tracking tick
    
    // Force an instant update to the frontend immediately!
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('window-update', {
        name: lastApp || 'Desktop',
        title: '',
        focusTime: lastApp ? (appUsage[lastApp] || 0) : 0,
        allUsage: { ...appUsage }, // Forced clone ensures React triggers Dashboard rerender
        appIcons: appIcons
      });
    });

    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('remove-app-usage', async (_event, appName: string) => {
  try {
    delete appUsage[appName];
    allUsageData[todayStr] = appUsage;
    await fs.promises.writeFile(dataPath, encryptData(JSON.stringify(allUsageData)));
    lastUiUpdate = 0; // Trigger an immediate UI refresh on the next tracking tick
    
    // Force an instant update to the frontend immediately!
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('window-update', {
        name: lastApp || 'Desktop',
        title: '',
        focusTime: lastApp ? (appUsage[lastApp] || 0) : 0,
        allUsage: { ...appUsage },
        appIcons: appIcons
      });
    });
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('refresh-app-icon', async (_event, appName: string) => {
  try {
    const exePath = appPaths[appName];
    if (exePath) {
      const nativeIcon = await app.getFileIcon(exePath, { size: 'large' });
      appIcons[appName] = nativeIcon.toDataURL();
      await fs.promises.writeFile(pathsDataPath, encryptData(JSON.stringify(appPaths)));
      
      // Force UI Update
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('window-update', {
          name: lastApp || 'Desktop',
          title: '',
          focusTime: lastApp ? (appUsage[lastApp] || 0) : 0,
          allUsage: { ...appUsage },
          appIcons: { ...appIcons }
        });
      });
      return true;
    }
    return false;
  } catch (e) { return false; }
});

ipcMain.handle('clear-usage-data', async () => {
  try {
    allUsageData = {};
    allUsageData[todayStr] = {};
    appUsage = allUsageData[todayStr];
    await fs.promises.writeFile(dataPath, encryptData(JSON.stringify(allUsageData)));
    lastUiUpdate = 0; // Trigger an immediate UI refresh
    
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('window-update', {
        name: lastApp || 'Desktop',
        title: '',
        focusTime: 0,
        allUsage: { ...appUsage },
        appIcons: appIcons
      });
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
      appIcons[displayAppName] = nativeIcon.toDataURL();
      appPaths[displayAppName] = exePath;
      await fs.promises.writeFile(pathsDataPath, encryptData(JSON.stringify(appPaths)));
      
      // Force an update so the frontend gets the new icon immediately
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('window-update', { name: lastApp || 'Desktop', title: '', focusTime: lastApp ? (appUsage[lastApp] || 0) : 0, allUsage: { ...appUsage }, appIcons: { ...appIcons } });
      });
    } catch (e) {}
  }

  return displayAppName;
});

ipcMain.handle('get-history', () => {
  return allUsageData;
});

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

async function startTracking(mainWindow: BrowserWindow) {
  try {
    const activeWin = (await import('active-win')).default;
    
    trackingInterval = setInterval(async () => {
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

          // WARM-UP CACHE: Save new paths instantly
          if (!appIcons[displayAppName] && rawPath) {
            try {
              const nativeIcon = await app.getFileIcon(rawPath, { size: 'large' });
              appIcons[displayAppName] = nativeIcon.toDataURL(); 
              appPaths[displayAppName] = rawPath;
              fs.promises.writeFile(pathsDataPath, encryptData(JSON.stringify(appPaths))).catch(()=>{});
            } catch (e) {}
          }

          if (isFocusModeEnabled) {
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
                return; 
              }

              if (!isHardBlocked && typeof ruleToApply === 'number') {
                const timeLeft = ruleToApply - timeSpentToday;
                if (timeLeft <= 300 && timeLeft > 0 && !warningSent[displayAppName]) {
                  new Notification({
                    title: 'Time Limit Approaching',
                    body: `You have less than 5 minutes remaining for ${displayAppName}.`
                  }).show();
                  warningSent[displayAppName] = true;
                }
              }
            }
          }

          const lowerPath = rawPath.toLowerCase();
          const isSystemApp = lowerPath.includes('\\windows\\') || lowerPath.includes('system32') || lowerPath.includes('windowsapps') || displayAppName.toLowerCase() === 'windows explorer' || displayAppName.toLowerCase() === 'searchhost';
          
          // FIX: Added 'app-tracker' to catch the dev environment name!
          const isSelfApp = displayAppName.toLowerCase().includes('forgepulse') || displayAppName.toLowerCase().includes('electron') || displayAppName.toLowerCase().includes('app-tracker');

          let shouldTrack = true;
          if (!trackSystemApps && isSystemApp) shouldTrack = false;
          if (!trackSelf && isSelfApp) shouldTrack = false;

          if (shouldTrack) {
            appUsage[displayAppName] = (appUsage[displayAppName] || 0) + timeDiff;
            if (tray) {
              const tip = `ForgePulse\nActive: ${displayAppName} (${formatTime(appUsage[displayAppName])})`;
              tray.setToolTip(tip.length > 127 ? tip.substring(0, 124) + '...' : tip);
            }
          } else if (tray) {
            tray.setToolTip('ForgePulse - Tracking System Process');
          }

          const appChanged = lastApp !== displayAppName;
          if (appChanged) lastApp = displayAppName;

          const timeSinceLastUpdate = now - lastUiUpdate;
          if (appChanged || timeSinceLastUpdate >= 60000) {
            allUsageData[todayStr] = appUsage;
            const liveUsageData = { ...appUsage };

            mainWindow.webContents.send('window-update', {
              name: displayAppName, 
              title: windowInfo.title,
              focusTime: liveUsageData[displayAppName] || 0,
              allUsage: liveUsageData,
              appIcons: appIcons
            });

            fs.promises.writeFile(dataPath, encryptData(JSON.stringify(allUsageData))).catch(()=>{});
            lastUiUpdate = now;
          }

        }
      } catch (err) {}
    }, 2000); 
  } catch (error) {}
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280, height: 850, minWidth: 1000, minHeight: 700,
    show: false, autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false, contextIsolation: true }
  });

  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' }; });
  mainWindow.on('close', (event) => { if (!isQuitting) { event.preventDefault(); mainWindow.hide(); } });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) { mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']); } 
  else { mainWindow.loadFile(join(__dirname, '../renderer/index.html')); }
  return mainWindow;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));

  const mainWindow = createWindow();

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'ForgePulse Engine Live', enabled: false },
    { type: 'separator' },
    { label: 'Show Dashboard', click: () => mainWindow.show() },
    { label: 'Quit ForgePulse', click: () => { isQuitting = true; app.quit(); } }
  ]);
  
  tray.setToolTip('ForgePulse - Tracking Active');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());

  startTracking(mainWindow);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });