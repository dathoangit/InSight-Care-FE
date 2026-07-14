import Link from 'next/link';

import { HOME_PATH } from 'src/auth/role-routing';
import {
  APP_BRAND_SHORT_NAME,
  APP_BRAND_THEME,
  APP_IT_DEPARTMENT_NAME,
  APP_ORG_NAME,
} from 'src/constants/branding';

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`print:hidden mt-auto w-full border-t ${APP_BRAND_THEME.footer.border} ${APP_BRAND_THEME.footer.bg} ${APP_BRAND_THEME.footer.text}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={`space-y-1 text-sm ${APP_BRAND_THEME.footer.muted}`}>
            <p>
              © {year} {APP_ORG_NAME} · {APP_BRAND_SHORT_NAME}
            </p>
            <p className="text-xs text-sky-300/90">
              Phát triển và phát hành bởi {APP_IT_DEPARTMENT_NAME}
            </p>
          </div>
          {/* <Link
            href={HOME_PATH}
            className={`text-sm ${APP_BRAND_THEME.footer.accent} transition ${APP_BRAND_THEME.footer.linkHover}`}>
            Bảng chỉ số sinh tồn
          </Link> */}
        </div>
      </div>
    </footer>
  );
}
