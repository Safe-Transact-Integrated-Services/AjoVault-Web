import type { Cooperative, CoopMember, CoopSavingsProgram, LoanApplication } from '@/types/cooperative';

export const mockCooperative: Cooperative = {
  id: 'coop_001',
  name: 'Lagos Teachers Cooperative',
  type: 'union',
  status: 'active',
  memberCount: 45,
  totalSavings: 12500000,
  totalLoans: 3200000,
  currency: 'NGN',
  role: 'admin',
  createdAt: '2025-06-01',
};

export const mockCoopMembers: CoopMember[] = [
  { id: 'cm1', firstName: 'Adaeze', lastName: 'Okafor', phone: '+234 812 345 6789', role: 'admin', kycStatus: 'verified', savingsBalance: 450000, loanBalance: 0, joinedAt: '2025-06-01' },
  { id: 'cm2', firstName: 'Chidi', lastName: 'Nwosu', phone: '+234 803 111 2222', role: 'member', kycStatus: 'verified', savingsBalance: 320000, loanBalance: 50000, joinedAt: '2025-07-15' },
  { id: 'cm3', firstName: 'Funke', lastName: 'Adeyemi', phone: '+234 901 333 4444', role: 'member', kycStatus: 'basic', savingsBalance: 180000, loanBalance: 0, joinedAt: '2025-08-01' },
  { id: 'cm4', firstName: 'Ibrahim', lastName: 'Mohammed', phone: '+234 705 555 6666', role: 'auditor', kycStatus: 'verified', savingsBalance: 560000, loanBalance: 100000, joinedAt: '2025-06-10' },
  { id: 'cm5', firstName: 'Ngozi', lastName: 'Eze', phone: '+234 810 777 8888', role: 'member', kycStatus: 'verified', savingsBalance: 290000, loanBalance: 0, joinedAt: '2025-09-01' },
];

export const mockCoopPrograms: CoopSavingsProgram[] = [
  { id: 'cp1', name: 'Monthly Staff Savings', type: 'individual', targetAmount: 5000000, totalContributed: 3200000, memberCount: 40, frequency: 'monthly', status: 'active' },
  { id: 'cp2', name: 'End of Year Fund', type: 'group', targetAmount: 10000000, totalContributed: 7800000, memberCount: 45, frequency: 'monthly', status: 'active' },
  { id: 'cp3', name: 'Housing Fund', type: 'individual', targetAmount: 20000000, totalContributed: 4500000, memberCount: 25, frequency: 'monthly', status: 'active' },
];

export const mockLoanApplications: LoanApplication[] = [
  { id: 'ln1', memberId: 'cm2', memberName: 'Chidi Nwosu', amount: 150000, purpose: 'Medical expenses', repaymentMonths: 6, creditScore: 680, status: 'repaying', appliedAt: '2026-01-15', currency: 'NGN' },
  { id: 'ln2', memberId: 'cm4', memberName: 'Ibrahim Mohammed', amount: 300000, purpose: 'Business expansion', repaymentMonths: 12, creditScore: 750, status: 'repaying', appliedAt: '2026-02-01', currency: 'NGN' },
  { id: 'ln3', memberId: 'cm3', memberName: 'Funke Adeyemi', amount: 100000, purpose: 'School fees', repaymentMonths: 3, creditScore: 520, status: 'pending', appliedAt: '2026-03-05', currency: 'NGN' },
  { id: 'ln4', memberId: 'cm5', memberName: 'Ngozi Eze', amount: 200000, purpose: 'Equipment purchase', repaymentMonths: 6, creditScore: 710, status: 'pending', appliedAt: '2026-03-07', currency: 'NGN' },
];
