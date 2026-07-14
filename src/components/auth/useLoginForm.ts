import { useRouter } from 'next/router';
import { useState, type FormEvent } from 'react';

import { useAuth } from 'src/auth/context';
import { getDefaultLandingPath } from 'src/auth/role-routing';
import { ApiError } from 'src/utils/api';

const INVALID_CREDENTIALS_MESSAGE = 'Sai tên đăng nhập hoặc mật khẩu.';
const DEV_LOGIN_USERNAME = 'admin';
const DEV_LOGIN_PASSWORD = '0123456789';
const isDev = process.env.NODE_ENV === 'development';

export function useLoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState(isDev ? DEV_LOGIN_USERNAME : '');
  const [password, setPassword] = useState(isDev ? DEV_LOGIN_PASSWORD : '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password.trim()) {
      setError(INVALID_CREDENTIALS_MESSAGE);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const me = await login({
        username: normalizedUsername,
        password,
      });
      await router.replace(getDefaultLandingPath(me.role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      console.error('[login] Login request failed.', err);
      setError('Không thể đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setPending(false);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    pending,
    error,
    handleSubmit,
  };
}
