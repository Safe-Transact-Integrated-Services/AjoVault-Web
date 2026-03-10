export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  kycTier: 'none' | 'basic' | 'verified' | 'premium';
  status: 'active' | 'suspended' | 'flagged';
  walletBalance: number;
  totalTransactions: number;
  creditScore: number;
  joinedAt: string;
}

export interface AdminAgent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  agentCode: string;
  location: string;
  state: string;
  tier: 'basic' | 'standard' | 'super';
  status: 'active' | 'suspended' | 'pending';
  totalCustomers: number;
  totalTransactions: number;
  commissionBalance: number;
  appliedAt: string;
}

export interface AdminDispute {
  id: string;
  type: 'failed_transaction' | 'wrong_debit' | 'fraud_report' | 'agent_complaint' | 'other';
  subject: string;
  description: string;
  userId: string;
  userName: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  amount?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface AdminTransaction {
  id: string;
  type: 'transfer' | 'fund' | 'withdrawal' | 'bill_payment' | 'cash_in' | 'cash_out';
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  date: string;
  reference: string;
  channel: 'app' | 'ussd' | 'agent';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  pendingAgents: number;
  totalTransactionVolume: number;
  todayTransactionVolume: number;
  openDisputes: number;
  totalSavings: number;
  activeCircles: number;
  currency: string;
}

export const mockAdminStats: AdminStats = {
  totalUsers: 24_850,
  activeUsers: 18_320,
  totalAgents: 1_240,
  pendingAgents: 38,
  totalTransactionVolume: 2_450_000_000,
  todayTransactionVolume: 85_600_000,
  openDisputes: 47,
  totalSavings: 890_000_000,
  activeCircles: 3_420,
  currency: '₦',
};

export const mockAdminUsers: AdminUser[] = [
  { id: 'u1', firstName: 'Adebayo', lastName: 'Ogunlesi', phone: '08012345678', email: 'adebayo@email.com', kycTier: 'verified', status: 'active', walletBalance: 125000, totalTransactions: 234, creditScore: 720, joinedAt: '2024-01-15' },
  { id: 'u2', firstName: 'Chioma', lastName: 'Eze', phone: '08098765432', email: 'chioma@email.com', kycTier: 'basic', status: 'active', walletBalance: 45000, totalTransactions: 89, creditScore: 580, joinedAt: '2024-03-22' },
  { id: 'u3', firstName: 'Fatimah', lastName: 'Bello', phone: '07034567890', email: 'fatimah@email.com', kycTier: 'premium', status: 'active', walletBalance: 890000, totalTransactions: 567, creditScore: 850, joinedAt: '2023-11-05' },
  { id: 'u4', firstName: 'Emmanuel', lastName: 'Nwosu', phone: '09045678123', email: 'emmanuel@email.com', kycTier: 'none', status: 'flagged', walletBalance: 5000, totalTransactions: 12, creditScore: 320, joinedAt: '2024-06-10' },
  { id: 'u5', firstName: 'Amina', lastName: 'Yusuf', phone: '08156789012', email: 'amina@email.com', kycTier: 'verified', status: 'suspended', walletBalance: 0, totalTransactions: 145, creditScore: 650, joinedAt: '2024-02-28' },
  { id: 'u6', firstName: 'Oluwaseun', lastName: 'Adeyemi', phone: '07089012345', email: 'seun@email.com', kycTier: 'basic', status: 'active', walletBalance: 78000, totalTransactions: 203, creditScore: 690, joinedAt: '2024-04-14' },
  { id: 'u7', firstName: 'Grace', lastName: 'Okafor', phone: '08167890456', email: 'grace@email.com', kycTier: 'verified', status: 'active', walletBalance: 234000, totalTransactions: 312, creditScore: 760, joinedAt: '2023-09-01' },
  { id: 'u8', firstName: 'Ibrahim', lastName: 'Musa', phone: '09078901234', email: 'ibrahim@email.com', kycTier: 'basic', status: 'active', walletBalance: 15000, totalTransactions: 45, creditScore: 480, joinedAt: '2024-07-20' },
];

export const mockAdminAgents: AdminAgent[] = [
  { id: 'a1', firstName: 'Kehinde', lastName: 'Adisa', phone: '08023456789', agentCode: 'AGT-001', location: 'Ikeja, Lagos', state: 'Lagos', tier: 'super', status: 'active', totalCustomers: 450, totalTransactions: 12340, commissionBalance: 345000, appliedAt: '2023-06-15' },
  { id: 'a2', firstName: 'Blessing', lastName: 'Okoro', phone: '07056789012', agentCode: 'AGT-002', location: 'Garki, Abuja', state: 'FCT', tier: 'standard', status: 'active', totalCustomers: 120, totalTransactions: 3400, commissionBalance: 89000, appliedAt: '2024-01-20' },
  { id: 'a3', firstName: 'Suleiman', lastName: 'Abdullahi', phone: '09034567891', agentCode: 'AGT-003', location: 'Sabon Gari, Kano', state: 'Kano', tier: 'basic', status: 'pending', totalCustomers: 0, totalTransactions: 0, commissionBalance: 0, appliedAt: '2024-08-01' },
  { id: 'a4', firstName: 'Ngozi', lastName: 'Uche', phone: '08145678901', agentCode: 'AGT-004', location: 'New Haven, Enugu', state: 'Enugu', tier: 'standard', status: 'active', totalCustomers: 200, totalTransactions: 5600, commissionBalance: 156000, appliedAt: '2023-12-10' },
  { id: 'a5', firstName: 'Taiwo', lastName: 'Balogun', phone: '07067890123', agentCode: 'AGT-005', location: 'Bodija, Ibadan', state: 'Oyo', tier: 'basic', status: 'suspended', totalCustomers: 35, totalTransactions: 780, commissionBalance: 12000, appliedAt: '2024-04-05' },
  { id: 'a6', firstName: 'Hauwa', lastName: 'Garba', phone: '09056781234', agentCode: 'AGT-006', location: 'Jos, Plateau', state: 'Plateau', tier: 'basic', status: 'pending', totalCustomers: 0, totalTransactions: 0, commissionBalance: 0, appliedAt: '2024-08-10' },
];

export const mockAdminDisputes: AdminDispute[] = [
  { id: 'd1', type: 'failed_transaction', subject: 'Transfer not received', description: 'Sent ₦50,000 to 08012345678 but recipient has not received it after 24 hours.', userId: 'u1', userName: 'Adebayo Ogunlesi', status: 'open', priority: 'high', amount: 50000, createdAt: '2024-08-12T10:30:00', updatedAt: '2024-08-12T10:30:00' },
  { id: 'd2', type: 'wrong_debit', subject: 'Double debit on airtime purchase', description: 'Was charged twice for ₦2,000 airtime purchase. Need a reversal.', userId: 'u2', userName: 'Chioma Eze', status: 'in_progress', priority: 'medium', amount: 2000, createdAt: '2024-08-11T14:20:00', updatedAt: '2024-08-12T09:00:00', assignedTo: 'Admin Sarah' },
  { id: 'd3', type: 'fraud_report', subject: 'Unauthorized withdrawal', description: 'Account was debited ₦100,000 without my authorization. I suspect my credentials were compromised.', userId: 'u6', userName: 'Oluwaseun Adeyemi', status: 'escalated', priority: 'critical', amount: 100000, createdAt: '2024-08-10T08:15:00', updatedAt: '2024-08-12T11:00:00', assignedTo: 'Admin James' },
  { id: 'd4', type: 'agent_complaint', subject: 'Agent refused cash out', description: 'Agent AGT-005 refused to process my cash out and was rude to me.', userId: 'u7', userName: 'Grace Okafor', status: 'open', priority: 'low', createdAt: '2024-08-12T07:45:00', updatedAt: '2024-08-12T07:45:00' },
  { id: 'd5', type: 'other', subject: 'Cannot upgrade KYC', description: 'I have submitted all documents but my KYC has been pending for 2 weeks.', userId: 'u8', userName: 'Ibrahim Musa', status: 'resolved', priority: 'medium', createdAt: '2024-08-05T16:30:00', updatedAt: '2024-08-10T12:00:00', assignedTo: 'Admin Sarah' },
];

export const mockAdminTransactions: AdminTransaction[] = [
  { id: 't1', type: 'transfer', senderName: 'Adebayo Ogunlesi', senderPhone: '08012345678', recipientName: 'Grace Okafor', recipientPhone: '08167890456', amount: 50000, currency: '₦', status: 'completed', date: '2024-08-12T14:30:00', reference: 'TXN-20240812-001', channel: 'app' },
  { id: 't2', type: 'cash_in', senderName: 'Kehinde Adisa (AGT)', senderPhone: '08023456789', recipientName: 'Chioma Eze', recipientPhone: '08098765432', amount: 25000, currency: '₦', status: 'completed', date: '2024-08-12T13:15:00', reference: 'TXN-20240812-002', channel: 'agent' },
  { id: 't3', type: 'bill_payment', senderName: 'Fatimah Bello', senderPhone: '07034567890', recipientName: 'DSTV', recipientPhone: '-', amount: 21000, currency: '₦', status: 'completed', date: '2024-08-12T12:00:00', reference: 'TXN-20240812-003', channel: 'app' },
  { id: 't4', type: 'fund', senderName: 'Bank Transfer', senderPhone: '-', recipientName: 'Emmanuel Nwosu', recipientPhone: '09045678123', amount: 150000, currency: '₦', status: 'pending', date: '2024-08-12T11:45:00', reference: 'TXN-20240812-004', channel: 'app' },
  { id: 't5', type: 'cash_out', senderName: 'Oluwaseun Adeyemi', senderPhone: '07089012345', recipientName: 'Ngozi Uche (AGT)', recipientPhone: '08145678901', amount: 100000, currency: '₦', status: 'failed', date: '2024-08-12T10:30:00', reference: 'TXN-20240812-005', channel: 'agent' },
  { id: 't6', type: 'withdrawal', senderName: 'Amina Yusuf', senderPhone: '08156789012', recipientName: 'GTBank ***4521', recipientPhone: '-', amount: 75000, currency: '₦', status: 'completed', date: '2024-08-12T09:20:00', reference: 'TXN-20240812-006', channel: 'ussd' },
  { id: 't7', type: 'transfer', senderName: 'Ibrahim Musa', senderPhone: '09078901234', recipientName: 'Adebayo Ogunlesi', recipientPhone: '08012345678', amount: 5000, currency: '₦', status: 'completed', date: '2024-08-12T08:10:00', reference: 'TXN-20240812-007', channel: 'ussd' },
];
