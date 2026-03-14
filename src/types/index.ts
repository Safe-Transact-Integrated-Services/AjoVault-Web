export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  kycTier: 'none' | 'basic' | 'verified' | 'premium';
  creditScore: number;
  role: string;
  isActive: boolean;
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
  frequency: 'daily' | 'weekly' | 'monthly';
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
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string;
  nextPayoutDate: string;
  status: 'active' | 'pending' | 'completed';
  payoutType: 'rotation' | 'random' | 'bidding';
  members: CircleMember[];
}

export interface CircleMember {
  id: string;
  name: string;
  avatar?: string;
  hasPaid: boolean;
  payoutPosition: number;
  hasReceivedPayout: boolean;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'alert' | 'milestone' | 'info';
  category?: 'savings' | 'circle' | 'group_goal' | 'system';
  title: string;
  message: string;
  read: boolean;
  date: string;
  link?: string;
}

export type BillType = 'airtime' | 'data' | 'electricity' | 'cable';

export interface BillProvider {
  id: string;
  name: string;
  type: BillType;
  logo?: string;
}
