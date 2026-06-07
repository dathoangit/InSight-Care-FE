export function getFloorRowClass(floor: number): string {
  switch (floor) {
    case 2:
    case 5:
      return 'bg-sky-50';
    case 3:
      return 'bg-amber-50';
    case 4:
      return 'bg-pink-50';
    default:
      return 'bg-white';
  }
}
