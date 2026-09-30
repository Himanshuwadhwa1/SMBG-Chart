import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ReadingWithTags, SlotCode, ThresholdConfig } from '../../db/types';
import { getConfigTypeForSlot, resolveColorBand } from '../../domain/thresholds';
import { useTheme } from '../../state/ThemeContext';
import { getBandStyle } from './colorBands';

interface LogbookChartProps {
  readings: ReadingWithTags[];
  thresholdConfigs: Record<string, ThresholdConfig>;
}

const ALL_SLOTS: SlotCode[] = ['BB', 'AB', 'BL', 'AL', 'BD', 'AD', '3AM'];

export const LogbookChart: React.FC<LogbookChartProps> = ({
  readings,
  thresholdConfigs,
}) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height || width >= 600;

  // Group readings by clinical_date
  const groupedByDate: Record<string, Record<SlotCode, ReadingWithTags>> = {};
  const dateComments: Record<string, string[]> = {};

  readings.forEach((r) => {
    if (!groupedByDate[r.clinical_date]) {
      groupedByDate[r.clinical_date] = {} as Record<SlotCode, ReadingWithTags>;
      dateComments[r.clinical_date] = [];
    }
    groupedByDate[r.clinical_date][r.slot] = r;

    // Collect tags and comment
    const notes: string[] = [];
    if (r.tags && r.tags.length > 0) {
      notes.push(...r.tags.map((t) => t.name));
    }
    if (r.comment && r.comment.trim()) {
      notes.push(r.comment.trim());
    }
    if (notes.length > 0) {
      dateComments[r.clinical_date].push(`${r.slot}: ${notes.join(', ')}`);
    }
  });

  const dates = Object.keys(groupedByDate).sort().reverse();

  if (dates.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        testID="empty-chart"
      >
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Readings Found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          No readings logged for the selected date range. Use the Log / Edit screen to add entries.
        </Text>
      </View>
    );
  }

  const renderCellContent = (reading: ReadingWithTags | undefined) => {
    if (!reading) {
      return (
        <Text style={[styles.emptyCellText, { color: colors.textSecondary }]}>
          —
        </Text>
      );
    }

    const configType = getConfigTypeForSlot(reading.slot);
    const config = thresholdConfigs[configType];
    const band = config ? resolveColorBand(reading.value, config) : 'ok';
    const style = getBandStyle(band);

    return (
      <View
        style={[
          styles.valueBadge,
          {
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
          },
        ]}
        testID={`reading-cell-${reading.id}`}
      >
        <Text style={[styles.valueText, { color: style.textColor }]}>
          {reading.value}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      testID="logbook-chart"
    >
      <ScrollView horizontal={!isLandscape} contentContainerStyle={styles.scrollContent}>
        <View style={styles.table}>
          {/* Table Header */}
          <View
            style={[
              styles.headerRow,
              { backgroundColor: colors.background, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.headerCell, styles.dateColumn, { color: colors.text }]}>
              Clinical Date
            </Text>
            {ALL_SLOTS.map((slot) => (
              <Text
                key={slot}
                style={[styles.headerCell, styles.slotColumn, { color: colors.text }]}
              >
                {slot}
              </Text>
            ))}
            <Text style={[styles.headerCell, styles.notesColumn, { color: colors.text }]}>
              Tags & Remarks
            </Text>
          </View>

          {/* Table Rows */}
          {dates.map((dateStr) => {
            const dayReadings = groupedByDate[dateStr];
            const notes = dateComments[dateStr] ? dateComments[dateStr].join(' • ') : '';

            return (
              <View
                key={dateStr}
                style={[styles.dataRow, { borderBottomColor: colors.border }]}
                testID={`date-row-${dateStr}`}
              >
                <Text style={[styles.dateCellText, styles.dateColumn, { color: colors.text }]}>
                  {dateStr}
                </Text>

                {ALL_SLOTS.map((slot) => (
                  <View key={slot} style={[styles.cell, styles.slotColumn]}>
                    {renderCellContent(dayReadings[slot])}
                  </View>
                ))}

                <Text
                  style={[styles.notesCellText, styles.notesColumn, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {notes || '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  table: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dateColumn: {
    width: 110,
    paddingLeft: 12,
    textAlign: 'left',
  },
  slotColumn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesColumn: {
    flex: 1,
    minWidth: 160,
    paddingHorizontal: 8,
    textAlign: 'left',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCellText: {
    fontSize: 14,
  },
  dateCellText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesCellText: {
    fontSize: 12,
  },
  valueBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

