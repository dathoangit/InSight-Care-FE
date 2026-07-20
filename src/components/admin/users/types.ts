import type { AuthRole } from 'src/auth/types';

export type AdminUser = {
  id: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  fullName: string;
  email?: string | null;
  emailVerifiedAt?: string | null;
  role: AuthRole;
  isActive: boolean;
};

export type AdminUsersListResponse = {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateAdminUserBody = {
  username: string;
  fullName: string;
  password?: string;
  email?: string | null;
  role: AuthRole;
  isActive?: boolean;
};

export type UpdateAdminUserBody = {
  username?: string;
  fullName?: string;
  email?: string | null;
  isActive?: boolean;
  password?: string;
};

export type UpdateAdminUserRoleBody = {
  role: AuthRole;
};
