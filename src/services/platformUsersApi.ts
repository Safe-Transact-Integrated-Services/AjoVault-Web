import { apiRequest } from '@/lib/api/http';

interface PlatformUserLookupResponse {
  userId: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface PlatformUserSearchResult {
  userId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export const platformUsersKeys = {
  search: (query: string) => ['platform-users', 'search', query] as const,
};

export const searchPlatformUsers = async (query: string, take = 8): Promise<PlatformUserSearchResult[]> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const response = await apiRequest<PlatformUserLookupResponse[]>(
    `/api/identity/platform-users/search?query=${encodeURIComponent(normalizedQuery)}&take=${take}`,
  );

  return response.map(user => ({
    userId: user.userId,
    fullName: user.fullName,
    email: user.email ?? undefined,
    phoneNumber: user.phoneNumber ?? undefined,
  }));
};
