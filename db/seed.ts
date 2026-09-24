import { getDb } from './schema';

export const SYSTEM_DEFAULT_TAGS = [
  'Missed meal',
  'Heavy meal',
  'Illness/fever',
  'Exercise',
  'Stress',
  'Medication change',
  'Travel',
  'Insulin dose adjusted',
  'Alcohol',
  'Poor sleep',
  'Hypo episode',
  'Hyper episode',
];

export const DEFAULT_THRESHOLDS = [
  {
    config_type: 'pre_meal',
    bad_low: 54,
    notsobad_low: 70,
    okayish_low: 80,
    ok_low: 90,
    ok_high: 130,
    okayish_high: 150,
    notsobad_high: 180,
    bad_high: 250,
  },
  {
    config_type: 'post_meal',
    bad_low: 54,
    notsobad_low: 70,
    okayish_low: 90,
    ok_low: 110,
    ok_high: 160,
    okayish_high: 180,
    notsobad_high: 220,
    bad_high: 300,
  },
  {
    config_type: '3am',
    bad_low: 54,
    notsobad_low: 65,
    okayish_low: 75,
    ok_low: 85,
    ok_high: 140,
    okayish_high: 160,
    notsobad_high: 200,
    bad_high: 250,
  },
];

export async function seedDatabaseIfEmpty(): Promise<void> {
  const db = await getDb();

  // Seed default tags if none exist
  const existingTags = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tags'
  );
  if (!existingTags || existingTags.count === 0) {
    for (const tagName of SYSTEM_DEFAULT_TAGS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO tags (name, is_system_default, is_active) VALUES (?, 1, 1)',
        [tagName]
      );
    }
  }

  // Seed default threshold configs if none exist
  const existingThresholds = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM threshold_configs'
  );
  if (!existingThresholds || existingThresholds.count === 0) {
    for (const config of DEFAULT_THRESHOLDS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO threshold_configs (
          config_type, ok_low, okayish_low, notsobad_low, bad_low,
          ok_high, okayish_high, notsobad_high, bad_high
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          config.config_type,
          config.ok_low,
          config.okayish_low,
          config.notsobad_low,
          config.bad_low,
          config.ok_high,
          config.okayish_high,
          config.notsobad_high,
          config.bad_high,
        ]
      );
    }
  }

  // Seed default settings if single row doesn't exist
  const existingSettings = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM settings'
  );
  if (!existingSettings || existingSettings.count === 0) {
    await db.runAsync(
      'INSERT OR IGNORE INTO settings (id, retention_duration_months, unit_system) VALUES (1, NULL, ?)',
      ['mg/dL']
    );
  }
}
