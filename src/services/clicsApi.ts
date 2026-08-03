import { apiRequest } from '@/lib/api/http';
import { searchPlatformUsers } from './platformUsersApi';

export type ClicMemberStatus = 'active' | 'pending' | 'removed';

export interface ClicGroup {
  id: string;
  clicId?: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  memberCount: number;
  pendingInvitationCount?: number;
  maxMembers: number;
  currentCycle: number;
  totalCycles: number;
  role: 'admin' | 'member';
  nextContributionDate?: string | null;
  nextPayoutDate?: string | null;
  status: 'active' | 'pending' | 'completed';
  members?: ClicMemberDetail[];
  createdAt?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
  completedPayoutsCount?: number;
  hasPaidCurrentCycle?: boolean;
}

export interface CreateClicMemberInput {
  platformUserId?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface CreateClicInput {
  name: string;
  description?: string;
  members?: CreateClicMemberInput[];
}

export const clicsKeys = {
  all: ['clics'] as const,
  list: ['clics', 'list'] as const,
  detail: (id: string) => ['clics', 'detail', id] as const,
};

export interface ClicMemberDetail {
  id: string;
  memberId?: string;
  userId?: string;
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  role: 'admin' | 'member';
  status?: ClicMemberStatus | string;
  joinedAtUtc?: string;
  hasPaid?: boolean;
  payoutPosition?: number;
}

export interface ClicInvitationDetail {
  id: string;
  invitationId?: string;
  clicId?: string;
  inviteeName?: string;
  displayName?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  inviteeContact?: string;
  channel?: 'platform' | 'email' | 'sms';
  status: 'pending' | 'accepted' | 'rejected';
  reinviteCount?: number;
  createdAt?: string;
  createdAtUtc?: string;
}

export interface ClicGroupDetail extends ClicGroup {
  clicId?: string;
  pendingInvitationCount?: number;
  members: ClicMemberDetail[];
  invitations: ClicInvitationDetail[];
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

const mapClicMembers = (rawMembers: any[] = []): ClicMemberDetail[] =>
  rawMembers.map((m: any, idx: number) => ({
    ...m,
    id: m.memberId || m.userId || m.id || `m_${idx}`,
    memberId: m.memberId || m.id || `m_${idx}`,
    userId: m.userId,
    name: m.displayName || m.name || m.email || 'Member',
    displayName: m.displayName || m.name,
    email: m.email || '',
    phone: m.phoneNumber || m.phone || '',
    phoneNumber: m.phoneNumber || m.phone || '',
    role: m.role || 'member',
    status: m.status || 'active',
    joinedAtUtc: m.joinedAtUtc,
    hasPaid: m.hasPaid ?? true,
    payoutPosition: m.payoutPosition ?? (idx + 1),
  })).sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));

