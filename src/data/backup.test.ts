import { describe, expect, it } from 'vitest';
import { makeLabel, makeTask } from '../test/factories';
import { backupFileName, createBackup, DUPLICATE_ID_ERROR, FORMAT_ERROR, parseBackup, previewImport } from './backup';
import { createDexieRepositories } from './dexie/createDexieRepositories';
import { AppDatabase } from './dexie/db';

const now = new Date(2026, 9, 16, 10, 0);

describe('createBackup / parseBackup', () => {
  it('xuất rồi đọc lại cho ra dữ liệu giống hệt', () => {
    const backup = createBackup([makeTask({ dueAt: now.toISOString() })], [makeLabel()], now);
    expect(backup).toMatchObject({ app: 'cong-viec-cua-toi', version: 1, exportedAt: now.toISOString() });
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed).toEqual({ ok: true, data: backup });
  });

  it('không phải JSON', () => {
    expect(parseBackup('{oops')).toEqual({ ok: false, error: 'File không phải JSON hợp lệ' });
  });

  it('sai ứng dụng hoặc sai cấu trúc', () => {
    const wrongApp = { ...createBackup([], [], now), app: 'khac' };
    expect(parseBackup(JSON.stringify(wrongApp))).toEqual({
      ok: false,
      error: 'File không đúng định dạng sao lưu của Công Việc Của Tôi',
    });
    const badTask = createBackup([{ ...makeTask(), status: 'xyz' as never }], [], now);
    expect(parseBackup(JSON.stringify(badTask)).ok).toBe(false);
  });

  it('bỏ khoảng trắng hai đầu tên việc / tên nhãn và chuẩn hoá NFC', () => {
    const decomposed = 'Mua sữa'.normalize('NFD');
    const backup = createBackup([makeTask({ title: `  ${decomposed} ` })], [makeLabel({ name: '\tNhà ' })], now);
    const parsed = parseBackup(JSON.stringify(backup));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.data.tasks[0].title).toBe('Mua sữa');
    expect(parsed.data.labels[0].name).toBe('Nhà');
  });

  it('từ chối tên việc / tên nhãn chỉ có khoảng trắng', () => {
    expect(parseBackup(JSON.stringify(createBackup([makeTask({ title: '   ' })], [], now)))).toEqual({
      ok: false,
      error: FORMAT_ERROR,
    });
    expect(parseBackup(JSON.stringify(createBackup([], [makeLabel({ name: ' \n ' })], now))).ok).toBe(false);
  });

  it('từ chối id trùng lặp', () => {
    const task = makeTask();
    const label = makeLabel();
    expect(parseBackup(JSON.stringify(createBackup([task, { ...task, title: 'Khác' }], [], now)))).toEqual({
      ok: false,
      error: DUPLICATE_ID_ERROR,
    });
    expect(parseBackup(JSON.stringify(createBackup([], [label, { ...label, name: 'Khác' }], now)))).toEqual({
      ok: false,
      error: DUPLICATE_ID_ERROR,
    });
  });

  it('tên file theo ngày', () => {
    expect(backupFileName(now)).toBe('cong-viec-cua-toi-2026-10-16.json');
  });
});

describe('previewImport', () => {
  it('đếm số thêm mới và ghi đè', () => {
    const existing = makeTask();
    const label = makeLabel();
    const backup = createBackup([existing, makeTask(), makeTask()], [label], now);
    expect(previewImport(backup, [existing], [])).toEqual({
      newTasks: 2,
      overwrittenTasks: 1,
      newLabels: 1,
      overwrittenLabels: 0,
      mergedLabels: 0,
    });
  });

  it('nhãn trùng tên với nhãn đã có được tính là gộp, không phải thêm mới', () => {
    const existing = makeLabel({ name: 'Công việc' });
    const backup = createBackup([], [makeLabel({ name: 'công việc' }), makeLabel({ name: 'Nhà' })], now);
    expect(previewImport(backup, [], [existing])).toMatchObject({ newLabels: 1, mergedLabels: 1 });
  });
});

it('xuất từ kho A rồi nhập vào kho B cho dữ liệu giống nhau', async () => {
  const a = createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`));
  const b = createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`));
  const label = await a.labels.create({ name: 'Công việc', color: 'blue' });
  await a.tasks.create({ title: 'Viết báo cáo', labelIds: [label.id] });
  await a.tasks.create({ title: 'Mua sữa', status: 'done' });

  const text = JSON.stringify(createBackup(await a.tasks.list(), await a.labels.list(), now));
  const parsed = parseBackup(text);
  if (!parsed.ok) throw new Error(parsed.error);
  await b.importData({ tasks: parsed.data.tasks, labels: parsed.data.labels });

  const byId = <T extends { id: string }>(list: T[]) => [...list].sort((x, y) => x.id.localeCompare(y.id));
  expect(byId(await b.tasks.list())).toEqual(byId(await a.tasks.list()));
  expect(await b.labels.list()).toEqual(await a.labels.list());
});
