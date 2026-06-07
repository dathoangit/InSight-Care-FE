import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';

import { getUserAccountDetails } from 'src/auth/display-user';
import { useAuth } from 'src/auth/context';
import { APP_DEFAULT_DEPARTMENT } from 'src/constants/branding';

type UserAccountMenuProps = {
  className?: string;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={className}>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function UserAccountMenu({ className = '' }: UserAccountMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPanelStyle(null);
  }, []);

  const updatePanelPosition = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const rect = root.getBoundingClientRect();
    const viewportPadding = 16;
    const panelWidth = Math.min(288, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(viewportPadding, rect.right - panelWidth),
      window.innerWidth - panelWidth - viewportPadding,
    );

    setPanelStyle({
      top: rect.bottom + 8,
      left,
      width: panelWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePanelPosition();
    }
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    const handleLayout = () => {
      updatePanelPosition();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleLayout);
    window.addEventListener('scroll', handleLayout, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleLayout);
      window.removeEventListener('scroll', handleLayout, true);
    };
  }, [close, open, updatePanelPosition]);

  if (!user) {
    return null;
  }

  const details = getUserAccountDetails(user, APP_DEFAULT_DEPARTMENT);

  const handleLogout = () => {
    close();
    logout();
    void router.replace('/login');
  };

  const handleChangePassword = () => {
    close();
    window.alert(
      'Vui lòng liên hệ quản trị viên để đổi mật khẩu.',
    );
  };

  const panel =
    open && panelStyle && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            className="fixed z-[100] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            style={{
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
            }}>
            <p className="text-base font-semibold text-slate-900">
              {details.username}
            </p>
            <dl className="mt-2 space-y-1 text-sm text-slate-500">
              <div>
                <dt className="sr-only">Vai trò</dt>
                <dd>Vai trò: {details.roleLabel}</dd>
              </div>
              <div>
                <dt className="sr-only">Khoa</dt>
                <dd>Khoa: {details.department}</dd>
              </div>
              <div>
                <dt className="sr-only">Mã nhân viên</dt>
                <dd>Mã NV: {details.staffCode}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                role="menuitem"
                onClick={handleChangePassword}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50">
                Đổi mật khẩu
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                Đăng xuất
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setOpen(true);
        }}
        className="inline-flex max-w-[min(100vw-12rem,14rem)] items-center gap-1.5 rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 sm:max-w-none sm:gap-2 sm:px-3.5">
        <span className="truncate">{details.username}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {panel}
    </div>
  );
}