export const getClics = async (page: number | any = 1, pageSize: number = 50): Promise<ClicGroup[]> => {
  const pageNum = typeof page === 'number' && !isNaN(page) ? page : 1;
  const sizeNum = typeof pageSize === 'number' && !isNaN(pageSize) ? Math.min(pageSize, 10) : 10;

  const queryParams = new URLSearchParams({
    page: pageNum.toString(),
    pageSize: sizeNum.toString(),
  });
  const response = await apiRequest<any>(`/api/clics?${queryParams.toString()}`);
  const rawList = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data?.items)
          ? response.data.items
          : Array.isArray(response?.result)
            ? response.result
            : Array.isArray(response?.result?.items)
              ? response.result.items
              : [];

  return rawList.map((rawItem: any, idx: number) => {
    const item = (rawItem && typeof rawItem === 'object' && ('data' in rawItem || 'result' in rawItem))
      ? (rawItem.data || rawItem.result || rawItem)
      : rawItem;

    const rawMembers = Array.isArray(item.members)
      ? item.members
      : Array.isArray(item.participants)
        ? item.participants
        : Array.isArray(item.clicMembers)
          ? item.clicMembers
          : Array.isArray(item.userMembers)
            ? item.userMembers
            : Array.isArray(item.data?.members)
              ? item.data.members
              : [];

  return rawList.map((item: any, idx: number) => ({
    ...item,
    id: item.clicId || item.id || item.groupId || `clic_${idx}`,
    clicId: item.clicId || item.id,
    name: item.name || '',
    description: item.description || '',
    status: item.status || 'active',
    memberCount: item.memberCount ?? (Array.isArray(item.members) ? item.members.length : 0),
    role: item.role || 'member',
    createdAt: item.createdAt || item.createdAtUtc || new Date().toISOString(),
    createdAtUtc: item.createdAtUtc || item.createdAt,
    updatedAtUtc: item.updatedAtUtc,
    members: mapClicMembers(Array.isArray(item.members) ? item.members : []),
  }));
};

export const getClic = async (id: string): Promise<ClicGroupDetail> => {
  const item = await apiRequest<any>(`/api/clics/${encodeURIComponent(id)}`);
  const rawMembers = Array.isArray(item?.members) ? item.members : [];
  const rawInvitations = Array.isArray(item?.invitations) ? item.invitations : [];

  const members = mapClicMembers(rawMembers);

  const pendingMemberInvitations: any[] = pendingRawMembers.map((m: any, idx: number) => {
    const contact = m.email || m.phoneNumber || m.phone || '';
    return {
      id: m.memberId || m.id || `pending_m_${idx}`,
      invitationId: m.memberId || m.id,
      clicId: id,
      invitedUserId: m.userId,
      platformUserId: m.userId,
      inviteeName: m.displayName || m.fullName || m.name || 'Invitee',
      email: m.email || (contact.includes('@') ? contact : 'N/A'),
      phone: m.phoneNumber || m.phone || (!contact.includes('@') ? contact : 'N/A'),
      phoneNumber: m.phoneNumber || m.phone || (!contact.includes('@') ? contact : 'N/A'),
      inviteeContact: contact,
      memberContact: contact,
      channel: m.email ? 'email' : 'sms',
      status: 'pending',
      reinviteCount: 0,
      createdAt: m.joinedAtUtc || new Date().toISOString(),
    };
  });

  const combinedRawInvitations = [...rawInvitations, ...pendingMemberInvitations];

  const invitations: ClicInvitationDetail[] = await Promise.all(combinedRawInvitations.map(async (inv: any, idx: number) => {
    const rawContact =
      inv.memberContact ||
      inv.inviteeContact ||
      inv.contact ||
      inv.email ||
      inv.inviteeEmail ||
      inv.platformUserEmail ||
      inv.platformUser?.email ||
      inv.phoneNumber ||
      inv.phone ||
      inv.inviteePhone ||
      inv.platformUserPhone ||
      inv.platformUser?.phoneNumber ||
      '';
    let extractedEmail = inv.email || inv.inviteeEmail || inv.platformUserEmail || inv.platformUser?.email || (rawContact.includes('@') ? rawContact : '');
    let extractedPhone = inv.phoneNumber || inv.phone || inv.inviteePhone || inv.platformUserPhone || inv.platformUser?.phoneNumber || (!rawContact.includes('@') && rawContact ? rawContact : '');
    const inviteeName = inv.inviteeName || inv.displayName || inv.name || inv.platformUser?.fullName || inv.email || 'Invitee';
    let matchedPlatformUserId = '';

    // If both email and phone are missing on the invitation record, lookup platform user by name or platformUserId
    if ((!extractedEmail || extractedEmail === 'N/A') && (!extractedPhone || extractedPhone === 'N/A') && inviteeName && inviteeName !== 'Invitee') {
      try {
        const platformMatches = await searchPlatformUsers(inviteeName);
        const match = platformMatches.find(
          u => u.userId === inv.platformUserId || u.fullName.toLowerCase() === inviteeName.toLowerCase()
        ) || platformMatches[0];

        if (match) {
          matchedPlatformUserId = match.userId;
          if (match.email) extractedEmail = match.email;
          if (match.phoneNumber) extractedPhone = match.phoneNumber;
        }
      } catch {
        // Continue with extracted fields
      }
    }

    return {
      ...inv,
      id: inv.invitationId || inv.id || `inv_${idx}`,
      invitationId: inv.invitationId || inv.id,
      clicId: inv.clicId || id,
      invitedUserId: inv.invitedUserId || inv.platformUserId || inv.userId || inv.platformUser?.userId || matchedPlatformUserId,
      platformUserId: inv.invitedUserId || inv.platformUserId || inv.userId || inv.platformUser?.userId || matchedPlatformUserId,
      inviteeName,
      email: extractedEmail || 'N/A',
      phone: extractedPhone || 'N/A',
      phoneNumber: extractedPhone || 'N/A',
      inviteeContact: rawContact || extractedEmail || extractedPhone,
      memberContact: rawContact || extractedEmail || extractedPhone,
      channel: inv.channel || 'platform',
      status: inv.status || 'pending',
      reinviteCount: inv.reinviteCount ?? inv.reInvitesCount ?? inv.reinvite_count ?? inv.attemptsCount ?? 0,
      createdAt: inv.createdAtUtc || inv.createdAt || new Date().toISOString(),
    };
  }));

  // Group invitations by invitee: aggregate attempt counts and prioritize 'accepted' > 'pending' > 'rejected'
  const statusPriority: Record<string, number> = { accepted: 3, pending: 2, rejected: 1 };
  const groupedInvitesMap = new Map<string, { main: ClicInvitationDetail; totalAttempts: number }>();

  for (const inv of invitations) {
    const key = (inv.invitedUserId || inv.platformUserId || inv.email || inv.phone || inv.memberContact || inv.inviteeContact || inv.inviteeName || '').toLowerCase().trim();
    if (!key || key === 'n/a' || key === 'invitee') {
      groupedInvitesMap.set(inv.id, { main: inv, totalAttempts: Math.max(1, (inv.reinviteCount ?? 0) + 1) });
      continue;
    }

    const existingGroup = groupedInvitesMap.get(key);
    if (!existingGroup) {
      groupedInvitesMap.set(key, { main: inv, totalAttempts: Math.max(1, (inv.reinviteCount ?? 0) + 1) });
    } else {
      const existingInv = existingGroup.main;
      const existingPriority = statusPriority[existingInv.status?.toLowerCase()] || 0;
      const currentPriority = statusPriority[inv.status?.toLowerCase()] || 0;

      const newTotalAttempts = Math.max(existingGroup.totalAttempts + 1, (inv.reinviteCount ?? 0) + 1);

      if (currentPriority > existingPriority) {
        groupedInvitesMap.set(key, { main: { ...inv, reinviteCount: Math.max(inv.reinviteCount ?? 0, newTotalAttempts - 1) }, totalAttempts: newTotalAttempts });
      } else if (currentPriority === existingPriority) {
        const existingTime = new Date(existingInv.createdAt).getTime();
        const currentTime = new Date(inv.createdAt).getTime();
        const winner = currentTime >= existingTime ? inv : existingInv;
        groupedInvitesMap.set(key, { main: { ...winner, reinviteCount: Math.max(winner.reinviteCount ?? 0, newTotalAttempts - 1) }, totalAttempts: newTotalAttempts });
      } else {
        groupedInvitesMap.set(key, { main: { ...existingInv, reinviteCount: Math.max(existingInv.reinviteCount ?? 0, newTotalAttempts - 1) }, totalAttempts: newTotalAttempts });
      }
    }
  }

  const deduplicatedInvitations = Array.from(groupedInvitesMap.values()).map(g => ({
    ...g.main,
    reinviteCount: Math.max(g.main.reinviteCount ?? 0, g.totalAttempts - 1),
  }));

  return {
    ...item,
    id: item?.clicId || item?.id || item?.groupId || id,
    clicId: item?.clicId || item?.id || id,
    name: item?.name || '',
    description: item?.description || '',
    status: item?.status || 'active',
    memberCount: item?.memberCount ?? item?.numberCount ?? members.length,
    pendingInvitationCount: item?.pendingInvitationCount ?? deduplicatedInvitations.filter(i => i.status === 'pending').length,
    role: item?.role || 'admin',
    members,
    invitations: deduplicatedInvitations,
    createdAt: item?.createdAt || item?.createdAtUtc || new Date().toISOString(),
    createdAtUtc: item?.createdAtUtc || item?.createdAt,
    updatedAtUtc: item?.updatedAtUtc,
    amount: item?.amount ?? 0,
    currency: item?.currency || 'NGN',
    frequency: item?.frequency || 'monthly',
    currentCycle: item?.currentCycle ?? 0,
    totalCycles: item?.totalCycles ?? 12,
  };
};

export interface ClicInvitationItem {
  id: string;
  invitationId?: string;
  clicId: string;
  groupName?: string;
  clicName?: string;
  inviterName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAtUtc?: string;
  createdAt?: string;
}

export const getMyClicInvitations = async (): Promise<ClicInvitationItem[]> => {
  const response = await apiRequest<any[]>('/api/clics/invitations/me');
  return (response || []).map((item, idx) => ({
    ...item,
    id: item.invitationId || item.id || `clic_inv_${idx}`,
    invitationId: item.invitationId || item.id,
    clicId: item.clicId || item.groupId || item.clic?.id,
    groupName: item.groupName || item.clicName || item.clic?.name || item.name || 'Group',
    inviterName: item.inviterName || item.invitedBy || item.inviter?.fullName || item.inviter?.name,
    status: item.status || 'pending',
  }));
};

export const acceptClicInvitation = async (clicId: string, invitationId: string): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}/accept`, {
    method: 'POST',
  });
};

export const rejectClicInvitation = async (clicId: string, invitationId: string): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}/reject`, {
    method: 'POST',
  });
};

