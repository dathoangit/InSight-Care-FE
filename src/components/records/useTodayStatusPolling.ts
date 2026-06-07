import { useCallback, useEffect, useRef, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { ApiError } from 'src/utils/api';

import { getTodayStatus } from './api';
import { type BedTodayStatus, type DailyRecord } from './types';

const DEFAULT_INTERVAL_MS = 3000;

type TodayStatusPollingOptions = {
  intervalMs?: number;
  /** Chỉ bật khi đang ở trang bảng vitals và tab đang hiển thị. */
  enabled?: boolean;
  /** Tạm dừng khi modal nhập liệu đang mở. */
  paused?: boolean;
};

export function useTodayStatusPolling(
  token: string | null,
  options: TodayStatusPollingOptions = {},
) {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    enabled = false,
    paused = false,
  } = options;
  const [data, setData] = useState<BedTodayStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const shouldPoll = Boolean(token && enabled && !paused);

  const fetchStatus = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }

    try {
      const api = createAuthenticatedApi(token);
      const result = await getTodayStatus(api);

      if (!isMountedRef.current) {
        return;
      }

      setData(result);
      setError(null);
      setLastUpdatedAt(new Date());
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      if (err instanceof ApiError && err.status === 401) {
        setData([]);
        setError(null);
        return;
      }

      const message =
        err instanceof Error ? err.message : 'Không thể tải trạng thái giường.';
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, token]);

  const mergeRecord = useCallback((record: DailyRecord) => {
    setData((prev) =>
      prev.map((bed) =>
        bed.bedId === record.bedId ? { ...bed, todayRecord: record } : bed,
      ),
    );
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!token || !enabled) {
      setIsLoading(false);
      if (!token) {
        setData([]);
        setError(null);
        setLastUpdatedAt(null);
      }
      return;
    }

    setIsLoading(true);
    void fetchStatus();
  }, [enabled, fetchStatus, token]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchStatus();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchStatus, intervalMs, shouldPoll]);

  return {
    data,
    isLoading,
    error,
    lastUpdatedAt,
    refetch: fetchStatus,
    mergeRecord,
  };
}
