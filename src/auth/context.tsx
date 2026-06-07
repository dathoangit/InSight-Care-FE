import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAccessToken,
  getAccessToken,
  getAuthUserJson,
  getTokenExpiresAt,
  setAccessToken,
  setAuthUserJson,
  setTokenExpiresAt,
} from './storage';
import { login as loginApi } from './api';
import {
  isAccessTokenExpired,
  persistTokenExpiry,
  resolveTokenExpiresAtMs,
} from './token-expiry';
import type { AuthLoginRequest, AuthLoginResponse, AuthMeResponse, AuthRole } from './types';

const VALID_ROLES: AuthRole[] = ['DOCTOR', 'NURSE', 'ADMIN'];

function isAuthRole(value: string): value is AuthRole {
  return VALID_ROLES.includes(value as AuthRole);
}

function userFromLoginResponse(res: AuthLoginResponse): AuthMeResponse {
  return res.user;
}

function parseStoredUser(raw: string): AuthMeResponse | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthMeResponse>;
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.createdAt === 'string' &&
      typeof parsed.updatedAt === 'string' &&
      typeof parsed.username === 'string' &&
      typeof parsed.role === 'string' &&
      isAuthRole(parsed.role) &&
      typeof parsed.isActive === 'boolean'
    ) {
      return parsed as AuthMeResponse;
    }
  } catch {
    /* ignore */
  }
  return null;
}

type AuthContextValue = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthMeResponse | null;
  role: AuthRole | null;
  login: (body: AuthLoginRequest) => Promise<AuthMeResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthMeResponse | null>(null);

  const logout = useCallback(() => {
    clearAccessToken();
    setAccessTokenState(null);
    setUser(null);
  }, []);

  const login = useCallback(async (body: AuthLoginRequest) => {
    const loginRes = await loginApi(body);
    const profile = userFromLoginResponse(loginRes);
    const { accessToken: token, expiresIn } = loginRes.token;
    persistTokenExpiry(token, expiresIn);
    setAccessToken(token);
    setAuthUserJson(JSON.stringify(profile));
    setAccessTokenState(token);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const token = getAccessToken();
      if (!token) {
        if (active) {
          setIsBootstrapping(false);
        }
        return;
      }

      const expiresAtMs = resolveTokenExpiresAtMs(token);
      if (expiresAtMs !== null) {
        setTokenExpiresAt(expiresAtMs);
      }

      if (isAccessTokenExpired()) {
        clearAccessToken();
        if (active) {
          setAccessTokenState(null);
          setUser(null);
          setIsBootstrapping(false);
        }
        return;
      }

      const rawUser = getAuthUserJson();
      const profile = rawUser ? parseStoredUser(rawUser) : null;
      if (!profile) {
        clearAccessToken();
        if (active) {
          setAccessTokenState(null);
          setUser(null);
          setIsBootstrapping(false);
        }
        return;
      }

      if (active) {
        setAccessTokenState(token);
        setUser(profile);
        setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [logout]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const expiresAt = getTokenExpiresAt();
    if (expiresAt === null) {
      return;
    }

    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(accessToken && user),
      accessToken,
      user,
      role: user?.role ?? null,
      login,
      logout,
    }),
    [accessToken, isBootstrapping, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
