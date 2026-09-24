import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createReading,
  deleteReading,
  getActiveTags,
  getReadingBySlotAndDate,
  getThresholdConfigByType,
  updateReading,
} from '../../db';
import { ReadingWithTags, SlotCode, Tag } from '../../db/types';
import { getClinicalDate } from '../../domain/clinicalDate';
import {
  ColorBand,
  getConfigTypeForSlot,
  isExtremeReading,
  resolveColorBand,
} from '../../domain/thresholds';

import { ExtremeNudgeModal } from './ExtremeNudgeModal';
import { SlotPicker } from './SlotPicker';
import { TagPicker } from './TagPicker';

export default function EditScreen() {
  const [selectedSlot, setSelectedSlot] = useState<SlotCode>('BB');
  const [clinicalDate, setClinicalDate] = useState<string>(
    getClinicalDate(new Date())
  );
  const [valueInput, setValueInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [existingReading, setExistingReading] =
    useState<ReadingWithTags | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extreme Nudge Modal State
  const [nudgeVisible, setNudgeVisible] = useState<boolean>(false);
  const [nudgeBand, setNudgeBand] = useState<ColorBand | null>(null);
  const [savedReadingId, setSavedReadingId] = useState<number | null>(null);

  // Load active tags and check existing reading for slot & clinicalDate
  useEffect(() => {
    loadActiveTags();
  }, []);

  useEffect(() => {
    checkExistingReading(selectedSlot, clinicalDate);
  }, [selectedSlot, clinicalDate]);

  const loadActiveTags = async () => {
    try {
      const tags = await getActiveTags();
      setActiveTags(tags);
    } catch (err) {
      console.error('Failed to load active tags:', err);
    }
  };

  const checkExistingReading = async (slot: SlotCode, date: string) => {
    try {
      setErrorMessage(null);
      const found = await getReadingBySlotAndDate(slot, date);
      if (found) {
        setExistingReading(found);
        setValueInput(String(found.value));
        setCommentInput(found.comment || '');
        setSelectedTagIds(found.tags.map((t) => t.id));
      } else {
        setExistingReading(null);
        setValueInput('');
        setCommentInput('');
        setSelectedTagIds([]);
      }
    } catch (err) {
      console.error('Failed to check existing reading:', err);
    }
  };

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const checkAndTriggerExtremeNudge = async (
    readingId: number,
    slot: SlotCode,
    val: number,
    comment: string
  ) => {
    const configType = getConfigTypeForSlot(slot);
    const config = await getThresholdConfigByType(configType);
    if (!config) return;

    const band = resolveColorBand(val, config);
    if (isExtremeReading(band)) {
      setSavedReadingId(readingId);
      setNudgeBand(band);
      setNudgeVisible(true);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);

    const numericValue = Number(valueInput.trim());
    if (
      !valueInput.trim() ||
      isNaN(numericValue) ||
      !Number.isInteger(numericValue)
    ) {
      setErrorMessage('Please enter a valid integer glucose reading (mg/dL).');
      return;
    }

    try {
      if (existingReading) {
        // Update existing reading
        const updated = await updateReading(existingReading.id, {
          value: numericValue,
          comment: commentInput.trim() || null,
          tag_ids: selectedTagIds,
        });
        setExistingReading(updated);
        await checkAndTriggerExtremeNudge(
          updated.id,
          selectedSlot,
          numericValue,
          commentInput.trim()
        );
      } else {
        // Create new reading
        const created = await createReading({
          slot: selectedSlot,
          value: numericValue,
          timestamp: Date.now(),
          clinical_date: clinicalDate,
          comment: commentInput.trim() || null,
          tag_ids: selectedTagIds,
        });
        setExistingReading(created);
        await checkAndTriggerExtremeNudge(
          created.id,
          selectedSlot,
          numericValue,
          commentInput.trim()
        );
      }
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        setErrorMessage(
          `A reading already exists for slot ${selectedSlot} on date ${clinicalDate}. Edit the existing entry or pick a different slot/date.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to save reading');
      }
    }
  };

  const handleDelete = async () => {
    if (!existingReading) return;

    const executeDelete = async () => {
      try {
        await deleteReading(existingReading.id);
        setExistingReading(null);
        setValueInput('');
        setCommentInput('');
        setSelectedTagIds([]);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete reading');
      }
    };

    // On web/test environment Alert.alert may be mocked or omitted
    if (typeof Alert !== 'undefined' && Alert.alert) {
      Alert.alert(
        'Delete Reading',
        `Are you sure you want to delete the ${selectedSlot} reading for ${clinicalDate}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete },
        ]
      );
    } else {
      await executeDelete();
    }
  };

  const handleSaveNudgeComment = async (nudgeComment: string) => {
    setNudgeVisible(false);
    if (savedReadingId !== null && nudgeComment.trim()) {
      try {
        const updated = await updateReading(savedReadingId, {
          comment: nudgeComment.trim(),
        });
        setExistingReading(updated);
        setCommentInput(nudgeComment.trim());
      } catch (err) {
        console.error('Failed to update nudge comment:', err);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} testID="edit-screen">
      <Text style={styles.headerTitle}>
        {existingReading ? 'Edit Blood Glucose Entry' : 'Log Blood Glucose Entry'}
      </Text>

      {errorMessage && (
        <View style={styles.errorContainer} testID="error-banner">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Date Selector Input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Clinical Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={clinicalDate}
          onChangeText={setClinicalDate}
          placeholder="YYYY-MM-DD"
          testID="date-input"
        />
      </View>

      {/* Slot Picker */}
      <SlotPicker selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />

      {/* Glucose Value Input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Glucose Reading (mg/dL)</Text>
        <TextInput
          style={styles.input}
          value={valueInput}
          onChangeText={setValueInput}
          placeholder="e.g. 110"
          keyboardType="number-pad"
          testID="value-input"
        />
      </View>

      {/* Tag Picker */}
      <TagPicker
        activeTags={activeTags}
        selectedTagIds={selectedTagIds}
        onToggleTag={handleToggleTag}
      />

      {/* Free-text Comment Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Notes / Comments (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={commentInput}
          onChangeText={setCommentInput}
          placeholder="Add any notes about this reading..."
          multiline
          numberOfLines={3}
          testID="comment-input"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          testID="save-button"
        >
          <Text style={styles.saveButtonText}>
            {existingReading ? 'Update Reading' : 'Save Reading'}
          </Text>
        </TouchableOpacity>

        {existingReading && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="delete-button"
          >
            <Text style={styles.deleteButtonText}>Delete Entry</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Extreme Reading Dismissible Nudge Modal */}
      <ExtremeNudgeModal
        visible={nudgeVisible}
        colorBand={nudgeBand}
        value={Number(valueInput)}
        initialComment={commentInput}
        onDismiss={() => setNudgeVisible(false)}
        onSaveComment={handleSaveNudgeComment}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2328',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebe9',
    borderColor: '#ff8182',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#cf222e',
    fontWeight: '500',
  },
  fieldContainer: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2328',
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionContainer: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#0969da',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff1f0',
    borderColor: '#ff4d4f',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#cf222e',
    fontSize: 16,
    fontWeight: '600',
  },
});
