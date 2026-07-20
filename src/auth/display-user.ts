import type { AuthMeResponse, AuthRole } from './types';

const ROLE_LABELS: Record<AuthRole, string> = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
};

/** Display label for auth role (matches triage staff wording). */
export function formatAuthRoleLabel(role: AuthRole): string {
  return ROLE_LABELS[role];
}

/** Derive staff code from username suffix digits, e.g. dieuduong1 → 001. */
export function deriveStaffCode(username: string): string {
  const match = username.match(/(\d+)$/);

  if (!match) {
    return '—';
  }

  return match[1].padStart(3, '0');
}

export type UserAccountDetails = {
  fullName: string;
  username: string;
  roleLabel: string;
  department: string;
  staffCode: string;
};

export function getUserAccountDetails(
  user: AuthMeResponse,
  department = 'Khoa Nội',
): UserAccountDetails {
  return {
    fullName: user.fullName?.trim() || user.username,
    username: user.username,
    roleLabel: formatAuthRoleLabel(user.role),
    department,
    staffCode: deriveStaffCode(user.username),
  };
}
