import type { LabelColor } from '../domain/task';

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

/** Chấm màu đặc, đủ đậm để nhìn rõ ở cả chế độ sáng lẫn tối. */
export const LABEL_DOT_CLASSES: Record<LabelColor, string> = {
  slate: 'bg-slate-400',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
};

export const LABEL_COLOR_NAMES: Record<LabelColor, string> = {
  slate: 'Xám',
  red: 'Đỏ',
  orange: 'Cam',
  amber: 'Vàng',
  green: 'Xanh lá',
  teal: 'Xanh ngọc',
  blue: 'Xanh dương',
  violet: 'Tím',
  pink: 'Hồng',
};
