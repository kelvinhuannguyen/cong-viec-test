import { useCallback } from 'react';
import { PREF_KEYS, usePref } from '../lib/prefs';
import { getPermission, requestPermission, type PermissionState } from './notifier';

export function useReminderSettings() {
  const [enabled, setEnabledPref] = usePref<boolean>(PREF_KEYS.reminders, false);
  // Đọc trực tiếp mỗi lần render: quyền có thể đổi ở nơi khác (Cài đặt, trình duyệt).
  const permission = getPermission();

  const setEnabled = useCallback(
    async (value: boolean): Promise<PermissionState> => {
      if (!value) {
        setEnabledPref(false);
        return getPermission();
      }
      const result = await requestPermission();
      setEnabledPref(result === 'granted');
      return result;
    },
    [setEnabledPref],
  );

  return { enabled, permission, active: enabled && permission === 'granted', setEnabled };
}
