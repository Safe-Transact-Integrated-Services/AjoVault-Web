import { apiRequest } from '@/lib/api/http';

export interface NotificationSettings {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  savingsEnabled: boolean;
  circleEnabled: boolean;
  groupGoalEnabled: boolean;
  updatedAtUtc: string;
}

export const settingsKeys = {
  me: ['settings', 'me'] as const,
};

export const getMySettings = () =>
  apiRequest<NotificationSettings>('/api/settings/me');

export const updateMySettings = (input: Omit<NotificationSettings, 'updatedAtUtc'>) =>
  apiRequest<NotificationSettings>('/api/settings/me', {
    method: 'PUT',
    json: input,
  });
