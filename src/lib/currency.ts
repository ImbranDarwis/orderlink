export const EXCHANGE_RATE = 15000; // 1 USD = 15,000 IDR

/**
 * Format a monetary value for display.
 *
 * @param amount     — the raw number to format
 * @param currency   — active display currency ('USD' | 'IDR')
 * @param storedInUSD — true if the value in DB is always USD and needs
 *                      conversion when displaying as IDR (e.g. order totals).
 *                      false for values stored in the user's input currency
 *                      (e.g. inventory price, customer total_spent).
 */
export const formatCurrency = (
  amount: any,
  currency: 'USD' | 'IDR',
  storedInUSD = false,
): string => {
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (isNaN(num)) return amount;
  if (currency === 'IDR') {
    const displayVal = storedInUSD ? num * EXCHANGE_RATE : num;
    return 'Rp ' + displayVal.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrencyCompact = (
  amount: number,
  currency: 'USD' | 'IDR',
  storedInUSD = false,
): string => {
  if (currency === 'IDR') {
    const displayVal = storedInUSD ? amount * EXCHANGE_RATE : amount;
    if (displayVal >= 1_000_000_000) {
      return 'Rp ' + (displayVal / 1_000_000_000).toFixed(1) + 'M';
    }
    if (displayVal >= 1_000_000) {
      return 'Rp ' + (displayVal / 1_000_000).toFixed(1) + 'Jt';
    }
    return 'Rp ' + displayVal.toLocaleString('id-ID');
  }
  
  if (amount >= 1_000_000) {
    return '$' + (amount / 1_000_000).toFixed(1) + 'M';
  }
  if (amount >= 1_000) {
    return '$' + (amount / 1_000).toFixed(1) + 'K';
  }
  return '$' + amount.toLocaleString('en-US');
};
