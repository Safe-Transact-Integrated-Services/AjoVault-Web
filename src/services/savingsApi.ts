import { apiRequest } from '@/lib/api/http';
import type { SavingsPlan } from '@/types';

interface SavingsPlanResponse {
  planId: string;
  name: string;
  planType: SavingsPlan['type'];
  targetAmount: number;
  currentBalance: number;
  contributionAmount: number;
  currency: string;
  frequency: SavingsPlan['frequency'];
  fundingSource: string;
  interestRate: number;
  status: SavingsPlan['status'];
  startDate: string;
  endDate: string;
  nextContributionDate: string;
  goalImage?: string | null;
}

interface SavingsContributionHistoryResponse {
  contributionId: string;
  amount: number;
  currency: string;
  fundingSource: string;
  status: string;
  reference: string;
  createdAtUtc: string;
}

interface SavingsPlanDetailResponse extends SavingsPlanResponse {
  progressPercent: number;
  hasSavedCardAuthorization: boolean;
  savedCardLabel?: string | null;
  contributions: SavingsContributionHistoryResponse[];
}

export interface SavingsContributionResponse {
  contributionId?: string | null;
  planId: string;
  amount: number;
  currency: string;
  fundingSource: string;
  status: string;
  reference: string;
  walletBalanceAfter?: number | null;
  planBalanceAfter?: number | null;
  planStatus?: string | null;
  requiresAction: boolean;
  accessCode?: string | null;
  authorizationUrl?: string | null;
  createdAtUtc: string;
}

export interface SavingsPlanDetail extends SavingsPlan {
  fundingSource: string;
  nextContributionDate: string;
  progressPercent: number;
  hasSavedCardAuthorization: boolean;
  savedCardLabel?: string;
  contributions: SavingsContributionHistory[];
}

export interface SavingsContributionHistory {
  contributionId: string;
  amount: number;
  currency: string;
  fundingSource: string;
  status: string;
  reference: string;
  createdAt: string;
}

export interface CreateSavingsPlanInput {
  name: string;
  planType: SavingsPlan['type'];
  targetAmount: number;
  contributionAmount: number;
  frequency: SavingsPlan['frequency'];
  fundingSource?: string;
  currency?: string;
  goalImage?: string;
}

export interface ContributeSavingsPlanInput {
  amount?: number;
  fundingSource?: string;
  pin: string;
}

export const savingsKeys = {
  all: ['savings'] as const,
  plans: ['savings', 'plans'] as const,
  detail: (planId: string) => ['savings', 'plans', planId] as const,
};

export const getSavingsPlans = async (): Promise<SavingsPlan[]> => {
  const response = await apiRequest<SavingsPlanResponse[]>('/api/savings/plans');
  return response.map(mapSavingsPlan);
};

export const getSavingsPlan = async (planId: string): Promise<SavingsPlanDetail> => {
  const response = await apiRequest<SavingsPlanDetailResponse>(`/api/savings/plans/${encodeURIComponent(planId)}`);
  return mapSavingsPlanDetail(response);
};

export const createSavingsPlan = async (input: CreateSavingsPlanInput): Promise<SavingsPlanDetail> => {
  const response = await apiRequest<SavingsPlanDetailResponse>('/api/savings/plans', {
    method: 'POST',
    json: {
      name: input.name.trim(),
      planType: input.planType,
      targetAmount: input.targetAmount,
      contributionAmount: input.contributionAmount,
      frequency: input.frequency,
      fundingSource: input.fundingSource ?? 'wallet',
      currency: input.currency ?? 'NGN',
      goalImage: input.goalImage?.trim() || undefined,
    },
  });

  return mapSavingsPlanDetail(response);
};

export const contributeToSavingsPlan = async (planId: string, input: ContributeSavingsPlanInput) =>
  apiRequest<SavingsContributionResponse>(`/api/savings/plans/${encodeURIComponent(planId)}/contributions`, {
    method: 'POST',
    json: {
      amount: input.amount,
      fundingSource: input.fundingSource ?? 'wallet',
      pin: input.pin,
    },
  });

const mapSavingsPlan = (plan: SavingsPlanResponse): SavingsPlan => ({
  id: plan.planId,
  name: plan.name,
  type: plan.planType,
  targetAmount: plan.targetAmount,
  savedAmount: plan.currentBalance,
  currency: plan.currency,
  frequency: plan.frequency,
  contributionAmount: plan.contributionAmount,
  startDate: plan.startDate,
  endDate: plan.endDate,
  status: plan.status,
  interestRate: plan.interestRate,
  goalImage: plan.goalImage ?? undefined,
});

const mapSavingsPlanDetail = (plan: SavingsPlanDetailResponse): SavingsPlanDetail => ({
  ...mapSavingsPlan(plan),
  fundingSource: plan.fundingSource,
  nextContributionDate: plan.nextContributionDate,
  progressPercent: plan.progressPercent,
  hasSavedCardAuthorization: plan.hasSavedCardAuthorization,
  savedCardLabel: plan.savedCardLabel ?? undefined,
  contributions: plan.contributions.map(contribution => ({
    contributionId: contribution.contributionId,
    amount: contribution.amount,
    currency: contribution.currency,
    fundingSource: contribution.fundingSource,
    status: contribution.status,
    reference: contribution.reference,
    createdAt: contribution.createdAtUtc,
  })),
});
