import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';

import { getOldestReadingTimestamp, getSettings } from '../db';
import { calculateRetentionNotificationPlan } from '../domain/retention';

export const RETENTION_NOTIFICATION_ID = 'smbg-retention-warning';

/**
 * Configure default foreground notification behavior for expo-notifications.
 * Ensures notifications are displayed when the app is in the foreground.
 */
export function configureNotificationHandler(): void {
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('Failed to configure notification handler:', err);
  }
}

/**
 * Request notification permissions from device user.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permissions:', err);
    return false;
  }
}

/**
 * Cancel any scheduled retention notifications.
 */
export async function cancelRetentionNotifications(): Promise<void> {
  try {
    await cancelScheduledNotificationAsync(RETENTION_NOTIFICATION_ID);
  } catch (err) {
    // If notification wasn't scheduled or platform doesn't find it, ignore
  }
}

/**
 * Evaluates current settings and oldest reading timestamp, then schedules or cancels
 * the local notification warning accordingly.
 */
export async function syncRetentionNotifications(currentTimestamp: number = Date.now()): Promise<{
  scheduled: boolean;
  triggerTimestamp: number | null;
  reason: string;
}> {
  const settings = await getSettings();
  const oldestTimestamp = await getOldestReadingTimestamp();

  const plan = calculateRetentionNotificationPlan(
    settings.retention_duration_months,
    oldestTimestamp,
    currentTimestamp
  );

  // Always cancel previous scheduled retention notification before scheduling a new one
  await cancelRetentionNotifications();

  if (!plan.shouldSchedule || plan.triggerTimestamp === null) {
    return {
      scheduled: false,
      triggerTimestamp: null,
      reason: plan.reason,
    };
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return {
      scheduled: false,
      triggerTimestamp: plan.triggerTimestamp,
      reason: 'permission_denied',
    };
  }

  const title = 'SMBG Chart — Data Retention Reminder';
  const body =
    plan.reason === 'approaching_warning'
      ? 'Your blood glucose data will reach its retention limit in 7 days. Export or review your data before it is eligible for cleanup.'
      : 'Your blood glucose data has reached its retention limit today. Open the app to review your readings.';

  try {
    await scheduleNotificationAsync({
      identifier: RETENTION_NOTIFICATION_ID,
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(plan.triggerTimestamp),
      },
    });

    return {
      scheduled: true,
      triggerTimestamp: plan.triggerTimestamp,
      reason: plan.reason,
    };
  } catch (scheduleErr) {
    console.warn('Failed to schedule local notification:', scheduleErr);
    return {
      scheduled: false,
      triggerTimestamp: plan.triggerTimestamp,
      reason: 'scheduling_failed',
    };
  }
}
