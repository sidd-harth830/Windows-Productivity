import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog, Notification } from 'electron'
import { join } from 'path'
import fs from 'fs'
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

let trackSystemApps = false;
let trackSelf = false;

if (fs.existsSync(dataPath)) { try { appUsage = JSON.parse(fs.readFileSync(dataPath, 'utf-8')); } catch (e) { } }
if (fs.existsSync(pathsDataPath)) { try { appPaths = JSON.parse(fs.readFileSync(pathsDataPath, 'utf-8')); } catch (e) { } }

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
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Usage Data',
    defaultPath: 'forgepulse-usage.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  if (filePath) {
    await fs.promises.writeFile(filePath, csvContent, 'utf-8');
    return true;
  }
  return false;
});

ipcMain.handle('save-pdf', async (_event, base64Str: string, filename?: string) => {
  try {
    const downloadsPath = app.getPath('downloads');
    const finalFilename = filename || `forgepulse-usage-${Date.now()}.pdf`;
    const filePath = join(downloadsPath, finalFilename);
    
    await fs.promises.writeFile(filePath, Buffer.from(base64Str, 'base64'));
    
    new Notification({
      title: 'PDF Export Complete',
      body: `Successfully saved to Downloads folder.`
    }).show();
    
    // Automatically opens Windows Explorer and highlights the file!
    shell.showItemInFolder(filePath);
    return true;
  } catch (error) {
    console.error('Failed to auto-save PDF:', error);
    return false;
  }
});

function cleanAppName(rawName: string): string {
  let clean = rawName.replace(/\.exe$/i, '').trim();
  if (clean.toLowerCase() === 'code') return 'VS Code';
  if (clean.toLowerCase() === 'msedge') return 'Microsoft Edge';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

async function startTracking(mainWindow: BrowserWindow) {
  try {
    const activeWin = (await import('active-win')).default;
    
    trackingInterval = setInterval(async () => {
      try {
        const windowInfo = await activeWin();
        if (windowInfo && mainWindow) {
          
          const rawName = windowInfo.owner.name; 
          const rawPath = windowInfo.owner.path || '';
          const actualExe = rawPath.split('\\').pop()?.toLowerCase() || rawName.toLowerCase();
          const displayAppName = cleanAppName(rawName);

          const now = Date.now();
          const timeDiff = Math.floor((now - lastCheckTime) / 1000);
          lastCheckTime = now;

          // WARM-UP CACHE: Save new paths instantly
          if (!appIcons[displayAppName] && rawPath) {
            try {
              const nativeIcon = await app.getFileIcon(rawPath, { size: 'large' });
              appIcons[displayAppName] = nativeIcon.toDataURL(); 
              appPaths[displayAppName] = rawPath;
              fs.promises.writeFile(pathsDataPath, JSON.stringify(appPaths)).catch(()=>{});
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
          }

          const appChanged = lastApp !== displayAppName;
          if (appChanged) lastApp = displayAppName;

          const timeSinceLastUpdate = now - lastUiUpdate;
          if (appChanged || timeSinceLastUpdate >= 60000) {
            const liveUsageData = { ...appUsage };

            mainWindow.webContents.send('window-update', {
              name: displayAppName, 
              title: windowInfo.title,
              focusTime: liveUsageData[displayAppName] || 0,
              allUsage: liveUsageData,
              appIcons: appIcons
            });

            fs.promises.writeFile(dataPath, JSON.stringify(liveUsageData)).catch(()=>{});
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