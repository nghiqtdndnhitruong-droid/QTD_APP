import { BadRequestException } from '@nestjs/common';
import { Gender, IdentityCardType } from '@prisma/client';
import { ISSUING_AUTHORITY_BY_ID_TYPE } from '../constants/loan.constants.js';
import { parseDateInput } from './date.helper.js';

export interface ParsedIdentityCardInfo {
  idNumber: string;
  gender: Gender;
  birthYear: number;
}

export interface PersonIdentityInput {
  idType: IdentityCardType;
  idNumber: string;
  issueDate: string | Date;
  expiryDate?: string | Date | null;
}

export interface EnrichedPersonIdentity {
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date | null;
  gender: Gender;
  birthYear: number;
}

const TWELVE_DIGITS_REGEX = /^\d{12}$/;

/**
 * Tách Giới tính và Năm sinh từ Số giấy tờ (12 chữ số, tính vị trí từ 1):
 * - Vị trí thứ 4 (index 0-based là 3):
 *   + '0' -> Nam, thế kỷ 20 (1900 - 1999)
 *   + '1' -> Nữ, thế kỷ 20 (1900 - 1999)
 *   + '2' -> Nam, thế kỷ 21 (2000 - 2099)
 *   + '3' -> Nữ, thế kỷ 21 (2000 - 2099)
 * - Vị trí thứ 5 và 6 (index 0-based là 4, 5): 2 số cuối năm sinh.
 */
export function parseIdentityCardNumber(
  rawIdNumber: string,
  fieldLabel = 'Số giấy tờ',
): ParsedIdentityCardInfo {
  const idNumber = rawIdNumber?.trim();

  if (!idNumber || !TWELVE_DIGITS_REGEX.test(idNumber)) {
    throw new BadRequestException(
      `${fieldLabel} phải gồm đúng 12 chữ số (nhận được: "${rawIdNumber ?? ''}")`,
    );
  }

  // Vị trí thứ 4 (tính từ 1) -> charAt(3)
  const fourthDigit = idNumber.charAt(3);
  // Vị trí thứ 5 và 6 (tính từ 1) -> slice(4, 6)
  const birthYearSuffix = Number.parseInt(idNumber.slice(4, 6), 10);

  let gender: Gender;
  let centuryBase: number;

  switch (fourthDigit) {
    case '0':
      gender = Gender.NAM;
      centuryBase = 1900;
      break;
    case '1':
      gender = Gender.NU;
      centuryBase = 1900;
      break;
    case '2':
      gender = Gender.NAM;
      centuryBase = 2000;
      break;
    case '3':
      gender = Gender.NU;
      centuryBase = 2000;
      break;
    default:
      throw new BadRequestException(
        `${fieldLabel} không hợp lệ: chữ số ở vị trí thứ 4 phải là 0, 1, 2 hoặc 3 (nhận được "${fourthDigit}")`,
      );
  }

  return {
    idNumber,
    gender,
    birthYear: centuryBase + birthYearSuffix,
  };
}

/**
 * Tự động lấy Nơi cấp giấy tờ theo Loại giấy tờ:
 * - Căn cước (CAN_CUOC) -> Bộ Công An
 * - Căn cước công dân (CCCD) -> Cục CSQLHC về TTXH
 */
export function resolveIssuingAuthority(idType: IdentityCardType): string {
  const authority = ISSUING_AUTHORITY_BY_ID_TYPE[idType];
  if (!authority) {
    throw new BadRequestException(`Loại giấy tờ không hợp lệ: ${idType}`);
  }
  return authority;
}

/**
 * Hàm dùng chung để chuẩn hóa và tự động điền các trường định danh cá nhân
 * (Dùng cho: Người vay, Người thừa kế, Người bảo lãnh, Người liên quan, Người trong hộ)
 */
export function buildPersonIdentityFields(
  input: PersonIdentityInput,
  personLabel = 'Cá nhân',
): EnrichedPersonIdentity {
  const { idNumber, gender, birthYear } = parseIdentityCardNumber(
    input.idNumber,
    `Số giấy tờ của ${personLabel}`,
  );
  const issuingAuthority = resolveIssuingAuthority(input.idType);
  const issueDate = parseDateInput(
    input.issueDate,
    `Ngày cấp giấy tờ của ${personLabel}`,
  );
  const expiryDate = input.expiryDate
    ? parseDateInput(input.expiryDate, `Thời hạn giấy tờ của ${personLabel}`)
    : null;

  return {
    idType: input.idType,
    idNumber,
    issuingAuthority,
    issueDate,
    expiryDate,
    gender,
    birthYear,
  };
}
