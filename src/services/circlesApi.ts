import { apiRequest } from '@/lib/api/http';

interface GroupSummaryResponse {
  groupId: string;
  groupName: string;
  description?: string | null;
  contributionAmount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string;
  nextPayoutDate: string;
  status: 'active' | 'pending' | 'completed';
  payoutType: 'rotation' | 'random' | 'bidding';
}

interface GroupMemberResponse {
  memberId: string;
  name: string;
  hasPaid: boolean;
  payoutPosition: number;
  hasReceivedPayout: boolean;
  role: 'admin' | 'member';
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
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  nextContributionDate: string;
  nextPayoutDate: string;
  status: 'active' | 'pending' | 'completed';
  payoutType: 'rotation' | 'random' | 'bidding';
  inviteCode: string;
  slotsRemaining: number;
  alreadyJoined: boolean;
  payoutAmount: number;
  hasPendingInvitation: boolean;
  invitationStatus?: string | null;
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
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate: string;
  nextPayoutDate: string;
  status: 'active' | 'pending' | 'completed';
  payoutType: 'rotation' | 'random' | 'bidding';
}

export interface CircleMember {
  id: string;
  name: string;
  hasPaid: boolean;
  payoutPosition: number;
  hasReceivedPayout: boolean;
  role: 'admin' | 'member';
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
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  nextContributionDate: string;
  nextPayoutDate: string;
  status: 'active' | 'pending' | 'completed';
  payoutType: 'rotation' | 'random' | 'bidding';
  inviteCode: string;
  slotsRemaining: number;
  alreadyJoined: boolean;
  payoutAmount: number;
  hasPendingInvitation: boolean;
  invitationStatus?: string;
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

export interface CreateCircleInput {
  name: string;
  description?: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  maxMembers: number;
  payoutType: 'rotation' | 'random' | 'bidding';
  currency?: string;
}

export interface SendCircleInviteInput {
  circleId: string;
  channel: 'platform' | 'code' | 'email' | 'sms';
  platformUserId?: string;
  memberContact?: string;
}

export const CIRCLE_PAYOUT_TYPE_METADATA = {
  rotation: {
    label: 'Rotation',
    description: 'Payouts move in fixed member order each cycle.',
    actionLabel: 'Release next payout',
  },
  random: {
    label: 'Random',
    description: 'A recipient is picked automatically at random from unpaid members each cycle.',
    actionLabel: 'Run random payout',
  },
  bidding: {
    label: 'Bidding',
    description: 'Admin selects the winning unpaid member for each cycle payout.',
    actionLabel: 'Select recipient',
  },
} as const;

export const getCirclePayoutTypeLabel = (payoutType: CircleSummary['payoutType']): string =>
  CIRCLE_PAYOUT_TYPE_METADATA[payoutType].label;

export const getCirclePayoutTypeDescription = (payoutType: CircleSummary['payoutType']): string =>
  CIRCLE_PAYOUT_TYPE_METADATA[payoutType].description;

export const getCirclePayoutActionLabel = (payoutType: CircleSummary['payoutType']): string =>
  CIRCLE_PAYOUT_TYPE_METADATA[payoutType].actionLabel;

export const circlesKeys = {
  all: ['circles'] as const,
  list: ['circles', 'list'] as const,
  detail: (circleId: string) => ['circles', 'detail', circleId] as const,
  invite: (code: string) => ['circles', 'invite', code] as const,
  ledger: (circleId: string) => ['circles', 'ledger', circleId] as const,
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
      payoutType: input.payoutType,
      currency: input.currency ?? 'NGN',
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
    payoutType: response.payoutType,
    inviteCode: response.inviteCode,
    slotsRemaining: response.slotsRemaining,
    alreadyJoined: response.alreadyJoined,
    payoutAmount: response.payoutAmount,
    hasPendingInvitation: response.hasPendingInvitation,
    invitationStatus: response.invitationStatus ?? undefined,
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
  payoutType: circle.payoutType,
});

const mapCircleDetail = (circle: GroupDetailResponse): CircleDetail => ({
  ...mapCircleSummary(circle),
  inviteCode: circle.inviteCode,
  hasPaidCurrentCycle: circle.hasPaidCurrentCycle,
  canPayout: circle.canPayout,
  payoutAmount: circle.payoutAmount,
  members: circle.members.map(member => ({
    id: member.memberId,
    name: member.name,
    hasPaid: member.hasPaid,
    payoutPosition: member.payoutPosition,
    hasReceivedPayout: member.hasReceivedPayout,
    role: member.role,
  })),
});
