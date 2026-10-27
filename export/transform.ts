import { Reading, ReadingWithTags, SlotCode } from '../db/types';
import { getClinicalDate } from '../domain/clinicalDate';
import { EXPORT_SLOTS, WideExportRow } from './types';

/**
 * Transforms a list of readings into wide-format rows (one row per clinical day,
 * one column per slot: date, BB, AB, BL, AL, BD, AD, 3AM, comments).
 */
export function transformReadingsToWideFormat(
  readings: (Reading | ReadingWithTags)[]
): WideExportRow[] {
  if (!readings || readings.length === 0) {
    return [];
  }

  // Group readings by clinical_date (computed via 4AM rule if not already present)
  const daysMap = new Map<string, (Reading | ReadingWithTags)[]>();

  for (const reading of readings) {
    const clinicalDate = reading.clinical_date || getClinicalDate(reading.timestamp);
    const existing = daysMap.get(clinicalDate);
    if (existing) {
      existing.push(reading);
    } else {
      daysMap.set(clinicalDate, [reading]);
    }
  }

  // Sort dates chronologically ascending
  const sortedDates = Array.from(daysMap.keys()).sort();

  const rows: WideExportRow[] = [];

  for (const date of sortedDates) {
    const dayReadings = daysMap.get(date)!;

    // Initialize row with null for all slots
    const row: WideExportRow = {
      date,
      BB: null,
      AB: null,
      BL: null,
      AL: null,
      BD: null,
      AD: null,
      '3AM': null,
      comments: '',
    };

    const commentParts: string[] = [];

    // Sort day readings by canonical slot order
    dayReadings.sort((a, b) => {
      const idxA = EXPORT_SLOTS.indexOf(a.slot as SlotCode);
      const idxB = EXPORT_SLOTS.indexOf(b.slot as SlotCode);
      return idxA - idxB;
    });

    for (const reading of dayReadings) {
      // Assign slot value
      if (EXPORT_SLOTS.includes(reading.slot as SlotCode)) {
        row[reading.slot as SlotCode] = reading.value;
      }

      // Collect comments and tags
      const noteSnippets: string[] = [];
      const trimmedComment = reading.comment?.trim();
      if (trimmedComment) {
        noteSnippets.push(trimmedComment);
      }

      const tags = (reading as ReadingWithTags).tags;
      if (tags && tags.length > 0) {
        const tagNames = tags.map((t) => t.name).join(', ');
        noteSnippets.push(`[${tagNames}]`);
      }

      if (noteSnippets.length > 0) {
        commentParts.push(`${reading.slot}: ${noteSnippets.join(' ')}`);
      }
    }

    row.comments = commentParts.join('; ');
    rows.push(row);
  }

  return rows;
}
