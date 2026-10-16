import { RepositoryError } from '../repository';

interface DbError {
  code?: string;
  message?: string;
}

/**
 * Lỗi PostgREST / Postgres → RepositoryError mà giao diện đã biết cách hiển thị.
 * Lỗi khác (mạng, quyền...) giữ nguyên để hook hiện thông báo chung.
 */
export function toRepositoryError(error: DbError, entity: 'task' | 'label'): Error {
  switch (error.code) {
    case '23505': // trùng khoá duy nhất (tên nhãn)
      if (entity === 'label') return new RepositoryError('DUPLICATE_LABEL');
      break;
    case '23514': // vi phạm ràng buộc check (độ dài tên)
      return new RepositoryError(entity === 'label' ? 'INVALID_LABEL_NAME' : 'INVALID_TITLE');
    case 'P0002': // remove_label: không có nhãn
    case 'PGRST116': // .single(): không có hàng nào
    case '22P02': // id không phải uuid hợp lệ
      return new RepositoryError('NOT_FOUND');
  }
  return Object.assign(new Error(error.message ?? 'Lỗi Supabase'), { code: error.code });
}
