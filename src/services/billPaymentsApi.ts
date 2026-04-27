import { apiRequest } from '@/lib/api/http';
import type { BillType } from '@/types';

export interface BillProvider {
  providerId: string;
  name: string;
  billType: BillType;
  accountLabel: string;
  minimumAmount: number;
  currency: string;
}

export interface CreateBillPaymentInput {
  providerId: string;
  accountNumber: string;
  amount: number;
  pin: string;
}

export interface BillPaymentReceipt {
  paymentId: string;
  providerId: string;
  providerName: string;
  billType: BillType;
  accountLabel: string;
  accountNumber: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  createdAtUtc: string;
}

export const billKeys = {
  providers: ['bills', 'providers'] as const,
};

export const getBillProviders = () =>
  apiRequest<BillProvider[]>('/api/bills/providers');

export const createBillPayment = (input: CreateBillPaymentInput) =>
  apiRequest<BillPaymentReceipt>('/api/bills/payments', {
    method: 'POST',
    json: {
      providerId: input.providerId,
      accountNumber: input.accountNumber.trim(),
      amount: input.amount,
      pin: input.pin.trim(),
    },
  });
