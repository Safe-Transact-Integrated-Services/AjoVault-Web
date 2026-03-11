import type { User } from '@/types';

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
    case 'agent':
      return '/agent';
    default:
      return '/dashboard';
  }
};
