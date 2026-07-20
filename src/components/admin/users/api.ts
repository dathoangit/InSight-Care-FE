import { type AuthenticatedApi } from 'src/api/authenticated';
import type { AuthRole } from 'src/auth/types';

import type {
  AdminUser,
  AdminUsersListResponse,
  CreateAdminUserBody,
  UpdateAdminUserBody,
  UpdateAdminUserRoleBody,
} from './types';

export function listAdminUsers(
  api: AuthenticatedApi,
  params?: { limit?: number; offset?: number },
): Promise<AdminUsersListResponse> {
  return api.get<AdminUsersListResponse>('/admin/users', params);
}

export function createAdminUser(
  api: AuthenticatedApi,
  body: CreateAdminUserBody,
): Promise<AdminUser> {
  return api.post<AdminUser, CreateAdminUserBody>('/admin/users', body);
}

export function updateAdminUser(
  api: AuthenticatedApi,
  userId: string,
  body: UpdateAdminUserBody,
): Promise<AdminUser> {
  return api.patch<AdminUser, UpdateAdminUserBody>(`/admin/users/${userId}`, body);
}

export function updateAdminUserRole(
  api: AuthenticatedApi,
  userId: string,
  role: AuthRole,
): Promise<AdminUser> {
  return api.patch<AdminUser, UpdateAdminUserRoleBody>(`/admin/users/${userId}/role`, {
    role,
  });
}

export function deactivateAdminUser(
  api: AuthenticatedApi,
  userId: string,
): Promise<AdminUser> {
  return api.delete<AdminUser>(`/admin/users/${userId}`);
}
