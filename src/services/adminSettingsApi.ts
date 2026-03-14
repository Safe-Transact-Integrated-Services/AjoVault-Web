import { apiRequest } from '@/lib/api/http';

export interface AgentOperationSettings {
  settingsId: string;
  maxSingleTransactionAmount: number;
  basicKycDailyTransferLimit: number;
  verifiedKycDailyTransferLimit: number;
  premiumKycDailyTransferLimit: number;
  cashInCommissionRate: number;
  cashOutCommissionRate: number;
  billPaymentCommissionRate: number;
  registrationBonusAmount: number;
  updatedAtUtc: string;
}

export interface UpdateAgentOperationSettingsInput {
  maxSingleTransactionAmount: number;
  basicKycDailyTransferLimit: number;
  verifiedKycDailyTransferLimit: number;
  premiumKycDailyTransferLimit: number;
  cashInCommissionRate: number;
  cashOutCommissionRate: number;
  billPaymentCommissionRate: number;
  registrationBonusAmount: number;
}

const AGENT_OPERATION_SETTINGS_PATH = '/api/agents/admin/settings/operations';

export const getAdminAgentOperationSettings = () =>
  apiRequest<AgentOperationSettings>(AGENT_OPERATION_SETTINGS_PATH);

export const updateAdminAgentOperationSettings = (input: UpdateAgentOperationSettingsInput) =>
  apiRequest<AgentOperationSettings>(AGENT_OPERATION_SETTINGS_PATH, {
    method: 'PUT',
    json: input,
  });
