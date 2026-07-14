const PROXY_API_PATH = '/backend';

function joinApiUrl(api: string, endPoint: string): string {
  return `${api.replace(/\/$/, '')}${endPoint.startsWith('/') ? endPoint : `/${endPoint}`}`;
}

/**
 * Browser-facing API base URL.
 * - `proxy`: same-origin `/backend` (for ngrok FE + phone testing)
 * - explicit URL: direct FE -> BE
 * - default: http://localhost:8081
 */
export function getPublicApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (url === 'proxy') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${PROXY_API_PATH}`;
    }

    return `http://localhost:3000${PROXY_API_PATH}`;
  }

  if (url) {
    return url.replace(/\/$/, '');
  }

  return 'http://localhost:8081';
}

export { joinApiUrl, PROXY_API_PATH };
