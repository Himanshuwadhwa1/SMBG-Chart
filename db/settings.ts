import { getDb } from './schema';
import { Settings, ThemeMode } from './types';

export interface UpdateSettingsInput {
  retention_duration_months?: number | null;
  unit_system?: string;
  theme_mode?: ThemeMode;
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1');
  if (!row) {
    return {
      retention_duration_months: null,
      unit_system: 'mg/dL',
      theme_mode: 'system',
    };
  }
  return {
    ...row,
    theme_mode: row.theme_mode || 'system',
  };
}

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  const db = await getDb();
  const current = await getSettings();

  const retention =
    input.retention_duration_months !== undefined
      ? input.retention_duration_months
      : current.retention_duration_months;
  const unitSystem =
    input.unit_system !== undefined ? input.unit_system : current.unit_system;
  const themeMode =
    input.theme_mode !== undefined ? input.theme_mode : current.theme_mode;

  await db.runAsync(
    `INSERT INTO settings (id, retention_duration_months, unit_system, theme_mode)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       retention_duration_months = excluded.retention_duration_months,
       unit_system = excluded.unit_system,
       theme_mode = excluded.theme_mode`,
    [retention, unitSystem, themeMode]
  );

  return getSettings();
}

