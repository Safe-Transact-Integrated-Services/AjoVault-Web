import { apiRequest } from '@/lib/api/http';

interface FundraiserSummaryResponse {
  fundraiserId: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  deadline: string;
  status: string;
  isPublic: boolean;
  creatorName: string;
  donorCount: number;
  shareCode: string;
  progressPercent: number;
  canManage: boolean;
  createdAtUtc: string;
}

interface FundraiserDonorResponse {
  donationId: string;
  name: string;
  amount: number;
  date: string;
  isAnonymous: boolean;
  fundingSource: string;
}

interface FundraiserUpdateSummaryResponse {
  updateId: string;
  title: string;
  message: string;
  createdAtUtc: string;
}

interface FundraiserDetailResponse extends FundraiserSummaryResponse {
  story: string;
  typeDetails: Record<string, string>;
  canDonateWithWallet: boolean;
  canDonateWithPaystack: boolean;
  beneficiaryVerified: boolean;
  withdrawnAmount: number;
  recentDonors: FundraiserDonorResponse[];
  recentUpdates: FundraiserUpdateSummaryResponse[];
}

interface FundraiserCheckoutResponse {
  checkoutId: string;
  fundraiserId: string;
  fundraiserTitle: string;
  shareCode: string;
  provider: string;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  purpose: string;
}

interface FundraiserCheckoutStatusResponse {
  checkoutId: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  fundraiserId?: string | null;
  createdAtUtc: string;
  paidAtUtc?: string | null;
  gatewayResponse?: string | null;
}

interface FundraiserDonationResponse {
  donationId: string;
  fundraiserId: string;
  amount: number;
  currency: string;
  fundingSource: string;
  status: string;
  reference: string;
  isAnonymous: boolean;
  donorName?: string | null;
  customerEmail?: string | null;
  walletBalanceAfter?: number | null;
  fundraiserBalanceAfter: number;
  fundraiserStatus: string;
  createdAtUtc: string;
}

interface FundraiserInviteResponse {
  fundraiserId: string;
  userId?: string | null;
  channel: 'platform' | 'email' | 'sms';
  inviteLink: string;
}

interface FundraiserBeneficiaryResponse {
  fundraiserId: string;
  isVerified: boolean;
  beneficiaryName?: string | null;
  accountName?: string | null;
  accountNumberMasked?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  verifiedAtUtc?: string | null;
}

interface FundraiserWithdrawalResponse {
  withdrawalId: string;
  fundraiserId: string;
  amount: number;
  currency: string;
  reference: string;
  provider: string;
  status: string;
  beneficiaryName: string;
  destinationAccountName: string;
  destinationAccountNumberMasked?: string | null;
  destinationBankName: string;
  providerTransferCode?: string | null;
  requiresOtp: boolean;
  message?: string | null;
  availableBalanceAfter: number;
  withdrawnAmount: number;
  createdAtUtc: string;
  completedAtUtc?: string | null;
}

interface FundraiserManagementResponse {
  fundraiserId: string;
  title: string;
  coverImageUrl?: string | null;
  raisedAmount: number;
  availableBalance: number;
  pendingWithdrawalAmount: number;
  withdrawnAmount: number;
  beneficiary: FundraiserBeneficiaryResponse;
  updates: FundraiserUpdateSummaryResponse[];
  withdrawals: FundraiserWithdrawalResponse[];
}

export interface FundraiserSummary {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  deadline: string;
  status: string;
  isPublic: boolean;
  creatorName: string;
  donorCount: number;
  shareCode: string;
  progressPercent: number;
  canManage: boolean;
  createdAt: string;
}

export interface FundraiserDonor {
  id: string;
  name: string;
  amount: number;
  date: string;
  isAnonymous: boolean;
  fundingSource: string;
}

export interface FundraiserUpdate {
  id: string;
  title: string;
  message: string;
  createdAtUtc: string;
}

