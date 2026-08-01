export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  bvnLast4?: string | null;
  ninLast4?: string | null;
  bvnVerified: boolean;
  ninVerified: boolean;
  avatar?: string;
  kycTier: 'none' | 'basic' | 'verified' | 'premium';
  kycDocumentStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycDocumentsSubmitted?: boolean;
  creditScore: number;
  role: string;
  isActive: boolean;
  hasWithdrawalAccount: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: 'fund' | 'transfer' | 'savings' | 'circle' | 'group_goal' | 'fundraising' | 'airtime' | 'data' | 'electricity' | 'cable' | 'withdrawal';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  reference: string;
}

export interface SavingsPlan {
  id: string;
  name: string;
  type: 'flexible' | 'locked' | 'goal';
  targetAmount: number;
  savedAmount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  contributionAmount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
  interestRate: number;
  goalImage?: string;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string | null;
  nextPayoutDate: string | null;
  status: 'active' | 'pending' | 'completed';
  members: CircleMember[];
  completedPayoutsCount?: number;
  createdAt?: string;
  startDate?: string;
  isPayoutOrderFinalized?: boolean;
  payoutOrderStrategy?: 'manual' | 'weighted_random' | string | null;
  payoutOrderFinalizedAt?: string | null;
}

export interface CircleMember {
  id: string;
  name: string;
  avatar?: string;
  hasPaid: boolean;
  payoutPosition: number;
  hasReceivedPayout: boolean;
  role?: 'admin' | 'member';
  isContributionParticipant?: boolean;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'alert' | 'milestone' | 'info';
  category?: 'savings' | 'circle' | 'clic' | 'group_goal' | 'group' | 'system';
  title: string;
  message: string;
  read: boolean;
  date: string;
  link?: string;
  inviteStatus?: 'pending' | 'accepted' | 'rejected';
  groupId?: string;
}

export type BillType = 'airtime' | 'data' | 'electricity' | 'cable';

export interface BillProvider {
  id: string;
  name: string;
  type: BillType;
  logo?: string;
}
