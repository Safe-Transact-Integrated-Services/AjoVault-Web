import { apiRequest } from '@/lib/api/http';

export interface AdminAgentProfile {
  agentUserId: string;
  agentCode: string;
  fullName: string;
  phoneNumber: string;
  tier: 'basic' | 'standard' | 'super';
  status: 'active' | 'suspended';
  state: string;
  lga?: string | null;
  location: string;
  floatBalance: number;
  commissionBalance: number;
  approvedAtUtc: string;
  updatedAtUtc: string;
}

export interface AdminAgentApplication {
  applicationId: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  state: string;
  lga?: string | null;
  location: string;
  idType: 'nin' | 'drivers' | 'voters' | 'passport';
  idDocumentName?: string | null;
  idDocumentDataUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  submittedAtUtc: string;
  reviewedAtUtc?: string | null;
}

export interface AdminAgentListItem {
  userId: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  role: string;
  profile?: AdminAgentProfile | null;
  application?: AdminAgentApplication | null;
}

interface AdminAgentListResponse {
  items: AdminAgentListItem[];
}

export const getAdminAgents = async (): Promise<AdminAgentListItem[]> => {
  const response = await apiRequest<AdminAgentListResponse>('/api/agents/admin/agents');
  return response.items;
};

export const approveAdminAgentApplication = (applicationId: string, tier: AdminAgentProfile['tier'], reviewNote?: string) =>
  apiRequest<AdminAgentProfile>(`/api/agents/admin/applications/${encodeURIComponent(applicationId)}/approve`, {
    method: 'POST',
    json: {
      tier,
      reviewNote: reviewNote?.trim() || null,
    },
  });

export const rejectAdminAgentApplication = (applicationId: string, reviewNote: string) =>
  apiRequest<AdminAgentApplication>(`/api/agents/admin/applications/${encodeURIComponent(applicationId)}/reject`, {
    method: 'POST',
    json: {
      reviewNote: reviewNote.trim(),
    },
  });

export const updateAdminAgentStatus = (agentUserId: string, status: AdminAgentProfile['status']) =>
  apiRequest<AdminAgentProfile>(`/api/agents/admin/profiles/${encodeURIComponent(agentUserId)}/status`, {
    method: 'PATCH',
    json: { status },
  });

export const updateAdminAgentFloat = (agentUserId: string, floatBalance: number) =>
  apiRequest<AdminAgentProfile>(`/api/agents/admin/profiles/${encodeURIComponent(agentUserId)}/float`, {
    method: 'PATCH',
    json: { floatBalance },
  });
