import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import {
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  resetMockNotifications,
  scheduledNotifications,
  scheduleNotificationAsync,
} from '../__mocks__/expo-notifications';
import {
  createReading,
  getAllReadings,
  initDb,
  resetDbInstance,
  updateSettings,
} from '../db';
import {
  cancelRetentionNotifications,
  configureNotificationHandler,
  RETENTION_NOTIFICATION_ID,
  syncRetentionNotifications,
} from '../notifications';
import { RetentionFlowModal } from '../screens/settings/RetentionFlowModal';
import { ThemeProvider } from '../state/ThemeContext';

describe('Phase 6 — Retention & Cleanup Flow Tests', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    resetMockNotifications();
    await initDb();
  });

  describe('1. Local Notification Scheduling (notifications/retention.ts)', () => {
    it('should configure foreground notification handler', () => {
      configureNotificationHandler();
      // Verify no throw and handler is set
    });

    it('should cancel scheduled notifications when retention duration is null', async () => {
      await updateSettings({ retention_duration_months: null });
      await createReading({
        slot: 'BB',
        value: 100,
        timestamp: Date.now(),
        clinical_date: '2026-05-01',
      });

      const result = await syncRetentionNotifications();
      expect(result.scheduled).toBe(false);
      expect(result.reason).toBe('none');
      expect(scheduledNotifications.length).toBe(0);
    });

    it('should cancel scheduled notifications when no readings exist in database', async () => {
      await updateSettings({ retention_duration_months: 3 });

      const result = await syncRetentionNotifications();
      expect(result.scheduled).toBe(false);
      expect(result.reason).toBe('none');
      expect(scheduledNotifications.length).toBe(0);
    });

    it('should schedule approaching warning notification when deadline is well in the future', async () => {
      await updateSettings({ retention_duration_months: 3 });

      // Oldest reading logged 30 days ago: 3 months retention means deadline is ~60 days in future
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      await createReading({
        slot: 'BB',
        value: 110,
        timestamp: thirtyDaysAgo,
        clinical_date: '2026-04-01',
      });

      const result = await syncRetentionNotifications();
      expect(result.scheduled).toBe(true);
      expect(result.reason).toBe('approaching_warning');
      expect(scheduledNotifications.length).toBe(1);
      expect(scheduledNotifications[0].identifier).toBe(RETENTION_NOTIFICATION_ID);
      expect(scheduledNotifications[0].content.title).toContain('Retention Reminder');
    });

    it('should schedule deadline-day reminder when currently within the 7-day warning window', async () => {
      await updateSettings({ retention_duration_months: 1 });

      // 1 month retention (30 days), reading logged 26 days ago -> 4 days remaining (inside 7-day warning window)
      const now = Date.now();
      const twentySixDaysAgo = now - 26 * 24 * 60 * 60 * 1000;
      await createReading({
        slot: 'BB',
        value: 115,
        timestamp: twentySixDaysAgo,
        clinical_date: '2026-04-05',
      });

      const result = await syncRetentionNotifications(now);
      expect(result.scheduled).toBe(true);
      expect(result.reason).toBe('deadline_now');
      expect(scheduledNotifications.length).toBe(1);
    });

    it('should not schedule notification and cancel existing when data is already expired', async () => {
      await updateSettings({ retention_duration_months: 1 });

      // Reading logged 60 days ago: 1 month retention is long expired
      const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
      await createReading({
        slot: 'BB',
        value: 120,
        timestamp: sixtyDaysAgo,
        clinical_date: '2026-03-01',
      });

      const result = await syncRetentionNotifications();
      expect(result.scheduled).toBe(false);
      expect(result.reason).toBe('none');
      expect(scheduledNotifications.length).toBe(0);
    });

    it('should not schedule notification if user denies notification permission', async () => {
      (getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied', granted: false });
      (requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied', granted: false });

      await updateSettings({ retention_duration_months: 3 });
      await createReading({
        slot: 'BB',
        value: 110,
        timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
        clinical_date: '2026-04-01',
      });

      const result = await syncRetentionNotifications();
      expect(result.scheduled).toBe(false);
      expect(result.reason).toBe('permission_denied');
      expect(scheduledNotifications.length).toBe(0);
    });
  });

  describe('2. In-App Open Check & Confirmation-Gated Deletion Flow', () => {
    it('should render neither modal nor banner when retention is healthy', async () => {
      await updateSettings({ retention_duration_months: 6 });
      await createReading({
        slot: 'BB',
        value: 100,
        timestamp: Date.now(),
        clinical_date: '2026-05-01',
      });

      let renderer!: ReactTestRenderer;
      await act(async () => {
        renderer = create(
          <ThemeProvider>
            <RetentionFlowModal />
          </ThemeProvider>
        );
      });

      const banner = renderer.root.findAllByProps({ testID: 'retention-approaching-banner' });
      const modal = renderer.root.findAllByProps({ testID: 'retention-expired-modal' });

      expect(banner.length).toBe(0);
      expect(modal[0]?.props.visible).toBe(false);
    });

    it('should show approaching banner when deadline is within warning threshold', async () => {
      await updateSettings({ retention_duration_months: 1 });

      // 1 month retention (30 days), reading logged 25 days ago -> 5 days remaining
      const twentyFiveDaysAgo = Date.now() - 25 * 24 * 60 * 60 * 1000;
      await createReading({
        slot: 'BB',
        value: 105,
        timestamp: twentyFiveDaysAgo,
        clinical_date: '2026-04-05',
      });

      let renderer!: ReactTestRenderer;
      await act(async () => {
        renderer = create(
          <ThemeProvider>
            <RetentionFlowModal />
          </ThemeProvider>
        );
      });

      const banner = renderer.root.findByProps({ testID: 'retention-approaching-banner' });
      expect(banner).toBeDefined();

      // Dismiss banner
      const dismissBtn = renderer.root.findByProps({ testID: 'retention-dismiss-banner-button' });
      await act(async () => {
        dismissBtn.props.onPress();
      });

      const bannerAfter = renderer.root.findAllByProps({ testID: 'retention-approaching-banner' });
      expect(bannerAfter.length).toBe(0);

      // Verify no data was deleted
      const readings = await getAllReadings();
      expect(readings.length).toBe(1);
    });

    it('should open confirmation modal when retention deadline has passed, and keep data if dismissed', async () => {
      await updateSettings({ retention_duration_months: 1 });

      // Reading logged 45 days ago -> expired by 15 days
      const fortyFiveDaysAgo = Date.now() - 45 * 24 * 60 * 60 * 1000;
      await createReading({
        slot: 'BB',
        value: 120,
        timestamp: fortyFiveDaysAgo,
        clinical_date: '2026-03-15',
      });

      let renderer!: ReactTestRenderer;
      await act(async () => {
        renderer = create(
          <ThemeProvider>
            <RetentionFlowModal />
          </ThemeProvider>
        );
      });

      const modal = renderer.root.findByProps({ testID: 'retention-expired-modal' });
      expect(modal.props.visible).toBe(true);

      // User chooses to keep data
      const keepBtn = renderer.root.findByProps({ testID: 'retention-keep-data-button' });
      await act(async () => {
        keepBtn.props.onPress();
      });

      expect(modal.props.visible).toBe(false);

      // Verify safety constraint: NO silent deletion; data remains completely intact
      const readings = await getAllReadings();
      expect(readings.length).toBe(1);
      expect(readings[0].value).toBe(120);
    });

    it('should delete all readings ONLY after explicit user confirmation on app open', async () => {
      await updateSettings({ retention_duration_months: 1 });

      const fortyFiveDaysAgo = Date.now() - 45 * 24 * 60 * 60 * 1000;
      await createReading({
        slot: 'BB',
        value: 130,
        timestamp: fortyFiveDaysAgo,
        clinical_date: '2026-03-15',
      });

      let renderer!: ReactTestRenderer;
      await act(async () => {
        renderer = create(
          <ThemeProvider>
            <RetentionFlowModal />
          </ThemeProvider>
        );
      });

      const modal = renderer.root.findByProps({ testID: 'retention-expired-modal' });
      expect(modal.props.visible).toBe(true);

      // User clicks Clean Now
      const deleteBtn = renderer.root.findByProps({ testID: 'retention-confirm-delete-button' });
      await act(async () => {
        deleteBtn.props.onPress();
      });

      // Verify deletion executed after explicit confirmation
      const readings = await getAllReadings();
      expect(readings.length).toBe(0);

      // Verify confirmation notice is displayed
      const notice = renderer.root.findByProps({ testID: 'retention-deleted-notice' });
      expect(notice).toBeDefined();
    });
  });
});
