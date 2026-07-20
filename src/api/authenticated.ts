import { getPublicApiBaseUrl } from 'src/config/public-api';
import { apiDelete, apiGet, apiPatch, apiPost } from 'src/utils/api';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type AuthenticatedApi = {
  get: <TResponse>(endPoint: string, params?: QueryParams) => Promise<TResponse>;
  post: <TResponse, TBody = unknown>(endPoint: string, body?: TBody) => Promise<TResponse>;
  patch: <TResponse, TBody = unknown>(endPoint: string, body?: TBody) => Promise<TResponse>;
  delete: <TResponse>(endPoint: string) => Promise<TResponse>;
};

export function createAuthenticatedApi(token: string): AuthenticatedApi {
  const api = getPublicApiBaseUrl();

  return {
    get: <TResponse>(endPoint: string, params?: QueryParams) =>
      apiGet<TResponse>({ api, endPoint, params, token }),
    post: <TResponse, TBody = unknown>(endPoint: string, body?: TBody) =>
      apiPost<TResponse, TBody>({ api, endPoint, body, token }),
    patch: <TResponse, TBody = unknown>(endPoint: string, body?: TBody) =>
      apiPatch<TResponse, TBody>({ api, endPoint, body, token }),
    delete: <TResponse>(endPoint: string) =>
      apiDelete<TResponse>({ api, endPoint, token }),
  };
}
