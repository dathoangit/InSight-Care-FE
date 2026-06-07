const ACCESS_TOKEN_KEY = 'triage.auth.accessToken';
const AUTH_USER_KEY = 'triage.auth.user';
const TOKEN_EXPIRES_AT_KEY = 'triage.auth.expiresAt';

let memoryAccessToken: string | null = null;

const canUseStorage = (): boolean => typeof window !== 'undefined';

export function setAccessToken(token: string): void {
  memoryAccessToken = token;
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function setAuthUserJson(json: string): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(AUTH_USER_KEY, json);
}

export function getAuthUserJson(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(AUTH_USER_KEY);
}

export function setTokenExpiresAt(expiresAtMs: number): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAtMs));
}

export function getTokenExpiresAt(): number | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAccessToken(): string | null {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }
  if (!canUseStorage()) {
    return null;
  }
  const stored = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (stored) {
    memoryAccessToken = stored;
  }
  return stored;
}

export function clearAccessToken(): void {
  memoryAccessToken = null;
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
}
