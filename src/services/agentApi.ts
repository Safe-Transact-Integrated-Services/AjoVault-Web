import { apiRequest } from '@/lib/api/http';
import { mapIdentityProfileToUser, type AuthResult } from '@/services/authApi';

interface IdentityUserProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  kycTier: 'none' | 'basic' | 'verified' | 'premium';
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
}

interface LoginUserResponse {
  user: IdentityUserProfileResponse;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

interface AgentPortalStateResponse {
  canAccessPortal: boolean;
  profile?: AgentProfile | null;
  application?: AgentApplication | null;
  summary?: AgentOperationalSummary | null;
}

export interface AgentProfile {
  agentUserId: string;
  agentCode: string;
  fullName: string;
  phoneNumber: string;
  tier: 'basic' | 'standard' | 'super';
  status: 'active' | 'suspended';
  state: string;
  lga?: string | null;
  location: string;
  floatBalance: number;
  commissionBalance: number;
  approvedAtUtc: string;
  updatedAtUtc: string;
}

export interface AgentApplication {
  applicationId: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  state: string;
  lga?: string | null;
  location: string;
  idType: 'nin' | 'drivers' | 'voters' | 'passport';
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  submittedAtUtc: string;
  reviewedAtUtc?: string | null;
}

export interface AgentPortalState {
  canAccessPortal: boolean;
  profile: AgentProfile | null;
  application: AgentApplication | null;
  summary: AgentOperationalSummary | null;
}

export interface SubmitAgentApplicationInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  state: string;
  lga?: string;
  location: string;
  idType: AgentApplication['idType'];
}

export interface AgentActivity {
  activityId: string;
  activityType: string;
  status: string;
  description: string;
  reference: string;
  amount: number;
  commissionAmount: number;
  currency: string;
  customerName?: string | null;
  customerPhoneNumber?: string | null;
  createdAtUtc: string;
}

export interface AgentOperationalSummary {
  linkedCustomerCount: number;
  totalActivities: number;
  totalCommissionsEarned: number;
  recentActivities: AgentActivity[];
}

export interface AgentCommissionEntry {
  entryId: string;
  amount: number;
  currency: string;
  status: 'available' | 'settled';
  description: string;
  activityReference?: string | null;
  activityType?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface AgentCommissionOverview {
  availableBalance: number;
  totalEarned: number;
  totalSettled: number;
  items: AgentCommissionEntry[];
}

export interface AgentFloatLedgerEntry {
  entryId: string;
  entryType: 'admin_adjustment' | 'cash_in' | 'cash_out';
  direction: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  reference?: string | null;
  balanceAfter: number;
  createdAtUtc: string;
}

export interface AgentFloatLedgerOverview {
  floatBalance: number;
  items: AgentFloatLedgerEntry[];
}

export interface AgentSettlement {
  settlementId: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  description: string;
  walletBalanceAfter: number;
  commissionBalanceAfter: number;
  createdAtUtc: string;
}

export interface AgentSettlementOverview {
  availableCommissionBalance: number;
  walletBalance: number;
  currency: string;
  items: AgentSettlement[];
}

export interface AgentSettlementReceipt extends AgentSettlement {}

export interface AgentCustomer {
  customerUserId: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  kycTier: 'none' | 'basic' | 'verified' | 'premium';
  isActive: boolean;
  linkType: string;
  linkedAtUtc: string;
  lastActivityAtUtc?: string | null;
  lastActivity?: AgentActivity | null;
}

export interface RegisterAgentCustomerInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  password: string;
  pin: string;
}

export interface RegisterAgentCustomerResponse {
  customer: AgentCustomer;
  temporaryPassword: string;
  temporaryPin: string;
  agentCommissionBalanceAfter: number;
}

export type AgentTransactionType =
  | 'cash_in'
  | 'cash_out'
  | 'transfer'
  | 'bill_payment'
  | 'balance_enquiry'
  | 'mini_statement'
  | 'savings'
  | 'circle'
  | 'group_goal';

