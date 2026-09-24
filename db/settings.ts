import { getDb } from './schema';
import { Settings } from './types';

export interface UpdateSettingsInput {
  retention_duration_months?: number | null;
  unit_system?: string;
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1');
  if (!row) {
    return {
      retention_duration_months: null,
      unit_system: 'mg/dL',
    };
  }
  return row;
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

  await db.runAsync(
    `INSERT INTO settings (id, retention_duration_months, unit_system)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       retention_duration_months = excluded.retention_duration_months,
       unit_system = excluded.unit_system`,
    [retention, unitSystem]
  );

  return getSettings();
}
