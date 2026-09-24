import Database from 'better-sqlite3';

class MockSQLiteDatabase {
  private db: InstanceType<typeof Database>;

  constructor() {
    this.db = new Database(':memory:');
  }

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async runAsync(
    source: string,
    params: any[] = []
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const stmt = this.db.prepare(source);
    const result = stmt.run(...params);
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  }

  async getFirstAsync<T>(source: string, params: any[] = []): Promise<T | null> {
    const stmt = this.db.prepare(source);
    const result = stmt.get(...params) as T | undefined;
    return result ?? null;
  }

  async getAllAsync<T>(source: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(source);
    return stmt.all(...params) as T[];
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }
}

let activeInstance: MockSQLiteDatabase | null = null;

export async function openDatabaseAsync(
  _name: string
): Promise<MockSQLiteDatabase> {
  if (!activeInstance) {
    activeInstance = new MockSQLiteDatabase();
  }
  return activeInstance;
}

export function resetTestDatabase(): void {
  if (activeInstance) {
    try {
      activeInstance.closeAsync();
    } catch {}
    activeInstance = null;
  }
}
