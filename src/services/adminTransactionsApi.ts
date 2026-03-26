import { apiRequest } from '@/lib/api/http';

export interface AdminTransactionListItem {
  id: string;
  type: string;
  senderName: string;
  senderPhone?: string | null;
  recipientName: string;
  recipientPhone?: string | null;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  date: string;
  reference: string;
  channel: 'app' | 'agent';
  description: string;
}

interface AdminTransactionsPageResponse {
  totalCount: number;
  items: AdminTransactionListItem[];
}

export const adminTransactionsKeys = {
  all: ['admin', 'transactions'] as const,
  list: () => [...adminTransactionsKeys.all, 'list'] as const,
};

export const getAdminTransactions = (): Promise<AdminTransactionsPageResponse> =>
  apiRequest<AdminTransactionsPageResponse>('/api/admin/transactions');
