import { apiRequest } from '@/lib/api/http';

interface FundraiserSummaryResponse {
  fundraiserId: string;
  title: string;
  description?: string | null;
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

interface FundraiserDetailResponse extends FundraiserSummaryResponse {
  story: string;
  canDonateWithWallet: boolean;
  canDonateWithPaystack: boolean;
  recentDonors: FundraiserDonorResponse[];
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

export interface FundraiserSummary {
  id: string;
  title: string;
  description?: string;
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

export interface FundraiserDetail extends FundraiserSummary {
  story: string;
  canDonateWithWallet: boolean;
  canDonateWithPaystack: boolean;
  recentDonors: FundraiserDonor[];
}

export interface CreateFundraiserInput {
  title: string;
  description?: string;
  story: string;
  category: string;
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
      story: input.story.trim(),
      category: input.category,
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

const mapSummary = (response: FundraiserSummaryResponse): FundraiserSummary => ({
  id: response.fundraiserId,
  title: response.title,
  description: response.description ?? undefined,
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
  canDonateWithWallet: response.canDonateWithWallet,
  canDonateWithPaystack: response.canDonateWithPaystack,
  recentDonors: response.recentDonors.map(donor => ({
    id: donor.donationId,
    name: donor.name,
    amount: donor.amount,
    date: donor.date,
    isAnonymous: donor.isAnonymous,
    fundingSource: donor.fundingSource,
  })),
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