export interface CreateAgentAuthorizationInput {
  agentCode: string;
  transactionType: AgentTransactionType;
  amount?: number;
  targetId?: string;
  destinationAccountNumber?: string;
  destinationBankCode?: string;
  destinationBankName?: string;
  reason?: string;
  pin: string;
}

export interface AgentAuthorization {
  authorizationId: string;
  authorizationCode: string;
  transactionType: AgentTransactionType;
  amount: number;
  currency: string;
  agentCode: string;
  agentName: string;
  targetId?: string | null;
  targetName?: string | null;
  targetDescription?: string | null;
  destinationAccountNumber?: string | null;
  destinationAccountName?: string | null;
  destinationBankName?: string | null;
  expiresAtUtc: string;
}

export interface AgentTransactionLookupInput {
  customerIdentifier: string;
  authorizationCode: string;
}

export interface AgentTransactionPreview {
  customerUserId: string;
  customerName: string;
  customerPhoneNumber?: string | null;
  customerEmail?: string | null;
  transactionType: AgentTransactionType;
  targetId?: string | null;
  targetName?: string | null;
  targetDescription?: string | null;
  destinationAccountNumber?: string | null;
  destinationAccountName?: string | null;
  destinationBankName?: string | null;
  amount: number;
  currency: string;
  agentCode: string;
  authorizationCode: string;
  expiresAtUtc: string;
}

export interface AgentStatementItem {
  entryId: string;
  referenceType: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  direction: string;
  status: string;
  createdAtUtc: string;
}

export interface AgentTransactionReceipt {
  transactionType: AgentTransactionType;
  targetName?: string | null;
  targetDescription?: string | null;
  destinationAccountNumber?: string | null;
  destinationAccountName?: string | null;
  destinationBankName?: string | null;
  amount: number;
  currency: string;
  status: string;
  message?: string | null;
  requiresOtp: boolean;
  customerName: string;
  customerPhoneNumber?: string | null;
  agentCode: string;
  reference: string;
  customerBalanceAfter: number;
  agentFloatBalanceAfter: number;
  commissionEarned: number;
  createdAtUtc: string;
  statementItems?: AgentStatementItem[] | null;
}

export interface FinalizeAgentTransferInput {
  customerIdentifier: string;
  reference: string;
  otp: string;
}

export const agentKeys = {
  portal: ['agent', 'portal'] as const,
  customers: ['agent', 'customers'] as const,
  activities: (take = 50) => ['agent', 'activities', take] as const,
  commissions: (take = 100) => ['agent', 'commissions', take] as const,
  ledger: (take = 100) => ['agent', 'ledger', take] as const,
  settlements: (take = 50) => ['agent', 'settlements', take] as const,
};

const mapSession = (response: LoginUserResponse) => ({
  accessToken: response.accessToken,
  accessTokenExpiresAt: response.accessTokenExpiresAtUtc,
  refreshToken: response.refreshToken,
  refreshTokenExpiresAt: response.refreshTokenExpiresAtUtc,
});

const mapPortalState = (response: AgentPortalStateResponse): AgentPortalState => ({
  canAccessPortal: response.canAccessPortal,
  profile: response.profile ?? null,
  application: response.application ?? null,
  summary: response.summary ?? null,
});

export const loginAgent = async (agentCode: string, password: string): Promise<AuthResult> => {
  const response = await apiRequest<LoginUserResponse>('/api/agents/login', {
    method: 'POST',
    auth: false,
    json: {
      agentCode: agentCode.trim().toUpperCase(),
      password,
    },
  });

  return {
    user: mapIdentityProfileToUser(response.user),
    session: mapSession(response),
  };
};

export const getMyAgentPortalState = async (): Promise<AgentPortalState> => {
  const response = await apiRequest<AgentPortalStateResponse>('/api/agents/me');
  return mapPortalState(response);
};