export interface FundraiserDetail extends FundraiserSummary {
  story: string;
  typeDetails: Record<string, string>;
  canDonateWithWallet: boolean;
  canDonateWithPaystack: boolean;
  beneficiaryVerified: boolean;
  withdrawnAmount: number;
  recentDonors: FundraiserDonor[];
  recentUpdates: FundraiserUpdate[];
}

export interface CreateFundraiserInput {
  title: string;
  description?: string;
  coverImageUrl?: string;
  story: string;
  category: string;
  typeDetails?: Record<string, string>;
  targetAmount: number;
  deadline: string;
  isPublic: boolean;
  currency?: string;
}

export interface FundraiserWalletDonationInput {
  amount: number;
  currency?: string;
  isAnonymous: boolean;
  donorName?: string;
  pin: string;
}

export interface InitializeFundraiserCheckoutInput {
  amount: number;
  currency?: string;
  email?: string;
  isAnonymous: boolean;
  donorName?: string;
}

export interface SendFundraiserInviteInput {
  fundraiserId: string;
  channel: 'platform' | 'email' | 'sms';
  platformUserId?: string;
  memberContact?: string;
}

export interface FundraiserInviteResult {
  fundraiserId: string;
  userId?: string;
  channel: 'platform' | 'email' | 'sms';
  inviteLink: string;
}

export interface SaveFundraiserBeneficiaryInput {
  beneficiaryName: string;
  accountNumber: string;
  bankCode: string;
  bankName?: string;
  email?: string;
  phoneNumber?: string;
  currency?: string;
}

export interface FundraiserBeneficiary {
  fundraiserId: string;
  isVerified: boolean;
  beneficiaryName?: string;
  accountName?: string;
  accountNumberMasked?: string;
  bankCode?: string;
  bankName?: string;
  email?: string;
  phoneNumber?: string;
  verifiedAtUtc?: string;
}

export interface CreateFundraiserUpdateInput {
  title: string;
  message: string;
}

export interface CreateFundraiserWithdrawalInput {
  amount: number;
  currency?: string;
  reason?: string;
  pin: string;
}

export interface FinalizeFundraiserWithdrawalInput {
  fundraiserId: string;
  reference: string;
  otp: string;
}

export interface FundraiserWithdrawal {
  withdrawalId: string;
  fundraiserId: string;
  amount: number;
  currency: string;
  reference: string;
  provider: string;
  status: string;
  beneficiaryName: string;
  destinationAccountName: string;
  destinationAccountNumberMasked?: string;
  destinationBankName: string;
  providerTransferCode?: string;
  requiresOtp: boolean;
  message?: string;
  availableBalanceAfter: number;
  withdrawnAmount: number;
  createdAtUtc: string;
  completedAtUtc?: string;
}

export interface FundraiserManagement {
  fundraiserId: string;
  title: string;
  coverImageUrl?: string;
  raisedAmount: number;
  availableBalance: number;
  pendingWithdrawalAmount: number;
  withdrawnAmount: number;
  beneficiary: FundraiserBeneficiary;
  updates: FundraiserUpdate[];
  withdrawals: FundraiserWithdrawal[];
}

export interface FundraiserDonationResult {
  donationId: string;
  fundraiserId: string;
  amount: number;
  currency: string;
  fundingSource: string;
  status: string;
  reference: string;
  isAnonymous: boolean;
  donorName?: string;
  customerEmail?: string;
  walletBalanceAfter?: number | null;
  fundraiserBalanceAfter: number;
  fundraiserStatus: string;
  createdAtUtc: string;
}

export interface FundraiserCheckoutResult {
  checkoutId: string;
  fundraiserId: string;
  fundraiserTitle: string;
  shareCode: string;
  provider: string;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  purpose: string;
}

export interface FundraiserCheckoutStatus {
  checkoutId: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  fundraiserId?: string | null;
  createdAtUtc: string;
  paidAtUtc?: string | null;
  gatewayResponse?: string | null;
}

