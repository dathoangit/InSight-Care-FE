import { getPublicApiBaseUrl } from 'src/config/public-api';
import { apiGet, apiPost } from 'src/utils/api';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type AuthenticatedApi = {
  get: <TResponse>(endPoint: string, params?: QueryParams) => Promise<TResponse>;
  post: <TResponse, TBody = unknown>(endPoint: string, body?: TBody) => Promise<TResponse>;
};

export function createAuthenticatedApi(token: string): AuthenticatedApi {
  const api = getPublicApiBaseUrl();

  return {
    get: <TResponse>(endPoint: string, params?: QueryParams) =>
      apiGet<TResponse>({ api, endPoint, params, token }),
    post: <TResponse, TBody = unknown>(endPoint: string, body?: TBody) =>
      apiPost<TResponse, TBody>({ api, endPoint, body, token }),
  };
}
