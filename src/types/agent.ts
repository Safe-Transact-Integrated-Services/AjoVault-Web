export interface Agent {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  agentCode: string;
  location: string;
  lga: string;
  state: string;
  tier: 'basic' | 'standard' | 'super';
  status: 'active' | 'suspended' | 'pending';
  walletBalance: number;
  commissionBalance: number;
  totalTransactions: number;
  totalCustomersRegistered: number;
  createdAt: string;
}

export interface AgentTransaction {
  id: string;
  type: 'cash_in' | 'cash_out' | 'registration' | 'bill_payment';
  customerName: string;
  customerPhone: string;
  amount: number;
  commission: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference: string;
}

export interface AgentCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  registeredAt: string;
  kycStatus: 'none' | 'basic' | 'verified';
  totalDeposits: number;
  lastActivity: string;
}

export interface CommissionSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  pending: number;
  currency: string;
}
