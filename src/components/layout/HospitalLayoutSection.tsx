import { useEffect, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';

import { getLayout } from './api';
import { type LayoutFloor } from './types';

type HospitalLayoutSectionProps = {
  token: string | null;
};

export function HospitalLayoutSection({ token }: HospitalLayoutSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [floors, setFloors] = useState<LayoutFloor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || !token || loaded) {
      return;
    }

    let cancelled = false;

    const loadLayout = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const api = createAuthenticatedApi(token);
        const result = await getLayout(api);

        if (!cancelled) {
          setFloors(result);
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Không thể tải sơ đồ bệnh viện.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadLayout();

    return () => {
      cancelled = true;
    };
  }, [isOpen, token, loaded]);

  const totalBeds = floors.reduce(
    (sum, floor) =>
      sum + floor.rooms.reduce((roomSum, room) => roomSum + room.beds.length, 0),
    0,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Sơ đồ bệnh viện</h2>
          <p className="mt-1 text-sm text-slate-600">
            Xem cấu trúc tầng · phòng · giường (chỉ đọc)
          </p>
        </div>
        <span className="text-sm text-sky-700">{isOpen ? 'Thu gọn' : 'Mở rộng'}</span>
      </button>

      {isOpen ? (
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && loaded ? (
            <>
              <p className="mb-4 text-sm text-slate-600">
                {floors.length} tầng · {totalBeds} giường
              </p>
              <div className="space-y-4">
                {floors.map((floor) => (
                  <div
                    key={floor.floor}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      P {floor.floor}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {floor.rooms.map((room) => (
                        <div key={room.id}>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Phòng {room.name}
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-2">
                            {room.beds.map((bed) => (
                              <li
                                key={bed.id}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                {bed.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
