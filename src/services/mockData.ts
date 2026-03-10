import type { User, WalletBalance, Transaction, SavingsPlan, Circle, Notification, BillProvider } from '@/types';

export const mockUser: User = {
  id: 'usr_001',
  phone: '+234 812 345 6789',
  firstName: 'Adaeze',
  lastName: 'Okafor',
  email: 'adaeze@email.com',
  kycTier: 'verified',
  creditScore: 720,
  role: 'user',
  isActive: true,
  createdAt: '2025-06-15',
  lastLoginAt: '2026-03-07T14:30:00',
};

export const mockWallet: WalletBalance = {
  available: 245680.50,
  pending: 15000,
  currency: 'NGN',
};

export const mockTransactions: Transaction[] = [
  { id: 'tx_001', type: 'credit', category: 'fund', amount: 50000, currency: 'NGN', description: 'Wallet Funded via Paystack', status: 'completed', date: '2026-03-07T14:30:00', reference: 'AJO-FND-001' },
  { id: 'tx_002', type: 'debit', category: 'savings', amount: 10000, currency: 'NGN', description: 'Emergency Fund Contribution', status: 'completed', date: '2026-03-07T10:00:00', reference: 'AJO-SAV-002' },
  { id: 'tx_003', type: 'debit', category: 'circle', amount: 25000, currency: 'NGN', description: 'Ajo Family Circle - March', status: 'completed', date: '2026-03-06T09:00:00', reference: 'AJO-CIR-003' },
  { id: 'tx_004', type: 'debit', category: 'airtime', amount: 2000, currency: 'NGN', description: 'MTN Airtime Purchase', status: 'completed', date: '2026-03-05T16:45:00', reference: 'AJO-AIR-004' },
  { id: 'tx_005', type: 'credit', category: 'circle', amount: 150000, currency: 'NGN', description: 'Circle Payout - Wealth Builders', status: 'completed', date: '2026-03-04T12:00:00', reference: 'AJO-CIR-005' },
  { id: 'tx_006', type: 'debit', category: 'transfer', amount: 30000, currency: 'NGN', description: 'Transfer to +234 901 234 5678', status: 'completed', date: '2026-03-03T11:20:00', reference: 'AJO-TRF-006' },
  { id: 'tx_007', type: 'debit', category: 'electricity', amount: 8500, currency: 'NGN', description: 'IKEDC Electricity Bill', status: 'pending', date: '2026-03-02T08:30:00', reference: 'AJO-ELC-007' },
  { id: 'tx_008', type: 'debit', category: 'data', amount: 3500, currency: 'NGN', description: 'Airtel 6GB Data Bundle', status: 'completed', date: '2026-03-01T15:10:00', reference: 'AJO-DAT-008' },
];

