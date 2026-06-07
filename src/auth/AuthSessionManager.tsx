import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAuth } from './context';
import { setUnauthorizedHandler } from './unauthorized';

export function AuthSessionManager() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();

      if (router.pathname !== '/login') {
        void router.replace('/login');
      }
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout, router]);

  return null;
}
