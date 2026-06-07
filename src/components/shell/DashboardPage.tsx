import { useState } from 'react';
import { useRouter } from 'next/router';

import { useAuth } from 'src/auth/context';
import { usePageVisible } from 'src/hooks/usePageVisible';
import { BedRecordModal } from 'src/components/records/BedRecordModal';
import { TodayStatusSection } from 'src/components/records/TodayStatusSection';
import { useTodayStatusPolling } from 'src/components/records/useTodayStatusPolling';
import {
  type BedTodayStatus,
  type DailyRecord,
} from 'src/components/records/types';
import { type VitalsShift } from 'src/utils/date-vn';

import { HistorySection } from '../history/HistorySection';

type ModalTarget = {
  bed: BedTodayStatus;
  shift: VitalsShift;
};

export function DashboardPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const isPageVisible = usePageVisible();
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const pollingEnabled = router.pathname === '/' && isPageVisible;

  const { data, isLoading, error, lastUpdatedAt, refetch, mergeRecord } =
    useTodayStatusPolling(accessToken, {
      enabled: pollingEnabled,
      paused: modalTarget !== null,
      intervalMs: 3000,
    });

  const handleCellClick = (bedId: string, shift: VitalsShift) => {
    const bed = data.find((item) => item.bedId === bedId);
    if (!bed) {
      return;
    }

    setModalTarget({ bed, shift });
  };

  const handleRecordSaved = (record: DailyRecord) => {
    mergeRecord(record);
    void refetch();
  };

  const selectedBed =
    modalTarget &&
    (data.find((bed) => bed.bedId === modalTarget.bed.bedId) ?? modalTarget.bed);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-1 py-4 sm:px-4 sm:py-8">
      <div className="space-y-6">
        <TodayStatusSection
          data={data}
          isLoading={isLoading}
          error={error}
          lastUpdatedAt={lastUpdatedAt}
          onCellClick={handleCellClick}
        />

        <BedRecordModal
          token={accessToken}
          bed={selectedBed ?? null}
          shift={modalTarget?.shift ?? null}
          onClose={() => setModalTarget(null)}
          onSaved={handleRecordSaved}
        />

        <HistorySection token={accessToken} beds={data} />
      </div>
    </main>
  );
}
