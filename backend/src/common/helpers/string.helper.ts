/**
 * Trim chuỗi và trả về null nếu rỗng/undefined/null.
 * Dùng để chuẩn hóa các trường tùy chọn (phone, note, usageForm, ...) trước khi lưu DB.
 */
export function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
