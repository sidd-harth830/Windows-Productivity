import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

const dbPath = join(app.getPath('userData'), 'forgepulse_store.json');

// --- High-Performance In-Memory Cache ---
let store: {
  daily_usage: Record<string, Record<string, number>>;
  app_metadata: Record<string, { exe_path: string | null; icon_base64: string | null }>;
} = { daily_usage: {}, app_metadata: {} };

// --- Safe Disk Operations ---
const loadDatabase = () => {
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      store = JSON.parse(data);
    } catch (e) {
      console.error("Failed to load local store, initializing empty.", e);
    }
  }
  if (!store.daily_usage) store.daily_usage = {};
  if (!store.app_metadata) store.app_metadata = {};
};

const saveDatabase = () => {
  try {
    // Write to a temporary file and rename for atomic, corruption-free saves
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(store));
    fs.renameSync(tempPath, dbPath);
  } catch (e) {
    console.error("Failed to save local store", e);
  }
};

// Load immediately on boot
loadDatabase();

// Debounce save logic so we don't thrash the disk every 2 seconds
let saveTimeout: NodeJS.Timeout | null = null;
const triggerSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveDatabase, 5000); 
};

// --- Usage Data Functions ---
export const upsertUsage = (date: string, appName: string, seconds: number) => {
  if (!store.daily_usage[date]) store.daily_usage[date] = {};
  store.daily_usage[date][appName] = (store.daily_usage[date][appName] || 0) + seconds;
  triggerSave();
};

export const getUsageForDate = (date: string): Record<string, number> => {
  return store.daily_usage[date] || {};
};

export const getAllUsage = (): Record<string, Record<string, number>> => {
  return store.daily_usage;
};

export const deleteAppUsage = (date: string, appName: string) => {
  if (store.daily_usage[date]) {
    delete store.daily_usage[date][appName];
    triggerSave();
  }
};

export const clearAllUsage = () => {
  store.daily_usage = {};
  triggerSave();
};

// --- App Metadata Functions ---
export const upsertAppMetadata = (metadata: { appName: string, exePath?: string | null, iconBase64?: string | null }) => {
  const existing = store.app_metadata[metadata.appName] || { exe_path: null, icon_base64: null };
  store.app_metadata[metadata.appName] = {
    exe_path: metadata.exePath ?? existing.exe_path,
    icon_base64: metadata.iconBase64 ?? existing.icon_base64
  };
  triggerSave();
};

export const getAppMetadata = (): { paths: Record<string, string>, icons: Record<string, string> } => {
  const paths: Record<string, string> = {};
  const icons: Record<string, string> = {};
  for (const [appName, data] of Object.entries(store.app_metadata)) {
    if (data.exe_path) paths[appName] = data.exe_path;
    if (data.icon_base64) icons[appName] = data.icon_base64;
  }
  return { paths, icons };
};

export const getAppPath = (appName: string): string | null => {
  return store.app_metadata[appName]?.exe_path || null;
};

// --- Cleanup ---
// Force a synchronous save when the app quits
app.on('before-quit', () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveDatabase(); 
});