import type { User } from '@/types';

export interface RedirectTarget {
  pathname?: string;
  search?: string;
  hash?: string;
}

export const getDefaultAuthenticatedPath = (user: Pick<User, 'role'>) => {
  switch (user.role) {
    case 'super-admin':
      return '/admin/dashboard';
    case 'agent':
      return '/agent';
    default:
      return '/dashboard';
  }
};

export const getDefaultUserLoginPath = (user: Pick<User, 'role'>) => {
  switch (user.role) {
    default:
      return '/dashboard';
  }
};

export const getRedirectPath = (target?: RedirectTarget | null) => {
  const pathname = target?.pathname?.trim();
  if (!pathname) {
    return null;
  }

  return `${pathname}${target?.search ?? ''}${target?.hash ?? ''}`;
};
