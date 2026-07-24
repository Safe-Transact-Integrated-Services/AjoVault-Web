import { apiRequest } from '@/lib/api/http';
import type { UpcomingContributionItem } from '@/services/dashboardApi';

export type CircleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface GroupSummaryResponse {
  groupId: string;
  groupName: string;
  description?: string | null;
  contributionAmount: number;
  currency: string;
  frequency: CircleFrequency;
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string | null;
  nextPayoutDate: string | null;
  status: 'active' | 'pending' | 'completed';
  completedPayoutsCount?: number;
  hasPaidCurrentCycle?: boolean;
  isContributionParticipant?: boolean;
  createdAt?: string;
  startDate?: string;
  isPayoutOrderFinalized: boolean;
  payoutOrderStrategy?: string | null;
  payoutOrderFinalizedAt?: string | null;
}

interface GroupMemberResponse {
  memberId: string;
  name: string;
  hasPaid: boolean;
  payoutPosition: number;
  hasReceivedPayout: boolean;
  role: 'admin' | 'member';
  isContributionParticipant?: boolean;
}

interface GroupDetailResponse extends GroupSummaryResponse {
  inviteCode: string;
  hasPaidCurrentCycle: boolean;
  canPayout: boolean;
  payoutAmount: number;
  members: GroupMemberResponse[];
}

interface GroupInvitePreviewResponse {
  groupId: string;
  groupName: string;
  description?: string | null;
  contributionAmount: number;
  currency: string;
  frequency: CircleFrequency;
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  nextContributionDate: string | null;
  nextPayoutDate: string | null;
  status: 'active' | 'pending' | 'completed';
  inviteCode: string;
  slotsRemaining: number;
  alreadyJoined: boolean;
  payoutAmount: number;
  hasPendingInvitation: boolean;
  invitationStatus?: string | null;
  startDate?: string | null;
  completedPayoutsCount?: number;
  isPayoutOrderFinalized: boolean;
  payoutOrderStrategy?: string | null;
  payoutOrderFinalizedAt?: string | null;
}

interface MemberInviteResponse {
  invitationId: string;
  groupId: string;
  channel: 'platform' | 'code' | 'email' | 'sms';
  status: string;
  inviteCode: string;
  inviteLink: string;
}

interface MemberInviteDecisionResponse {
  invitationId: string;
  groupId: string;
  status: string;
  inviteCode: string;
}

interface JoinGroupResponse {
  groupId: string;
  groupName: string;
  memberId: string;
  role: 'admin' | 'member';
  payoutPosition: number;
  status: string;
  joinedAtUtc: string;
}

interface GroupContributionResponse {
  contributionId: string;
  groupId: string;
  cycleNumber: number;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  createdAtUtc: string;
}

interface GroupLedgerEntryResponse {
  entryId: string;
  entryType: 'contribution' | 'payout';
  memberId: string;
  memberName: string;
  cycleNumber: number;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAtUtc: string;
}

interface GroupLedgerResponse {
  groupId: string;
  entries: GroupLedgerEntryResponse[];
}

interface PayoutDisbursementResponse {
  payoutId: string;
  groupId: string;
  recipientMemberId: string;
  recipientName: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  completedCycleNumber: number;
  nextCycleNumber: number;
  circleStatus: string;
  createdAtUtc: string;
}

export interface CircleSummary {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: CircleFrequency;
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string | null;
  nextPayoutDate: string | null;
  status: 'active' | 'pending' | 'completed';
  completedPayoutsCount?: number;
  hasPaidCurrentCycle?: boolean;
  isContributionParticipant?: boolean;
  createdAt?: string;
  startDate?: string;
  isPayoutOrderFinalized: boolean;
  payoutOrderStrategy?: string | null;
  payoutOrderFinalizedAt?: string | null;
}

export interface CircleMember {
  id: string;
  name: string;
  hasPaid: boolean;
  payoutPosition: number;
  hasReceivedPayout: boolean;
  role: 'admin' | 'member';
  isContributionParticipant: boolean;
}

export interface CircleDetail extends CircleSummary {
  inviteCode: string;
  hasPaidCurrentCycle: boolean;
  canPayout: boolean;
  payoutAmount: number;
  members: CircleMember[];
}

export interface CircleInvitePreview {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: CircleFrequency;
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  nextContributionDate: string | null;
  nextPayoutDate: string | null;
  status: 'active' | 'pending' | 'completed';
  inviteCode: string;
  slotsRemaining: number;
  alreadyJoined: boolean;
  payoutAmount: number;
  hasPendingInvitation: boolean;
  invitationStatus?: string;
  startDate?: string;
  completedPayoutsCount?: number;
  isPayoutOrderFinalized: boolean;
  payoutOrderStrategy?: string | null;
  payoutOrderFinalizedAt?: string | null;
}

