import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RetentionSettings } from './RetentionSettings';
import { TagManager } from './TagManager';
import { ThresholdEditor } from './ThresholdEditor';

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container} testID="settings-screen">
      <Text style={styles.title}>App Settings</Text>
      <Text style={styles.subtitle}>
        Configure threshold boundaries, custom tags, and data retention settings.
      </Text>

      {/* Unit System Card */}
      <View style={styles.unitCard} testID="unit-system-card">
        <Text style={styles.unitLabel}>Unit System</Text>
        <View style={styles.unitBadge}>
          <Text style={styles.unitBadgeText}>mg/dL (v1 Default)</Text>
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
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2328',
  },
  subtitle: {
    fontSize: 14,
    color: '#57606a',
    marginTop: 4,
    marginBottom: 12,
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24292f',
  },
  unitBadge: {
    backgroundColor: '#ddf4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0969da',
  },
});
