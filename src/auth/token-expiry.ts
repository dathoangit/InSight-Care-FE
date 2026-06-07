import { getTokenExpiresAt, setTokenExpiresAt } from './storage';

export function resolveTokenExpiresAtMs(
  accessToken: string,
  expiresInSeconds?: number,
): number | null {
  if (typeof expiresInSeconds === 'number' && expiresInSeconds > 0) {
    return Date.now() + expiresInSeconds * 1000;
  }

  const stored = getTokenExpiresAt();
  if (stored !== null) {
    return stored;
  }

  return decodeJwtExpiresAtMs(accessToken);
}

export function persistTokenExpiry(
  accessToken: string,
  expiresInSeconds: number,
): number {
  const expiresAtMs = Date.now() + expiresInSeconds * 1000;
  setTokenExpiresAt(expiresAtMs);
  return expiresAtMs;
}

export function isAccessTokenExpired(now = Date.now()): boolean {
  const expiresAt = getTokenExpiresAt();
  if (expiresAt === null) {
    return false;
  }

  return now >= expiresAt;
}

function decodeJwtExpiresAtMs(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1])) as { exp?: unknown };
    if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }
  } catch {
    return null;
  }

  return null;
}
