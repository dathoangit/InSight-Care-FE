type FloorTabsProps = {
  floors: number[];
  activeFloor: number;
  bedCountByFloor: Record<number, number>;
  onChange: (floor: number) => void;
};

export function FloorTabs({
  floors,
  activeFloor,
  bedCountByFloor,
  onChange,
}: FloorTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-300">
      {floors.map((floor) => {
        const isActive = floor === activeFloor;

        return (
          <button
            key={floor}
            type="button"
            onClick={() => onChange(floor)}
            className={`rounded-t-lg border border-b-0 px-2 py-1 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? 'border-slate-300 bg-white text-slate-900'
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            Tầng {floor}
            <span className="ml-1 text-xs text-slate-500">
              ({bedCountByFloor[floor] ?? 0})
            </span>
          </button>
        );
      })}
    </div>
  );
}
