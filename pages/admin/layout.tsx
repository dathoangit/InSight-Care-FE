import Head from 'next/head';

import { AdminLayoutPage } from 'src/components/admin/layout/AdminLayoutPage';
import { APP_BRAND_SHORT_NAME, APP_ORG_NAME } from 'src/constants/branding';

export default function AdminLayoutRoutePage() {
  return (
    <>
      <Head>
        <title>{APP_BRAND_SHORT_NAME} · Quản lý giường</title>
        <meta
          name="description"
          content={`Quản lý giường bệnh — ${APP_ORG_NAME}.`}
        />
      </Head>
      <AdminLayoutPage />
    </>
  );
}
