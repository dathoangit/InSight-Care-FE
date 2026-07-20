import { useCallback, useEffect, useMemo, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { formatAuthRoleLabel } from 'src/auth/display-user';
import { useAuth } from 'src/auth/context';
import { ApiError } from 'src/utils/api';

import { deactivateAdminUser, listAdminUsers } from './api';
import type { AdminUser } from './types';
import { UserFormModal } from './UserFormModal';

function matchesSearch(user: AdminUser, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const haystack = [
    user.fullName,
    user.username,
    user.email ?? '',
    user.role,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
}

export function AdminUsersPage() {
  const { accessToken, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = createAuthenticatedApi(accessToken);
      const result = await listAdminUsers(api, { limit: 200, offset: 0 });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Không thể tải danh sách người dùng.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesSearch(user, searchQuery)),
    [users, searchQuery],
  );

  const openCreate = () => {
    setEditingUser(null);
    setFormMode('create');
    setActionError(null);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormMode('edit');
    setActionError(null);
  };

  const handleSaved = (_saved: AdminUser) => {
    void loadUsers();
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (!accessToken) {
      return;
    }

    if (currentUser?.id === user.id) {
      setActionError('Không thể vô hiệu hoá tài khoản đang đăng nhập.');
      return;
    }

    const confirmed = window.confirm(
      `Vô hiệu hoá tài khoản "${user.username}"? Người dùng sẽ không đăng nhập được.`,
    );

    if (!confirmed) {
      return;
    }

    setDeactivatingId(user.id);
    setActionError(null);

    try {
      const api = createAuthenticatedApi(accessToken);
      const updated = await deactivateAdminUser(api, user.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Không thể vô hiệu hoá người dùng.',
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Quản lý tài khoản
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {loading
              ? 'Đang tải...'
              : searchQuery.trim()
                ? `${filteredUsers.length} / ${total} tài khoản`
                : `${total} tài khoản`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          Thêm người dùng
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="admin-users-search" className="sr-only">
          Tìm kiếm tài khoản
        </label>
        <input
          id="admin-users-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên, tên đăng nhập, email hoặc vai trò..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:max-w-md"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {actionError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 sm:px-4">Tên người dùng</th>
                <th className="px-3 py-3 sm:px-4">Tên đăng nhập</th>
                <th className="px-3 py-3 sm:px-4">Email</th>
                <th className="px-3 py-3 sm:px-4">Vai trò</th>
                <th className="px-3 py-3 sm:px-4">Trạng thái</th>
                <th className="px-3 py-3 text-right sm:px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-slate-500 sm:px-4">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : null}

              {!loading && filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-slate-500 sm:px-4">
                    {searchQuery.trim()
                      ? 'Không tìm thấy tài khoản phù hợp.'
                      : 'Chưa có người dùng nào.'}
                  </td>
                </tr>
              ) : null}

              {!loading
                ? filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-3 font-medium text-slate-900 sm:px-4">
                        {user.fullName}
                      </td>
                      <td className="px-3 py-3 text-slate-600 sm:px-4">
                        {user.username}
                      </td>
                      <td className="px-3 py-3 text-slate-600 sm:px-4">
                        {user.email || '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-700 sm:px-4">
                        {formatAuthRoleLabel(user.role)}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        {user.isActive ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Vô hiệu
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right sm:px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={
                              !user.isActive ||
                              deactivatingId === user.id ||
                              currentUser?.id === user.id
                            }
                            onClick={() => void handleDeactivate(user)}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                            {deactivatingId === user.id
                              ? 'Đang xử lý...'
                              : 'Vô hiệu hoá'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {formMode && accessToken ? (
        <UserFormModal
          token={accessToken}
          mode={formMode}
          user={editingUser}
          currentUserId={currentUser?.id}
          onClose={() => {
            setFormMode(null);
            setEditingUser(null);
          }}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
