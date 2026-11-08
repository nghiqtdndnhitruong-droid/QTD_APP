import { BadRequestException } from '@nestjs/common';
import { LoanDurationType } from '@prisma/client';
import { DEFAULT_LOAN_DURATION_MONTHS } from '../constants/loan.constants.js';

const DD_MM_YYYY_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const YYYY_MM_DD_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * Chuyển đổi chuỗi ngày (hỗ trợ cả dd/mm/yyyy và yyyy-mm-dd hoặc ISO string) sang đối tượng Date (UTC)
 */
export function parseDateInput(
  value: string | Date,
  fieldLabel = 'Ngày tháng',
): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException(`${fieldLabel} không hợp lệ`);
    }
    return value;
  }

  const trimmed = value?.trim();
  if (!trimmed) {
    throw new BadRequestException(`${fieldLabel} không được để trống`);
  }

  let day: number;
  let month: number;
  let year: number;

  const dmyMatch = DD_MM_YYYY_REGEX.exec(trimmed);
  if (dmyMatch) {
    day = Number.parseInt(dmyMatch[1], 10);
    month = Number.parseInt(dmyMatch[2], 10);
    year = Number.parseInt(dmyMatch[3], 10);
  } else {
    const ymdMatch = YYYY_MM_DD_REGEX.exec(trimmed);
    if (ymdMatch) {
      year = Number.parseInt(ymdMatch[1], 10);
      month = Number.parseInt(ymdMatch[2], 10);
      day = Number.parseInt(ymdMatch[3], 10);
    } else {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException(
          `${fieldLabel} không đúng định dạng dd/mm/yyyy hoặc yyyy-mm-dd (nhận được: "${value}")`,
        );
      }
      return parsed;
    }
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException(
      `${fieldLabel} không tồn tại trên lịch (nhận được: "${value}")`,
    );
  }

  return date;
}

/**
 * Chuẩn hóa một thời điểm thực (VD: giờ hiện tại) về nửa đêm UTC cùng ngày,
 * để thống nhất với các ngày nhập tay dd/mm/yyyy vốn được parse theo Date.UTC.
 * Tránh lệch múi giờ khi cộng thêm tháng để tính ngày tới hạn.
 */
export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

/**
 * Định dạng đối tượng Date sang chuỗi dd/mm/yyyy
 */
export function formatDateDDMMYYYY(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Cộng số tháng vào một ngày (xử lý an toàn ngày cuối tháng như 31/01 -> 28/02)
 */
export function addMonthsUTC(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthIndex = month + months;
  const result = new Date(Date.UTC(year, targetMonthIndex, day));

  // Nếu bị tràn sang tháng kế tiếp (VD: 31/01 + 1 tháng -> 03/03), lùi về ngày cuối cùng của tháng đích
  if (result.getUTCDate() !== day) {
    return new Date(Date.UTC(year, targetMonthIndex + 1, 0));
  }

  return result;
}

/**
 * Tính Thời hạn vay (số tháng mặc định: Ngắn hạn = 12 tháng, Trung hạn = 24 tháng)
 * và Ngày tới hạn trả tính từ Ngày giải ngân (nếu đã có Ngày giải ngân)
 */
export function calculateLoanTermAndDueDate(
  disbursementDateInput: string | Date | null | undefined,
  durationType: LoanDurationType,
): {
  disbursementDate: Date | null;
  durationMonths: number;
  dueDate: Date | null;
} {
  const durationMonths = DEFAULT_LOAN_DURATION_MONTHS[durationType];

  if (!durationMonths) {
    throw new BadRequestException(
      `Thời hạn vay không hợp lệ: ${durationType}`,
    );
  }

  const hasDisbursement =
    disbursementDateInput instanceof Date ||
    (typeof disbursementDateInput === 'string' &&
      disbursementDateInput.trim().length > 0);

  if (!hasDisbursement) {
    return {
      disbursementDate: null,
      durationMonths,
      dueDate: null,
    };
  }

  const disbursementDate = parseDateInput(
    disbursementDateInput!,
    'Ngày giải ngân',
  );
  const dueDate = addMonthsUTC(disbursementDate, durationMonths);

  return {
    disbursementDate,
    durationMonths,
    dueDate,
  };
}
