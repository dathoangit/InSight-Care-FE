import { getPublicApiBaseUrl } from 'src/config/public-api';
import { apiPost } from 'src/utils/api';
import type { AuthLoginRequest, AuthLoginResponse } from './types';

export function login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
  return apiPost<AuthLoginResponse, AuthLoginRequest>({
    api: getPublicApiBaseUrl(),
    endPoint: '/auth/login',
    body,
  });
}
