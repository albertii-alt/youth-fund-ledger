export function sundaysInMonth(year: number, month: number): Date[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const result: Date[] = [];
  const d = new Date(year, month - 1, 1);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  while (d.getMonth() === month - 1) {
    if (d <= today) result.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return result;
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSunday(dateStr: string): boolean {
  return new Date(dateStr + 'T00:00:00').getDay() === 0;
}

export function isFuture(dateStr: string): boolean {
  return new Date(dateStr + 'T00:00:00') > new Date();
}
