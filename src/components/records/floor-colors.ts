export function getZebraRowClass(rowIndex: number): string {
  return rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
}
