import type { User } from '@/types';

export type KycStepKey = 'phone' | 'bvn' | 'nin';

export interface KycProgress {
  phoneComplete: boolean;
  bvnComplete: boolean;
  ninComplete: boolean;
  bvnPending: boolean;
  ninPending: boolean;
  completedCount: number;
  nextStep: KycStepKey | 'complete';
  nextStepTitle: string;
  summary: string;
}

const hasBasicTier = (kycTier?: User['kycTier']) =>
  kycTier === 'basic' || kycTier === 'verified' || kycTier === 'premium';

const hasVerifiedTier = (kycTier?: User['kycTier']) =>
  kycTier === 'verified' || kycTier === 'premium';

const hasPremiumTier = (kycTier?: User['kycTier']) =>
  kycTier === 'premium';

export const getKycProgress = (user: User | null | undefined): KycProgress => {
  // Tier 1 is phone verification, which is done at signup
  const phoneComplete = !!user?.phoneVerified;
  const bvnComplete = !!user?.bvnVerified;
  const ninComplete = !!user?.ninVerified;

  const isPending = user?.kycDocumentStatus === 'pending';
  const bvnPending = isPending && !user?.bvnVerified;
  const ninPending = isPending && user?.bvnVerified && !user?.ninVerified;
  
  const completedCount = [phoneComplete, bvnComplete, ninComplete].filter(Boolean).length;

  if (!phoneComplete) {
    return {
      phoneComplete,
      bvnComplete,
      ninComplete,
      bvnPending,
      ninPending,
      completedCount,
      nextStep: 'phone',
      nextStepTitle: 'Verify phone',
      summary: 'Tier 1 pending',
    };
  }

  if (!bvnComplete) {
    return {
      phoneComplete,
      bvnComplete,
      ninComplete,
      bvnPending,
      ninPending,
      completedCount,
      nextStep: 'bvn',
      nextStepTitle: 'Verify BVN',
      summary: 'Tier 2 pending',
    };
  }

  if (!ninComplete) {
    return {
      phoneComplete,
      bvnComplete,
      ninComplete,
      bvnPending,
      ninPending,
      completedCount,
      nextStep: 'nin',
      nextStepTitle: 'Submit NIN',
      summary: 'Tier 3 pending',
    };
  }

  return {
    phoneComplete,
    bvnComplete,
    ninComplete,
    bvnPending,
    ninPending,
    completedCount,
    nextStep: 'complete',
    nextStepTitle: 'KYC complete',
    summary: 'All tiers completed',
  };
};
