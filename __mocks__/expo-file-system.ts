let mockFileStore: Record<string, string> = {};

export const documentDirectory = 'file:///mock-documents/';
export const cacheDirectory = 'file:///mock-cache/';

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export async function getInfoAsync(
  fileUri: string
): Promise<{ exists: boolean; isDirectory: boolean; size?: number }> {
  if (mockFileStore[fileUri] !== undefined) {
    return {
      exists: true,
      isDirectory: false,
      size: Buffer.byteLength(mockFileStore[fileUri], 'utf8'),
    };
  }
  return {
    exists: false,
    isDirectory: false,
  };
}

export async function readAsStringAsync(fileUri: string): Promise<string> {
  if (mockFileStore[fileUri] !== undefined) {
    return mockFileStore[fileUri];
  }
  throw new Error(`File not found: ${fileUri}`);
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string
): Promise<void> {
  mockFileStore[fileUri] = contents;
}

export async function deleteAsync(
  fileUri: string,
  options?: { idempotent?: boolean }
): Promise<void> {
  if (mockFileStore[fileUri] !== undefined) {
    delete mockFileStore[fileUri];
  } else if (!options?.idempotent) {
    throw new Error(`Cannot delete non-existent file: ${fileUri}`);
  }
}

export const StorageAccessFramework = {
  requestDirectoryPermissionsAsync: jest.fn(async () => ({
    granted: true,
    directoryUri: 'content://com.android.externalstorage.documents/tree/primary%3ADownloads',
  })),
  createFileAsync: jest.fn(async (parentUri: string, fileName: string, mimeType: string) => {
    const ext = mimeType === 'text/csv' ? '.csv' : '.xls';
    const fileUri = `${parentUri}/${fileName}${ext}`;
    mockFileStore[fileUri] = '';
    return fileUri;
  }),
  writeAsStringAsync,
  readAsStringAsync,
  deleteAsync,
};

export function resetMockFileSystem(): void {
  mockFileStore = {};
  StorageAccessFramework.requestDirectoryPermissionsAsync.mockClear();
  StorageAccessFramework.createFileAsync.mockClear();
}
