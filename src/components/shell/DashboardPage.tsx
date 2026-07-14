import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { useAuth } from 'src/auth/context';
import { usePageVisible } from 'src/hooks/usePageVisible';
import { BedRecordModal } from 'src/components/records/BedRecordModal';
import { TodayStatusSection } from 'src/components/records/TodayStatusSection';
import { useBedStatusByDate } from 'src/components/records/useTodayStatusPolling';
import {
  PatientEpisodeModal,
  type PatientEpisodeTarget,
} from 'src/components/patient/PatientEpisodeModal';
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
  const [selectedDate, setSelectedDate] = useState('');
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [patientEpisodeTarget, setPatientEpisodeTarget] =
    useState<PatientEpisodeTarget | null>(null);
  const pollingEnabled = router.pathname === '/' && isPageVisible;

  const {
    data,
    serverDate,
    editableShift,
    isLoading,
    error,
    lastUpdatedAt,
    isViewingToday,
    refetch,
    mergeRecord,
  } = useBedStatusByDate(accessToken, {
    selectedDate,
    enabled: pollingEnabled,
    paused: modalTarget !== null || patientEpisodeTarget !== null,
    intervalMs: 3000,
    onServerDateChange: setSelectedDate,
  });

  useEffect(() => {
    if (!isViewingToday) {
      setModalTarget(null);
    }
  }, [isViewingToday]);

  const handleSelectedDateChange = (date: string) => {
    setSelectedDate(date);
    if (serverDate && date !== serverDate) {
      setModalTarget(null);
    }
  };

  const handleCellClick = (bedId: string, shift: VitalsShift) => {
    if (!isViewingToday) {
      return;
    }

    const bed = data.find((item) => item.bedId === bedId);
    if (!bed) {
      return;
    }

    setModalTarget({ bed, shift });
  };

  const handlePatientClick = (
    bedId: string,
    patientName: string,
    anchorDate: string,
    patientCode?: string,
  ) => {
    setPatientEpisodeTarget({ bedId, patientName, anchorDate, patientCode });
  };

  const handleRecordSaved = (record: DailyRecord) => {
    mergeRecord(record);
    void refetch();
  };

  const selectedBed =
    modalTarget &&
    (data.find((bed) => bed.bedId === modalTarget.bed.bedId) ?? modalTarget.bed);

  const displayDate = selectedDate || serverDate;

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1400px] overflow-x-clip px-1 py-4 sm:px-4 sm:py-8">
      <div className="min-w-0 space-y-6">
        <TodayStatusSection
          data={data}
          isLoading={isLoading}
          error={error}
          lastUpdatedAt={lastUpdatedAt}
          selectedDate={displayDate}
          serverDate={serverDate}
          editableShift={editableShift}
          onSelectedDateChange={handleSelectedDateChange}
          readOnly={!isViewingToday}
          onCellClick={handleCellClick}
          onPatientClick={handlePatientClick}
        />

        {isViewingToday ? (
          <BedRecordModal
            token={accessToken}
            bed={selectedBed ?? null}
            shift={modalTarget?.shift ?? null}
            editableShift={editableShift}
            onClose={() => setModalTarget(null)}
            onSaved={handleRecordSaved}
          />
        ) : null}

        <PatientEpisodeModal
          token={accessToken}
          target={patientEpisodeTarget}
          onClose={() => setPatientEpisodeTarget(null)}
          onSwitchAdmission={setPatientEpisodeTarget}
        />

        <HistorySection
          token={accessToken}
          beds={data}
          serverDate={serverDate}
          onPatientClick={handlePatientClick}
        />
      </div>
    </main>
  );
}
