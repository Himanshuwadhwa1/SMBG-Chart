import { Reading, ReadingWithTags, SlotCode } from '../db/types';

export const EXPORT_SLOTS: readonly SlotCode[] = ['BB', 'AB', 'BL', 'AL', 'BD', 'AD', '3AM'] as const;

export const EXPORT_COLUMNS = ['date', 'BB', 'AB', 'BL', 'AL', 'BD', 'AD', '3AM', 'comments'] as const;
export type ExportColumnName = (typeof EXPORT_COLUMNS)[number];

export interface WideExportRow {
  date: string; // Clinical date in YYYY-MM-DD
  BB?: number | null;
  AB?: number | null;
  BL?: number | null;
  AL?: number | null;
  BD?: number | null;
  AD?: number | null;
  '3AM'?: number | null;
  comments: string;
}

export type ExportFormat = 'csv' | 'xlsx';

export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  format: ExportFormat;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
  rowCount: number;
  readingCount: number;
  fileUri?: string;
}
