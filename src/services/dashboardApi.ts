import { apiRequest } from '@/lib/api/http';

export interface DashboardSummaryResponse {
  wallet: {
    currency: string;
    availableBalance: number;
    pendingBalance: number;
    status: string;
  };
  savings: {
    activeCount: number;
    totalSavedAmount: number;
  };
  circles: {
    activeCount: number;
    memberCount: number;
  };
  unreadNotificationCount: number;
  recentActivities: DashboardActivity[];
}

export interface DashboardActivity {
  activityId: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  date: string;
  reference: string;
}

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
};

export const getDashboardSummary = () =>
  apiRequest<DashboardSummaryResponse>('/api/dashboard/me');
