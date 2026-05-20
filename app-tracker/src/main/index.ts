import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let trackingInterval: NodeJS.Timeout | null = null;
let lastApp: string | null = null;
let lastCheckTime: number = Date.now();
let lastUiUpdate: number = Date.now();

const dataPath = join(app.getPath('userData'), 'usage-data.json');
const pathsDataPath = join(app.getPath('userData'), 'app-paths.json');

let appUsage: Record<string, number> = {};
let appPaths: Record<string, string> = {}; 
let appIcons: Record<string, string> = {}; 

let isFocusModeEnabled = false;
let currentBlockList: Record<string, 'fully_blocked' | number> = {};
let isQuitting = false;
let tray: Tray | null = null;

// User Preferences
let trackSystemApps = false;
let trackSelf = false;

// Load Databases
if (fs.existsSync(dataPath)) { try { appUsage = JSON.parse(fs.readFileSync(dataPath, 'utf-8')); } catch (e) { } }
if (fs.existsSync(pathsDataPath)) { try { appPaths = JSON.parse(fs.readFileSync(pathsDataPath, 'utf-8')); } catch (e) { } }

// PRE-FETCH ICONS INSTANTLY ON BOOT
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

// Premium Name Formatter
function cleanAppName(rawName: string): string {
  let clean = rawName.replace(/\.exe$/i, '').trim();
  if (clean.toLowerCase() === 'code') return 'VS Code';
  if (clean.toLowerCase() === 'msedge') return 'Microsoft Edge';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

async function startTracking(mainWindow: BrowserWindow) {
  try {
    const activeWin = (await import('active-win')).default;
    
    // FAST 2-SECOND CHECK LOOP FOR INSTANT FOCUS BLOCKING
    trackingInterval = setInterval(async () => {
      try {
        const windowInfo = await activeWin();
        if (windowInfo && mainWindow) {
          
          const rawName = windowInfo.owner.name; 
          const rawPath = windowInfo.owner.path || '';
          const actualExe = rawPath.split('\\').pop()?.toLowerCase() || rawName.toLowerCase();
          
          // Strip .exe and capitalize perfectly
          const displayAppName = cleanAppName(rawName);

          const now = Date.now();
          const timeDiff = Math.floor((now - lastCheckTime) / 1000);
          lastCheckTime = now;

          // Fetch missing icons & save path for future boots
          if (!appIcons[displayAppName] && rawPath) {
            try {
              const nativeIcon = await app.getFileIcon(rawPath, { size: 'large' });
              appIcons[displayAppName] = nativeIcon.toDataURL(); 
              appPaths[displayAppName] = rawPath;
              fs.promises.writeFile(pathsDataPath, JSON.stringify(appPaths)).catch(()=>{});
            } catch (e) {}
          }

          // FOCUS MODE SHIELD
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
                return; // Kill app and skip tracking time!
              }
            }
          }

          // --- SYSTEM AND SELF FILTERING ENGINE ---
          const lowerPath = rawPath.toLowerCase();
          const isSystemApp = lowerPath.includes('\\windows\\') || lowerPath.includes('system32') || lowerPath.includes('windowsapps') || displayAppName.toLowerCase() === 'windows explorer' || displayAppName.toLowerCase() === 'searchhost';
          const isSelfApp = displayAppName.toLowerCase().includes('forgepulse') || displayAppName.toLowerCase().includes('electron');

          let shouldTrack = true;
          if (!trackSystemApps && isSystemApp) shouldTrack = false;
          if (!trackSelf && isSelfApp) shouldTrack = false;

          if (shouldTrack) {
            appUsage[displayAppName] = (appUsage[displayAppName] || 0) + timeDiff;
          }

          const appChanged = lastApp !== displayAppName;
          if (appChanged) lastApp = displayAppName;

          // --- 60-SECOND UI UPDATE BATCHING ---
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