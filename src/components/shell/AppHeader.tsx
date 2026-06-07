import Image from 'next/image';
import Link from 'next/link';

import { HOME_PATH } from 'src/auth/role-routing';
import { useAuth } from 'src/auth/context';
import {
  APP_BRAND_SHORT_NAME,
  APP_BRAND_THEME,
  APP_LOGO_SRC,
  APP_ORG_NAME,
} from 'src/constants/branding';

import { UserAccountMenu } from './UserAccountMenu';

export function AppHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header
      className={`print:hidden w-full border-b ${APP_BRAND_THEME.header.border} ${APP_BRAND_THEME.header.bg} ${APP_BRAND_THEME.header.text}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href={HOME_PATH}
          className="inline-flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-red-700 sm:gap-3">
          <Image
            src={APP_LOGO_SRC}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-lg bg-white/95 object-contain p-0.5 sm:h-10 sm:w-10"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold sm:text-base">
              {APP_BRAND_SHORT_NAME}
            </p>
            <p
              className={`hidden truncate text-xs sm:block ${APP_BRAND_THEME.header.subtle} sm:text-sm`}>
              {APP_ORG_NAME}
            </p>
          </div>
        </Link>

        {isAuthenticated ? <UserAccountMenu className="shrink-0" /> : null}
      </div>
    </header>
  );
}
