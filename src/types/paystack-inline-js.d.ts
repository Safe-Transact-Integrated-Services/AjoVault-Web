declare module '@paystack/inline-js' {
  export interface PaystackTransactionLoadData {
    id: number;
    customer: Record<string, unknown>;
    accessCode: string;
  }

  export interface PaystackTransactionSuccessData {
    id: number;
    reference: string;
    message: string;
  }

  export interface PaystackTransactionErrorData {
    message: string;
  }

  export interface PaystackCallbacks {
    onLoad?: (response: PaystackTransactionLoadData) => void;
    onSuccess?: (response: PaystackTransactionSuccessData) => void;
    onCancel?: () => void;
    onError?: (error: PaystackTransactionErrorData) => void;
  }

  export default class PaystackPop {
    resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): unknown;
  }
}
