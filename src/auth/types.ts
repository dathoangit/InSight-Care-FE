export type AuthRole = 'DOCTOR' | 'NURSE' | 'ADMIN';

export type AuthLoginRequest = {
  username: string;
  password: string;
};

export type AuthToken = {
  accessToken: string;
  expiresIn: number;
};

/** Login envelope data contains token metadata plus the current user profile. */
export type AuthLoginResponse = {
  token: AuthToken;
  user: AuthMeResponse;
};

export type AuthMeResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  fullName: string;
  email?: string | null;
  role: AuthRole;
  isActive: boolean;
};
