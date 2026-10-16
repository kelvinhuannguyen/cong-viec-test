import { WarningCircleIcon } from '@phosphor-icons/react';
import { useState, type ChangeEvent } from 'react';
import type { PermissionState } from '../../notifications/notifier';
import { useReminderSettings } from '../../notifications/useReminderSettings';

function permissionMessage(permission: PermissionState): string {
  return permission === 'unsupported'
    ? 'Trình duyệt này không hỗ trợ thông báo.'
    : 'Bạn chưa cho phép thông báo. Hãy cấp quyền trong cài đặt trang của trình duyệt rồi thử lại.';
}

export function ReminderSection() {
  const { enabled, permission, setEnabled } = useReminderSettings();
  const [message, setMessage] = useState('');

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    const result = await setEnabled(checked);
    if (!checked || result === 'granted') {
      setMessage('');
    } else {
      setMessage(permissionMessage(result));
    }
  }

  // Quyền có thể bị thu hồi sau khi đã bật: nhắc người dùng dù họ không bấm gì.
  const shownMessage = message || (enabled && permission !== 'granted' ? permissionMessage(permission) : '');

  return (
    <div className="space-y-3 text-sm">
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
        <span>
          <span className="block font-medium">Nhắc hạn chót bằng thông báo</span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            Chỉ hoạt động khi ứng dụng đang mở (tab hoặc app đã cài).
          </span>
        </span>
        <span className="relative inline-flex shrink-0">
          <input
            type="checkbox"
            aria-label="Nhắc hạn chót bằng thông báo"
            className="peer sr-only"
            checked={enabled}
            onChange={handleChange}
          />
          <span
            aria-hidden="true"
            className="h-6 w-10 rounded-full bg-zinc-200 transition-colors duration-200 peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25 dark:bg-zinc-700"
          />
          <span
            aria-hidden="true"
            className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgb(9_9_11/0.25)] transition-transform duration-300 ease-(--ease-spring) peer-checked:translate-x-4"
          />
        </span>
      </label>
      {shownMessage && (
        <p role="alert" className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
          <WarningCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {shownMessage}
        </p>
      )}
    </div>
  );
}
