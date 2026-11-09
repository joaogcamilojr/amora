const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Data de calendário real: rejeita 2026-13-45 e 2026-02-30. */
export function isCalendarDate(value: string) {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
