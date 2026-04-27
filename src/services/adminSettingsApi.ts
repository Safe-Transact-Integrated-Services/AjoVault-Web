import { apiRequest } from '@/lib/api/http';

export interface AgentOperationSettings {
  settingsId: string;
  maxSingleTransactionAmount: number;
  basicKycDailyTransferLimit: number;
  verifiedKycDailyTransferLimit: number;
  premiumKycDailyTransferLimit: number;
  transferFeeBandOneMax: number;
  transferFeeBandOneAmount: number;
  transferFeeBandTwoMax: number;
  transferFeeBandTwoAmount: number;
  transferFeeBandThreeAmount: number;
  transferStampDutyThreshold: number;
  transferStampDutyAmount: number;
  transferPassStampDutyToUser: boolean;
  cashInCommissionRate: number;
  cashOutCommissionRate: number;
  transferAssistedServiceFeeRate: number;
  billPaymentCommissionRate: number;
  balanceEnquiryFee: number;
  miniStatementFee: number;
  agentCommissionShareRate: number;
  platformCommissionShareRate: number;
  registrationBonusAmount: number;
  campaignDefaultTipRate: number;
  campaignAllowCustomTip: boolean;
  campaignEnableCoverFees: boolean;
  campaignWithdrawalFeeRate: number;
  campaignWithdrawalFeeCap: number;
  walletFundingCheckoutProvider: string;
  walletFundingTransferAccountProvider: string;
  walletFundingCheckoutFeeMode: string;
  walletFundingCheckoutMarkupRate: number;
  walletFundingTransferAccountFeeMode: string;
  paymentProcessorRate: number;
  paymentProcessorFlatFee: number;
  paymentProcessorFlatFeeThreshold: number;
  paymentProcessorFeeCap: number;
  updatedAtUtc: string;
}

export interface UpdateAgentOperationSettingsInput {
  maxSingleTransactionAmount: number;
  basicKycDailyTransferLimit: number;
  verifiedKycDailyTransferLimit: number;
  premiumKycDailyTransferLimit: number;
  transferFeeBandOneMax: number;
  transferFeeBandOneAmount: number;
  transferFeeBandTwoMax: number;
  transferFeeBandTwoAmount: number;
  transferFeeBandThreeAmount: number;
  transferStampDutyThreshold: number;
  transferStampDutyAmount: number;
  transferPassStampDutyToUser: boolean;
  cashInCommissionRate: number;
  cashOutCommissionRate: number;
  transferAssistedServiceFeeRate: number;
  billPaymentCommissionRate: number;
  balanceEnquiryFee: number;
  miniStatementFee: number;
  agentCommissionShareRate: number;
  platformCommissionShareRate: number;
  registrationBonusAmount: number;
  campaignDefaultTipRate: number;
  campaignAllowCustomTip: boolean;
  campaignEnableCoverFees: boolean;
  campaignWithdrawalFeeRate: number;
  campaignWithdrawalFeeCap: number;
  walletFundingCheckoutProvider: string;
  walletFundingTransferAccountProvider: string;
  walletFundingCheckoutFeeMode: string;
  walletFundingCheckoutMarkupRate: number;
  walletFundingTransferAccountFeeMode: string;
  paymentProcessorRate: number;
  paymentProcessorFlatFee: number;
  paymentProcessorFlatFeeThreshold: number;
  paymentProcessorFeeCap: number;
}

const AGENT_OPERATION_SETTINGS_PATH = '/api/agents/admin/settings/operations';

export const getAdminAgentOperationSettings = () =>
  apiRequest<AgentOperationSettings>(AGENT_OPERATION_SETTINGS_PATH);

export const updateAdminAgentOperationSettings = (input: UpdateAgentOperationSettingsInput) =>
  apiRequest<AgentOperationSettings>(AGENT_OPERATION_SETTINGS_PATH, {
    method: 'PUT',
    json: input,
  });
