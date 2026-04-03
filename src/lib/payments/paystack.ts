export interface PaystackCheckoutSuccessResult {
  id: number;
  reference: string;
  message: string;
}

export class PaystackCheckoutCancelledError extends Error {
  constructor() {
    super('Paystack checkout was cancelled.');
    this.name = 'PaystackCheckoutCancelledError';
  }
}

export const resumePaystackTransaction = async (accessCode: string): Promise<PaystackCheckoutSuccessResult> => {
  const { default: PaystackPop } = await import('@paystack/inline-js');

  return new Promise((resolve, reject) => {
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: response => resolve(response),
      onCancel: () => reject(new PaystackCheckoutCancelledError()),
      onError: error => reject(new Error(error.message || 'Unable to open Paystack checkout.')),
    });
  });
};
