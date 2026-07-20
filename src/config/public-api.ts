function joinApiUrl(api: string, endPoint: string): string {
  return `${api.replace(/\/$/, '')}${endPoint.startsWith('/') ? endPoint : `/${endPoint}`}`;
}

/**
 * Browser-facing API base URL.
 * - explicit URL: direct FE -> BE
 * - default: http://localhost:8081
 */
export function getPublicApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (url) {
    return url.replace(/\/$/, '');
  }

  return 'http://localhost:8081';
}

export { joinApiUrl };
