import Head from 'next/head';

import { LoginForm } from 'src/components/auth/LoginForm';
import { APP_BRAND_SHORT_NAME, APP_LOGIN_BG_SRC, APP_ORG_NAME } from 'src/constants/branding';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Đăng nhập · {APP_BRAND_SHORT_NAME}</title>
        <meta
          name="description"
          content={`Đăng nhập hệ thống ${APP_BRAND_SHORT_NAME} — ${APP_ORG_NAME}.`}
        />
      </Head>
      <main
        className="relative flex w-full flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-6 sm:py-8"
        style={{ backgroundImage: `url(${APP_LOGIN_BG_SRC})` }}>
        <div aria-hidden className="absolute inset-0 bg-slate-900/45" />
        <div className="relative z-10 w-full max-w-md">
          <LoginForm />
        </div>
      </main>
    </>
  );
}
