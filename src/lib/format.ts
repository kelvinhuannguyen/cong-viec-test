import { differenceInCalendarDays, format } from 'date-fns';

export function formatDueLabel(dueAt: string, now: Date): string {
  const due = new Date(dueAt);
  const days = differenceInCalendarDays(due, now);
  const hasTime = !(due.getHours() === 23 && due.getMinutes() === 59);
  const time = hasTime ? ` ${format(due, 'HH:mm')}` : '';
  if (days === 0) return `Hôm nay${time}`;
  if (days === 1) return `Ngày mai${time}`;
  if (days === -1) return `Hôm qua${time}`;
  if (days > 1) return `Còn ${days} ngày`;
  return `Trễ ${-days} ngày`;
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy HH:mm');
}
