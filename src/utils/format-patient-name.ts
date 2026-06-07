/** Viết hoa chữ cái đầu mỗi từ trong tên bệnh nhân. */
export function formatPatientName(value: string): string {
  return value.replace(
    /(^|\s)(\S)/g,
    (_, prefix: string, char: string) => prefix + char.toLocaleUpperCase('vi-VN'),
  );
}
