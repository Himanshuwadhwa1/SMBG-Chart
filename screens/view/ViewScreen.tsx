import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getReadingsByDateRange, getThresholdConfigs } from '../../db';
import { ReadingWithTags, ThresholdConfig } from '../../db/types';
import { getClinicalDate } from '../../domain/clinicalDate';
import { useTheme } from '../../state/ThemeContext';
import { DateRangePreset, getDateRangeForPreset } from './dateRanges';
import { DateRangeSelector } from './DateRangeSelector';
import { LogbookChart } from './LogbookChart';
import { RefreshIcon, WaitIcon } from './RefreshIcons';

export default function ViewScreen() {
  const { colors } = useTheme();
  const [preset, setPreset] = useState<DateRangePreset>('last_3_months');
  const [customStart, setCustomStart] = useState<string>(
    getClinicalDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
  );
  const [customEnd, setCustomEnd] = useState<string>(
    getClinicalDate(new Date())
  );

  const [readings, setReadings] = useState<ReadingWithTags[]>([]);
  const [thresholdConfigs, setThresholdConfigs] = useState<
    Record<string, ThresholdConfig>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeRange, setActiveRange] = useState<{ startDate: string; endDate: string }>({
    startDate: customStart,
    endDate: customEnd,
  });

  const loadThresholds = async () => {
    try {
      const configs = await getThresholdConfigs();
      const map: Record<string, ThresholdConfig> = {};
      configs.forEach((c) => {
        map[c.config_type] = c;
      });
      setThresholdConfigs(map);
    } catch (err) {
      console.error('Failed to load threshold configs:', err);
    }
  };

  const fetchReadings = async (startDate: string, endDate: string, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const results = await getReadingsByDateRange(startDate, endDate);
      setReadings(results);
    } catch (err) {
      console.error('Failed to fetch readings by date range:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadThresholds();
  }, []);

  useEffect(() => {
    const range = getDateRangeForPreset(preset, customStart, customEnd);
    setActiveRange(range);
    fetchReadings(range.startDate, range.endDate);
  }, [preset, customStart, customEnd]);

  // Automatically refresh whenever user navigates/switches into the View tab
  useFocusEffect(
    useCallback(() => {
      const range = getDateRangeForPreset(preset, customStart, customEnd);
      fetchReadings(range.startDate, range.endDate, true);
    }, [preset, customStart, customEnd])
  );

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchReadings(activeRange.startDate, activeRange.endDate, false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { flexGrow: 1, backgroundColor: colors.background, paddingBottom: 90 },
      ]}
      testID="view-screen"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleManualRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>SMBG Chart Review</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Read-only self-monitoring blood glucose logbook
          </Text>
        </View>

        {/* Manual Refresh Button */}
        <TouchableOpacity
          style={[
            styles.refreshButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={handleManualRefresh}
          disabled={loading || refreshing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Refresh chart"
          testID="view-refresh-button"
        >
          {refreshing ? (
            <WaitIcon size={15} color={colors.primary} />
          ) : (
            <RefreshIcon size={15} color={colors.primary} />
          )}
          <Text style={[styles.refreshButtonText, { color: colors.primary }]}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Range Preset Selector */}
      <DateRangeSelector
        selectedPreset={preset}
        onSelectPreset={setPreset}
        customStartDate={customStart}
        customEndDate={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      {/* Summary Header */}
      <View
        style={[
          styles.summaryBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        testID="summary-bar"
      >
        <Text style={[styles.summaryText, { color: colors.text }]}>
          Showing{' '}
          <Text style={[styles.highlightText, { color: colors.primary }]}>
            {readings.length}
          </Text>{' '}
          readings from{' '}
          <Text style={[styles.highlightText, { color: colors.primary }]}>
            {activeRange.startDate}
          </Text>{' '}
          to{' '}
          <Text style={[styles.highlightText, { color: colors.primary }]}>
            {activeRange.endDate}
          </Text>
        </Text>
      </View>

      {/* Loading or Chart Display */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading SMBG Chart...
          </Text>
        </View>
      ) : (
        <LogbookChart
          readings={readings}
          thresholdConfigs={thresholdConfigs}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBar: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  summaryText: {
    fontSize: 13,
  },
  highlightText: {
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});

