import { useState, type FormEvent } from 'react';
import { field } from '../../components/ui/styles';
import { normalizeTitle } from '../../domain/rules';
import { useCreateTask } from '../../hooks/useTasks';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const createTask = useCreateTask();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const normalized = normalizeTitle(title);
    if (!normalized) {
      setError('Tên tối đa 200 ký tự');
      return;
    }
    setError('');
    const submitted = title;
    // Chỉ xoá khi ô vẫn giữ đúng chữ vừa gửi: gõ nhanh việc kế tiếp trong lúc chờ lưu thì không bị mất.
    createTask.mutate({ title: normalized }, { onSuccess: () => setTitle((cur) => (cur === submitted ? '' : cur)) });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Thêm nhanh công việc"
        placeholder="Thêm nhanh: gõ tên việc rồi nhấn Enter"
        className={`${field} w-full`}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError('');
        }}
      />
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