export const createClic = async (input: CreateClicInput): Promise<ClicGroup> => {
  const item = await apiRequest<any>('/api/clics', {
    method: 'POST',
    json: {
      name: input.name.trim(),
      description: input.description?.trim() || '',
      members: input.members || [],
    },
  });

  return {
    ...item,
    id: item?.clicId || item?.id,
    clicId: item?.clicId || item?.id,
    name: item?.name || '',
    description: item?.description || '',
    status: item?.status || 'active',
    memberCount: item?.memberCount ?? (Array.isArray(item?.members) ? item.members.filter((m: any) => (m.status || 'active') === 'active').length : 0),
    pendingInvitationCount: item?.pendingInvitationCount ?? 0,
    role: item?.role || 'admin',
    members: mapClicMembers(Array.isArray(item?.members) ? item.members : []),
    maxMembers: item?.maxMembers ?? (Array.isArray(item?.members) ? item.members.length : 0),
    createdAt: item?.createdAt || item?.createdAtUtc || new Date().toISOString(),
    createdAtUtc: item?.createdAtUtc || item?.createdAt,
    updatedAtUtc: item?.updatedAtUtc,
    amount: item?.amount ?? 0,
    currency: item?.currency || 'NGN',
    frequency: item?.frequency || 'monthly',
    currentCycle: item?.currentCycle ?? 0,
    totalCycles: item?.totalCycles ?? 12,
  };
};

