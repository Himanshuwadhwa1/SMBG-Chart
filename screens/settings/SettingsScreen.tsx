import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { RetentionSettings } from './RetentionSettings';
import { TagManager } from './TagManager';
import { ThemeSelector } from './ThemeSelector';
import { ThresholdEditor } from './ThresholdEditor';

export default function SettingsScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      testID="settings-screen"
    >
      <Text style={[styles.title, { color: colors.text }]}>App Settings</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Configure theme appearance, threshold boundaries, custom tags, and data retention settings.
      </Text>

      {/* Theme Selector (Dark/Light Mode) */}
      <ThemeSelector />

      {/* Unit System Card */}
      <View
        style={[styles.unitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        testID="unit-system-card"
      >
        <Text style={[styles.unitLabel, { color: colors.text }]}>Unit System</Text>
        <View style={[styles.unitBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.unitBadgeText, { color: colors.primary }]}>mg/dL (v1 Default)</Text>
        </View>
      </View>

      {/* Threshold Config Editor */}
      <ThresholdEditor />

      {/* Tag Management */}
      <TagManager />

      {/* Retention Settings & Clean Now */}
      <RetentionSettings />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
