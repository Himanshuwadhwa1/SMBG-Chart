import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ColorBand } from '../../domain/thresholds';

interface ExtremeNudgeModalProps {
  visible: boolean;
  colorBand: ColorBand | null;
  value: number;
  initialComment: string;
  onDismiss: () => void;
  onSaveComment: (comment: string) => void;
}

export const ExtremeNudgeModal: React.FC<ExtremeNudgeModalProps> = ({
  visible,
  colorBand,
  value,
  initialComment,
  onDismiss,
  onSaveComment,
}) => {
  const [comment, setComment] = useState(initialComment);

  const isLow = colorBand === 'extreme_low';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID="extreme-nudge-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.headerBadge, isLow ? styles.lowBadge : styles.highBadge]}>
            <Text style={styles.headerBadgeText}>
              {isLow ? '⚠️ Extreme Low Glucose' : '⚠️ Extreme High Glucose'}
            </Text>
          </View>

          <Text style={styles.title}>Extreme Reading ({value} mg/dL)</Text>
          <Text style={styles.message}>
            This reading falls in your extreme {isLow ? 'low' : 'high'} threshold band. Would you like to add a remark or reason for reference?
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Skipped meal, heavy exercise, dosage change..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            testID="extreme-nudge-input"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              testID="extreme-nudge-dismiss"
            >
              <Text style={styles.dismissButtonText}>Skip / Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSaveComment(comment)}
              testID="extreme-nudge-save"
            >
              <Text style={styles.saveButtonText}>Save Remark</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  lowBadge: {
    backgroundColor: '#ffebe9',
  },
  highBadge: {
    backgroundColor: '#fff8c5',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cf222e',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2328',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#57606a',
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2328',
    backgroundColor: '#f6f8fa',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57606a',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0969da',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
