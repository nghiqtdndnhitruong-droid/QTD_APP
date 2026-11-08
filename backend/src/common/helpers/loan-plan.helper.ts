import { BadRequestException } from '@nestjs/common';

export interface LoanPlanLineItemInput {
  itemName: string;
  amount: number;
}

export interface LoanPlanCalculationInput {
  expenses: LoanPlanLineItemInput[];
  revenues: LoanPlanLineItemInput[];
  fundLoanCapital: number;
}

export interface LoanPlanCalculationResult {
  totalCapitalNeed: number;
  fundLoanCapital: number;
  ownCapital: number;
  totalRevenue: number;
  profit: number;
}

/**
 * Tính toán các chỉ tiêu tài chính của Phương án vay vốn:
 * - Tổng nhu cầu vốn = Tổng các khoản chi phí (tiền lãi vay đã nằm trong danh sách chi phí)
 * - Vốn tự có = Tổng nhu cầu vốn - Vốn vay quỹ
 * - Tổng nguồn thu = Tổng các khoản nguồn thu
 * - Lợi nhuận = Tổng nguồn thu - Tổng nhu cầu vốn (tổng chi phí)
 */
export function calculateLoanPlanSummary(
  input: LoanPlanCalculationInput,
): LoanPlanCalculationResult {
  const totalCapitalNeed = (input.expenses ?? []).reduce((sum, item) => {
    if (!Number.isFinite(item.amount) || item.amount < 0) {
      throw new BadRequestException(
        `Số tiền chi phí "${item.itemName}" không hợp lệ`,
      );
    }
    return sum + item.amount;
  }, 0);

  const totalRevenue = (input.revenues ?? []).reduce((sum, item) => {
    if (!Number.isFinite(item.amount) || item.amount < 0) {
      throw new BadRequestException(
        `Số tiền nguồn thu "${item.itemName}" không hợp lệ`,
      );
    }
    return sum + item.amount;
  }, 0);

  if (
    !Number.isFinite(input.fundLoanCapital) ||
    input.fundLoanCapital <= 0
  ) {
    throw new BadRequestException('Vốn vay quỹ phải lớn hơn 0');
  }

  if (
    totalCapitalNeed > 0 &&
    input.fundLoanCapital > totalCapitalNeed
  ) {
    throw new BadRequestException(
      `Vốn vay quỹ (${input.fundLoanCapital.toLocaleString('vi-VN')}đ) không được vượt quá tổng nhu cầu vốn của phương án (${totalCapitalNeed.toLocaleString('vi-VN')}đ)`,
    );
  }

  const ownCapital = Math.max(0, totalCapitalNeed - input.fundLoanCapital);
  const profit = totalRevenue - totalCapitalNeed;

  return {
    totalCapitalNeed,
    fundLoanCapital: input.fundLoanCapital,
    ownCapital,
    totalRevenue,
    profit,
  };
}
