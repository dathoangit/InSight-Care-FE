import Image from 'next/image';
import type { FormEvent } from 'react';

import { APP_BRAND_SHORT_NAME, APP_LOGO_SRC, APP_ORG_NAME } from 'src/constants/branding';

import { useLoginForm } from './useLoginForm';

export function LoginForm() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    pending,
    error,
    handleSubmit,
  } = useLoginForm();

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 text-center">
        <Image
          src={APP_LOGO_SRC}
          alt={APP_ORG_NAME}
          width={80}
          height={80}
          priority
          className="mx-auto h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm sm:h-20 sm:w-20"
        />
        <h1 className="mt-4 text-2xl font-bold text-red-700">{APP_BRAND_SHORT_NAME}</h1>
        <p className="mt-2 text-sm text-slate-600">{APP_ORG_NAME}</p>
      </div>

      <form
        onSubmit={(e: FormEvent) => void handleSubmit(e)}
        className="space-y-4"
        noValidate>
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
  );
}
