import { apiRequest } from '@/lib/api/http';

interface GroupGoalSummaryResponse {
  goalId: string;
  goalName: string;
  description?: string | null;
  category: GroupGoalCategory;
  targetAmount: number;
  currentBalance: number;
  contributionAmount: number;
  currency: string;
  frequency: GroupGoalFrequency;
  deadline: string;
  status: GroupGoalStatus;
  creatorName: string;
  memberCount: number;
  role: GroupGoalRole;
  progressPercent: number;
  createdAtUtc: string;
}

interface GroupGoalMemberResponse {
  memberId: string;
  name: string;
  role: GroupGoalRole;
  totalContributed: number;
  lastContributionAtUtc?: string | null;
}

interface GroupGoalDetailResponse extends GroupGoalSummaryResponse {
  inviteCode: string;
  canInvite: boolean;
  canContribute: boolean;
  members: GroupGoalMemberResponse[];
}

interface GroupGoalInvitePreviewResponse {
  goalId: string;
  goalName: string;
  description?: string | null;
  category: GroupGoalCategory;
  targetAmount: number;
  currentBalance: number;
  contributionAmount: number;
  currency: string;
  frequency: GroupGoalFrequency;
  deadline: string;
  status: GroupGoalStatus;
  creatorName: string;
  memberCount: number;
  inviteCode: string;
  progressPercent: number;
  alreadyJoined: boolean;
}

interface GroupGoalInviteResponse {
  invitationId: string;
  goalId: string;
  channel: 'code' | 'email' | 'sms';
  status: string;
  inviteCode: string;
  inviteLink: string;
}

interface JoinGroupGoalResponse {
  goalId: string;
  goalName: string;
  memberId: string;
  role: GroupGoalRole;
  status: string;
  joinedAtUtc: string;
}

interface GroupGoalContributionResponse {
  contributionId: string;
  goalId: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  goalBalanceAfter: number;
  goalStatus: string;
  createdAtUtc: string;
}

export type GroupGoalCategory = 'property' | 'vehicle' | 'equipment' | 'education' | 'other';
export type GroupGoalFrequency = 'daily' | 'weekly' | 'monthly';
export type GroupGoalStatus = 'active' | 'completed' | 'cancelled';
export type GroupGoalRole = 'admin' | 'member';

export interface GroupGoalSummary {
  id: string;
  name: string;
  description: string;
  category: GroupGoalCategory;
  targetAmount: number;
  currentBalance: number;
  contributionAmount: number;
  currency: string;
  frequency: GroupGoalFrequency;
  deadline: string;
  status: GroupGoalStatus;
  creatorName: string;
  memberCount: number;
  role: GroupGoalRole;
  progressPercent: number;
  createdAt: string;
}

export interface GroupGoalMember {
  id: string;
  name: string;
  role: GroupGoalRole;
  totalContributed: number;
  lastContributionAt?: string;
}

export interface GroupGoalDetail extends GroupGoalSummary {
  inviteCode: string;
  canInvite: boolean;
  canContribute: boolean;
  members: GroupGoalMember[];
}

export interface GroupGoalInvitePreview extends Omit<GroupGoalSummary, 'role' | 'createdAt'> {
  inviteCode: string;
  alreadyJoined: boolean;
}

export interface GroupGoalInviteResult {
  invitationId: string;
  goalId: string;
  channel: 'code' | 'email' | 'sms';
  status: string;
  inviteCode: string;
  inviteLink: string;
}

export interface GroupGoalJoinResult {
  goalId: string;
  goalName: string;
  memberId: string;
  role: GroupGoalRole;
  status: string;
  joinedAtUtc: string;
}

export interface GroupGoalContributionResult {
  contributionId: string;
  goalId: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  walletBalanceAfter: number;
  goalBalanceAfter: number;
  goalStatus: string;
  createdAtUtc: string;
}

export interface CreateGroupGoalInput {
  name: string;
  description?: string;
  category: GroupGoalCategory;
  targetAmount: number;
  contributionAmount: number;
  frequency: GroupGoalFrequency;
  deadline: string;
  currency?: string;
}

export interface SendGroupGoalInviteInput {
  goalId: string;
  channel: 'code' | 'email' | 'sms';
  memberContact?: string;
}

