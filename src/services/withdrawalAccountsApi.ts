import { apiRequest } from '@/lib/api/http';

export interface WithdrawalAccount {
  accountId: string;
  accountName: string;
  accountNumberMasked: string;
  bankCode: string;
  bankName: string;
  currency: string;
  isActive: boolean;
  verifiedAtUtc: string;
  createdAtUtc: string;
}

export interface SaveWithdrawalAccountInput {
  accountNumber: string;
  bankCode: string;
  bankName?: string;
  currency?: string;
  makeActive?: boolean;
}

export const withdrawalAccountKeys = {
  me: ['identity', 'me', 'withdrawal-accounts'] as const,
};

export const getMyWithdrawalAccounts = () =>
  apiRequest<WithdrawalAccount[]>('/api/identity/me/withdrawal-accounts');

export const saveMyWithdrawalAccount = (input: SaveWithdrawalAccountInput) =>
  apiRequest<WithdrawalAccount>('/api/identity/me/withdrawal-accounts', {
    method: 'POST',
    json: {
      accountNumber: input.accountNumber.trim(),
      bankCode: input.bankCode,
      bankName: input.bankName?.trim() || undefined,
      currency: input.currency ?? 'NGN',
      makeActive: input.makeActive ?? undefined,
    },
  });

export const activateMyWithdrawalAccount = (accountId: string) =>
  apiRequest<WithdrawalAccount>(`/api/identity/me/withdrawal-accounts/${encodeURIComponent(accountId)}/activate`, {
    method: 'PATCH',
    json: {
      isActive: true,
    },
  });

export const deleteMyWithdrawalAccount = (accountId: string) =>
  apiRequest<{ message: string }>(`/api/identity/me/withdrawal-accounts/${encodeURIComponent(accountId)}`, {
    method: 'DELETE',
  });
