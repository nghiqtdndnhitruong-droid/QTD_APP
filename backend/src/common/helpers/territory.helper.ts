export const DEFAULT_PROVINCE_NAME = 'Tỉnh Vĩnh Long';

function ensurePrefix(name: string, prefix: string): string {
  const trimmed = name.trim();
  if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
    return trimmed;
  }
  return `${prefix} ${trimmed}`;
}

/**
 * Tự động ghép địa chỉ chuẩn từ Ấp - Xã - Tỉnh Vĩnh Long
 * Ví dụ: ("Ấp Nô Lựa", "Xã Nhị Trường") -> "Ấp Nô Lựa, Xã Nhị Trường, Tỉnh Vĩnh Long"
 */
export function formatTerritoryAddress(
  hamletName: string,
  communeName: string,
  provinceName = DEFAULT_PROVINCE_NAME,
): string {
  const normalizedHamlet = ensurePrefix(hamletName, 'Ấp');
  const normalizedCommune = ensurePrefix(communeName, 'Xã');
  const normalizedProvince = provinceName?.trim() || DEFAULT_PROVINCE_NAME;

  return `${normalizedHamlet}, ${normalizedCommune}, ${normalizedProvince}`;
}

/**
 * Tự động ghép địa chỉ chuẩn cấp Xã - Tỉnh Vĩnh Long (Dùng cho tài sản thế chấp chọn cấp Xã)
 * Ví dụ: ("Xã Nhị Trường") -> "Xã Nhị Trường, Tỉnh Vĩnh Long"
 */
export function formatCommuneAddress(
  communeName: string,
  provinceName = DEFAULT_PROVINCE_NAME,
): string {
  const normalizedCommune = ensurePrefix(communeName, 'Xã');
  const normalizedProvince = provinceName?.trim() || DEFAULT_PROVINCE_NAME;

  return `${normalizedCommune}, ${normalizedProvince}`;
}