export interface CircleInviteResult {
  invitationId: string;
  groupId: string;
  channel: 'platform' | 'code' | 'email' | 'sms';
  status: string;
  inviteCode: string;
  inviteLink: string;
}

export interface CircleInviteDecisionResult {
  invitationId: string;
  groupId: string;
  status: string;
  inviteCode: string;
}

export interface CircleJoinResult {
  groupId: string;
  groupName: string;
  memberId: string;
  role: 'admin' | 'member';
  payoutPosition: number;
  status: string;
  joinedAtUtc: string;
}

export interface CircleContributionResult {
  contributionId: string;
  groupId: string;
  cycleNumber: number;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  createdAtUtc: string;
}

export interface CircleLedgerEntry {
  entryId: string;
  entryType: 'contribution' | 'payout';
  memberId: string;
  memberName: string;
  cycleNumber: number;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAtUtc: string;
}

export interface CirclePayoutResult {
  payoutId: string;
  groupId: string;
  recipientMemberId: string;
  recipientName: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  completedCycleNumber: number;
  nextCycleNumber: number;
  circleStatus: string;
  createdAtUtc: string;
}

export type CirclePayoutOrderStrategy = 'manual' | 'weighted_random';

export interface CirclePayoutOrderMember {
  memberId: string;
  name: string;
  payoutPosition: number;
  reliabilityScore: number;
  savingsContributionCount: number;
  savingsContributionAmount: number;
  recentSavingsContributionCount: number;
  circleContributionCount: number;
  onTimeCircleContributionCount: number;
}

export interface CirclePayoutOrderResult {
  groupId: string;
  strategy: CirclePayoutOrderStrategy | string;
  finalizedAt: string;
  members: CirclePayoutOrderMember[];
}

export interface CirclePayoutOrderPreviewResult {
  groupId: string;
  strategy: CirclePayoutOrderStrategy | string;
  isFinalized: boolean;
  finalizedAt?: string | null;
  members: CirclePayoutOrderMember[];
}

export interface FinalizeCirclePayoutOrderInput {
  strategy?: CirclePayoutOrderStrategy;
  memberIds?: string[];
}

export interface CreateCircleInput {
  name: string;
  description?: string;
  amount: number;
  frequency: CircleFrequency;
  maxMembers: number;
  adminParticipatesInContributions?: boolean;
  currency?: string;
  isOngoing?: boolean;
  currentCycle?: number;
  completedPayoutsCount?: number;
  startDate?: string;
  totalCycles?: number;
}

export interface CircleDashboardMetrics {
  totalCount: number;
  activeCount: number;
  adminCount: number;
  memberCount: number;
  pendingCount: number;
  completedCount: number;
  totalProjectedPayouts: number;
  activeCommitment: number;
  currency: string;
}

export interface CircleDashboardPage {
  page: number;
  pageSize: number;
  totalCount: number;
  items: CircleSummary[];
}

export interface CircleDashboardResponse {
  metrics: CircleDashboardMetrics;
  nextDueCircle: CircleSummary | null;
  upcomingContributions: UpcomingContributionItem[];
  circles: CircleDashboardPage;
}

export interface CircleDashboardFilters {
  page?: number;
  pageSize?: number;
  role?: 'admin' | 'member';
  status?: 'active' | 'pending' | 'completed';
  name?: string;
  sortBy?: 'newest' | 'oldest' | 'alphabetical' | 'amount_high' | 'payout_high' | string;
}

export interface SendCircleInviteInput {
  circleId: string;
  channel: 'platform' | 'code' | 'email' | 'sms';
  platformUserId?: string;
  memberContact?: string;
}

export const CIRCLE_PAYOUT_ORDER_STRATEGY_METADATA = {
  manual: {
    label: 'Manual',
    description: 'Admin arranges and confirms the member payout order before the circle starts.',
  },
  weighted_random: {
    label: 'System generated',
    description: 'AjoVault suggests an order using member savings history and prompt contribution behavior, then admin confirms it.',
  },
} as const;

export const normalizeCirclePayoutOrderStrategy = (
  strategy?: string | null,
): CirclePayoutOrderStrategy =>
  strategy === 'weighted_random' || strategy === 'system_generated'
    ? 'weighted_random'
    : 'manual';

