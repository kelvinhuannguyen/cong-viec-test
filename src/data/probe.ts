const PROBE_DB = '__cvct_probe__';

/** Kiểm tra trình duyệt có cho mở IndexedDB không (chế độ ẩn danh có thể chặn). */
export function probeIndexedDb(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(false);
      const request = indexedDB.open(PROBE_DB);
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase(PROBE_DB);
        resolve(true);
      };
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}
