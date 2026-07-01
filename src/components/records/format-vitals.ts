const EMPTY = '—';

export function formatPulse(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY;
  }

  return String(value);
}

export function formatTemp(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY;
  }

  return String(value);
}

export function formatBp(value: string | null | undefined): string {
  if (!value?.trim()) {
    return EMPTY;
  }

  return value.trim();
}

export function formatNote(value: string | null | undefined): string {
  if (!value?.trim()) {
    return EMPTY;
  }

  return value.trim();
}
