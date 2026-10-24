import { EXPORT_COLUMNS, WideExportRow } from './types';

/**
 * Escapes a single field according to RFC 4180 CSV specifications:
 * - If the value is null or undefined, returns empty string.
 * - If the value contains comma, double-quote, carriage return, or newline,
 *   it wraps the string in double-quotes and escapes inner double-quotes as `""`.
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string from wide-format export rows.
 * Header: `date,BB,AB,BL,AL,BD,AD,3AM,comments`
 */
export function generateCsv(rows: WideExportRow[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const lines: string[] = [header];

  for (const row of rows) {
    const fields = [
      escapeCsvField(row.date),
      escapeCsvField(row.BB),
      escapeCsvField(row.AB),
      escapeCsvField(row.BL),
      escapeCsvField(row.AL),
      escapeCsvField(row.BD),
      escapeCsvField(row.AD),
      escapeCsvField(row['3AM']),
      escapeCsvField(row.comments),
    ];
    lines.push(fields.join(','));
  }

  return lines.join('\r\n');
}
