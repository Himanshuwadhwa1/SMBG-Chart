import { ThresholdConfig } from '../db/types';

export type ColorBand =
  | 'extreme_low'
  | 'bad_low'
  | 'notsobad_low'
  | 'okayish_low'
  | 'ok'
  | 'okayish_high'
  | 'notsobad_high'
  | 'bad_high'
  | 'extreme_high';

/**
 * Resolves a glucose reading value into one of 9 color bands given a threshold config.
 * Center "ok" band is inclusive of ok_low and ok_high (ok_low <= value <= ok_high).
 */
export function resolveColorBand(
  value: number,
  config: Pick<
    ThresholdConfig,
    | 'bad_low'
    | 'notsobad_low'
    | 'okayish_low'
    | 'ok_low'
    | 'ok_high'
    | 'okayish_high'
    | 'notsobad_high'
    | 'bad_high'
  >
): ColorBand {
  if (!Number.isInteger(value)) {
    throw new Error('Glucose value must be an integer');
  }

  if (value < config.bad_low) {
    return 'extreme_low';
  }
  if (value < config.notsobad_low) {
    return 'bad_low';
  }
  if (value < config.okayish_low) {
    return 'notsobad_low';
  }
  if (value < config.ok_low) {
    return 'okayish_low';
  }
  if (value <= config.ok_high) {
    return 'ok';
  }
  if (value <= config.okayish_high) {
    return 'okayish_high';
  }
  if (value <= config.notsobad_high) {
    return 'notsobad_high';
  }
  if (value <= config.bad_high) {
    return 'bad_high';
  }
  return 'extreme_high';
}

/**
 * Checks if a color band represents an extreme reading (outermost band).
 */
export function isExtremeReading(band: ColorBand): boolean {
  return band === 'extreme_low' || band === 'extreme_high';
}
