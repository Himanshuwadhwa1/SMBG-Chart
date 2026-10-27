import React from 'react';
import { Alert, Share } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import { resetMockFileSystem } from '../__mocks__/expo-file-system';
import {
  clearLogFile,
  ErrorBoundary,
  formatLogEntry,
  getLogFileInfo,
  getLogFileUri,
  logCrash,
  logError,
  readLogFile,
  writeLogEntry,
} from '../logging';
import { CrashLogSettings } from '../screens/settings/CrashLogSettings';
import { ThemeProvider } from '../state/ThemeContext';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Phase 8 — Local-Only Crash and Error Logging', () => {
  beforeEach(async () => {
    resetMockFileSystem();
    jest.clearAllMocks();
  });

  describe('1. Local Logger Unit Tests', () => {
    it('returns empty string and exists=false when no log file has been created', async () => {
      const content = await readLogFile();
      expect(content).toBe('');

      const info = await getLogFileInfo();
      expect(info.exists).toBe(false);
      expect(info.entryCount).toBe(0);
      expect(info.sizeBytes).toBe(0);
    });

    it('logs an error with timestamp, level, message, context, and stack trace', async () => {
      const testError = new Error('Database connection failed');
      await logError(testError, { operation: 'openDb', retryCount: 2 });

      const content = await readLogFile();
      expect(content).toContain('[ERROR] Database connection failed');
      expect(content).toContain('Context: {"operation":"openDb","retryCount":2}');
      expect(content).toContain('Stack: Error: Database connection failed');
      expect(content).toContain('---');

      const info = await getLogFileInfo();
      expect(info.exists).toBe(true);
      expect(info.entryCount).toBe(1);
      expect(info.sizeBytes).toBeGreaterThan(0);
    });

    it('logs multiple errors sequentially without overwriting previous entries', async () => {
      await logError('First validation warning');
      await logCrash(new Error('Fatal UI crash'));

      const content = await readLogFile();
      expect(content).toContain('[ERROR] First validation warning');
      expect(content).toContain('[CRASH] Fatal UI crash');

      const info = await getLogFileInfo();
      expect(info.entryCount).toBe(2);
    });

    it('clears log file cleanly when clearLogFile is called', async () => {
      await logError('Temporary glitch');
      expect(await readLogFile()).not.toBe('');

      await clearLogFile();

      expect(await readLogFile()).toBe('');
      const info = await getLogFileInfo();
      expect(info.exists).toBe(false);
      expect(info.entryCount).toBe(0);
    });

    it('formats string-only errors without stack trace when stack is absent', () => {
      const formatted = formatLogEntry({
        timestamp: '2026-10-24T08:00:00.000Z',
        level: 'WARN',
        message: 'Low disk space warning',
      });

      expect(formatted).toBe(
        '[2026-10-24T08:00:00.000Z] [WARN] Low disk space warning\n---\n'
      );
    });
  });

  describe('2. Strict Local-Only Guarantee (No Network Calls)', () => {
    it('never initiates any network requests or HTTP calls when logging or reading errors', async () => {
      const fetchSpy = jest.fn();
      // @ts-ignore
      global.fetch = fetchSpy;

      // Trigger multiple errors and crash operations
      await logError(new Error('Deliberate error for network check'));
      await logCrash('Unhandled exception');
      await readLogFile();
      await getLogFileInfo();
      await clearLogFile();

      // Ensure zero network calls were attempted
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('3. ErrorBoundary Component Tests', () => {
    // Suppress expected React console.error during deliberate throw
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });

    const Bomb: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Explosion inside component tree');
      }
      return <></>;
    };

    it('catches rendering errors, writes to local error log, and displays user-friendly fallback', async () => {
      let tree: TestRenderer.ReactTestRenderer;

      await act(async () => {
        tree = TestRenderer.create(
          <ErrorBoundary>
            <Bomb shouldThrow={true} />
          </ErrorBoundary>
        );
      });

      // Verify fallback UI rendered
      const fallback = tree!.root.findByProps({ testID: 'error-boundary-fallback' });
      expect(fallback).toBeDefined();

      const retryBtn = tree!.root.findByProps({ testID: 'error-boundary-retry-button' });
      expect(retryBtn).toBeDefined();

      // Verify crash was persisted to local log
      const logContent = await readLogFile();
      expect(logContent).toContain('[CRASH] Explosion inside component tree');
      expect(logContent).toContain('componentStack');
    });
  });

  describe('4. CrashLogSettings UI Component Tests', () => {
    it('displays log status, triggers deliberate test error, and shares log', async () => {
      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <ThemeProvider>
            <CrashLogSettings />
          </ThemeProvider>
        );
      });

      // Initially 0 entries
      const statusBox = tree!.root.findByProps({ testID: 'crash-log-status' });
      expect(statusBox).toBeDefined();

      // Click Trigger Test Error
      const testBtn = tree!.root.findByProps({ testID: 'trigger-test-error-button' });
      await act(async () => {
        await testBtn.props.onPress();
      });

      // Verify log has 1 entry recorded
      const logContent = await readLogFile();
      expect(logContent).toContain('Deliberate test error logged from settings');

      // Click Share Log
      const shareBtn = tree!.root.findByProps({ testID: 'share-crash-log-button' });
      await act(async () => {
        await shareBtn.props.onPress();
      });

      expect(shareSpy).toHaveBeenCalledTimes(1);
      const shareCall = shareSpy.mock.calls[0][0];
      expect(shareCall.title).toBe('smbg_error.log');
      expect(shareCall.message).toContain('Deliberate test error logged from settings');

      // Click Clear Log (Alert mock automatically triggers confirm callback)
      const clearBtn = tree!.root.findByProps({ testID: 'clear-crash-log-button' });
      await act(async () => {
        clearBtn.props.onPress();
      });

      // Verify log was cleared
      expect(await readLogFile()).toBe('');
    });

    it('shows alert when trying to share an empty log file', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <ThemeProvider>
            <CrashLogSettings />
          </ThemeProvider>
        );
      });

      const shareBtn = tree!.root.findByProps({ testID: 'share-crash-log-button' });
      await act(async () => {
        await shareBtn.props.onPress();
      });

      expect(alertSpy).toHaveBeenCalledWith('Empty Log', 'No errors or crash logs recorded.');
    });
  });
});
