import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getThresholdConfigs, updateThresholdConfig } from '../../db';
import { ThresholdConfig, ThresholdConfigType } from '../../db/types';

export const ThresholdEditor: React.FC = () => {
  const [configs, setConfigs] = useState<ThresholdConfig[]>([]);
  const [selectedType, setSelectedType] = useState<ThresholdConfigType>('pre_meal');
  const [formValues, setFormValues] = useState<{
    bad_low: string;
    notsobad_low: string;
    okayish_low: string;
    ok_low: string;
    ok_high: string;
    okayish_high: string;
    notsobad_high: string;
    bad_high: string;
  }>({
    bad_low: '',
    notsobad_low: '',
    okayish_low: '',
    ok_low: '',
    ok_high: '',
    okayish_high: '',
    notsobad_high: '',
    bad_high: '',
  });

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    const current = configs.find((c) => c.config_type === selectedType);
    if (current) {
      setFormValues({
        bad_low: String(current.bad_low),
        notsobad_low: String(current.notsobad_low),
        okayish_low: String(current.okayish_low),
        ok_low: String(current.ok_low),
        ok_high: String(current.ok_high),
        okayish_high: String(current.okayish_high),
        notsobad_high: String(current.notsobad_high),
        bad_high: String(current.bad_high),
      });
    }
  }, [selectedType, configs]);

  const loadConfigs = async () => {
    try {
      const data = await getThresholdConfigs();
      setConfigs(data);
    } catch (err) {
      console.error('Failed to load threshold configs:', err);
    }
  };

  const handleSave = async () => {
    setMessage(null);

    const bad_low = Number(formValues.bad_low);
    const notsobad_low = Number(formValues.notsobad_low);
    const okayish_low = Number(formValues.okayish_low);
    const ok_low = Number(formValues.ok_low);
    const ok_high = Number(formValues.ok_high);
    const okayish_high = Number(formValues.okayish_high);
    const notsobad_high = Number(formValues.notsobad_high);
    const bad_high = Number(formValues.bad_high);

    const values = [
      bad_low,
      notsobad_low,
      okayish_low,
      ok_low,
      ok_high,
      okayish_high,
      notsobad_high,
      bad_high,
    ];

    if (values.some((v) => isNaN(v) || !Number.isInteger(v))) {
      setMessage({ text: 'All 8 boundary values must be valid integers.', isError: true });
      return;
    }

    try {
      const updated = await updateThresholdConfig(selectedType, {
        bad_low,
        notsobad_low,
        okayish_low,
        ok_low,
        ok_high,
        okayish_high,
        notsobad_high,
        bad_high,
      });

      setConfigs((prev) => prev.map((c) => (c.config_type === selectedType ? updated : c)));
      setMessage({ text: `Successfully updated ${selectedType} threshold config!`, isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update threshold config', isError: true });
    }
  };

  const configTypes: { id: ThresholdConfigType; label: string }[] = [
    { id: 'pre_meal', label: 'Pre-Meal (BB/BL/BD)' },
    { id: 'post_meal', label: 'Post-Meal (AB/AL/AD)' },
    { id: '3am', label: '3AM Overnight' },
  ];

  return (
    <View style={styles.container} testID="threshold-editor">
      <Text style={styles.sectionTitle}>Threshold Config Editor</Text>

      {message && (
        <View
          style={[styles.messageBanner, message.isError ? styles.errorBanner : styles.successBanner]}
          testID="threshold-message"
        >
          <Text style={[styles.messageText, message.isError ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        </View>
      )}

      {/* Config Type Selector */}
      <View style={styles.tabRow}>
        {configTypes.map((t) => {
          const isSelected = selectedType === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              testID={`config-tab-${t.id}`}
              style={[styles.tabButton, isSelected && styles.selectedTabButton]}
              onPress={() => setSelectedType(t.id)}
            >
              <Text style={[styles.tabText, isSelected && styles.selectedTabText]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 8 Boundary Input Fields */}
      <View style={styles.formGrid}>
        <Text style={styles.subHeader}>Low-Side Boundaries (Ascending)</Text>
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bad Low (&lt;)</Text>
            <TextInput
              style={styles.input}
              value={formValues.bad_low}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, bad_low: val }))}
              keyboardType="number-pad"
              testID="input-bad_low"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Not-so-bad Low</Text>
            <TextInput
              style={styles.input}
              value={formValues.notsobad_low}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, notsobad_low: val }))}
              keyboardType="number-pad"
              testID="input-notsobad_low"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Okayish Low</Text>
            <TextInput
              style={styles.input}
              value={formValues.okayish_low}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, okayish_low: val }))}
              keyboardType="number-pad"
              testID="input-okayish_low"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>OK Low (Min Target)</Text>
            <TextInput
              style={styles.input}
              value={formValues.ok_low}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, ok_low: val }))}
              keyboardType="number-pad"
              testID="input-ok_low"
            />
          </View>
        </View>

        <Text style={styles.subHeader}>High-Side Boundaries (Ascending)</Text>
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>OK High (Max Target)</Text>
            <TextInput
              style={styles.input}
              value={formValues.ok_high}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, ok_high: val }))}
              keyboardType="number-pad"
              testID="input-ok_high"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Okayish High</Text>
            <TextInput
              style={styles.input}
              value={formValues.okayish_high}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, okayish_high: val }))}
              keyboardType="number-pad"
              testID="input-okayish_high"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Not-so-bad High</Text>
            <TextInput
              style={styles.input}
              value={formValues.notsobad_high}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, notsobad_high: val }))}
              keyboardType="number-pad"
              testID="input-notsobad_high"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bad High (&gt;)</Text>
            <TextInput
              style={styles.input}
              value={formValues.bad_high}
              onChangeText={(val) => setFormValues((prev) => ({ ...prev, bad_high: val }))}
              keyboardType="number-pad"
              testID="input-bad_high"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} testID="save-thresholds-button">
        <Text style={styles.saveButtonText}>Save Threshold Boundaries</Text>
      </TouchableOpacity>
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
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  selectedTabButton: {
    backgroundColor: '#0969da',
    borderColor: '#0969da',
  },
  tabText: {
    fontSize: 13,
    color: '#24292f',
  },
  selectedTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  formGrid: {
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#57606a',
    marginTop: 8,
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    flex: 1,
    minWidth: 120,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#0969da',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
