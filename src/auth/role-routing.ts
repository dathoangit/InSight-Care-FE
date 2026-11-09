import type { AuthRole } from './types';

export const HOME_PATH = '/';
export const ADMIN_USERS_PATH = '/admin/users';
export const ADMIN_LAYOUT_PATH = '/admin/layout';

export function isAdmin(role: AuthRole | null | undefined): boolean {
  return role === 'ADMIN';
}

/** Where to send the user right after a successful login (or when visiting /login while already authenticated). */
export function getDefaultLandingPath(role: AuthRole): string {
  void role;
  return HOME_PATH;
}
