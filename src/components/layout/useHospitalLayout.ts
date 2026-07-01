import { useCallback, useEffect, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { ApiError } from 'src/utils/api';

import { getLayout } from './api';
import { flattenLayout } from './layout-utils';
import { type FlatLayoutBed, type LayoutFloor } from './types';

type UseHospitalLayoutOptions = {
  enabled?: boolean;
};

export function useHospitalLayout(
  token: string | null,
  options: UseHospitalLayoutOptions = {},
) {
  const { enabled = true } = options;
  const [floors, setFloors] = useState<LayoutFloor[]>([]);
  const [beds, setBeds] = useState<FlatLayoutBed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLayout = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const api = createAuthenticatedApi(token);
      const result = await getLayout(api);
      setFloors(result);
      setBeds(flattenLayout(result));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFloors([]);
        setBeds([]);
        setError(null);
        return;
      }

      const message =
        err instanceof Error ? err.message : 'Không thể tải sơ đồ bệnh viện.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, token]);

  useEffect(() => {
    if (!token || !enabled) {
      setFloors([]);
      setBeds([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    void fetchLayout();
  }, [enabled, fetchLayout, token]);

  return {
    floors,
    beds,
    isLoading,
    error,
    refetch: fetchLayout,
  };
}
