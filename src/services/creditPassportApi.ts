import { apiRequest } from '@/lib/api/http';

export interface CreditPassportScoreResponse {
  score: number;
  breakdown: Array<{
    factor: string;
    weightPercent: number;
  }>;
  calculatedAt: string;
}

export interface CreditPassportUnlocksResponse {
  score: number;
  unlocks: string[];
}

export const creditPassportKeys = {
  score: ['credit-passport', 'score'] as const,
  unlocks: ['credit-passport', 'unlocks'] as const,
};

export const getCreditPassportScore = () =>
  apiRequest<CreditPassportScoreResponse>('/api/credit-passport/me/score');

export const getCreditPassportUnlocks = () =>
  apiRequest<CreditPassportUnlocksResponse>('/api/credit-passport/me/benefits');
