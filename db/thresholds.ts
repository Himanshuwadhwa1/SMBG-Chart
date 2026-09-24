import { getDb } from './schema';
import { ThresholdConfig, ThresholdConfigType } from './types';

export interface UpdateThresholdConfigInput {
  bad_low: number;
  notsobad_low: number;
  okayish_low: number;
  ok_low: number;
  ok_high: number;
  okayish_high: number;
  notsobad_high: number;
  bad_high: number;
}

export async function getThresholdConfigs(): Promise<ThresholdConfig[]> {
  const db = await getDb();
  return db.getAllAsync<ThresholdConfig>('SELECT * FROM threshold_configs');
}

export async function getThresholdConfigByType(
  configType: ThresholdConfigType
): Promise<ThresholdConfig | null> {
  const db = await getDb();
  const config = await db.getFirstAsync<ThresholdConfig>(
    'SELECT * FROM threshold_configs WHERE config_type = ?',
    [configType]
  );
  return config || null;
}

export async function updateThresholdConfig(
  configType: ThresholdConfigType,
  input: UpdateThresholdConfigInput
): Promise<ThresholdConfig> {
  const db = await getDb();

  // Boundary ascending order validation
  if (
    !(
      input.bad_low < input.notsobad_low &&
      input.notsobad_low < input.okayish_low &&
      input.okayish_low < input.ok_low &&
      input.ok_low <= input.ok_high &&
      input.ok_high < input.okayish_high &&
      input.okayish_high < input.notsobad_high &&
      input.notsobad_high < input.bad_high
    )
  ) {
    throw new Error(
      'Threshold boundaries must satisfy ascending order: bad_low < notsobad_low < okayish_low < ok_low <= ok_high < okayish_high < notsobad_high < bad_high'
    );
  }

  await db.runAsync(
    `UPDATE threshold_configs
     SET bad_low = ?, notsobad_low = ?, okayish_low = ?, ok_low = ?,
         ok_high = ?, okayish_high = ?, notsobad_high = ?, bad_high = ?
     WHERE config_type = ?`,
    [
      input.bad_low,
      input.notsobad_low,
      input.okayish_low,
      input.ok_low,
      input.ok_high,
      input.okayish_high,
      input.notsobad_high,
      input.bad_high,
      configType,
    ]
  );

  const updated = await getThresholdConfigByType(configType);
  if (!updated) {
    throw new Error(`Failed to retrieve updated threshold config for ${configType}`);
  }
  return updated;
}
