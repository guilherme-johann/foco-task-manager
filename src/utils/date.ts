export function getLocalDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && getLocalDate(date) === value;
}

export function formatDueDate(value: string, today = getLocalDate()): string {
  if (value === today) return 'Hoje';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: value.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined,
  }).format(new Date(`${value}T12:00:00`));
}
