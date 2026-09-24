import { getDb } from './schema';
import { Reading, ReadingWithTags, SlotCode, Tag } from './types';

export interface CreateReadingInput {
  slot: SlotCode;
  value: number; // integer
  timestamp: number; // epoch ms
  clinical_date: string; // YYYY-MM-DD
  comment?: string | null;
  tag_ids?: number[];
}

export interface UpdateReadingInput {
  value?: number;
  timestamp?: number;
  comment?: string | null;
  tag_ids?: number[];
}

export async function createReading(input: CreateReadingInput): Promise<ReadingWithTags> {
  const db = await getDb();
  const now = Date.now();
  const comment = input.comment ?? null;
  const tagIds = input.tag_ids ?? [];

  // Integer validation check
  if (!Number.isInteger(input.value)) {
    throw new Error('Glucose value must be an integer');
  }

  const result = await db.runAsync(
    `INSERT INTO readings (slot, value, timestamp, clinical_date, comment, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.slot, input.value, input.timestamp, input.clinical_date, comment, now, now]
  );

  const readingId = result.lastInsertRowId;

  if (tagIds.length > 0) {
    for (const tagId of tagIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO reading_tags (reading_id, tag_id) VALUES (?, ?)',
        [readingId, tagId]
      );
    }
  }

  const created = await getReadingById(readingId);
  if (!created) {
    throw new Error('Failed to retrieve newly created reading');
  }
  return created;
}

export async function updateReading(
  id: number,
  input: UpdateReadingInput
): Promise<ReadingWithTags> {
  const db = await getDb();
  const now = Date.now();

  const existing = await getReadingById(id);
  if (!existing) {
    throw new Error(`Reading with id ${id} not found`);
  }

  const value = input.value !== undefined ? input.value : existing.value;
  if (!Number.isInteger(value)) {
    throw new Error('Glucose value must be an integer');
  }

  const timestamp = input.timestamp !== undefined ? input.timestamp : existing.timestamp;
  const comment = input.comment !== undefined ? input.comment : existing.comment;

  await db.runAsync(
    `UPDATE readings SET value = ?, timestamp = ?, comment = ?, updated_at = ? WHERE id = ?`,
    [value, timestamp, comment, now, id]
  );

  if (input.tag_ids !== undefined) {
    await db.runAsync('DELETE FROM reading_tags WHERE reading_id = ?', [id]);
    for (const tagId of input.tag_ids) {
      await db.runAsync(
        'INSERT OR IGNORE INTO reading_tags (reading_id, tag_id) VALUES (?, ?)',
        [id, tagId]
      );
    }
  }

  const updated = await getReadingById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated reading');
  }
  return updated;
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM readings WHERE id = ?', [id]);
}

export async function getReadingById(id: number): Promise<ReadingWithTags | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Reading>(
    'SELECT * FROM readings WHERE id = ?',
    [id]
  );

  if (!row) return null;

  const tags = await db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     INNER JOIN reading_tags rt ON t.id = rt.tag_id
     WHERE rt.reading_id = ?`,
    [id]
  );

  return {
    ...row,
    tags: tags.map((t) => ({
      ...t,
      is_system_default: Boolean(t.is_system_default),
      is_active: Boolean(t.is_active),
    })),
  };
}

export async function getReadingBySlotAndDate(
  slot: SlotCode,
  clinicalDate: string
): Promise<ReadingWithTags | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Reading>(
    'SELECT * FROM readings WHERE slot = ? AND clinical_date = ?',
    [slot, clinicalDate]
  );

  if (!row) return null;
  return getReadingById(row.id);
}

export async function getReadingsByDateRange(
  startDate: string,
  endDate: string
): Promise<ReadingWithTags[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Reading>(
    'SELECT * FROM readings WHERE clinical_date >= ? AND clinical_date <= ? ORDER BY clinical_date ASC, timestamp ASC',
    [startDate, endDate]
  );

  const results: ReadingWithTags[] = [];
  for (const row of rows) {
    const reading = await getReadingById(row.id);
    if (reading) {
      results.push(reading);
    }
  }
  return results;
}

export async function getAllReadings(): Promise<ReadingWithTags[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Reading>('SELECT * FROM readings ORDER BY clinical_date DESC, timestamp DESC');

  const results: ReadingWithTags[] = [];
  for (const row of rows) {
    const reading = await getReadingById(row.id);
    if (reading) {
      results.push(reading);
    }
  }
  return results;
}

export async function deleteAllReadings(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM readings');
}