export const mockSavingsPlans: SavingsPlan[] = [
  { id: 'sav_001', name: 'Emergency Fund', type: 'flexible', targetAmount: 500000, savedAmount: 185000, currency: 'NGN', frequency: 'weekly', contributionAmount: 10000, startDate: '2025-12-01', endDate: '2026-06-01', status: 'active', interestRate: 8 },
  { id: 'sav_002', name: 'New Laptop', type: 'goal', targetAmount: 350000, savedAmount: 280000, currency: 'NGN', frequency: 'monthly', contributionAmount: 35000, startDate: '2025-09-01', endDate: '2026-05-01', status: 'active', interestRate: 10, goalImage: '💻' },
  { id: 'sav_003', name: 'Rent 2027', type: 'locked', targetAmount: 1200000, savedAmount: 400000, currency: 'NGN', frequency: 'monthly', contributionAmount: 100000, startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', interestRate: 12 },
];

export const mockCircles: Circle[] = [
  {
    id: 'cir_001', name: 'Ajo Family Circle', description: 'Monthly family contribution group', amount: 25000, currency: 'NGN', frequency: 'monthly',
    memberCount: 6, maxMembers: 6, currentCycle: 3, totalCycles: 6, role: 'admin',
    nextContributionDate: '2026-04-01', nextPayoutDate: '2026-04-05', status: 'active', payoutType: 'rotation',
    members: [
      { id: 'm1', name: 'Adaeze O.', hasPaid: true, payoutPosition: 1, hasReceivedPayout: true },
      { id: 'm2', name: 'Chidi N.', hasPaid: true, payoutPosition: 2, hasReceivedPayout: true },
      { id: 'm3', name: 'Funke A.', hasPaid: false, payoutPosition: 3, hasReceivedPayout: false },
      { id: 'm4', name: 'Ibrahim M.', hasPaid: true, payoutPosition: 4, hasReceivedPayout: false },
      { id: 'm5', name: 'Ngozi E.', hasPaid: false, payoutPosition: 5, hasReceivedPayout: false },
      { id: 'm6', name: 'Yusuf K.', hasPaid: true, payoutPosition: 6, hasReceivedPayout: false },
    ],
  },
  {
    id: 'cir_002', name: 'Wealth Builders', description: 'Investment-focused savings group', amount: 50000, currency: 'NGN', frequency: 'monthly',
    memberCount: 10, maxMembers: 12, currentCycle: 5, totalCycles: 12, role: 'member',
    nextContributionDate: '2026-04-01', nextPayoutDate: '2026-04-10', status: 'active', payoutType: 'rotation',
    members: [
      { id: 'm7', name: 'Amina B.', hasPaid: true, payoutPosition: 1, hasReceivedPayout: true },
      { id: 'm8', name: 'David O.', hasPaid: true, payoutPosition: 2, hasReceivedPayout: true },
      { id: 'm9', name: 'Emeka C.', hasPaid: false, payoutPosition: 3, hasReceivedPayout: true },
      { id: 'm10', name: 'Grace I.', hasPaid: true, payoutPosition: 4, hasReceivedPayout: true },
      { id: 'm11', name: 'Adaeze O.', hasPaid: true, payoutPosition: 5, hasReceivedPayout: true },
    ],
  },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'reminder', title: 'Contribution Due', message: 'Your Ajo Family Circle contribution of ₦25,000 is due tomorrow.', read: false, date: '2026-03-07T08:00:00', link: '/circles/cir_001' },
  { id: 'n2', type: 'milestone', title: '80% Goal Reached! 🎉', message: 'Your "New Laptop" savings is at 80%. Keep going!', read: false, date: '2026-03-06T12:00:00', link: '/savings/sav_002' },
  { id: 'n3', type: 'alert', title: 'Login from New Device', message: 'A login was detected from a new device. If this wasn\'t you, please change your PIN.', read: true, date: '2026-03-05T09:15:00' },
  { id: 'n4', type: 'info', title: 'KYC Verified ✅', message: 'Your identity has been verified. You now have full access.', read: true, date: '2026-03-03T14:00:00' },
  { id: 'n5', type: 'reminder', title: 'Weekly Savings', message: 'Auto-debit of ₦10,000 for Emergency Fund is scheduled for tomorrow.', read: false, date: '2026-03-07T07:00:00', link: '/savings/sav_001' },
];

export const mockBillProviders: BillProvider[] = [
  { id: 'bp1', name: 'MTN', type: 'airtime' },
  { id: 'bp2', name: 'Airtel', type: 'airtime' },
  { id: 'bp3', name: 'Glo', type: 'airtime' },
  { id: 'bp4', name: '9mobile', type: 'airtime' },
  { id: 'bp5', name: 'MTN Data', type: 'data' },
  { id: 'bp6', name: 'Airtel Data', type: 'data' },
  { id: 'bp7', name: 'IKEDC', type: 'electricity' },
  { id: 'bp8', name: 'EKEDC', type: 'electricity' },
  { id: 'bp9', name: 'DSTV', type: 'cable' },
  { id: 'bp10', name: 'GOtv', type: 'cable' },
];

export const formatCurrency = (amount: number, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
};
