/** Hospital / app favicon (served from `public/favicon/`). */
export const APP_FAVICON_SRC = '/favicon/favicon.svg';

/** Replace with `/images/logo.png` when hospital asset is available. */
export const APP_LOGO_SRC = '/images/logo.svg';

export const APP_LOGO_TEXT_SRC = '/images/logo-text.png';

/** Wordmark on the login card (`text.png`). */
export const APP_LOGIN_TEXT_SRC = '/images/text.png';

export const APP_LOGIN_BG_SRC = '/images/login-bg.jpg';

export const APP_BRAND_SHORT_NAME = 'InSight Care';

export const APP_ORG_NAME = 'Bệnh viện Đa khoa Xanh Pôn';

export const APP_DEFAULT_DEPARTMENT = 'Trung tâm kỹ thuật cao';

/** Brand chrome aligned with logo (red header, blue footer). */
export const APP_BRAND_THEME = {
  header: {
    bg: 'bg-red-700',
    border: 'border-red-800',
    text: 'text-white',
    subtle: 'text-red-100',
  },
  footer: {
    bg: 'bg-sky-800',
    border: 'border-sky-900',
    text: 'text-sky-50',
    muted: 'text-sky-200',
    accent: 'text-sky-100',
    divider: 'border-sky-600/50',
    linkHover: 'hover:text-white',
  },
} as const;
