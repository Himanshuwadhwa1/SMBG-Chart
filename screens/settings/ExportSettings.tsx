import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { exportReadings, ExportFormat, ExportResult } from '../../export';
import { getDateRangeForPreset } from '../view/dateRanges';
import { useTheme } from '../../state/ThemeContext';

export type ExportRangeOption = 'all' | 'last_3_months' | 'last_6_months' | 'this_year';

export const ExportSettings: React.FC = () => {
  const { colors } = useTheme();

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [rangeOption, setRangeOption] = useState<ExportRangeOption>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleSaveToDevice = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (rangeOption !== 'all') {
        const range = getDateRangeForPreset(rangeOption);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const result: ExportResult = await exportReadings({
        format,
        startDate,
        endDate,
      });

      if (result.readingCount === 0) {
        Alert.alert('No Readings', 'There are no readings to export in the selected range.');
        setExportStatus('No readings found in selected date range.');
        return;
      }

      // On Android, use StorageAccessFramework to let the user select any directory (e.g. Downloads, Documents)
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const mimeType = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
          const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            result.filename.replace(/\.(csv|xls)$/, ''),
            mimeType
          );
          await FileSystem.writeAsStringAsync(fileUri, result.content);
          setExportStatus(`Saved ${result.filename} directly to selected folder!`);
          Alert.alert('File Saved', `${result.filename} was saved to your device.`);
          return;
        }
      }

      // Fallback: file is already created in local cache/document directory
      setExportStatus(`File created at: ${result.fileUri || result.filename}`);
      Alert.alert('File Created', `Saved ${result.filename} to app storage.`);
    } catch (err: any) {
      if (err.message && !err.message.includes('dismissed') && !err.message.includes('cancel')) {
        Alert.alert('Save Error', err.message || 'Failed to save file');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (rangeOption !== 'all') {
        const range = getDateRangeForPreset(rangeOption);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const result: ExportResult = await exportReadings({
        format,
        startDate,
        endDate,
      });

      if (result.readingCount === 0) {
        Alert.alert('No Readings', 'There are no readings to export in the selected range.');
        setExportStatus('No readings found in selected date range.');
        return;
      }

      setExportStatus(
        `Generated ${result.filename} (${result.rowCount} days, ${result.readingCount} readings).`
      );

      // Open native share sheet with file details and content
      if (result.fileUri) {
        await Share.share({
          title: result.filename,
          url: result.fileUri,
          message: `SMBG Logbook Export: ${result.filename}\n${result.content}`,
        });
      } else {
        await Share.share({
          title: result.filename,
          message: result.content,
        });
      }
    } catch (err: any) {
      // User cancelling share sheet is normal and should not show error
      if (err.message && !err.message.includes('dismissed') && !err.message.includes('cancel')) {
        Alert.alert('Export Error', err.message || 'Failed to export readings');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="export-settings-card"
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Logbook Data</Text>
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        Export your clinical readings in wide format (1 row per clinical day, columns for all 7
        slots + comments) for your doctor or personal records.
      </Text>

      {/* Format Selector */}
      <Text style={[styles.label, { color: colors.text }]}>Export Format</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            { borderColor: colors.border },
            format === 'csv' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setFormat('csv')}
          testID="export-format-csv"
        >
          <Text
            style={[
              styles.optionButtonText,
              { color: colors.text },
              format === 'csv' && styles.optionButtonTextActive,
            ]}
          >
            CSV (.csv)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            { borderColor: colors.border },
            format === 'xlsx' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setFormat('xlsx')}
          testID="export-format-xlsx"
        >
          <Text
            style={[
              styles.optionButtonText,
              { color: colors.text },
              format === 'xlsx' && styles.optionButtonTextActive,
            ]}
          >
            Excel (.xls)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Range Selector */}
      <Text style={[styles.label, { color: colors.text }]}>Date Range</Text>
      <View style={styles.gridRow}>
        <TouchableOpacity
          style={[
            styles.rangeButton,
            { borderColor: colors.border },
            rangeOption === 'all' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setRangeOption('all')}
          testID="export-range-all"
        >
          <Text
            style={[
              styles.rangeButtonText,
              { color: colors.text },
              rangeOption === 'all' && styles.optionButtonTextActive,
            ]}
          >
            All Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rangeButton,
            { borderColor: colors.border },
            rangeOption === 'last_3_months' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setRangeOption('last_3_months')}
          testID="export-range-last_3_months"
        >
          <Text
            style={[
              styles.rangeButtonText,
              { color: colors.text },
              rangeOption === 'last_3_months' && styles.optionButtonTextActive,
            ]}
          >
            Last 3 Mos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rangeButton,
            { borderColor: colors.border },
            rangeOption === 'last_6_months' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setRangeOption('last_6_months')}
          testID="export-range-last_6_months"
        >
          <Text
            style={[
              styles.rangeButtonText,
              { color: colors.text },
              rangeOption === 'last_6_months' && styles.optionButtonTextActive,
            ]}
          >
            Last 6 Mos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rangeButton,
            { borderColor: colors.border },
            rangeOption === 'this_year' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setRangeOption('this_year')}
          testID="export-range-this_year"
        >
          <Text
            style={[
              styles.rangeButtonText,
              { color: colors.text },
              rangeOption === 'this_year' && styles.optionButtonTextActive,
            ]}
          >
            This Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Export Action Buttons */}
      <View style={{ gap: 10 }}>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveToDevice}
          disabled={isExporting}
          testID="export-save-file-button"
        >
          {isExporting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.exportButtonText}>
              💾 Save {format.toUpperCase()} File to Device
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
          ]}
          onPress={handleExport}
          disabled={isExporting}
          testID="export-share-button"
        >
          <Text style={[styles.exportButtonText, { color: colors.primary }]}>
            📤 Share via Other Apps
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Feedback */}
      {exportStatus ? (
        <Text
          style={[styles.statusText, { color: colors.textSecondary }]}
          testID="export-status-message"
        >
          {exportStatus}
        </Text>
      ) : null}
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  rangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exportButton: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
