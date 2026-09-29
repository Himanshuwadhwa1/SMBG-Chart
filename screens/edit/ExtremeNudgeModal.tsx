import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ColorBand } from '../../domain/thresholds';
import { useTheme } from '../../state/ThemeContext';

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
  const { colors } = useTheme();
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
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <View style={[styles.headerBadge, isLow ? styles.lowBadge : styles.highBadge]}>
            <Text style={styles.headerBadgeText}>
              {isLow ? '⚠️ Extreme Low Glucose' : '⚠️ Extreme High Glucose'}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Extreme Reading ({value} mg/dL)</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            This reading falls in your extreme {isLow ? 'low' : 'high'} threshold band. Would you like to add a remark or reason for reference?
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. Skipped meal, heavy exercise, dosage change..."
            placeholderTextColor={colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            testID="extreme-nudge-input"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.dismissButton, { borderColor: colors.border }]}
              onPress={onDismiss}
              testID="extreme-nudge-dismiss"
            >
              <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>Skip / Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
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
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
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
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
