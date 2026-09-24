import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DateRangePreset } from './dateRanges';

interface DateRangeSelectorProps {
  selectedPreset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
}) => {
  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'last_6_months', label: 'Last 6 Months' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <View style={styles.container} testID="date-range-selector">
      <Text style={styles.label}>Select Date Range</Text>
      <View style={styles.presetRow}>
        {presets.map((p) => {
          const isSelected = selectedPreset === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              testID={`preset-${p.id}`}
              style={[styles.presetButton, isSelected && styles.selectedPresetButton]}
              onPress={() => onSelectPreset(p.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.presetText, isSelected && styles.selectedPresetText]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedPreset === 'custom' && (
        <View style={styles.customRow} testID="custom-date-inputs">
          <View style={styles.customField}>
            <Text style={styles.subLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={customStartDate}
              onChangeText={onCustomStartChange}
              placeholder="YYYY-MM-DD"
              testID="custom-start-input"
            />
          </View>
          <View style={styles.customField}>
            <Text style={styles.subLabel}>End Date</Text>
            <TextInput
              style={styles.input}
              value={customEndDate}
              onChangeText={onCustomEndChange}
              placeholder="YYYY-MM-DD"
              testID="custom-end-input"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    backgroundColor: '#f6f8fa',
  },
  selectedPresetButton: {
    backgroundColor: '#0969da',
    borderColor: '#0969da',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#24292f',
  },
  selectedPresetText: {
    color: '#ffffff',
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  customField: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    color: '#57606a',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
});