export const groupGoalsKeys = {
  all: ['group-goals'] as const,
  list: ['group-goals', 'list'] as const,
  detail: (goalId: string) => ['group-goals', 'detail', goalId] as const,
  invite: (code: string) => ['group-goals', 'invite', code] as const,
};

export const getGroupGoals = async (): Promise<GroupGoalSummary[]> => {
  const response = await apiRequest<GroupGoalSummaryResponse[]>('/api/group-goals/');
  return response.map(mapSummary);
};

export const getGroupGoal = async (goalId: string): Promise<GroupGoalDetail> => {
  const response = await apiRequest<GroupGoalDetailResponse>(`/api/group-goals/${encodeURIComponent(goalId)}`);
  return mapDetail(response);
};

export const createGroupGoal = async (input: CreateGroupGoalInput): Promise<GroupGoalDetail> => {
  const response = await apiRequest<GroupGoalDetailResponse>('/api/group-goals/', {
    method: 'POST',
    json: {
      goalName: input.name.trim(),
      description: input.description?.trim() || undefined,
      category: input.category,
      targetAmount: input.targetAmount,
      contributionAmount: input.contributionAmount,
      frequency: input.frequency,
      deadline: input.deadline,
      currency: input.currency ?? 'NGN',
    },
  });

  return mapDetail(response);
};

export const getGroupGoalInvitePreview = async (code: string): Promise<GroupGoalInvitePreview> => {
  const response = await apiRequest<GroupGoalInvitePreviewResponse>(`/api/group-goals/invite/${encodeURIComponent(code.trim().toUpperCase())}`);
  return {
    id: response.goalId,
    name: response.goalName,
    description: response.description ?? '',
    category: response.category,
    targetAmount: response.targetAmount,
    currentBalance: response.currentBalance,
    contributionAmount: response.contributionAmount,
    currency: response.currency,
    frequency: response.frequency,
    deadline: response.deadline,
    status: response.status,
    creatorName: response.creatorName,
    memberCount: response.memberCount,
    progressPercent: response.progressPercent,
    inviteCode: response.inviteCode,
    alreadyJoined: response.alreadyJoined,
  };
};

export const joinGroupGoal = async (code: string, pin: string): Promise<GroupGoalJoinResult> =>
  apiRequest<JoinGroupGoalResponse>(`/api/group-goals/invite/${encodeURIComponent(code.trim().toUpperCase())}/join`, {
    method: 'POST',
    json: { pin },
  });

export const sendGroupGoalInvite = async (input: SendGroupGoalInviteInput): Promise<GroupGoalInviteResult> =>
  apiRequest<GroupGoalInviteResponse>(`/api/group-goals/${encodeURIComponent(input.goalId)}/members/invitations`, {
    method: 'POST',
    json: {
      channel: input.channel,
      memberContact: input.memberContact?.trim() || undefined,
    },
  });

export const contributeToGroupGoal = async (goalId: string, pin: string): Promise<GroupGoalContributionResult> =>
  apiRequest<GroupGoalContributionResponse>(`/api/group-goals/${encodeURIComponent(goalId)}/contributions`, {
    method: 'POST',
    json: { pin },
  });

const mapSummary = (goal: GroupGoalSummaryResponse): GroupGoalSummary => ({
  id: goal.goalId,
  name: goal.goalName,
  description: goal.description ?? '',
  category: goal.category,
  targetAmount: goal.targetAmount,
  currentBalance: goal.currentBalance,
  contributionAmount: goal.contributionAmount,
  currency: goal.currency,
  frequency: goal.frequency,
  deadline: goal.deadline,
  status: goal.status,
  creatorName: goal.creatorName,
  memberCount: goal.memberCount,
  role: goal.role,
  progressPercent: goal.progressPercent,
  createdAt: goal.createdAtUtc,
});

const mapDetail = (goal: GroupGoalDetailResponse): GroupGoalDetail => ({
  ...mapSummary(goal),
  inviteCode: goal.inviteCode,
  canInvite: goal.canInvite,
  canContribute: goal.canContribute,
  members: goal.members.map(member => ({
    id: member.memberId,
    name: member.name,
    role: member.role,
    totalContributed: member.totalContributed,
    lastContributionAt: member.lastContributionAtUtc ?? undefined,
  })),
});
