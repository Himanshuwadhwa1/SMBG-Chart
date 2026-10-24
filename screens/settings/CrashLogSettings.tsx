import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { clearLogFile, getLogFileInfo, logError, readLogFile } from '../../logging';
import { useTheme } from '../../state/ThemeContext';

export const CrashLogSettings: React.FC = () => {
  const { colors } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [logInfo, setLogInfo] = useState<{
    exists: boolean;
    sizeBytes: number;
    entryCount: number;
  }>({
    exists: false,
    sizeBytes: 0,
    entryCount: 0,
  });

  const refreshInfo = async () => {
    setLoading(true);
    try {
      const info = await getLogFileInfo();
      setLogInfo(info);
    } catch {
      setLogInfo({ exists: false, sizeBytes: 0, entryCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInfo();
  }, []);

  const handleShareLog = async () => {
    try {
      const content = await readLogFile();
      if (!content || content.trim().length === 0) {
        Alert.alert('Empty Log', 'No errors or crash logs recorded.');
        return;
      }

      await Share.share({
        title: 'smbg_error.log',
        message: content,
      });
    } catch (err: any) {
      if (err.message && !err.message.includes('dismissed') && !err.message.includes('cancel')) {
        Alert.alert('Error', 'Failed to share log file.');
      }
    }
  };

  const handleClearLog = () => {
    Alert.alert(
      'Clear Error Log',
      'Are you sure you want to delete the local error log file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Log',
          style: 'destructive',
          onPress: async () => {
            await clearLogFile();
            await refreshInfo();
          },
        },
      ]
    );
  };

  const handleTriggerTestError = async () => {
    await logError(new Error('Deliberate test error logged from settings'), {
      source: 'CrashLogSettings.testButton',
    });
    await refreshInfo();
    Alert.alert('Test Logged', 'A test error entry was recorded to error.log.');
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="crash-log-card"
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Local Error & Crash Logs
      </Text>
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        All errors and crashes are logged strictly to a local file on this device (`error.log`).
        Nothing is ever sent automatically or transmitted over the network.
      </Text>

      {/* Log File Status */}
      <View
        style={[styles.statusBox, { backgroundColor: colors.background, borderColor: colors.border }]}
        testID="crash-log-status"
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.statusText, { color: colors.text }]}>
            {logInfo.entryCount > 0
              ? `Log File: ${logInfo.entryCount} entries (${(logInfo.sizeBytes / 1024).toFixed(1)} KB)`
              : 'Log File: Clean (0 entries, 0 KB)'}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleShareLog}
          testID="share-crash-log-button"
        >
          <Text style={styles.actionButtonText}>Share / Export Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearLog}
          testID="clear-crash-log-button"
        >
          <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear Log</Text>
        </TouchableOpacity>
      </View>

      {/* Diagnostic Trigger */}
      <TouchableOpacity
        style={[styles.testButton, { borderColor: colors.border }]}
        onPress={handleTriggerTestError}
        testID="trigger-test-error-button"
      >
        <Text style={[styles.testButtonText, { color: colors.textSecondary }]}>
          Trigger Test Error Entry
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#ffebe9',
  },
  clearButtonText: {
    color: '#cf222e',
  },
  testButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: 12,
  },
});
