import { useCallback, useEffect, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { useAuth } from 'src/auth/context';
import { ApiError } from 'src/utils/api';

import {
  closeAdminBed,
  createAdminBed,
  getAdminLayout,
  updateAdminBed,
} from './api';
import type { AdminLayoutBed, AdminLayoutFloor, AdminLayoutRoom } from './types';

function todayLabel(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function AdminLayoutPage() {
  const { accessToken } = useAuth();
  const [floors, setFloors] = useState<AdminLayoutFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [newBedNames, setNewBedNames] = useState<Record<string, string>>({});

  const loadLayout = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = createAuthenticatedApi(accessToken);
      const nextFloors = await getAdminLayout(api);
      setFloors(nextFloors);

      const nextDrafts: Record<string, string> = {};
      for (const floor of nextFloors) {
        for (const room of floor.rooms) {
          for (const bed of room.beds) {
            nextDrafts[bed.id] = bed.name;
          }
        }
      }
      setDraftNames(nextDrafts);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Không thể tải danh sách giường.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadLayout();
  }, [loadLayout]);

  const runAction = async (
    key: string,
    confirmMessage: string,
    action: () => Promise<void>,
  ) => {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBusyKey(key);
    setActionError(null);

    try {
      await action();
      await loadLayout();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Không thể cập nhật giường.',
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleRename = async (bed: AdminLayoutBed) => {
    if (!accessToken) {
      return;
    }

    const nextName = (draftNames[bed.id] ?? bed.name).trim();

    if (!nextName || nextName === bed.name) {
      return;
    }

    await runAction(
      `rename:${bed.id}`,
      `Đổi tên giường "${bed.name}" thành "${nextName}" từ hôm nay (${todayLabel()})?\nCác ngày trước vẫn hiện "${bed.name}". Không hoàn tác được cho các ngày đã qua.`,
      async () => {
        const api = createAuthenticatedApi(accessToken);
        await updateAdminBed(api, bed.id, { name: nextName });
      },
    );
  };

  const handleAdd = async (room: AdminLayoutRoom) => {
    if (!accessToken) {
      return;
    }

    const nextName = (newBedNames[room.id] ?? '').trim();

    if (!nextName) {
      setActionError('Nhập tên giường mới trước khi thêm.');
      return;
    }

    await runAction(
      `add:${room.id}`,
      `Thêm giường "${nextName}" vào phòng ${room.name} từ hôm nay (${todayLabel()})?\nCác ngày trước sẽ không hiện giường này.`,
      async () => {
        const api = createAuthenticatedApi(accessToken);
        await createAdminBed(api, { roomId: room.id, name: nextName });
        setNewBedNames((prev) => ({ ...prev, [room.id]: '' }));
      },
    );
  };

  const handleClose = async (bed: AdminLayoutBed) => {
    if (!accessToken) {
      return;
    }

    await runAction(
      `close:${bed.id}`,
      `Đóng giường "${bed.name}" từ hôm nay (${todayLabel()})?\nHồ sơ cũ vẫn giữ. Các ngày trước vẫn hiện giường này.`,
      async () => {
        const api = createAuthenticatedApi(accessToken);
        await closeAdminBed(api, bed.id);
      },
    );
  };

  const totalBeds = floors.reduce(
    (sum, floor) =>
      sum + floor.rooms.reduce((roomSum, room) => roomSum + room.beds.length, 0),
    0,
  );

  return (
    <div className="page-frame py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Quản lý giường
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {loading
            ? 'Đang tải...'
            : `${totalBeds} giường · Thêm, sửa tên, đóng có hiệu lực từ hôm nay`}
        </p>
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

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải danh sách giường...</p>
      ) : null}

      {!loading
        ? floors.map((floor) => (
            <section key={floor.floor} className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tầng {floor.floor}
              </h2>
              <div className="space-y-3">
                {floor.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Phòng {room.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {room.beds.length} giường
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={newBedNames[room.id] ?? ''}
                          onChange={(event) =>
                            setNewBedNames((prev) => ({
                              ...prev,
                              [room.id]: event.target.value,
                            }))
                          }
                          placeholder="Tên giường mới"
                          maxLength={64}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          disabled={busyKey === `add:${room.id}`}
                          onClick={() => void handleAdd(room)}
                          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                          Thêm giường
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-3 sm:px-4">Giường</th>
                            <th className="px-3 py-3 sm:px-4">Mở từ</th>
                            <th className="px-3 py-3 sm:px-4">Trạng thái</th>
                            <th className="px-3 py-3 text-right sm:px-4">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {room.beds.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-6 text-center text-slate-500 sm:px-4">
                                Chưa có giường trong phòng này.
                              </td>
                            </tr>
                          ) : null}

                          {room.beds.map((bed) => {
                            const draft = draftNames[bed.id] ?? bed.name;
                            const renameBusy = busyKey === `rename:${bed.id}`;
                            const closeBusy = busyKey === `close:${bed.id}`;
                            const canEdit = !bed.isClosed;

                            return (
                              <tr key={bed.id} className="hover:bg-slate-50/80">
                                <td className="px-3 py-3 sm:px-4">
                                  {canEdit ? (
                                    <input
                                      type="text"
                                      value={draft}
                                      onChange={(event) =>
                                        setDraftNames((prev) => ({
                                          ...prev,
                                          [bed.id]: event.target.value,
                                        }))
                                      }
                                      maxLength={64}
                                      className="w-full max-w-[10rem] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                  ) : (
                                    <span className="font-medium text-slate-700">
                                      {bed.name}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-slate-600 sm:px-4">
                                  {bed.opensOn}
                                </td>
                                <td className="px-3 py-3 sm:px-4">
                                  {bed.isClosed ? (
                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                      Đã đóng
                                      {bed.closesOn ? ` · ${bed.closesOn}` : ''}
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                      Đang dùng
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-right sm:px-4">
                                  {canEdit ? (
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        disabled={
                                          renameBusy ||
                                          draft.trim() === bed.name ||
                                          !draft.trim()
                                        }
                                        onClick={() => void handleRename(bed)}
                                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                        Lưu tên
                                      </button>
                                      <button
                                        type="button"
                                        disabled={closeBusy}
                                        onClick={() => void handleClose(bed)}
                                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                                        Đóng
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      Chỉ đọc
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        : null}
    </div>
  );
}
