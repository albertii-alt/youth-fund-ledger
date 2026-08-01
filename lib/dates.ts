function todayInPHT(): Date {
  // Resolve "today" in Philippine Time (UTC+8) so overnight UTC≠PHT windows
  // don't cause the server to treat the current PHT day as still yesterday.
  const phtDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const [y, m, d] = phtDateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function sundaysInMonth(year: number, month: number): Date[] {
  const today = todayInPHT();
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
  return new Date(dateStr + 'T00:00:00') > todayInPHT();
}
