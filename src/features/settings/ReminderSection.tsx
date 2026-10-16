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
    <div className="space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4" checked={enabled} onChange={handleChange} />
        Nhắc hạn chót bằng thông báo
      </label>
      <p className="text-slate-500">
        Nhắc khi còn 1 giờ, khi vừa trễ hạn, và tóm tắt mỗi ngày. Chỉ hoạt động khi ứng dụng đang mở (tab hoặc app đã cài).
      </p>
      {shownMessage && (
        <p role="alert" className="text-red-600">
          {shownMessage}
        </p>
      )}
    </div>
  );
}
