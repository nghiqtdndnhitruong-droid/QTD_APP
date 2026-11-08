import { BadRequestException } from '@nestjs/common';
import { FundLandCategory, LoanType, ValuationType } from '@prisma/client';
import {
  FUND_REGULATION_UNIT_PRICES,
  MAX_SECURED_VALUATION_RATIO,
  MAX_UNSECURED_LOAN_AMOUNT,
  VALUATION_ROUNDING_UNIT,
} from '../constants/loan.constants.js';

export interface CollateralValuationInput {
  area: number;
  actualArea?: number | null;
  valuationType: ValuationType;
  fundLandCategory?: FundLandCategory | null;
  unitPrice?: number | null;
}

export interface CollateralValuationResult {
  effectiveArea: number;
  unitPrice: number;
  rawValuationAmount: number;
  valuationAmount: number;
}

/**
 * Làm tròn xuống hàng triệu (VD: 15.200.000đ -> 15.000.000đ)
 */
export function roundDownToMillion(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  return (
    Math.floor(amount / VALUATION_ROUNDING_UNIT) * VALUATION_ROUNDING_UNIT
  );
}

/**
 * Tính định giá của 1 tài sản thế chấp:
 * - Theo Nghị định/Quy định Quỹ: lấy diện tích x đơn giá cố định của Quỹ (60k, 70k, 100k, 150k)
 * - Theo Giá thị trường: lấy diện tích x đơn giá thị trường do cán bộ nhập
 * - Kết quả làm tròn xuống hàng triệu (VD: 15.200.000đ -> 15.000.000đ)
 */
export function calculateCollateralAssetValuation(
  input: CollateralValuationInput,
): CollateralValuationResult {
  if (!Number.isFinite(input.area) || input.area <= 0) {
    throw new BadRequestException('Diện tích tài sản thế chấp phải lớn hơn 0');
  }

  let resolvedUnitPrice: number;

  if (input.valuationType === ValuationType.QUY_DINH_QUY) {
    if (!input.fundLandCategory) {
      throw new BadRequestException(
        'Vui lòng chọn loại đất theo quy định Quỹ khi định giá theo Nghị định Quỹ',
      );
    }
    const price = FUND_REGULATION_UNIT_PRICES[input.fundLandCategory];
    if (!price) {
      throw new BadRequestException(
        `Loại đất quy định Quỹ không hợp lệ: ${input.fundLandCategory}`,
      );
    }
    resolvedUnitPrice = price;
  } else if (input.valuationType === ValuationType.THI_TRUONG) {
    if (
      input.unitPrice === undefined ||
      input.unitPrice === null ||
      !Number.isFinite(input.unitPrice) ||
      input.unitPrice <= 0
    ) {
      throw new BadRequestException(
        'Vui lòng nhập mức đơn giá hợp lệ (> 0) khi định giá theo giá thị trường',
      );
    }
    resolvedUnitPrice = input.unitPrice;
  } else {
    throw new BadRequestException(
      `Loại định giá không hợp lệ: ${input.valuationType}`,
    );
  }

  const effectiveArea =
    input.actualArea !== undefined &&
    input.actualArea !== null &&
    Number.isFinite(input.actualArea) &&
    input.actualArea > 0
      ? input.actualArea
      : input.area;

  const rawValuationAmount = effectiveArea * resolvedUnitPrice;
  const valuationAmount = roundDownToMillion(rawValuationAmount);

  return {
    effectiveArea,
    unitPrice: resolvedUnitPrice,
    rawValuationAmount,
    valuationAmount,
  };
}

/**
 * Tính hạn mức cho vay tối đa:
 * - Tín chấp: tối đa 100.000.000đ / người
 * - Thế chấp: tối đa 70% tổng định giá của các tài sản thế chấp
 */
export function calculateMaxLoanLimit(
  loanType: LoanType,
  totalCollateralValuation = 0,
): number {
  if (loanType === LoanType.TIN_CHAP) {
    return MAX_UNSECURED_LOAN_AMOUNT;
  }
  return Math.floor(totalCollateralValuation * MAX_SECURED_VALUATION_RATIO);
}
