import { ColorBand } from '../../domain/thresholds';

export interface BandStyle {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export const COLOR_BAND_STYLES: Record<ColorBand, BandStyle> = {
  extreme_low: {
    label: 'Extreme Low',
    backgroundColor: '#ffebe9',
    textColor: '#82071e',
    borderColor: '#ff8182',
  },
  bad_low: {
    label: 'Bad Low',
    backgroundColor: '#ffd8d6',
    textColor: '#a40e26',
    borderColor: '#ffaba8',
  },
  notsobad_low: {
    label: 'Not-so-bad Low',
    backgroundColor: '#fff8c5',
    textColor: '#7d4e00',
    borderColor: '#d4a72c',
  },
  okayish_low: {
    label: 'Okayish Low',
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fcd34d',
  },
  ok: {
    label: 'Target (OK)',
    backgroundColor: '#dafbe1',
    textColor: '#1a7f37',
    borderColor: '#4ac26b',
  },
  okayish_high: {
    label: 'Okayish High',
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fcd34d',
  },
  notsobad_high: {
    label: 'Not-so-bad High',
    backgroundColor: '#fff8c5',
    textColor: '#7d4e00',
    borderColor: '#d4a72c',
  },
  bad_high: {
    label: 'Bad High',
    backgroundColor: '#ffd8d6',
    textColor: '#a40e26',
    borderColor: '#ffaba8',
  },
  extreme_high: {
    label: 'Extreme High',
    backgroundColor: '#ffebe9',
    textColor: '#82071e',
    borderColor: '#ff8182',
  },
};

export function getBandStyle(band: ColorBand): BandStyle {
  return COLOR_BAND_STYLES[band] || COLOR_BAND_STYLES.ok;
}
