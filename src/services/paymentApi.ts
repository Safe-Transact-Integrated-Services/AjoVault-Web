import { apiRequest } from '@/lib/api/http';

export interface InitializePaymentCheckoutInput {
  amount: number;
  currency?: string;
  email?: string;
  purpose?: string;
}

export interface QuoteWalletFundingInput {
  amount: number;
  currency?: string;
}

export interface WalletFundingQuoteResponse {
  fundingAmount: number;
  serviceFee: number;
  processorFeeEstimate: number;
  totalCharge: number;
  currency: string;
  feeMode: string;
}

export interface InitializePaymentCheckoutResponse {
  checkoutId: string;
  provider: string;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  amount: number;
  fundingAmount: number;
  serviceFee: number;
  processorFeeEstimate: number;
  totalCharge: number;
  currency: string;
  status: string;
  customerEmail: string;
  purpose: string;
  feeMode: string;
}

export interface PaymentCheckoutStatusResponse {
  checkoutId: string;
  provider: string;
  reference: string;
  amount: number;
  fundingAmount: number;
  serviceFee: number;
  processorFeeEstimate: number;
  totalCharge: number;
  currency: string;
  status: string;
  purpose: string;
  customerEmail: string;
  createdAtUtc: string;
  paidAtUtc?: string | null;
  gatewayResponse?: string | null;
  feeMode: string;
}

export interface PayoutBank {
  code: string;
  name: string;
  slug?: string | null;
  active: boolean;
}

export interface ResolveTransferAccountInput {
  accountNumber: string;
  bankCode: string;
  bankName?: string;
  currency?: string;
}

export interface ResolveTransferAccountResponse {
  provider: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  currency: string;
}

export interface CreateWalletTransferInput {
  amount: number;
  currency?: string;
  reason?: string;
  pin: string;
  provider?: string;
}

export interface QuoteTransferInput {
  amount: number;
  currency?: string;
}

export interface TransferQuoteResponse {
  amount: number;
  serviceFee: number;
  stampDuty: number;
  totalDebit: number;
  currency: string;
}

export interface CreateTransferResponse {
  transferId: string;
  reference: string;
  amount: number;
  serviceFee: number;
  stampDuty: number;
  totalDebit: number;
  currency: string;
  provider: string;
  status: string;
  destinationAccountName: string;
  destinationAccountNumber: string;
  destinationBankName: string;
  providerTransferCode?: string | null;
  requiresOtp: boolean;
  message?: string | null;
  createdAtUtc: string;
  completedAtUtc?: string | null;
}

export interface TransferStatusResponse extends CreateTransferResponse {
  destinationBankCode: string;
  reason?: string | null;
  updatedAtUtc: string;
}

export interface FinalizeWalletTransferInput {
  reference: string;
  otp: string;
}

export const quoteWalletFunding = (input: QuoteWalletFundingInput) =>
  apiRequest<WalletFundingQuoteResponse>('/api/payments/checkout/quote', {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
    },
  });

export const initializePaymentCheckout = (input: InitializePaymentCheckoutInput) =>
  apiRequest<InitializePaymentCheckoutResponse>('/api/payments/checkout/initialize', {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
      email: input.email?.trim() || undefined,
      purpose: input.purpose ?? 'wallet_fund',
    },
  });

export const getPaymentCheckoutStatus = (reference: string) =>
  apiRequest<PaymentCheckoutStatusResponse>(`/api/payments/checkout/${encodeURIComponent(reference)}`);

export const getPayoutBanks = () =>
  apiRequest<PayoutBank[]>('/api/payments/banks');

export const resolveTransferAccount = (input: ResolveTransferAccountInput) =>
  apiRequest<ResolveTransferAccountResponse>('/api/payments/transfers/resolve-account', {
    method: 'POST',
    json: {
      accountNumber: input.accountNumber.trim(),
      bankCode: input.bankCode,
      bankName: input.bankName?.trim() || undefined,
      currency: input.currency ?? 'NGN',
    },
  });

export const quoteWalletTransfer = (input: QuoteTransferInput) =>
  apiRequest<TransferQuoteResponse>('/api/payments/transfers/quote', {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
    },
  });

export const createWalletTransfer = (input: CreateWalletTransferInput) =>
  apiRequest<CreateTransferResponse>('/api/payments/transfers', {
    method: 'POST',
    json: {
      amount: input.amount,
      currency: input.currency ?? 'NGN',
      reason: input.reason?.trim() || undefined,
      pin: input.pin,
      provider: input.provider ?? 'Paystack',
    },
  });

export const getTransferStatus = (reference: string) =>
  apiRequest<TransferStatusResponse>(`/api/payments/transfers/${encodeURIComponent(reference)}`);

export const finalizeWalletTransfer = (input: FinalizeWalletTransferInput) =>
  apiRequest<TransferStatusResponse>(`/api/payments/transfers/${encodeURIComponent(input.reference)}/finalize`, {
    method: 'POST',
    json: {
      otp: input.otp.trim(),
    },
  });
