import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('smbg_chart.db');
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export function resetDbInstance(): void {
  dbInstance = null;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot TEXT NOT NULL,
      value INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      clinical_date TEXT NOT NULL,
      comment TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(slot, clinical_date)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_system_default INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reading_tags (
      reading_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (reading_id, tag_id),
      FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS threshold_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_type TEXT NOT NULL UNIQUE,
      ok_low INTEGER NOT NULL,
      okayish_low INTEGER NOT NULL,
      notsobad_low INTEGER NOT NULL,
      bad_low INTEGER NOT NULL,
      ok_high INTEGER NOT NULL,
      okayish_high INTEGER NOT NULL,
      notsobad_high INTEGER NOT NULL,
      bad_high INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      retention_duration_months INTEGER,
      unit_system TEXT NOT NULL DEFAULT 'mg/dL'
    );

    CREATE INDEX IF NOT EXISTS idx_readings_clinical_date ON readings(clinical_date);
    CREATE INDEX IF NOT EXISTS idx_readings_slot ON readings(slot);
  `);
}
