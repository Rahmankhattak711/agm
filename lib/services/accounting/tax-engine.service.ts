export type TaxCategoryType =
  | "OUT_OF_SCOPE"
  | "STANDARD_PURCHASES"
  | "STANDARD_SALES"
  | "REVERSE_CHARGE"
  | "ZERO_RATED"
  | "EXEMPT";

export interface TaxRateOption {
  code: TaxCategoryType;
  label: string;
  category: "OUT OF SCOPE" | "PURCHASES" | "REVERSE CHARGE" | "SALES" | "EXEMPT";
  rate: number; // e.g. 5.00 or 0.00
  isRecoverable: boolean; // true for Purchases (Input tax claimable)
}

export const UAE_TAX_RATES: TaxRateOption[] = [
  {
    code: "OUT_OF_SCOPE",
    label: "0% - Out of Scope",
    category: "OUT OF SCOPE",
    rate: 0,
    isRecoverable: false,
  },
  {
    code: "STANDARD_PURCHASES",
    label: "5% - VAT on Purchases",
    category: "PURCHASES",
    rate: 5,
    isRecoverable: true,
  },
  {
    code: "REVERSE_CHARGE",
    label: "5% - Reverse Charge",
    category: "REVERSE CHARGE",
    rate: 5,
    isRecoverable: true,
  },
  {
    code: "ZERO_RATED",
    label: "0% - Zero-Rated Sales",
    category: "SALES",
    rate: 0,
    isRecoverable: false,
  },
  {
    code: "STANDARD_SALES",
    label: "5% - Standard Rated",
    category: "SALES",
    rate: 5,
    isRecoverable: false,
  },
  {
    code: "EXEMPT",
    label: "0% - Exempt",
    category: "EXEMPT",
    rate: 0,
    isRecoverable: false,
  },
];

export interface TaxCalculationResult {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export class TaxEngineService {
  /**
   * Calculate VAT based on base net amount or tax-inclusive amount
   */
  static calculateTax(
    amount: number,
    taxType: TaxCategoryType,
    isInclusive: boolean = false
  ): TaxCalculationResult {
    const taxOption = UAE_TAX_RATES.find((t) => t.code === taxType) || UAE_TAX_RATES[0];
    const rate = taxOption.rate;

    if (rate === 0) {
      return {
        taxableAmount: Math.round(amount * 100) / 100,
        taxAmount: 0,
        totalAmount: Math.round(amount * 100) / 100,
      };
    }

    if (isInclusive) {
      // Amount includes 5% VAT (e.g. 105 -> 100 net + 5 tax)
      const taxable = amount / (1 + rate / 100);
      const tax = amount - taxable;
      return {
        taxableAmount: Math.round(taxable * 100) / 100,
        taxAmount: Math.round(tax * 100) / 100,
        totalAmount: Math.round(amount * 100) / 100,
      };
    } else {
      // Amount is net before tax (e.g. 100 -> 5 tax -> 105 total)
      const tax = (amount * rate) / 100;
      const total = amount + tax;
      return {
        taxableAmount: Math.round(amount * 100) / 100,
        taxAmount: Math.round(tax * 100) / 100,
        totalAmount: Math.round(total * 100) / 100,
      };
    }
  }
}