export const getCirclePayoutOrderStrategyLabel = (strategy?: string | null): string =>
  CIRCLE_PAYOUT_ORDER_STRATEGY_METADATA[normalizeCirclePayoutOrderStrategy(strategy)].label;

export const getCirclePayoutOrderStrategyDescription = (strategy?: string | null): string =>
  CIRCLE_PAYOUT_ORDER_STRATEGY_METADATA[normalizeCirclePayoutOrderStrategy(strategy)].description;

export const circlesKeys = {
  all: ['circles'] as const,
  list: ['circles', 'list'] as const,
  dashboard: ['circles', 'dashboard'] as const,
  dashboardPage: (page: number, pageSize: number, tab: string, name: string, sortBy: string) =>
    ['circles', 'dashboard', page, pageSize, tab, name, sortBy] as const,
  detail: (circleId: string) => ['circles', 'detail', circleId] as const,
  invite: (code: string) => ['circles', 'invite', code] as const,
  ledger: (circleId: string) => ['circles', 'ledger', circleId] as const,
};

export const getCircleDashboard = (filters: CircleDashboardFilters = {}) => {
  const search = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 5),
  });

  if (filters.role) {
    search.set('role', filters.role);
  }

  if (filters.status) {
    search.set('status', filters.status);
  }

  if (filters.name?.trim()) {
    search.set('name', filters.name.trim());
  }

  if (filters.sortBy?.trim()) {
    search.set('sortBy', filters.sortBy.trim());
  }

  return apiRequest<CircleDashboardResponse>(`/api/dashboard/me/circles?${search.toString()}`);
};

export const getCircles = async (): Promise<CircleSummary[]> => {
  const response = await apiRequest<GroupSummaryResponse[]>('/api/groups/');
  return response.map(mapCircleSummary);
};

export const getCircle = async (circleId: string): Promise<CircleDetail> => {
  const response = await apiRequest<GroupDetailResponse>(`/api/groups/${encodeURIComponent(circleId)}`);
  return mapCircleDetail(response);
};

export const createCircle = async (input: CreateCircleInput): Promise<CircleDetail> => {
  const response = await apiRequest<GroupDetailResponse>('/api/groups/', {
    method: 'POST',
    json: {
      groupName: input.name.trim(),
      description: input.description?.trim() || undefined,
      contributionAmount: input.amount,
      frequency: input.frequency,
      maxMembers: input.maxMembers,
      adminParticipatesInContributions: input.adminParticipatesInContributions ?? true,
      currency: input.currency ?? 'NGN',
      isOngoing: input.isOngoing,
      currentCycle: input.currentCycle,
      completedPayoutsCount: input.completedPayoutsCount,
      startDate: input.startDate || undefined,
      totalCycles: input.totalCycles,
    },
  });

  return mapCircleDetail(response);
};

export const getCircleInvitePreview = async (code: string): Promise<CircleInvitePreview> => {
  const response = await apiRequest<GroupInvitePreviewResponse>(`/api/groups/invite/${encodeURIComponent(code.trim().toUpperCase())}`);
  return {
    id: response.groupId,
    name: response.groupName,
    description: response.description ?? '',
    amount: response.contributionAmount,
    currency: response.currency,
    frequency: response.frequency,
    memberCount: response.memberCount,
    maxMembers: response.maxMembers,
    currentCycle: response.currentCycle,
    totalCycles: response.totalCycles,
    nextContributionDate: response.nextContributionDate,
    nextPayoutDate: response.nextPayoutDate,
    status: response.status,
    inviteCode: response.inviteCode,
    slotsRemaining: response.slotsRemaining,
    alreadyJoined: response.alreadyJoined,
    payoutAmount: response.payoutAmount,
    hasPendingInvitation: response.hasPendingInvitation,
    invitationStatus: response.invitationStatus ?? undefined,
    startDate: response.startDate ?? undefined,
    completedPayoutsCount: response.completedPayoutsCount,
    isPayoutOrderFinalized: response.isPayoutOrderFinalized,
    payoutOrderStrategy: response.payoutOrderStrategy,
    payoutOrderFinalizedAt: response.payoutOrderFinalizedAt,
  };
};

export const joinCircle = async (code: string, pin: string): Promise<CircleJoinResult> =>
  apiRequest<JoinGroupResponse>(`/api/groups/invite/${encodeURIComponent(code.trim().toUpperCase())}/join`, {
    method: 'POST',
    json: {
      pin,
    },
  });

export const sendCircleInvite = async (input: SendCircleInviteInput): Promise<CircleInviteResult> =>
  apiRequest<MemberInviteResponse>(`/api/groups/${encodeURIComponent(input.circleId)}/members/invitations`, {
    method: 'POST',
    json: {
      platformUserId: input.platformUserId,
      memberContact: input.memberContact?.trim() || undefined,
      channel: input.channel,
    },
  });

