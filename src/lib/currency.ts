// Nigerian Naira currency formatting
export const CURRENCY_SYMBOL = '₦';
export const CURRENCY_CODE = 'NGN';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return `${CURRENCY_SYMBOL}0.00`;
  }
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyCompact(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return `${CURRENCY_SYMBOL}0`;
  }
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-NG')}`;
}
