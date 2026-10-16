import { useEffect, useState } from 'react';

/** Thời điểm hiện tại, tự cập nhật mỗi `intervalMs` để màu trễ hạn luôn đúng. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
