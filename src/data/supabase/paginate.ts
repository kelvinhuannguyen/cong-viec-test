/** Supabase trả tối đa 1000 hàng mỗi lần (max rows mặc định): đọc theo trang cho tới khi hết. */
export const PAGE_SIZE = 1000;

interface PageResult<T> {
  data: T[] | null;
  error: { code?: string; message?: string } | null;
}

export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = PAGE_SIZE,
): Promise<{ data: T[]; error: PageResult<T>['error'] }> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: all, error };
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: all, error: null };
  }
}