export const rejectCircleInvite = async (code: string): Promise<CircleInviteDecisionResult> =>
  apiRequest<MemberInviteDecisionResponse>(`/api/groups/invite/${encodeURIComponent(code.trim().toUpperCase())}/reject`, {
    method: 'POST',
  });

export const finalizeCirclePayoutOrder = async (
  circleId: string,
  input: FinalizeCirclePayoutOrderInput,
): Promise<CirclePayoutOrderResult> =>
  apiRequest<CirclePayoutOrderResult>(`/api/groups/${encodeURIComponent(circleId)}/payout-order`, {
    method: 'POST',
    json: {
      strategy: input.strategy,
      memberIds: input.memberIds,
    },
  });

export const previewCirclePayoutOrder = async (
  circleId: string,
  input: FinalizeCirclePayoutOrderInput = {},
): Promise<CirclePayoutOrderPreviewResult> =>
  apiRequest<CirclePayoutOrderPreviewResult>(`/api/groups/${encodeURIComponent(circleId)}/payout-order/preview`, {
    method: 'POST',
    json: {
      strategy: input.strategy,
      memberIds: input.memberIds,
    },
  });

export const reopenCirclePayoutOrder = async (circleId: string): Promise<CircleDetail> => {
  const response = await apiRequest<GroupDetailResponse>(`/api/groups/${encodeURIComponent(circleId)}/payout-order/reopen`, {
    method: 'POST',
  });
  return mapCircleDetail(response);
};

export const contributeToCircle = async (circleId: string, pin: string): Promise<CircleContributionResult> =>
  apiRequest<GroupContributionResponse>(`/api/groups/${encodeURIComponent(circleId)}/contributions`, {
    method: 'POST',
    json: {
      pin,
    },
  });

export const getCircleLedger = async (circleId: string): Promise<CircleLedgerEntry[]> => {
  const response = await apiRequest<GroupLedgerResponse>(`/api/groups/${encodeURIComponent(circleId)}/ledger`);
  return response.entries;
};

export const payoutCircle = async (
  circleId: string,
  recipientMemberId: string | undefined,
  pin: string,
): Promise<CirclePayoutResult> =>
  apiRequest<PayoutDisbursementResponse>(`/api/groups/${encodeURIComponent(circleId)}/payouts/disburse`, {
    method: 'POST',
    json: {
      recipientMemberId: recipientMemberId || undefined,
      pin,
    },
  });

export const startCircle = async (circleId: string): Promise<CircleDetail> => {
  const response = await apiRequest<GroupDetailResponse>(`/api/groups/${encodeURIComponent(circleId)}/start`, {
    method: 'POST',
  });
  return mapCircleDetail(response);
};

const mapCircleSummary = (circle: GroupSummaryResponse): CircleSummary => ({
  id: circle.groupId,
  name: circle.groupName,
  description: circle.description ?? '',
  amount: circle.contributionAmount,
  currency: circle.currency,
  frequency: circle.frequency,
  memberCount: circle.memberCount,
  maxMembers: circle.maxMembers,
  currentCycle: circle.currentCycle,
  totalCycles: circle.totalCycles,
  role: circle.role,
  nextContributionDate: circle.nextContributionDate,
  nextPayoutDate: circle.nextPayoutDate,
  status: circle.status,
  completedPayoutsCount: circle.completedPayoutsCount,
  hasPaidCurrentCycle: circle.hasPaidCurrentCycle,
  isContributionParticipant: circle.isContributionParticipant ?? true,
  createdAt: circle.createdAt ?? '2026-01-01',
  startDate: circle.startDate ?? undefined,
  isPayoutOrderFinalized: circle.isPayoutOrderFinalized,
  payoutOrderStrategy: circle.payoutOrderStrategy,
  payoutOrderFinalizedAt: circle.payoutOrderFinalizedAt,
});

const mapCircleDetail = (circle: GroupDetailResponse): CircleDetail => ({
  ...mapCircleSummary(circle),
  inviteCode: circle.inviteCode,
  canPayout: circle.canPayout,
  payoutAmount: circle.payoutAmount,
  members: circle.members.map(member => ({
    id: member.memberId,
    name: member.name,
    hasPaid: member.hasPaid,
    payoutPosition: member.payoutPosition,
    hasReceivedPayout: member.hasReceivedPayout,
    role: member.role,
    isContributionParticipant: member.isContributionParticipant ?? true,
  })),
});
