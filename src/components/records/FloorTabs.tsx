type FloorTabsProps = {
  floors: string[];
  activeFloor: string;
  onChange: (floor: string) => void;
};

export function FloorTabs({
  floors,
  activeFloor,
  onChange,
}: FloorTabsProps) {
  return (
    <div className="flex items-end border-b-2 border-red-800">
      {floors.map((floor, index) => {
        const isActive = floor === activeFloor;

        return (
          <button
            key={floor}
            type="button"
            onClick={() => onChange(floor)}
            className={[
              'relative rounded-t-xl px-4 py-2 text-xs transition sm:px-5 sm:py-2.5 sm:text-sm',
              index > 0 ? '-ml-px' : '',
              isActive
                ? 'z-10 bg-red-800 font-bold text-white'
                : 'border border-b-0 border-gray-300 bg-gray-200 font-medium text-gray-600 hover:bg-gray-100',
            ].join(' ')}>
            P {floor}
          </button>
        );
      })}
    </div>
  );
}
