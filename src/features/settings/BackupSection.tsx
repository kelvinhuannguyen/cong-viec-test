import { useState, type ChangeEvent } from 'react';
import { useToast } from '../../components/ui/Toast';
import { btn } from '../../components/ui/styles';
import { backupFileName, createBackup, parseBackup, previewImport } from '../../data/backup';
import { useImportData } from '../../hooks/useImportData';
import { useLabels } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { SAVE_ERROR } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { PREF_KEYS, usePref } from '../../lib/prefs';

const BACKUP_REMINDER_MS = 7 * 24 * 60 * 60 * 1000;

/** Dùng FileReader thay cho File#text() để chạy được cả trên trình duyệt cũ và jsdom. */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function BackupSection() {
  const { data: tasks = [] } = useTasks();
  const { data: labels = [] } = useLabels();
  const importData = useImportData();
  const toast = useToast();
  const [lastBackupAt, setLastBackupAt] = usePref<string | null>(PREF_KEYS.lastBackupAt, null);
  const [error, setError] = useState('');

  function handleExport() {
    const now = new Date();
    const backup = createBackup(tasks, labels, now);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName(now);
    link.click();
    URL.revokeObjectURL(url);
    setLastBackupAt(backup.exportedAt);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await readFileText(file));
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError('');
    const p = previewImport(parsed.data, tasks, labels);
    const ok = window.confirm(
      `Nhập ${p.newTasks} việc mới, ghi đè ${p.overwrittenTasks} việc; ${p.newLabels} nhãn mới, ghi đè ${p.overwrittenLabels} nhãn. Tiếp tục?`,
    );
    if (!ok) return;
    try {
      await importData.mutateAsync({ tasks: parsed.data.tasks, labels: parsed.data.labels });
      toast.show({ message: 'Đã nhập dữ liệu' });
    } catch {
      toast.show({ message: SAVE_ERROR });
    }
  }

  const stale = !lastBackupAt || Date.now() - Date.parse(lastBackupAt) > BACKUP_REMINDER_MS;

  return (
    <div className="space-y-3 text-sm">
      <p>{lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(lastBackupAt)}` : 'Chưa sao lưu lần nào.'}</p>
      {stale && (
        <p className="text-amber-700 dark:text-amber-400">
          Nên xuất file sao lưu ít nhất mỗi tuần — dữ liệu chỉ nằm trong trình duyệt này.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={handleExport}>
          Xuất dữ liệu
        </button>
        <label className={`${btn.secondary} cursor-pointer`}>
          Nhập dữ liệu
          <input type="file" accept="application/json,.json" className="sr-only" onChange={handleImport} />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
