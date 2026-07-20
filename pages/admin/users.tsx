import Head from 'next/head';

import { AdminUsersPage } from 'src/components/admin/users/AdminUsersPage';
import { APP_BRAND_SHORT_NAME, APP_ORG_NAME } from 'src/constants/branding';

export default function AdminUsersRoutePage() {
  return (
    <>
      <Head>
        <title>{APP_BRAND_SHORT_NAME} · Quản lý tài khoản</title>
        <meta
          name="description"
          content={`Quản lý tài khoản nhân viên — ${APP_ORG_NAME}.`}
        />
      </Head>
      <AdminUsersPage />
    </>
  );
}
