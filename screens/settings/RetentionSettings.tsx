import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteAllReadings, getSettings, updateSettings } from '../../db';
import { useTheme } from '../../state/ThemeContext';

export const RetentionSettings: React.FC = () => {
  const { colors } = useTheme();
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
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      testID="retention-settings"
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Data Retention &amp; Manual Cleanup
      </Text>

      {message && (
        <View
          style={[
            styles.messageBanner,
            message.isError
              ? { backgroundColor: colors.errorBg, borderColor: colors.error }
              : { backgroundColor: colors.successBg, borderColor: colors.success },
          ]}
          testID="retention-message"
        >
          <Text
            style={[
              styles.messageText,
              { color: message.isError ? colors.error : colors.success },
            ]}
          >
            {message.text}
          </Text>
        </View>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Automatic Retention Duration
      </Text>
      <View style={styles.optionGrid}>
        {retentionOptions.map((opt) => {
          const isSelected = retentionMonths === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              testID={`retention-opt-${opt.value ?? 'null'}`}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelectRetention(opt.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? '#ffffff' : colors.text },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.warningNote, { color: colors.textSecondary }]}>
        Data deletion only executes on app open after your explicit confirmation.
      </Text>

      {/* Manual Clean Now */}
      <View style={[styles.dangerZone, { borderTopColor: colors.border }]}>
        <Text style={[styles.dangerTitle, { color: colors.error }]}>Manual Cleanup</Text>
        <TouchableOpacity
          style={[
            styles.cleanButton,
            { backgroundColor: colors.errorBg, borderColor: colors.error },
          ]}
          onPress={handleCleanNow}
          testID="clean-now-button"
        >
          <Text style={[styles.cleanButtonText, { color: colors.error }]}>
            Clean Now (Delete All Data)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
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
  },
  optionText: {
    fontSize: 13,
  },
  warningNote: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  dangerZone: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  cleanButton: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cleanButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

