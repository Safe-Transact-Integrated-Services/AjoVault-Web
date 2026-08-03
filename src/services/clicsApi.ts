import { apiRequest } from '@/lib/api/http';

export type ClicRole = 'admin' | 'member';
export type ClicStatus = 'active' | 'archived';
export type ClicMemberStatus = 'active' | 'pending' | 'removed';
export type ClicInvitationStatus = 'pending' | 'accepted' | 'rejected';
export type ClicInvitationChannel = 'platform' | 'email' | 'sms' | 'contact';

export interface ClicMember {
  memberId: string;
  userId?: string | null;
  displayName: string;
  email?: string | null;
  phoneNumber?: string | null;
  role: ClicRole;
  status: ClicMemberStatus;
  joinedAtUtc: string;
}

export interface ClicInvitation {
  invitationId: string;
  clicId: string;
  invitedUserId?: string | null;
  inviteeName?: string | null;
  memberContact?: string | null;
  channel: ClicInvitationChannel;
  status: ClicInvitationStatus;
  reinviteCount: number;
  inviteCode: string;
  inviteLink: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  acceptedAtUtc?: string | null;
  rejectedAtUtc?: string | null;
}

export interface ClicSummary {
  clicId: string;
  name: string;
  description?: string | null;
  status: ClicStatus;
  memberCount: number;
  pendingInvitationCount: number;
  role: ClicRole;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ClicListItem extends ClicSummary {
  members: ClicMember[];
}

export interface ClicDetail extends ClicSummary {
  members: ClicMember[];
  invitations: ClicInvitation[];
}

export interface ClicPageResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: ClicListItem[];
}

export interface ClicMemberInput {
  platformUserId?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface UpdateClicMemberInput {
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface UpdateClicMemberBatchItemInput extends UpdateClicMemberInput {
  memberId: string;
}

export interface UpdateClicMembersInput {
  members: UpdateClicMemberBatchItemInput[];
}

export interface CreateClicInput {
  name: string;
  description?: string | null;
  members?: ClicMemberInput[];
}

export interface UpdateClicInput {
  name?: string | null;
  description?: string | null;
}

export interface InviteClicMemberInput extends ClicMemberInput {
  memberContact?: string | null;
  channel?: ClicInvitationChannel | null;
}

export interface ClicInvitationDecision {
  invitationId: string;
  clicId: string;
  status: ClicInvitationStatus;
  memberId?: string | null;
}

export interface ClicReceivedInvitation {
  invitationId: string;
  clicId: string;
  clicName: string;
  clicDescription?: string | null;
  inviterName: string;
  channel: ClicInvitationChannel;
  status: ClicInvitationStatus;
  reinviteCount: number;
  inviteCode: string;
  inviteLink: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export const clicKeys = {
  all: ['clics'] as const,
  lists: (page = 1, pageSize = 20) => [...clicKeys.all, 'list', page, pageSize] as const,
  invitations: () => [...clicKeys.all, 'invitations'] as const,
  detail: (clicId: string) => [...clicKeys.all, 'detail', clicId] as const,
};

export const getClics = (page = 1, pageSize = 20) =>
  apiRequest<ClicPageResponse>(`/api/clics?page=${page}&pageSize=${pageSize}`);

export const getClic = (clicId: string) =>
  apiRequest<ClicDetail>(`/api/clics/${encodeURIComponent(clicId)}`);

export const getMyClicInvitations = () =>
  apiRequest<ClicReceivedInvitation[]>('/api/clics/invitations/me');

export const createClic = (input: CreateClicInput) =>
  apiRequest<ClicDetail>('/api/clics', {
    method: 'POST',
    json: input,
  });

export const updateClic = (clicId: string, input: UpdateClicInput) =>
  apiRequest<ClicSummary>(`/api/clics/${encodeURIComponent(clicId)}`, {
    method: 'PUT',
    json: input,
  });

export const archiveClic = (clicId: string) =>
  apiRequest<void>(`/api/clics/${encodeURIComponent(clicId)}`, {
    method: 'DELETE',
  });

export const addClicMember = (clicId: string, input: ClicMemberInput) =>
  apiRequest<ClicMember>(`/api/clics/${encodeURIComponent(clicId)}/members`, {
    method: 'POST',
    json: input,
  });

export const updateClicMembers = (clicId: string, input: UpdateClicMembersInput) =>
  apiRequest<ClicMember[]>(`/api/clics/${encodeURIComponent(clicId)}/members`, {
    method: 'PUT',
    json: input,
  });

export const updateClicMember = (clicId: string, memberId: string, input: UpdateClicMemberInput) =>
  apiRequest<ClicMember>(`/api/clics/${encodeURIComponent(clicId)}/members/${encodeURIComponent(memberId)}`, {
    method: 'PUT',
    json: input,
  });

export const removeClicMember = (clicId: string, memberId: string) =>
  apiRequest<void>(`/api/clics/${encodeURIComponent(clicId)}/members/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });

export const inviteClicMember = (clicId: string, input: InviteClicMemberInput) =>
  apiRequest<ClicInvitation>(`/api/clics/${encodeURIComponent(clicId)}/invitations`, {
    method: 'POST',
    json: input,
  });

export const resendClicInvitation = (clicId: string, invitationId: string) =>
  apiRequest<ClicInvitation>(
    `/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: 'POST' },
  );

export const acceptClicInvitation = (clicId: string, invitationId: string) =>
  apiRequest<ClicInvitationDecision>(
    `/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}/accept`,
    { method: 'POST' },
  );

export const rejectClicInvitation = (clicId: string, invitationId: string) =>
  apiRequest<ClicInvitationDecision>(
    `/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}/reject`,
    { method: 'POST' },
  );