export const fundraisingKeys = {
  list: ['fundraising', 'list'] as const,
  detail: (id: string) => ['fundraising', 'detail', id] as const,
  share: (code: string) => ['fundraising', 'share', code] as const,
  manage: (id: string) => ['fundraising', 'manage', id] as const,
};

export const getFundraisers = async (): Promise<FundraiserSummary[]> => {
  const response = await apiRequest<FundraiserSummaryResponse[]>('/api/fundraisers');
  return response.map(mapSummary);
};

export const getFundraiser = async (id: string): Promise<FundraiserDetail> => {
  const response = await apiRequest<FundraiserDetailResponse>(`/api/fundraisers/${encodeURIComponent(id)}`);
  return mapDetail(response);
};

export const getFundraiserByShareCode = async (code: string): Promise<FundraiserDetail> => {
  const response = await apiRequest<FundraiserDetailResponse>(`/api/fundraisers/share/${encodeURIComponent(code)}`);
  return mapDetail(response);
};

export const createFundraiser = async (input: CreateFundraiserInput): Promise<FundraiserDetail> => {
  const response = await apiRequest<FundraiserDetailResponse>('/api/fundraisers', {
    method: 'POST',
    json: {
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      coverImageUrl: input.coverImageUrl || undefined,
      story: input.story.trim(),
      category: input.category,
      typeDetails: input.typeDetails ?? {},
      targetAmount: input.targetAmount,
      deadline: input.deadline,
      isPublic: input.isPublic,
      currency: input.currency ?? 'NGN',
    },
  });

  return mapDetail(response);
};

export const donateToFundraiserFromWallet = async (
  id: string,
  input: FundraiserWalletDonationInput,
): Promise<FundraiserDonationResult> => {
  const response = await apiRequest<FundraiserDonationResponse>(`/api/fundraisers/${encodeURIComponent(id)}/wallet-donations`, {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
      isAnonymous: input.isAnonymous,
      donorName: input.donorName?.trim() || undefined,
      pin: input.pin,
    },
  });

  return mapDonation(response);
};

export const initializeFundraiserCheckout = async (
  id: string,
  input: InitializeFundraiserCheckoutInput,
): Promise<FundraiserCheckoutResult> => {
  const response = await apiRequest<FundraiserCheckoutResponse>(`/api/fundraisers/${encodeURIComponent(id)}/checkout/initialize`, {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
      email: input.email?.trim() || undefined,
      isAnonymous: input.isAnonymous,
      donorName: input.donorName?.trim() || undefined,
    },
  });

  return mapCheckout(response);
};

export const initializeFundraiserCheckoutByShareCode = async (
  code: string,
  input: InitializeFundraiserCheckoutInput,
): Promise<FundraiserCheckoutResult> => {
  const response = await apiRequest<FundraiserCheckoutResponse>(`/api/fundraisers/share/${encodeURIComponent(code)}/checkout/initialize`, {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
      email: input.email?.trim() || undefined,
      isAnonymous: input.isAnonymous,
      donorName: input.donorName?.trim() || undefined,
    },
  });

  return mapCheckout(response);
};

export const getFundraiserCheckoutStatus = async (reference: string): Promise<FundraiserCheckoutStatus> => {
  const response = await apiRequest<FundraiserCheckoutStatusResponse>(`/api/fundraisers/checkouts/${encodeURIComponent(reference)}`);
  return {
    checkoutId: response.checkoutId,
    reference: response.reference,
    amount: response.amount,
    currency: response.currency,
    status: response.status,
    customerEmail: response.customerEmail,
    fundraiserId: response.fundraiserId ?? undefined,
    createdAtUtc: response.createdAtUtc,
    paidAtUtc: response.paidAtUtc ?? undefined,
    gatewayResponse: response.gatewayResponse ?? undefined,
  };
};

