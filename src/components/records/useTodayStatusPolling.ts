import { useCallback, useEffect, useRef, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { ApiError } from 'src/utils/api';
import { type VitalsShift } from 'src/utils/date-vn';

import { getBedStatus } from './api';
import { type BedTodayStatus, type DailyRecord } from './types';

const DEFAULT_INTERVAL_MS = 3000;

type BedStatusByDateOptions = {
  selectedDate: string;
  intervalMs?: number;
  enabled?: boolean;
  paused?: boolean;
  onServerDateChange?: (serverDate: string) => void;
};

export function useBedStatusByDate(
  token: string | null,
  options: BedStatusByDateOptions,
) {
  const {
    selectedDate,
    intervalMs = DEFAULT_INTERVAL_MS,
    enabled = false,
    paused = false,
    onServerDateChange,
  } = options;
  const [data, setData] = useState<BedTodayStatus[]>([]);
  const [serverDate, setServerDate] = useState('');
  const [editableShift, setEditableShift] = useState<VitalsShift>('morning');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const isViewingToday = Boolean(
    serverDate && (!selectedDate || selectedDate === serverDate),
  );
  const shouldPoll = Boolean(token && enabled && isViewingToday && !paused);

  const fetchStatus = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }

    const viewToday = !selectedDate || selectedDate === serverDate;

    try {
      const api = createAuthenticatedApi(token);
      const result = await getBedStatus(api, {
        viewToday,
        date: viewToday ? undefined : selectedDate,
      });

      if (!isMountedRef.current) {
        return;
      }

      setServerDate(result.serverDate);
      setEditableShift(result.editableShift);
      setData(result.beds);
      setError(null);
      setLastUpdatedAt(new Date());

      if (viewToday && selectedDate !== result.serverDate) {
        onServerDateChange?.(result.serverDate);
      }
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
  }, [enabled, onServerDateChange, selectedDate, serverDate, token]);

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
        setServerDate('');
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
    serverDate,
    editableShift,
    isLoading,
    error,
    lastUpdatedAt,
    isViewingToday,
    refetch: fetchStatus,
    mergeRecord,
  };
}
