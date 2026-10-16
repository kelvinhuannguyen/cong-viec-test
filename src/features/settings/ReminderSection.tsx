import { useState, type ChangeEvent } from 'react';
import { useReminderSettings } from '../../notifications/useReminderSettings';

export function ReminderSection() {
  const { enabled, setEnabled } = useReminderSettings();
  const [message, setMessage] = useState('');

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    const result = await setEnabled(checked);
    if (!checked || result === 'granted') {
      setMessage('');
    } else if (result === 'unsupported') {
      setMessage('Trình duyệt này không hỗ trợ thông báo.');
    } else {
      setMessage('Bạn chưa cho phép thông báo. Hãy cấp quyền trong cài đặt trang của trình duyệt rồi thử lại.');
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4" checked={enabled} onChange={handleChange} />
        Nhắc hạn chót bằng thông báo
      </label>
      <p className="text-slate-500">
        Nhắc khi còn 1 giờ, khi vừa trễ hạn, và tóm tắt mỗi ngày. Chỉ hoạt động khi ứng dụng đang mở (tab hoặc app đã cài).
      </p>
      {message && (
        <p role="alert" className="text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