export const sendFundraiserInvite = async (input: SendFundraiserInviteInput): Promise<FundraiserInviteResult> => {
  const response = await apiRequest<FundraiserInviteResponse>(`/api/fundraisers/${encodeURIComponent(input.fundraiserId)}/invites`, {
    method: 'POST',
    json: {
      platformUserId: input.platformUserId,
      memberContact: input.memberContact?.trim() || undefined,
      channel: input.channel,
    },
  });

  return {
    fundraiserId: response.fundraiserId,
    userId: response.userId ?? undefined,
    channel: response.channel,
    inviteLink: response.inviteLink,
  };
};

export const getFundraiserManagement = async (id: string): Promise<FundraiserManagement> => {
  const response = await apiRequest<FundraiserManagementResponse>(`/api/fundraisers/${encodeURIComponent(id)}/management`);
  return {
    fundraiserId: response.fundraiserId,
    title: response.title,
    coverImageUrl: response.coverImageUrl ?? undefined,
    raisedAmount: response.raisedAmount,
    availableBalance: response.availableBalance,
    pendingWithdrawalAmount: response.pendingWithdrawalAmount,
    withdrawnAmount: response.withdrawnAmount,
    beneficiary: mapBeneficiary(response.beneficiary),
    updates: response.updates.map(mapUpdate),
    withdrawals: response.withdrawals.map(mapWithdrawal),
  };
};

export const saveFundraiserBeneficiary = async (
  id: string,
  input: SaveFundraiserBeneficiaryInput,
): Promise<FundraiserBeneficiary> => {
  const response = await apiRequest<FundraiserBeneficiaryResponse>(`/api/fundraisers/${encodeURIComponent(id)}/beneficiary`, {
    method: 'POST',
    json: {
      beneficiaryName: input.beneficiaryName.trim(),
      accountNumber: input.accountNumber.trim(),
      bankCode: input.bankCode,
      bankName: input.bankName?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phoneNumber: input.phoneNumber?.trim() || undefined,
      currency: input.currency ?? 'NGN',
    },
  });

  return mapBeneficiary(response);
};

export const createFundraiserUpdate = async (
  id: string,
  input: CreateFundraiserUpdateInput,
): Promise<FundraiserUpdate> => {
  const response = await apiRequest<FundraiserUpdateSummaryResponse>(`/api/fundraisers/${encodeURIComponent(id)}/updates`, {
    method: 'POST',
    json: {
      title: input.title.trim(),
      message: input.message.trim(),
    },
  });

  return mapUpdate(response);
};

export const createFundraiserWithdrawal = async (
  id: string,
  input: CreateFundraiserWithdrawalInput,
): Promise<FundraiserWithdrawal> => {
  const response = await apiRequest<FundraiserWithdrawalResponse>(`/api/fundraisers/${encodeURIComponent(id)}/withdrawals`, {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
      reason: input.reason?.trim() || undefined,
      pin: input.pin,
    },
  });

  return mapWithdrawal(response);
};

export const finalizeFundraiserWithdrawal = async (
  input: FinalizeFundraiserWithdrawalInput,
): Promise<FundraiserWithdrawal> => {
  const response = await apiRequest<FundraiserWithdrawalResponse>(
    `/api/fundraisers/${encodeURIComponent(input.fundraiserId)}/withdrawals/${encodeURIComponent(input.reference)}/finalize`,
    {
      method: 'POST',
      json: {
        otp: input.otp.trim(),
      },
    },
  );

  return mapWithdrawal(response);
};

const mapSummary = (response: FundraiserSummaryResponse): FundraiserSummary => ({
  id: response.fundraiserId,
  title: response.title,
  description: response.description ?? undefined,
  coverImageUrl: response.coverImageUrl ?? undefined,
  category: response.category,
  targetAmount: response.targetAmount,
  raisedAmount: response.raisedAmount,
  currency: response.currency,
  deadline: response.deadline,
  status: response.status,
  isPublic: response.isPublic,
  creatorName: response.creatorName,
  donorCount: response.donorCount,
  shareCode: response.shareCode,
  progressPercent: response.progressPercent,
  canManage: response.canManage,
  createdAt: response.createdAtUtc,
});

