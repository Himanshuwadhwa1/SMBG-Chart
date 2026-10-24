import { getAllReadings, getReadingsByDateRange } from '../db/readings';
import { generateCsv } from './csv';
import { transformReadingsToWideFormat } from './transform';
import { ExportOptions, ExportResult } from './types';
import { generateXlsx } from './xlsx';

/**
 * Executes full export pipeline:
 * 1. Queries readings by date range (or all readings if no range given) from DB layer
 * 2. Transforms into wide format (1 row per clinical day)
 * 3. Encodes into requested format (CSV or Excel XML/XLSX)
 */
export async function exportReadings(options: ExportOptions): Promise<ExportResult> {
  const { startDate, endDate, format } = options;

  const readings =
    startDate && endDate
      ? await getReadingsByDateRange(startDate, endDate)
      : await getAllReadings();

  const wideRows = transformReadingsToWideFormat(readings);
  const nowStr = new Date().toISOString().split('T')[0];

  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'csv') {
    content = generateCsv(wideRows);
    filename = `smbg_logbook_${nowStr}.csv`;
    mimeType = 'text/csv';
  } else {
    content = generateXlsx(wideRows);
    filename = `smbg_logbook_${nowStr}.xls`;
    mimeType = 'application/vnd.ms-excel';
  }

  return {
    content,
    filename,
    mimeType,
    rowCount: wideRows.length,
    readingCount: readings.length,
  };
}
