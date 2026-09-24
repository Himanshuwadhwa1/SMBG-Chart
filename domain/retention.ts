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
