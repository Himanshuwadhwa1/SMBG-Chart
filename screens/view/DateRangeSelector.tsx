import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
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
  const { colors } = useTheme();
  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'last_6_months', label: 'Last 6 Months' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <View style={styles.container} testID="date-range-selector">
      <Text style={[styles.label, { color: colors.text }]}>Select Date Range</Text>
      <View style={styles.presetRow}>
        {presets.map((p) => {
          const isSelected = selectedPreset === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              testID={`preset-${p.id}`}
              style={[
                styles.presetButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelectPreset(p.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: isSelected ? '#ffffff' : colors.text },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedPreset === 'custom' && (
        <View style={styles.customRow} testID="custom-date-inputs">
          <View style={styles.customField}>
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
              Start Date
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={customStartDate}
              onChangeText={onCustomStartChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              testID="custom-start-input"
            />
          </View>
          <View style={styles.customField}>
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
              End Date
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={customEndDate}
              onChangeText={onCustomEndChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
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
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
});

