import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SlotCode } from '../../db/types';
import { useTheme } from '../../state/ThemeContext';

export interface SlotInfo {
  code: SlotCode;
  label: string;
}

export const SLOTS: SlotInfo[] = [
  { code: 'BB', label: 'BB (Before Breakfast)' },
  { code: 'AB', label: 'AB (After Breakfast)' },
  { code: 'BL', label: 'BL (Before Lunch)' },
  { code: 'AL', label: 'AL (After Lunch)' },
  { code: 'BD', label: 'BD (Before Dinner)' },
  { code: 'AD', label: 'AD (After Dinner)' },
  { code: '3AM', label: '3AM (Overnight Check)' },
];

interface SlotPickerProps {
  selectedSlot: SlotCode;
  onSelectSlot: (slot: SlotCode) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({ selectedSlot, onSelectSlot }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container} testID="slot-picker">
      <Text style={[styles.label, { color: colors.text }]}>Select Slot</Text>
      <View style={styles.grid}>
        {SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.code;
          return (
            <TouchableOpacity
              key={slot.code}
              testID={`slot-option-${slot.code}`}
              style={[
                styles.slotButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelectSlot(slot.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isSelected ? '#ffffff' : colors.text },
                ]}
              >
                {slot.code}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
