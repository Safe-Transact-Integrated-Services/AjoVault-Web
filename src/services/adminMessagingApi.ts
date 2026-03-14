import { apiRequest } from '@/lib/api/http';

export type AdminMessagingDispatchStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed';
export type AdminMessagingDispatchChannel = 'email' | 'sms';
export type AdminMessagingDispatchPurpose = 'notification' | 'security';

export interface AdminMessagingDispatchSummary {
  pending: number;
  sending: number;
  sent: number;
  delivered: number;
  failed: number;
}

export interface AdminMessagingDispatch {
  dispatchId: string;
  notificationId?: string | null;
  userId?: string | null;
  userFullName?: string | null;
  userEmail?: string | null;
  userPhoneNumber?: string | null;
  channel: AdminMessagingDispatchChannel;
  purpose: AdminMessagingDispatchPurpose | string;
  provider: string;
  recipient: string;
  subject: string;
  templateKey?: string | null;
  status: AdminMessagingDispatchStatus | string;
  attemptCount: number;
  providerMessageId?: string | null;
  providerReference?: string | null;
  lastError?: string | null;
  feature?: string | null;
  featureReference?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  sentAtUtc?: string | null;
  deliveredAtUtc?: string | null;
  failedAtUtc?: string | null;
}

interface AdminMessagingDispatchListResponse {
  summary: AdminMessagingDispatchSummary;
  items: AdminMessagingDispatch[];
}

export interface GetAdminMessagingDispatchesInput {
  status?: string;
  channel?: string;
  purpose?: string;
  take?: number;
}

export const adminMessagingKeys = {
  all: ['admin', 'messaging'] as const,
  dispatches: (filters: GetAdminMessagingDispatchesInput) => ['admin', 'messaging', 'dispatches', filters] as const,
};

export const getAdminMessagingDispatches = (filters: GetAdminMessagingDispatchesInput = {}) => {
  const searchParams = new URLSearchParams();

  if (filters.status) {
    searchParams.set('status', filters.status);
  }

  if (filters.channel) {
    searchParams.set('channel', filters.channel);
  }

  if (filters.purpose) {
    searchParams.set('purpose', filters.purpose);
  }

  if (filters.take) {
    searchParams.set('take', String(filters.take));
  }

  const query = searchParams.toString();
  return apiRequest<AdminMessagingDispatchListResponse>(`/api/admin/messaging/dispatches${query ? `?${query}` : ''}`);
};

export const retryAdminMessagingDispatch = (dispatchId: string) =>
  apiRequest<AdminMessagingDispatch>(`/api/admin/messaging/dispatches/${encodeURIComponent(dispatchId)}/retry`, {
    method: 'POST',
  });
