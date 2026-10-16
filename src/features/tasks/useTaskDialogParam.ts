import { useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export const NEW_TASK = 'new';

/** Đánh dấu mục lịch sử do chính hộp thoại thêm vào, để khi đóng thì lùi lại đúng một bước. */
const PUSHED_STATE = { taskDialog: true } as const;

function isPushed(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { taskDialog?: unknown }).taskDialog === true;
}

/**
 * Hộp thoại việc gắn với tham số `?task=` trên URL. Mở thì thêm một mục lịch sử, nên nút Back
 * (kể cả Back của Android trong PWA đã cài) đóng hộp thoại thay vì thoát ứng dụng; đóng bằng nút
 * thì lùi lại mục đó. Mở thẳng từ liên kết (không có mục do ta thêm) thì đóng bằng cách thay URL.
 */
export function useTaskDialogParam() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dialogTaskId = params.get('task');
  const isOpen = dialogTaskId !== null;
  const pushed = isPushed(location.state);
  // Chặn đóng hai lần trên cùng một mục lịch sử (ví dụ bấm Esc liên tiếp trước khi Back kịp xong),
  // nếu không sẽ lùi quá một bước và rời khỏi ứng dụng.
  const closedKeyRef = useRef<string | null>(null);

  const open = useCallback(
    (value: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('task', value);
          return next;
        },
        // Đang mở sẵn thì chỉ thay nội dung, giữ nguyên số mục lịch sử.
        isOpen ? { replace: true, state: location.state } : { state: PUSHED_STATE },
      ),
    [setParams, isOpen, location.state],
  );

  const close = useCallback(() => {
    if (!isOpen || closedKeyRef.current === location.key) return;
    closedKeyRef.current = location.key;
    if (pushed) {
      navigate(-1);
      return;
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('task');
        return next;
      },
      { replace: true },
    );
  }, [isOpen, location.key, pushed, navigate, setParams]);

  const openNew = useCallback(() => open(NEW_TASK), [open]);
  const openTask = useCallback((id: string) => open(id), [open]);

  return { dialogTaskId, openNew, openTask, close };
}
