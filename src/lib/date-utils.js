const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const pad2 = (value) => String(value).padStart(2, '0');

const fromDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (isUtcMidnight) {
    return [
      date.getUTCFullYear(),
      pad2(date.getUTCMonth() + 1),
      pad2(date.getUTCDate()),
    ].join('-');
  }

  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join('-');
};

export const toDateOnly = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const match = value.match(DATE_ONLY_PATTERN);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    const parsed = new Date(value);
    return fromDate(parsed);
  }

  return fromDate(value);
};

export const dateOnlyToLocalDate = (value) => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

export const getTodayDateOnly = () => toDateOnly(new Date());

export const formatDateOnlyBR = (value) => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return '';

  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
};
