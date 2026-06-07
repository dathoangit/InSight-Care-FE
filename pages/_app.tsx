import 'src/styles/global.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { AuthSessionManager } from 'src/auth/AuthSessionManager';
import { AuthProvider, useAuth } from 'src/auth/context';
import { getDefaultLandingPath } from 'src/auth/role-routing';
import { AppShell } from 'src/components/shell/AppShell';

const PROTECTED_PATHS = ['/'];
const PUBLIC_PATHS = ['/login', '/404'];

function isPathPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/');
}

function isPathProtected(pathname: string): boolean {
  return PROTECTED_PATHS.includes(pathname);
}

function AuthGate({ children }: { children: JSX.Element }) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const path = router.pathname;
  const isPublic = isPathPublic(path);
  const isProtected = isPathProtected(path);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!isAuthenticated && isProtected) {
      void router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublic && path === '/login') {
      if (!user) {
        return;
      }
      void router.replace(getDefaultLandingPath(user.role));
    }
  }, [
    isAuthenticated,
    isBootstrapping,
    isProtected,
    isPublic,
    path,
    router,
    user,
  ]);

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">Checking auth session...</p>
      </main>
    );
  }

  if (!isAuthenticated && isProtected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">Redirecting to login...</p>
      </main>
    );
  }

  if (isAuthenticated && path === '/login') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">Redirecting to home...</p>
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthSessionManager />
      <AuthGate>
        <Component {...pageProps} />
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
