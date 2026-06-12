const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const pad2 = (value: number): string => String(value).padStart(2, '0');

export function toDateOnlyString(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const match = value.match(DATE_ONLY_PATTERN);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    return [
      parsed.getUTCFullYear(),
      pad2(parsed.getUTCMonth() + 1),
      pad2(parsed.getUTCDate()),
    ].join('-');
  }

  if (Number.isNaN(value.getTime())) return null;

  return [
    value.getFullYear(),
    pad2(value.getMonth() + 1),
    pad2(value.getDate()),
  ].join('-');
}

export function toPrismaDateOnly(value: Date | string | null | undefined): Date | null {
  const dateOnly = toDateOnlyString(value);
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}
