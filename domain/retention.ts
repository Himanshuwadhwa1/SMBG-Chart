export interface RetentionStatus {
  isConfigured: boolean;
  isApproaching: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  deadlineTimestamp: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates the exact deadline timestamp when data of a given retention duration (months)
 * relative to the oldest reading will expire.
 */
export function calculateRetentionDeadline(
  oldestReadingTimestamp: number,
  retentionDurationMonths: number
): number {
  const date = new Date(oldestReadingTimestamp);
  date.setMonth(date.getMonth() + retentionDurationMonths);
  return date.getTime();
}

/**
 * Evaluates whether a retention deadline is approaching or passed based on retention settings,
 * oldest reading timestamp, and current timestamp.
 */
export function evaluateRetentionDeadline(
  retentionDurationMonths: number | null,
  oldestReadingTimestamp: number | null,
  currentTimestamp: number = Date.now(),
  warningThresholdDays: number = 7
): RetentionStatus {
  if (
    retentionDurationMonths === null ||
    retentionDurationMonths <= 0 ||
    oldestReadingTimestamp === null
  ) {
    return {
      isConfigured: false,
      isApproaching: false,
      isExpired: false,
      daysRemaining: null,
      deadlineTimestamp: null,
    };
  }

  const deadlineTimestamp = calculateRetentionDeadline(
    oldestReadingTimestamp,
    retentionDurationMonths
  );

  const diffMs = deadlineTimestamp - currentTimestamp;
  const daysRemaining = Math.ceil(diffMs / MS_PER_DAY);

  const isExpired = diffMs <= 0;
  const isApproaching = !isExpired && daysRemaining <= warningThresholdDays;

  return {
    isConfigured: true,
    isApproaching,
    isExpired,
    daysRemaining,
    deadlineTimestamp,
  };
}

export interface RetentionNotificationPlan {
  shouldSchedule: boolean;
  triggerTimestamp: number | null;
  reason: 'approaching_warning' | 'deadline_now' | 'none';
}

/**
 * Calculates the notification scheduling plan based on retention deadline and current time.
 * If the warning threshold is in the future, schedules for that warning threshold timestamp.
 * If already inside the warning window (<= warningThresholdDays remaining), schedules for the exact deadline.
 * If already expired or not configured, shouldSchedule is false.
 */
export function calculateRetentionNotificationPlan(
  retentionDurationMonths: number | null,
  oldestReadingTimestamp: number | null,
  currentTimestamp: number = Date.now(),
  warningThresholdDays: number = 7
): RetentionNotificationPlan {
  const status = evaluateRetentionDeadline(
    retentionDurationMonths,
    oldestReadingTimestamp,
    currentTimestamp,
    warningThresholdDays
  );

  if (!status.isConfigured || status.deadlineTimestamp === null || status.isExpired) {
    return {
      shouldSchedule: false,
      triggerTimestamp: null,
      reason: 'none',
    };
  }

  const warningTimestamp = status.deadlineTimestamp - warningThresholdDays * MS_PER_DAY;

  if (currentTimestamp < warningTimestamp) {
    return {
      shouldSchedule: true,
      triggerTimestamp: warningTimestamp,
      reason: 'approaching_warning',
    };
  }

  return {
    shouldSchedule: true,
    triggerTimestamp: status.deadlineTimestamp,
    reason: 'deadline_now',
  };
}
