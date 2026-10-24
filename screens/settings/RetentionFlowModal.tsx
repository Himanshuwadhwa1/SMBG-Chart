import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteAllReadings, getOldestReadingTimestamp, getSettings } from '../../db';
import { evaluateRetentionDeadline, RetentionStatus } from '../../domain/retention';
import { syncRetentionNotifications } from '../../notifications';
import { useTheme } from '../../state/ThemeContext';

export interface RetentionFlowModalProps {
  onCheckComplete?: (status: RetentionStatus) => void;
}

export const RetentionFlowModal: React.FC<RetentionFlowModalProps> = ({ onCheckComplete }) => {
  const { colors } = useTheme();
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus | null>(null);
  const [retentionMonths, setRetentionMonths] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  useEffect(() => {
    checkRetention();
  }, []);

  const checkRetention = async () => {
    try {
      const settings = await getSettings();
      const oldestTs = await getOldestReadingTimestamp();
      const status = evaluateRetentionDeadline(
        settings.retention_duration_months,
        oldestTs,
        Date.now()
      );

      setRetentionStatus(status);
      setRetentionMonths(settings.retention_duration_months);

      // Also ensure scheduled local notifications are updated
      await syncRetentionNotifications();

      if (status.isExpired) {
        setModalVisible(true);
      } else if (status.isApproaching) {
        setBannerVisible(true);
      }

      if (onCheckComplete) {
        onCheckComplete(status);
      }
    } catch (err) {
      console.error('Failed to run app-open retention check:', err);
    }
  };

  const handleExecuteDelete = async () => {
    try {
      await deleteAllReadings();
      await syncRetentionNotifications();
      setModalVisible(false);
      setDeletedNotice(true);
    } catch (err) {
      console.error('Failed to execute retention deletion:', err);
    }
  };

  const handleConfirmDelete = () => {
    if (typeof Alert !== 'undefined' && Alert.alert) {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to permanently delete ALL glucose readings? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All Readings',
            style: 'destructive',
            onPress: handleExecuteDelete,
          },
        ]
      );
    } else {
      handleExecuteDelete();
    }
  };

  const handleKeepData = () => {
    // User chooses to keep data past deadline — no deletion occurs
    setModalVisible(false);
  };

  const handleDismissBanner = () => {
    setBannerVisible(false);
  };

  return (
    <>
      {/* Approaching Retention Deadline Banner */}
      {bannerVisible && retentionStatus && retentionStatus.isApproaching && (
        <View
          style={[
            styles.bannerContainer,
            { backgroundColor: colors.primaryLight, borderColor: colors.primary },
          ]}
          testID="retention-approaching-banner"
        >
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: colors.primary }]}>
              Data Retention Notice
            </Text>
            <Text style={[styles.bannerBody, { color: colors.text }]}>
              Your glucose data will reach its {retentionMonths}-month retention limit in{' '}
              {retentionStatus.daysRemaining} day(s). Consider exporting your data before it is
              eligible for cleanup.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bannerDismissButton, { backgroundColor: colors.card }]}
            onPress={handleDismissBanner}
            testID="retention-dismiss-banner-button"
          >
            <Text style={[styles.bannerDismissText, { color: colors.textSecondary }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Retention Deadline Passed Confirmation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        testID="retention-expired-modal"
        onRequestClose={handleKeepData}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.error }]}>
              Retention Deadline Passed
            </Text>
            <Text style={[styles.modalBody, { color: colors.text }]}>
              Your stored glucose entries have exceeded your {retentionMonths}-month retention
              period.
            </Text>
            <Text style={[styles.modalSubBody, { color: colors.textSecondary }]}>
              Per medical data privacy guidelines, data past the retention deadline can be cleaned
              from this device. No data is ever deleted without your explicit confirmation.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.keepButton, { borderColor: colors.border }]}
                onPress={handleKeepData}
                testID="retention-keep-data-button"
              >
                <Text style={[styles.keepButtonText, { color: colors.text }]}>Keep Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={handleConfirmDelete}
                testID="retention-confirm-delete-button"
              >
                <Text style={styles.deleteButtonText}>Clean Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation notice after deletion */}
      {deletedNotice && (
        <View
          style={[styles.noticeContainer, { backgroundColor: colors.successBg, borderColor: colors.success }]}
          testID="retention-deleted-notice"
        >
          <Text style={[styles.noticeText, { color: colors.success }]}>
            All historical readings were cleaned successfully.
          </Text>
          <TouchableOpacity onPress={() => setDeletedNotice(false)}>
            <Text style={[styles.noticeClose, { color: colors.success }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  bannerDismissButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerDismissText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  modalSubBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  keepButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  noticeContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noticeClose: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
});
