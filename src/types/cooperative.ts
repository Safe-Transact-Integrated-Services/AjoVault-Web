import type { Circle } from '@/types';

export interface Cooperative {
  id: string;
  name: string;
  type: 'company' | 'union' | 'community' | 'association';
  status: 'active' | 'pending' | 'suspended';
  memberCount: number;
  totalSavings: number;
  totalLoans: number;
  currency: string;
  role: 'admin' | 'member' | 'auditor';
  createdAt: string;
}

export interface CoopMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'member' | 'auditor';
  kycStatus: 'none' | 'basic' | 'verified';
  savingsBalance: number;
  loanBalance: number;
  joinedAt: string;
}

export interface CoopSavingsProgram {
  id: string;
  name: string;
  type: 'individual' | 'group';
  targetAmount: number;
  totalContributed: number;
  memberCount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'completed' | 'paused';
}

export interface LoanApplication {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  purpose: string;
  repaymentMonths: number;
  creditScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaying' | 'completed' | 'overdue';
  appliedAt: string;
  currency: string;
}
