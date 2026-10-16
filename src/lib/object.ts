/** Bỏ các khoá có giá trị undefined để `{ ...a, ...patch }` không ghi đè bằng undefined. */
export function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
