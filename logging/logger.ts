import * as FileSystem from 'expo-file-system/legacy';
import { LogEntry, LogFileInfo, LogLevel } from './types';

const LOG_FILE_NAME = 'error.log';

/**
 * Returns the absolute path to the local error log file on device storage.
 */
export function getLogFileUri(): string {
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return `${baseDir}${LOG_FILE_NAME}`;
}

/**
 * Formats a log entry into a standardized single-entry string block.
 */
export function formatLogEntry(entry: LogEntry): string {
  const parts: string[] = [`[${entry.timestamp}] [${entry.level}] ${entry.message}`];

  if (entry.context && Object.keys(entry.context).length > 0) {
    try {
      parts.push(`Context: ${JSON.stringify(entry.context)}`);
    } catch {
      parts.push('Context: [Unserializable]');
    }
  }

  if (entry.stack) {
    parts.push(`Stack: ${entry.stack.trim()}`);
  }

  return parts.join('\n') + '\n---\n';
}

/**
 * Appends an entry to the local log file.
 * Guaranteed local-only execution: no HTTP calls, analytics SDKs, or cloud transmission.
 */
export async function writeLogEntry(
  level: LogLevel,
  error: Error | string,
  context?: Record<string, any>
): Promise<void> {
  const message = typeof error === 'string' ? error : error.message || 'Unknown error';
  const stack = typeof error === 'object' && error.stack ? error.stack : undefined;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    stack,
    context,
  };

  const formatted = formatLogEntry(entry);
  const fileUri = getLogFileUri();

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    let existingContent = '';
    if (info.exists) {
      existingContent = await FileSystem.readAsStringAsync(fileUri);
    }
    await FileSystem.writeAsStringAsync(fileUri, existingContent + formatted);
  } catch (writeErr) {
    // Local fallback: log to console only (never throw or silently crash logging)
    console.error('Failed to write to local error log:', writeErr);
  }
}

/**
 * Logs an application error to the local log file.
 */
export async function logError(
  error: Error | string,
  context?: Record<string, any>
): Promise<void> {
  return writeLogEntry('ERROR', error, context);
}

/**
 * Logs an unhandled crash or fatal exception to the local log file.
 */
export async function logCrash(
  error: Error | string,
  context?: Record<string, any>
): Promise<void> {
  return writeLogEntry('CRASH', error, context);
}

/**
 * Reads the entire contents of the local error log file.
 */
export async function readLogFile(): Promise<string> {
  const fileUri = getLogFileUri();
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      return '';
    }
    return await FileSystem.readAsStringAsync(fileUri);
  } catch {
    return '';
  }
}

/**
 * Clears/deletes the local error log file.
 */
export async function clearLogFile(): Promise<void> {
  const fileUri = getLogFileUri();
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (err) {
    console.error('Failed to clear local error log:', err);
  }
}

/**
 * Retrieves metadata about the local error log file.
 */
export async function getLogFileInfo(): Promise<LogFileInfo> {
  const fileUri = getLogFileUri();
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      return {
        exists: false,
        sizeBytes: 0,
        entryCount: 0,
        uri: fileUri,
      };
    }

    const content = await FileSystem.readAsStringAsync(fileUri);
    // Count entries separated by delimiter
    const entryCount = (content.match(/---\n/g) || []).length;

    return {
      exists: true,
      sizeBytes: info.size || Buffer.byteLength(content, 'utf8'),
      entryCount: entryCount || (content.trim().length > 0 ? 1 : 0),
      uri: fileUri,
    };
  } catch {
    return {
      exists: false,
      sizeBytes: 0,
      entryCount: 0,
      uri: fileUri,
    };
  }
}
