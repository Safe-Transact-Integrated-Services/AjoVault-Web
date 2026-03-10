import type { Agent, AgentTransaction, AgentCustomer, CommissionSummary } from '@/types/agent';

export const mockAgent: Agent = {
  id: 'agt_001',
  phone: '+234 803 456 7890',
  firstName: 'Musa',
  lastName: 'Abdullahi',
  agentCode: 'AJO-AG-2847',
  location: 'Kano Central Market',
  lga: 'Kano Municipal',
  state: 'Kano',
  tier: 'standard',
  status: 'active',
  walletBalance: 385400,
  commissionBalance: 18750,
  totalTransactions: 1247,
  totalCustomersRegistered: 89,
  createdAt: '2025-08-10',
};

export const mockAgentTransactions: AgentTransaction[] = [
  { id: 'atx_001', type: 'cash_in', customerName: 'Halima Bello', customerPhone: '+234 901 111 2222', amount: 15000, commission: 150, currency: 'NGN', status: 'completed', date: '2026-03-08T09:15:00', reference: 'AJO-CI-0901' },
  { id: 'atx_002', type: 'cash_out', customerName: 'Yakubu Danladi', customerPhone: '+234 802 333 4444', amount: 30000, commission: 300, currency: 'NGN', status: 'completed', date: '2026-03-08T08:45:00', reference: 'AJO-CO-0902' },
  { id: 'atx_003', type: 'registration', customerName: 'Fatima Sani', customerPhone: '+234 705 555 6666', amount: 0, commission: 200, currency: 'NGN', status: 'completed', date: '2026-03-08T08:20:00', reference: 'AJO-RG-0903' },
  { id: 'atx_004', type: 'cash_in', customerName: 'Ibrahim Garba', customerPhone: '+234 810 777 8888', amount: 5000, commission: 50, currency: 'NGN', status: 'completed', date: '2026-03-07T16:30:00', reference: 'AJO-CI-0904' },
  { id: 'atx_005', type: 'bill_payment', customerName: 'Amina Yusuf', customerPhone: '+234 903 999 0000', amount: 3000, commission: 100, currency: 'NGN', status: 'completed', date: '2026-03-07T15:10:00', reference: 'AJO-BP-0905' },
  { id: 'atx_006', type: 'cash_out', customerName: 'Suleiman Musa', customerPhone: '+234 806 222 3333', amount: 50000, commission: 500, currency: 'NGN', status: 'pending', date: '2026-03-07T14:00:00', reference: 'AJO-CO-0906' },
  { id: 'atx_007', type: 'cash_in', customerName: 'Zainab Abubakar', customerPhone: '+234 701 444 5555', amount: 20000, commission: 200, currency: 'NGN', status: 'completed', date: '2026-03-07T11:45:00', reference: 'AJO-CI-0907' },
  { id: 'atx_008', type: 'registration', customerName: 'Bashir Umar', customerPhone: '+234 809 666 7777', amount: 0, commission: 200, currency: 'NGN', status: 'completed', date: '2026-03-06T10:30:00', reference: 'AJO-RG-0908' },
  { id: 'atx_009', type: 'cash_in', customerName: 'Aisha Aliyu', customerPhone: '+234 902 888 9999', amount: 10000, commission: 100, currency: 'NGN', status: 'failed', date: '2026-03-06T09:00:00', reference: 'AJO-CI-0909' },
  { id: 'atx_010', type: 'bill_payment', customerName: 'Mohammed Isah', customerPhone: '+234 803 111 0000', amount: 8500, commission: 150, currency: 'NGN', status: 'completed', date: '2026-03-05T17:20:00', reference: 'AJO-BP-0910' },
];

export const mockAgentCustomers: AgentCustomer[] = [
  { id: 'ac_001', firstName: 'Halima', lastName: 'Bello', phone: '+234 901 111 2222', registeredAt: '2026-01-15', kycStatus: 'basic', totalDeposits: 85000, lastActivity: '2026-03-08' },
  { id: 'ac_002', firstName: 'Yakubu', lastName: 'Danladi', phone: '+234 802 333 4444', registeredAt: '2026-02-03', kycStatus: 'verified', totalDeposits: 245000, lastActivity: '2026-03-08' },
  { id: 'ac_003', firstName: 'Fatima', lastName: 'Sani', phone: '+234 705 555 6666', registeredAt: '2026-03-08', kycStatus: 'none', totalDeposits: 0, lastActivity: '2026-03-08' },
  { id: 'ac_004', firstName: 'Ibrahim', lastName: 'Garba', phone: '+234 810 777 8888', registeredAt: '2025-11-20', kycStatus: 'basic', totalDeposits: 120000, lastActivity: '2026-03-07' },
  { id: 'ac_005', firstName: 'Amina', lastName: 'Yusuf', phone: '+234 903 999 0000', registeredAt: '2025-12-10', kycStatus: 'basic', totalDeposits: 67000, lastActivity: '2026-03-07' },
  { id: 'ac_006', firstName: 'Suleiman', lastName: 'Musa', phone: '+234 806 222 3333', registeredAt: '2026-01-28', kycStatus: 'verified', totalDeposits: 310000, lastActivity: '2026-03-07' },
  { id: 'ac_007', firstName: 'Zainab', lastName: 'Abubakar', phone: '+234 701 444 5555', registeredAt: '2026-02-14', kycStatus: 'basic', totalDeposits: 95000, lastActivity: '2026-03-07' },
  { id: 'ac_008', firstName: 'Bashir', lastName: 'Umar', phone: '+234 809 666 7777', registeredAt: '2026-03-06', kycStatus: 'none', totalDeposits: 0, lastActivity: '2026-03-06' },
];

export const mockCommissionSummary: CommissionSummary = {
  today: 700,
  thisWeek: 4850,
  thisMonth: 18750,
  allTime: 156200,
  pending: 500,
  currency: 'NGN',
};

export const formatCurrency = (amount: number, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};
