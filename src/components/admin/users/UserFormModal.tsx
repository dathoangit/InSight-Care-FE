import { useEffect, useId, useState, type FormEvent } from 'react';

import type { AuthRole } from 'src/auth/types';
import { formatAuthRoleLabel } from 'src/auth/display-user';
import { createAuthenticatedApi } from 'src/api/authenticated';
import { AnimatedModalShell } from 'src/components/ui/AnimatedModalShell';
import { ApiError } from 'src/utils/api';

import { createAdminUser, updateAdminUser, updateAdminUserRole } from './api';
import { ADMIN_USER_ROLES, DEFAULT_NEW_USER_PASSWORD } from './constants';
import type { AdminUser } from './types';

type UserFormModalProps = {
  token: string;
  mode: 'create' | 'edit';
  user: AdminUser | null;
  currentUserId?: string;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
};

type FormState = {
  username: string;
  fullName: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
  password: string;
};

const inputClassName =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

export function UserFormModal({
  token,
  mode,
  user,
  currentUserId,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const titleId = useId();
  const isEditingSelf = mode === 'edit' && user?.id === currentUserId;
  const [form, setForm] = useState<FormState>({
    username: '',
    fullName: '',
    email: '',
    role: 'NURSE',
    isActive: true,
    password: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setForm({
        username: user.username,
        fullName: user.fullName,
        email: user.email ?? '',
        role: user.role,
        isActive: user.isActive,
        password: '',
      });
      return;
    }

    setForm({
      username: '',
      fullName: '',
      email: '',
      role: 'NURSE',
      isActive: true,
      password: '',
    });
  }, [mode, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const username = form.username.trim();
    const fullName = form.fullName.trim();

    if (!username) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (!fullName) {
      setError('Vui lòng nhập tên người dùng.');
      return;
    }

    setPending(true);
    const api = createAuthenticatedApi(token);

    try {
      if (mode === 'create') {
        const body = {
          username,
          fullName,
          email: form.email.trim() || null,
          role: form.role,
          isActive: form.isActive,
          ...(form.password.trim()
            ? { password: form.password.trim() }
            : {}),
        };
        const created = await createAdminUser(api, body);
        onSaved(created);
        onClose();
        return;
      }

      if (!user) {
        return;
      }

      const body: {
        username?: string;
        fullName?: string;
        email?: string | null;
        isActive?: boolean;
        password?: string;
      } = {
        username,
        fullName,
        email: form.email.trim() || null,
        isActive: form.isActive,
      };

      if (form.password.trim()) {
        body.password = form.password.trim();
      }

      let updated = await updateAdminUser(api, user.id, body);

      if (form.role !== user.role) {
        updated = await updateAdminUserRole(api, user.id, form.role);
      }

      onSaved(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Không thể lưu người dùng. Vui lòng thử lại.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AnimatedModalShell
      isOpen
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
      {({ requestClose }) => (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col"
          noValidate>
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {mode === 'create' ? 'Thêm người dùng' : 'Sửa người dùng'}
            </h2>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              Đóng
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div>
              <label
                htmlFor="admin-user-full-name"
                className="block text-sm font-medium text-slate-700">
                Tên người dùng
              </label>
              <input
                id="admin-user-full-name"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="admin-user-username"
                className="block text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <input
                id="admin-user-username"
                type="text"
                autoComplete="off"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="admin-user-email"
                className="block text-sm font-medium text-slate-700">
                Email (tuỳ chọn)
              </label>
              <input
                id="admin-user-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="admin-user-role"
                className="block text-sm font-medium text-slate-700">
                Vai trò
              </label>
              <select
                id="admin-user-role"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as AuthRole,
                  }))
                }
                className={inputClassName}>
                {ADMIN_USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatAuthRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-user-password"
                className="block text-sm font-medium text-slate-700">
                {mode === 'create'
                  ? 'Mật khẩu (tuỳ chọn)'
                  : 'Mật khẩu mới (tuỳ chọn)'}
              </label>
              <input
                id="admin-user-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className={inputClassName}
              />
              <p className="mt-1 text-xs text-slate-500">
                {mode === 'create'
                  ? `Để trống sẽ dùng mật khẩu mặc định: ${DEFAULT_NEW_USER_PASSWORD}`
                  : 'Để trống nếu không muốn đổi mật khẩu.'}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                disabled={isEditingSelf}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-50"
              />
              Tài khoản đang hoạt động
              {isEditingSelf ? (
                <span className="text-xs text-slate-500">
                  (không thể tự vô hiệu hoá)
                </span>
              ) : null}
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      )}
    </AnimatedModalShell>
  );
}
