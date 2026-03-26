import { apiRequest } from '@/lib/api/http';

export interface AdminUserListItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  kycTier: 'none' | 'basic' | 'verified' | 'premium';
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
}

interface AdminUsersPageResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: AdminUserListItem[];
}

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  list: (pageSize = 1000) => [...adminUsersKeys.all, pageSize] as const,
};

export const getAdminUsers = async (pageSize = 1000): Promise<AdminUsersPageResponse> =>
  apiRequest<AdminUsersPageResponse>(`/api/identity/users?page=1&pageSize=${pageSize}`);

export const updateAdminUserStatus = (userId: string, isActive: boolean) =>
  apiRequest<AdminUserListItem>(`/api/identity/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    json: { isActive },
  });
