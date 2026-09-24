import { initDatabase } from './schema';
import { seedDatabaseIfEmpty } from './seed';

export async function initDb(): Promise<void> {
  await initDatabase();
  await seedDatabaseIfEmpty();
}

export * from './types';
export * from './schema';
export * from './seed';
export * from './readings';
export * from './tags';
export * from './thresholds';
export * from './settings';
