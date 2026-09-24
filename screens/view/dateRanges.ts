import { getClinicalDate } from '../../domain/clinicalDate';

export type DateRangePreset = 'last_3_months' | 'last_6_months' | 'this_year' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export function getDateRangeForPreset(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
  nowDate: Date = new Date()
): DateRange {
  const endDateStr = getClinicalDate(nowDate);

  if (preset === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  if (preset === 'this_year') {
    const currentYear = nowDate.getFullYear();
    return {
      startDate: `${currentYear}-01-01`,
      endDate: endDateStr,
    };
  }

  if (preset === 'last_6_months') {
    const d = new Date(nowDate);
    d.setMonth(d.getMonth() - 6);
    return {
      startDate: getClinicalDate(d),
      endDate: endDateStr,
    };
  }

  // Default: last_3_months
  const d = new Date(nowDate);
  d.setMonth(d.getMonth() - 3);
  return {
    startDate: getClinicalDate(d),
    endDate: endDateStr,
  };
}
