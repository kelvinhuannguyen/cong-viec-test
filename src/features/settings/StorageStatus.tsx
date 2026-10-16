import { useEffect, useState } from 'react';

export function StorageStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    navigator.storage
      ?.persisted?.()
      .then((value) => {
        if (alive) setPersisted(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const text =
    persisted === null ? 'Không rõ' : persisted ? 'Có' : 'Chưa — trình duyệt có thể xoá dữ liệu khi máy thiếu dung lượng';
  return <p className="text-sm">Dữ liệu được bảo vệ khỏi việc tự xoá: {text}</p>;
}