export interface UpdateClicInput {
  name: string;
  description?: string;
}

export const updateClic = async (clicId: string, input: UpdateClicInput): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}`, {
    method: 'PUT',
    json: {
      name: input.name.trim(),
      description: input.description?.trim() || '',
    },
  });
};

export const deleteClic = async (clicId: string): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}`, {
    method: 'DELETE',
  });
};

export interface AddClicMemberInput {
  platformUserId?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
}

export const addClicMember = async (clicId: string, input: AddClicMemberInput): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/members`, {
    method: 'POST',
    json: {
      platformUserId: input.platformUserId || undefined,
      displayName: input.displayName?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phoneNumber: input.phoneNumber?.trim() || undefined,
    },
  });
};

export interface CreateClicInvitationInput {
  platformUserId?: string;
  displayName?: string;
  memberContact?: string;
  email?: string;
  phoneNumber?: string;
  channel?: string;
}

export const createClicInvitation = async (clicId: string, input: CreateClicInvitationInput): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/invitations`, {
    method: 'POST',
    json: {
      platformUserId: input.platformUserId || undefined,
      invitedUserId: input.platformUserId || undefined,
      displayName: input.displayName?.trim() || undefined,
      inviteeName: input.displayName?.trim() || undefined,
      memberContact: input.memberContact?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phoneNumber: input.phoneNumber?.trim() || undefined,
      channel: input.channel || undefined,
    },
  });
};

export const resendClicInvitation = async (clicId: string, invitationId: string): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}/resend`, {
    method: 'POST',
  });
};

export const removeClicMember = async (clicId: string, memberId: string): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/members/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
};

export const removeClicInvitation = async (clicId: string, invitationId: string): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/invitations/${encodeURIComponent(invitationId)}`, {
    method: 'DELETE',
  });
};

export interface UpdateClicMembersBatchItem {
  memberId: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface UpdateClicMembersBatchInput {
  members: UpdateClicMembersBatchItem[];
}

export const updateClicMembersBatch = async (
  clicId: string,
  input: UpdateClicMembersBatchInput
): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/members`, {
    method: 'PUT',
    json: {
      members: input.members.map(m => ({
        memberId: m.memberId,
        displayName: m.displayName?.trim() || undefined,
        email: m.email?.trim() || undefined,
        phoneNumber: m.phoneNumber?.trim() || undefined,
      })),
    },
  });
};

export interface UpdateClicMemberInput {
  displayName?: string;
  email?: string;
  phoneNumber?: string;
}

export const updateClicMember = async (
  clicId: string,
  memberId: string,
  input: UpdateClicMemberInput
): Promise<void> => {
  await apiRequest(`/api/clics/${encodeURIComponent(clicId)}/members/${encodeURIComponent(memberId)}`, {
    method: 'PUT',
    json: {
      displayName: input.displayName?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phoneNumber: input.phoneNumber?.trim() || undefined,
    },
  });
};
