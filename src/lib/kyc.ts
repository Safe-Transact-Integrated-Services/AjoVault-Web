import type { User } from '@/types';

export type KycStepKey = 'email' | 'nin' | 'bvn' | 'documents';

export interface KycProgress {
  emailComplete: boolean;
  ninComplete: boolean;
  bvnComplete: boolean;
  documentsComplete: boolean;
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
  const emailComplete = !!user?.emailVerified;
  const ninComplete = !!user?.ninLast4 || hasBasicTier(user?.kycTier);
  const bvnComplete = !!user?.bvnLast4 || hasVerifiedTier(user?.kycTier);
  const documentsComplete =
    !!user?.kycDocumentsSubmitted || user?.kycDocumentStatus === 'verified' || hasPremiumTier(user?.kycTier);
  const completedCount = [emailComplete, ninComplete, bvnComplete, documentsComplete].filter(Boolean).length;

  if (!emailComplete) {
    return {
      emailComplete,
      ninComplete,
      bvnComplete,
      documentsComplete,
      completedCount,
      nextStep: 'email',
      nextStepTitle: 'Verify email',
      summary: 'Tier 1 pending',
    };
  }

  if (!ninComplete) {
    return {
      emailComplete,
      ninComplete,
      bvnComplete,
      documentsComplete,
      completedCount,
      nextStep: 'nin',
      nextStepTitle: 'Submit NIN',
      summary: 'Tier 2 pending',
    };
  }

  if (!bvnComplete) {
    return {
      emailComplete,
      ninComplete,
      bvnComplete,
      documentsComplete,
      completedCount,
      nextStep: 'bvn',
      nextStepTitle: 'Verify BVN',
      summary: 'Tier 3 pending',
    };
  }

  if (!documentsComplete) {
    return {
      emailComplete,
      ninComplete,
      bvnComplete,
      documentsComplete,
      completedCount,
      nextStep: 'documents',
      nextStepTitle: 'Upload Documents',
      summary: 'Tier 4 pending',
    };
  }

  return {
    emailComplete,
    ninComplete,
    bvnComplete,
    documentsComplete,
    completedCount,
    nextStep: 'complete',
    nextStepTitle: 'KYC complete',
    summary: 'All tiers completed',
  };
};
