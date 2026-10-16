import { RepositoryError } from '../data/repository';

export const SAVE_ERROR = 'Không lưu được, thử lại';
export const LOAD_ERROR = 'Không đọc được dữ liệu. Hãy tải lại trang.';

export function errorMessage(error: unknown): string {
  if (error instanceof RepositoryError) {
    switch (error.code) {
      case 'DUPLICATE_LABEL':
        return 'Nhãn này đã tồn tại';
      case 'INVALID_LABEL_NAME':
        return 'Tên nhãn dài 1–30 ký tự';
      case 'INVALID_TITLE':
        return 'Tên công việc dài 1–200 ký tự';
      case 'NOT_FOUND':
        return 'Không tìm thấy dữ liệu';
    }
  }
  return SAVE_ERROR;
}