const mapDetail = (response: FundraiserDetailResponse): FundraiserDetail => ({
  ...mapSummary(response),
  story: response.story,
  typeDetails: response.typeDetails ?? {},
  canDonateWithWallet: response.canDonateWithWallet,
  canDonateWithPaystack: response.canDonateWithPaystack,
  beneficiaryVerified: response.beneficiaryVerified,
  withdrawnAmount: response.withdrawnAmount,
  recentDonors: response.recentDonors.map(donor => ({
    id: donor.donationId,
    name: donor.name,
    amount: donor.amount,
    date: donor.date,
    isAnonymous: donor.isAnonymous,
    fundingSource: donor.fundingSource,
  })),
  recentUpdates: response.recentUpdates.map(mapUpdate),
});

const mapDonation = (response: FundraiserDonationResponse): FundraiserDonationResult => ({
  donationId: response.donationId,
  fundraiserId: response.fundraiserId,
  amount: response.amount,
  currency: response.currency,
  fundingSource: response.fundingSource,
  status: response.status,
  reference: response.reference,
  isAnonymous: response.isAnonymous,
  donorName: response.donorName ?? undefined,
  customerEmail: response.customerEmail ?? undefined,
  walletBalanceAfter: response.walletBalanceAfter ?? undefined,
  fundraiserBalanceAfter: response.fundraiserBalanceAfter,
  fundraiserStatus: response.fundraiserStatus,
  createdAtUtc: response.createdAtUtc,
});

const mapCheckout = (response: FundraiserCheckoutResponse): FundraiserCheckoutResult => ({
  checkoutId: response.checkoutId,
  fundraiserId: response.fundraiserId,
  fundraiserTitle: response.fundraiserTitle,
  shareCode: response.shareCode,
  provider: response.provider,
  reference: response.reference,
  accessCode: response.accessCode,
  authorizationUrl: response.authorizationUrl,
  amount: response.amount,
  currency: response.currency,
  status: response.status,
  customerEmail: response.customerEmail,
  purpose: response.purpose,
});

const mapUpdate = (response: FundraiserUpdateSummaryResponse): FundraiserUpdate => ({
  id: response.updateId,
  title: response.title,
  message: response.message,
  createdAtUtc: response.createdAtUtc,
});

const mapBeneficiary = (response: FundraiserBeneficiaryResponse): FundraiserBeneficiary => ({
  fundraiserId: response.fundraiserId,
  isVerified: response.isVerified,
  beneficiaryName: response.beneficiaryName ?? undefined,
  accountName: response.accountName ?? undefined,
  accountNumberMasked: response.accountNumberMasked ?? undefined,
  bankCode: response.bankCode ?? undefined,
  bankName: response.bankName ?? undefined,
  email: response.email ?? undefined,
  phoneNumber: response.phoneNumber ?? undefined,
  verifiedAtUtc: response.verifiedAtUtc ?? undefined,
});

const mapWithdrawal = (response: FundraiserWithdrawalResponse): FundraiserWithdrawal => ({
  withdrawalId: response.withdrawalId,
  fundraiserId: response.fundraiserId,
  amount: response.amount,
  currency: response.currency,
  reference: response.reference,
  provider: response.provider,
  status: response.status,
  beneficiaryName: response.beneficiaryName,
  destinationAccountName: response.destinationAccountName,
  destinationAccountNumberMasked: response.destinationAccountNumberMasked ?? undefined,
  destinationBankName: response.destinationBankName,
  providerTransferCode: response.providerTransferCode ?? undefined,
  requiresOtp: response.requiresOtp,
  message: response.message ?? undefined,
  availableBalanceAfter: response.availableBalanceAfter,
  withdrawnAmount: response.withdrawnAmount,
  createdAtUtc: response.createdAtUtc,
  completedAtUtc: response.completedAtUtc ?? undefined,
});
