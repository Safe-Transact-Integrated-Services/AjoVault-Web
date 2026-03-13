import { apiRequest } from '@/lib/api/http';
import type { Transaction, WalletBalance } from '@/types';

interface WalletResponse {
  walletId: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  status: string;
  virtualAccount?: WalletVirtualAccountResponse | null;
}

interface LedgerEntryResponse {
  entryId: string;
  walletId: string;
  referenceType: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  direction: string;
  status: string;
  balanceAfter: number;
  reference?: string | null;
  createdAt: string;
}

interface WalletVirtualAccountResponse {
  provider: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  currency: string;
  status: string;
}

export interface WalletSummary extends WalletBalance {
  walletId: string;
  status: string;
  virtualAccount?: WalletVirtualAccount | null;
}

export interface WalletVirtualAccount {
  provider: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  currency: string;
  status: string;
}

export const walletKeys = {
  me: ['wallet', 'me'] as const,
  ledger: ['wallet', 'ledger'] as const,
};

export const getMyWallet = async (): Promise<WalletSummary> => {
  const response = await apiRequest<WalletResponse>('/api/wallets/me');

  return {
    walletId: response.walletId,
    available: response.availableBalance,
    pending: response.pendingBalance,
    currency: response.currency,
    status: response.status,
    virtualAccount: response.virtualAccount ? mapVirtualAccount(response.virtualAccount) : null,
  };
};

export const getWalletTransactions = async (): Promise<Transaction[]> => {
  const response = await apiRequest<LedgerEntryResponse[]>('/api/transactions/ledger');
  return response.map(mapLedgerEntryToTransaction);
};

export const ensureWalletVirtualAccount = async (): Promise<WalletVirtualAccount> => {
  const response = await apiRequest<WalletVirtualAccountResponse>('/api/wallets/me/virtual-account', {
    method: 'POST',
  });

  return mapVirtualAccount(response);
};

const mapLedgerEntryToTransaction = (entry: LedgerEntryResponse): Transaction => ({
  id: entry.entryId,
  type: entry.direction.toLowerCase() === 'debit' ? 'debit' : 'credit',
  category: normalizeCategory(entry.category),
  amount: entry.amount,
  currency: entry.currency,
  description: entry.description,
  status: normalizeStatus(entry.status),
  date: entry.createdAt,
  reference: entry.reference ?? entry.referenceType,
});

const normalizeCategory = (category: string): Transaction['category'] => {
  switch (category.trim().toLowerCase()) {
    case 'transfer':
      return 'transfer';
    case 'savings':
      return 'savings';
    case 'circle':
      return 'circle';
    case 'group_goal':
      return 'group_goal';
    case 'fundraising':
      return 'fundraising';
    case 'airtime':
      return 'airtime';
    case 'data':
      return 'data';
    case 'electricity':
      return 'electricity';
    case 'cable':
      return 'cable';
    case 'withdrawal':
      return 'withdrawal';
    default:
      return 'fund';
  }
};

const normalizeStatus = (status: string): Transaction['status'] => {
  switch (status.trim().toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'failed':
      return 'failed';
    default:
      return 'completed';
  }
};

const mapVirtualAccount = (account: WalletVirtualAccountResponse): WalletVirtualAccount => ({
  provider: account.provider,
  accountNumber: account.accountNumber,
  accountName: account.accountName,
  bankName: account.bankName,
  currency: account.currency,
  status: account.status,
});