export const submitAgentApplication = async (input: SubmitAgentApplicationInput): Promise<AgentPortalState> => {
  const response = await apiRequest<AgentPortalStateResponse>('/api/agents/applications', {
    method: 'POST',
    json: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      state: input.state.trim(),
      lga: input.lga?.trim() || null,
      location: input.location.trim(),
      idType: input.idType,
    },
  });

  return mapPortalState(response);
};

export const getLinkedAgentCustomers = async (): Promise<AgentCustomer[]> =>
  apiRequest<AgentCustomer[]>('/api/agents/customers');

export const registerAgentCustomer = async (input: RegisterAgentCustomerInput): Promise<RegisterAgentCustomerResponse> =>
  apiRequest<RegisterAgentCustomerResponse>('/api/agents/customers/register', {
    method: 'POST',
    json: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      email: input.email?.trim() || null,
      password: input.password.trim(),
      pin: input.pin.trim(),
    },
  });

export const createAgentAuthorization = async (input: CreateAgentAuthorizationInput): Promise<AgentAuthorization> =>
  apiRequest<AgentAuthorization>('/api/agents/authorizations', {
    method: 'POST',
    json: {
      agentCode: input.agentCode.trim().toUpperCase(),
      transactionType: input.transactionType,
      amount: input.amount,
      targetId: input.targetId,
      destinationAccountNumber: input.destinationAccountNumber?.trim(),
      destinationBankCode: input.destinationBankCode?.trim(),
      destinationBankName: input.destinationBankName?.trim(),
      reason: input.reason?.trim(),
      pin: input.pin.trim(),
    },
  });

export const getAgentActivities = async (take = 50): Promise<AgentActivity[]> =>
  apiRequest<AgentActivity[]>(`/api/agents/activities?take=${encodeURIComponent(String(take))}`);

export const getAgentCommissions = async (take = 100): Promise<AgentCommissionOverview> =>
  apiRequest<AgentCommissionOverview>(`/api/agents/commissions?take=${encodeURIComponent(String(take))}`);

export const getAgentFloatLedger = async (take = 100): Promise<AgentFloatLedgerOverview> =>
  apiRequest<AgentFloatLedgerOverview>(`/api/agents/ledger?take=${encodeURIComponent(String(take))}`);

export const getAgentSettlements = async (take = 50): Promise<AgentSettlementOverview> =>
  apiRequest<AgentSettlementOverview>(`/api/agents/settlements?take=${encodeURIComponent(String(take))}`);

export const settleAgentCommissions = async (): Promise<AgentSettlementReceipt> =>
  apiRequest<AgentSettlementReceipt>('/api/agents/settlements', {
    method: 'POST',
  });

export const previewAgentTransaction = async (input: AgentTransactionLookupInput): Promise<AgentTransactionPreview> =>
  apiRequest<AgentTransactionPreview>('/api/agents/transactions/preview', {
    method: 'POST',
    json: {
      customerIdentifier: input.customerIdentifier.trim(),
      authorizationCode: input.authorizationCode.trim(),
    },
  });

export const executeAgentTransaction = async (input: AgentTransactionLookupInput): Promise<AgentTransactionReceipt> =>
  apiRequest<AgentTransactionReceipt>('/api/agents/transactions', {
    method: 'POST',
    json: {
      customerIdentifier: input.customerIdentifier.trim(),
      authorizationCode: input.authorizationCode.trim(),
    },
  });

export const finalizeAgentTransfer = async (input: FinalizeAgentTransferInput): Promise<AgentTransactionReceipt> =>
  apiRequest<AgentTransactionReceipt>(`/api/agents/transactions/${encodeURIComponent(input.reference)}/finalize`, {
    method: 'POST',
    json: {
      customerIdentifier: input.customerIdentifier.trim(),
      otp: input.otp.trim(),
    },
  });
