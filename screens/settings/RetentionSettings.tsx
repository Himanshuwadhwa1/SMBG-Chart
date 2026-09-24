import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteAllReadings, getSettings, updateSettings } from '../../db';

export const RetentionSettings: React.FC = () => {
  const [retentionMonths, setRetentionMonths] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setRetentionMonths(settings.retention_duration_months);
    } catch (err) {
      console.error('Failed to load retention settings:', err);
    }
  };

  const handleSelectRetention = async (months: number | null) => {
    setMessage(null);
    try {
      const updated = await updateSettings({ retention_duration_months: months });
      setRetentionMonths(updated.retention_duration_months);
      setMessage({
        text: months === null ? 'Data retention set to Keep Forever' : `Data retention set to ${months} month(s)`,
        isError: false,
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update retention setting', isError: true });
    }
  };

  const handleCleanNow = async () => {
    setMessage(null);

    const executeClean = async () => {
      try {
        await deleteAllReadings();
        setMessage({ text: 'All readings deleted successfully', isError: false });
      } catch (err: any) {
        setMessage({ text: err.message || 'Failed to clean data', isError: true });
      }
    };

    if (typeof Alert !== 'undefined' && Alert.alert) {
      Alert.alert(
        'Clean All Data',
        'Are you sure you want to delete ALL SMBG readings permanently? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clean Now (Delete All)', style: 'destructive', onPress: executeClean },
        ]
      );
    } else {
      await executeClean();
    }
  };

  const retentionOptions: { label: string; value: number | null }[] = [
    { label: 'Keep Forever', value: null },
    { label: '1 Month', value: 1 },
    { label: '3 Months', value: 3 },
    { label: '4 Months', value: 4 },
    { label: '6 Months', value: 6 },
    { label: '12 Months', value: 12 },
  ];

  return (
    <View style={styles.container} testID="retention-settings">
      <Text style={styles.sectionTitle}>Data Retention &amp; Manual Cleanup</Text>

      {message && (
        <View
          style={[styles.messageBanner, message.isError ? styles.errorBanner : styles.successBanner]}
          testID="retention-message"
        >
          <Text style={[styles.messageText, message.isError ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Automatic Retention Duration</Text>
      <View style={styles.optionGrid}>
        {retentionOptions.map((opt) => {
          const isSelected = retentionMonths === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              testID={`retention-opt-${opt.value ?? 'null'}`}
              style={[styles.optionButton, isSelected && styles.selectedOptionButton]}
              onPress={() => handleSelectRetention(opt.value)}
            >
              <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.warningNote}>
        Data deletion only executes on app open after your explicit confirmation.
      </Text>

      {/* Manual Clean Now */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Manual Cleanup</Text>
        <TouchableOpacity
          style={styles.cleanButton}
          onPress={handleCleanNow}
          testID="clean-now-button"
        >
          <Text style={styles.cleanButtonText}>Clean Now (Delete All Data)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2328',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#57606a',
    marginBottom: 8,
  },
  messageBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: '#ffebe9',
    borderColor: '#ff8182',
  },
  successBanner: {
    backgroundColor: '#dafbe1',
    borderColor: '#4ac26b',
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#cf222e',
  },
  successText: {
    color: '#1a7f37',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0d7de',
    backgroundColor: '#f6f8fa',
  },
  selectedOptionButton: {
    backgroundColor: '#0969da',
    borderColor: '#0969da',
  },
  optionText: {
    fontSize: 13,
    color: '#24292f',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  warningNote: {
    fontSize: 12,
    color: '#57606a',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    paddingTop: 12,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cf222e',
    marginBottom: 8,
  },
  cleanButton: {
    backgroundColor: '#fff1f0',
    borderColor: '#ff4d4f',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cleanButtonText: {
    color: '#cf222e',
    fontSize: 14,
    fontWeight: '600',
  },
});
