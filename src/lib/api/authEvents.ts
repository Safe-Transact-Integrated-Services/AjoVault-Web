export const AUTH_SESSION_EXPIRED_EVENT = 'ajovault:auth-session-expired';

export const notifyAuthSessionExpired = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
};
