export const SchedulableTriggerInputTypes = {
  CALENDAR: 'calendar',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  DATE: 'date',
  TIME_INTERVAL: 'timeInterval',
};

export const scheduledNotifications: any[] = [];

export const setNotificationHandler = jest.fn();

export const getPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
}));

export const requestPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
}));

export const scheduleNotificationAsync = jest.fn(async (request: any) => {
  scheduledNotifications.push(request);
  return request.identifier || 'mock-notification-id';
});

export const cancelScheduledNotificationAsync = jest.fn(async (identifier: string) => {
  const index = scheduledNotifications.findIndex((n) => n.identifier === identifier);
  if (index !== -1) {
    scheduledNotifications.splice(index, 1);
  }
});

export const cancelAllScheduledNotificationsAsync = jest.fn(async () => {
  scheduledNotifications.length = 0;
});

export const getAllScheduledNotificationsAsync = jest.fn(async () => {
  return [...scheduledNotifications];
});

export function resetMockNotifications(): void {
  scheduledNotifications.length = 0;
  setNotificationHandler.mockClear();
  getPermissionsAsync.mockClear();
  requestPermissionsAsync.mockClear();
  scheduleNotificationAsync.mockClear();
  cancelScheduledNotificationAsync.mockClear();
  cancelAllScheduledNotificationsAsync.mockClear();
  getAllScheduledNotificationsAsync.mockClear();
}
