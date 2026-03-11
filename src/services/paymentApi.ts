import { apiRequest } from '@/lib/api/http';

export interface InitializePaymentCheckoutInput {
  amount: number;
  currency?: string;
  email?: string;
  purpose?: string;
}

export interface InitializePaymentCheckoutResponse {
  checkoutId: string;
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

export interface PaymentCheckoutStatusResponse {
  checkoutId: string;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  customerEmail: string;
  createdAtUtc: string;
  paidAtUtc?: string | null;
  gatewayResponse?: string | null;
}

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
