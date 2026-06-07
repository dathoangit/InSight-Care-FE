import Head from 'next/head';

import { DashboardPage } from 'src/components/shell/DashboardPage';
import { APP_BRAND_SHORT_NAME, APP_ORG_NAME } from 'src/constants/branding';

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>{APP_BRAND_SHORT_NAME} · Chỉ số sinh tồn</title>
        <meta
          name="description"
          content={`Theo dõi chỉ số sinh tồn theo giường bệnh — ${APP_ORG_NAME}.`}
        />
      </Head>
      <DashboardPage />
    </>
  );
}
