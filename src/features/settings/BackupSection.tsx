import { useState, type ChangeEvent } from 'react';
import { useToast } from '../../components/ui/Toast';
import { btn } from '../../components/ui/styles';
import { backupFileName, createBackup, parseBackup, previewImport } from '../../data/backup';
import { useImportData } from '../../hooks/useImportData';
import { useLabels } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { LOAD_ERROR, SAVE_ERROR } from '../../lib/errors';
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
  const tasksQuery = useTasks();
  const labelsQuery = useLabels();
  const tasks = tasksQuery.data ?? [];
  const labels = labelsQuery.data ?? [];
  // Đọc lại ngầm bị lỗi nhưng vẫn còn dữ liệu đã tải thì vẫn dùng được, không báo lỗi.
  const ready = tasksQuery.data !== undefined && labelsQuery.data !== undefined;
  const loadFailed =
    (tasksQuery.isError && tasksQuery.data === undefined) || (labelsQuery.isError && labelsQuery.data === undefined);
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setLastBackupAt(backup.exportedAt);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      setError('Không đọc được file');
      return;
    }
    const parsed = parseBackup(text);
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
        <button type="button" className={btn.secondary} onClick={handleExport} disabled={!ready}>
          Xuất dữ liệu
        </button>
        <label className={`${btn.secondary} ${ready ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
          Nhập dữ liệu
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={!ready}
            onChange={handleImport}
          />
        </label>
      </div>
      {loadFailed && (
        <p role="alert" className="text-red-600">
          {LOAD_ERROR}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
