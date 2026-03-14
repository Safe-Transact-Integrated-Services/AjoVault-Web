import { apiRequest } from '@/lib/api/http';

export type SupportCategory =
  | 'account'
  | 'payment'
  | 'savings'
  | 'circle'
  | 'group_goal'
  | 'fundraising'
  | 'verification'
  | 'agent_transaction'
  | 'agent_settlement'
  | 'agent_float'
  | 'other';

export type SupportStatus = 'open' | 'in_review' | 'resolved';
export type SupportPriority = 'low' | 'medium' | 'high' | 'critical';
export type SupportRequesterRole = 'customer' | 'agent';

export interface SupportFaq {
  faqId: string;
  question: string;
  answer: string;
  category: string;
  link?: string | null;
}

export interface SupportRequest {
  requestId: string;
  requesterRole: SupportRequesterRole;
  category: SupportCategory;
  categoryLabel: string;
  priority: SupportPriority;
  subject: string;
  message: string;
  relatedReference?: string | null;
  relatedCustomerIdentifier?: string | null;
  adminResponse?: string | null;
  status: SupportStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  resolvedAtUtc?: string | null;
}

export interface SupportOverview {
  faqs: SupportFaq[];
  requests: SupportRequest[];
}

export interface CreateSupportRequestInput {
  category: SupportCategory;
  priority?: SupportPriority;
  subject: string;
  message: string;
  relatedReference?: string;
  relatedCustomerIdentifier?: string;
}

export interface AdminSupportRequest {
  requestId: string;
  requesterUserId: string;
  requesterRole: SupportRequesterRole;
  requesterFullName: string;
  requesterEmail?: string | null;
  requesterPhoneNumber?: string | null;
  category: SupportCategory;
  categoryLabel: string;
  priority: SupportPriority;
  subject: string;
  message: string;
  relatedReference?: string | null;
  relatedCustomerIdentifier?: string | null;
  adminResponse?: string | null;
  status: SupportStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  resolvedAtUtc?: string | null;
}

interface AdminSupportRequestListResponse {
  items: AdminSupportRequest[];
}

export interface UpdateAdminSupportRequestInput {
  requestId: string;
  status: SupportStatus;
  adminResponse?: string;
}

export const supportKeys = {
  all: ['support'] as const,
  me: ['support', 'me'] as const,
  agentMe: ['support', 'agent', 'me'] as const,
  adminAll: ['support', 'admin', 'all'] as const,
};

export const getMySupportOverview = () =>
  apiRequest<SupportOverview>('/api/support/me');

export const getMyAgentSupportOverview = () =>
  apiRequest<SupportOverview>('/api/agents/support/me');

export const createSupportRequest = (input: CreateSupportRequestInput) =>
  apiRequest<SupportRequest>('/api/support/requests', {
    method: 'POST',
    json: {
      category: input.category,
      priority: input.priority ?? null,
      subject: input.subject,
      message: input.message,
      relatedReference: input.relatedReference?.trim() || null,
      relatedCustomerIdentifier: input.relatedCustomerIdentifier?.trim() || null,
    },
  });

export const createAgentSupportRequest = (input: CreateSupportRequestInput) =>
  apiRequest<SupportRequest>('/api/agents/support/requests', {
    method: 'POST',
    json: {
      category: input.category,
      priority: input.priority ?? null,
      subject: input.subject,
      message: input.message,
      relatedReference: input.relatedReference?.trim() || null,
      relatedCustomerIdentifier: input.relatedCustomerIdentifier?.trim() || null,
    },
  });

export const getAdminSupportRequests = async (): Promise<AdminSupportRequest[]> => {
  const response = await apiRequest<AdminSupportRequestListResponse>('/api/support/admin/requests');
  return response.items;
};

export const updateAdminSupportRequest = (input: UpdateAdminSupportRequestInput) =>
  apiRequest<AdminSupportRequest>(`/api/support/admin/requests/${encodeURIComponent(input.requestId)}`, {
    method: 'PATCH',
    json: {
      status: input.status,
      adminResponse: input.adminResponse?.trim() || null,
    },
  });
