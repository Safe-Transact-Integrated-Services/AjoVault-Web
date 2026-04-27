import { apiRequest } from '@/lib/api/http';

export interface AdminDashboardKpis {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  pendingAgents: number;
  todayTransactionVolume: number;
  totalTransactionVolume: number;
  openDisputes: number;
  totalSavings: number;
  activeCircles: number;
  currency: string;
}

export interface AdminPendingAgentApproval {
  applicationId: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  state: string;
  lga?: string | null;
  location: string;
  submittedAtUtc: string;
}

export interface AdminActiveIssue {
  requestId: string;
  subject: string;
  requesterFullName: string;
  requesterRole: 'customer' | 'agent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_review' | 'resolved';
  categoryLabel: string;
  relatedReference?: string | null;
  updatedAtUtc: string;
}

export interface AdminRecentTransaction {
  entryId: string;
  reference: string;
  transactionType: string;
  customerName: string;
  description: string;
  amount: number;
  currency: string;
  direction: 'credit' | 'debit';
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  createdAtUtc: string;
}

export interface AdminDashboardSummary {
  kpis: AdminDashboardKpis;
  pendingAgentApprovals: AdminPendingAgentApproval[];
  activeIssues: AdminActiveIssue[];
  recentTransactions: AdminRecentTransaction[];
}

export const adminDashboardKeys = {
  summary: ['admin', 'dashboard', 'summary'] as const,
};

export const getAdminDashboardSummary = () =>
  apiRequest<AdminDashboardSummary>('/api/admin/dashboard');
