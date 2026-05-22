import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';

const dbPath = join(app.getPath('userData'), 'forgepulse.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance.
db.pragma('journal_mode = WAL');

// --- Schema Definition ---
const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_usage (
      date TEXT NOT NULL,
      app_name TEXT NOT NULL,
      usage_seconds INTEGER NOT NULL,
      PRIMARY KEY (date, app_name)
    );

    CREATE TABLE IF NOT EXISTS app_metadata (
      app_name TEXT PRIMARY KEY NOT NULL,
      exe_path TEXT,
      icon_base64 TEXT
    );
  `);
};

// --- Usage Data Functions ---

const upsertUsageStmt = db.prepare(`
  INSERT INTO daily_usage (date, app_name, usage_seconds)
  VALUES (?, ?, ?)
  ON CONFLICT(date, app_name) DO UPDATE SET
  usage_seconds = usage_seconds + excluded.usage_seconds;
`);
export const upsertUsage = (date: string, appName: string, seconds: number) => {
  upsertUsageStmt.run(date, appName, seconds);
};

const getUsageForDateStmt = db.prepare('SELECT app_name, usage_seconds FROM daily_usage WHERE date = ?');
export const getUsageForDate = (date: string): Record<string, number> => {
  const rows = getUsageForDateStmt.all(date) as { app_name: string, usage_seconds: number }[];
  return rows.reduce((acc, row) => {
    acc[row.app_name] = row.usage_seconds;
    return acc;
  }, {} as Record<string, number>);
};

const getAllUsageStmt = db.prepare('SELECT date, app_name, usage_seconds FROM daily_usage ORDER BY date');
export const getAllUsage = (): Record<string, Record<string, number>> => {
  const rows = getAllUsageStmt.all() as { date: string, app_name: string, usage_seconds: number }[];
  const history: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!history[row.date]) {
      history[row.date] = {};
    }
    history[row.date][row.app_name] = row.usage_seconds;
  }
  return history;
};

const deleteAppUsageStmt = db.prepare('DELETE FROM daily_usage WHERE date = ? AND app_name = ?');
export const deleteAppUsage = (date: string, appName: string) => {
  deleteAppUsageStmt.run(date, appName);
};

const clearAllUsageStmt = db.prepare('DELETE FROM daily_usage');
export const clearAllUsage = () => {
  clearAllUsageStmt.run();
};

// --- App Metadata Functions ---

const upsertAppMetadataStmt = db.prepare(`
  INSERT INTO app_metadata (app_name, exe_path, icon_base64)
  VALUES (@appName, @exePath, @iconBase64)
  ON CONFLICT(app_name) DO UPDATE SET
  exe_path = COALESCE(excluded.exe_path, exe_path),
  icon_base64 = COALESCE(excluded.icon_base64, icon_base64);
`);
export const upsertAppMetadata = (metadata: { appName: string, exePath?: string | null, iconBase64?: string | null }) => {
  upsertAppMetadataStmt.run(metadata);
};

const getAppMetadataStmt = db.prepare('SELECT app_name, exe_path, icon_base64 FROM app_metadata');
export const getAppMetadata = (): { paths: Record<string, string>, icons: Record<string, string> } => {
  const rows = getAppMetadataStmt.all() as { app_name: string, exe_path: string | null, icon_base64: string | null }[];
  const paths: Record<string, string> = {};
  const icons: Record<string, string> = {};
  for (const row of rows) {
    if (row.exe_path) paths[row.app_name] = row.exe_path;
    if (row.icon_base64) icons[row.app_name] = row.icon_base64;
  }
  return { paths, icons };
};

const getAppPathStmt = db.prepare('SELECT exe_path FROM app_metadata WHERE app_name = ?');
export const getAppPath = (appName: string): string | null => {
  const result = getAppPathStmt.get(appName) as { exe_path: string | null } | undefined;
  return result?.exe_path || null;
};

// --- Initialization and Cleanup ---

// This function will be called once at the start of the application.
initDatabase();

// Gracefully close the database on app exit.
app.on('before-quit', () => {
  if (db && db.open) {
    db.close();
  }
});