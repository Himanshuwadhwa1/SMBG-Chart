import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SlotCode } from '../../db/types';

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
  return (
    <View style={styles.container} testID="slot-picker">
      <Text style={styles.label}>Select Slot</Text>
      <View style={styles.grid}>
        {SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.code;
          return (
            <TouchableOpacity
              key={slot.code}
              testID={`slot-option-${slot.code}`}
              style={[styles.slotButton, isSelected && styles.selectedButton]}
              onPress={() => onSelectSlot(slot.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.buttonText, isSelected && styles.selectedButtonText]}>
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
    color: '#333',
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
    borderColor: '#d0d7de',
    backgroundColor: '#f6f8fa',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  selectedButton: {
    backgroundColor: '#0969da',
    borderColor: '#0969da',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24292f',
  },
  selectedButtonText: {
    color: '#ffffff',
  },
});
