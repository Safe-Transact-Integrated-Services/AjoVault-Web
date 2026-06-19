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
  upcomingContributionsPreview: ['dashboard', 'upcomingContributions', 'preview'] as const,
  upcomingContributionsAll: ['dashboard', 'upcomingContributions', 'all'] as const,
  upcomingContributions: (page: number, pageSize: number) =>
    ['dashboard', 'upcomingContributions', page, pageSize] as const,
};

export interface UpcomingContributionItem {
  id: string;
  date: string;
  name: string;
  type: string;
  contributionAmount: number;
  status: string;
  paymentUrl?: string | null;
}

export interface UpcomingContributionsResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: UpcomingContributionItem[];
}

export const getDashboardSummary = () =>
  apiRequest<DashboardSummaryResponse>('/api/dashboard/me');

export const getUpcomingContributions = (page = 1, pageSize = 10) =>
  apiRequest<UpcomingContributionsResponse>(
    `/api/dashboard/me/upcoming-contributions?page=${page}&pageSize=${pageSize}`,
  );

export const compareUpcomingContributionsByDate = (
  a: UpcomingContributionItem,
  b: UpcomingContributionItem,
) => new Date(a.date).getTime() - new Date(b.date).getTime();



export const getAllUpcomingContributions = async () => {
  const firstPage = await getUpcomingContributions(1, 10);

  if (firstPage.totalCount <= firstPage.items.length) {
    return {
      ...firstPage,
      items: firstPage.items,
    };
  }

  const fullPage = await getUpcomingContributions(1, firstPage.totalCount);

  return {
    ...fullPage,
    items: fullPage.items,
  };
};

export const resolveUpcomingContributionPath = (item: UpcomingContributionItem) => {
  if (item.paymentUrl?.startsWith('/')) {
    return item.paymentUrl;
  }

  const type = item.type?.toLowerCase().trim() ?? '';
  const { id } = item;

  if (type.includes('circle') || type.includes('ajo')) {
    return `/circles/${id}`;
  }

  if (type.includes('saving') || type.includes('thrift')) {
    return `/savings/${id}`;
  }

  if (type.includes('group') && type.includes('goal')) {
    return `/group-goals/${id}`;
  }

  if (type.includes('cooperative')) {
    return '/cooperative';
  }

  if (type.includes('fundraising') || type.includes('fundraiser')) {
    return `/fundraising/${id}`;
  }

  return `/circles/${id}`;
};

export const openUpcomingContribution = (
  item: UpcomingContributionItem,
  navigate: (path: string) => void,
) => {
  if (item.paymentUrl && !item.paymentUrl.startsWith('/')) {
    window.location.href = item.paymentUrl;
    return;
  }

  navigate(resolveUpcomingContributionPath(item));
};
