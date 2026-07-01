import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, type FormEvent } from 'react';
import { useAuth } from 'src/auth/context';
import { getDefaultLandingPath } from 'src/auth/role-routing';
import { APP_BRAND_SHORT_NAME, APP_ORG_NAME } from 'src/constants/branding';
import { ApiError } from 'src/utils/api';

const INVALID_CREDENTIALS_MESSAGE = 'Sai tên đăng nhập hoặc mật khẩu.';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <>
      <Head>
        <title>Đăng nhập · {APP_BRAND_SHORT_NAME}</title>
        <meta
          name="description"
          content={`Đăng nhập hệ thống ${APP_BRAND_SHORT_NAME} — ${APP_ORG_NAME}.`}
        />
      </Head>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:py-12">
        <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-red-700">{APP_BRAND_SHORT_NAME}</h1>
            <p className="mt-2 text-sm text-slate-600">{APP_ORG_NAME}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
