import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeMode } from '../../db/types';
import { useTheme } from '../../state/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { themeMode, setThemeMode, colors } = useTheme();

  const options: { id: ThemeMode; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'system', label: 'Auto', icon: '⚙️' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="theme-selector"
    >
      <Text style={[styles.label, { color: colors.text }]}>App Theme</Text>

      {/* Segmented Compact Toggle */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {options.map((opt) => {
          const isSelected = themeMode === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              testID={`theme-option-${opt.id}`}
              style={[
                styles.segmentButton,
                isSelected && { backgroundColor: colors.primary },
              ]}
              onPress={() => setThemeMode(opt.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: isSelected ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {opt.icon} {opt.label}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
  },
  segmentButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
