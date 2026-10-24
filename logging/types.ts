export type LogLevel = 'ERROR' | 'CRASH' | 'WARN' | 'INFO';

export interface LogEntry {
  timestamp: string; // ISO 8601 string
  level: LogLevel;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface LogFileInfo {
  exists: boolean;
  sizeBytes: number;
  entryCount: number;
  uri: string;
}
