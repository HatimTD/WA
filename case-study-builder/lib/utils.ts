import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Single source of truth for the currency picker on the Solution (step 5) and
 * Cost Calculator (step 7) wizard steps. Covers every `currencyCode` actually
 * used by a `Subsidiary` row in production so auto-fill from a user's
 * subsidiary never silently drops back to EUR. Symbols are the common glyph
 * where one exists; otherwise the 3-letter ISO code is used as the prefix
 * (the cost-calc step widens its input padding when symbol.length > 1).
 *
 * Keep ordered: the major reserve currencies first (EUR/USD/GBP/etc.) for the
 * common case, then the rest alphabetised by code so users can scan quickly.
 */
export const CURRENCY_OPTIONS: ReadonlyArray<{
  code: string;
  name: string;
  symbol: string;
}> = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  // Remaining codes used by Subsidiary rows, alphabetised.
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'MXP', name: 'Mexican Peso', symbol: 'MXP' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
];

/**
 * ISO-4217 currency code → display symbol. Derived from CURRENCY_OPTIONS so
 * the picker and the input-prefix renderer can never drift apart. Anything
 * not in the map falls back to the code itself (e.g. an unrecognised code).
 */
const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  CURRENCY_OPTIONS.map((c) => [c.code, c.symbol])
);

/** Return the display symbol for a currency code, with safe fallbacks. */
export function getCurrencySymbol(currency: string | null | undefined): string {
  if (!currency) return '€';
  const code = currency.toUpperCase();
  return CURRENCY_SYMBOLS[code] || code;
}

/**
 * Format an amount with the given currency. Defaults to EUR (the application
 * default) when no code is supplied. Previously hard-coded USD which silently
 * mis-rendered every caller; pass the case study's `revenueCurrency` or the
 * cost calculator's `currency` explicitly.
 */
export function formatCurrency(amount: number, currency: string | null | undefined = 'EUR'): string {
  const code = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format(amount);
  } catch {
    // Unknown ISO code - fall back to symbol + number formatting.
    return `${getCurrencySymbol(code)}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(date);
}

/**
 * Format job type for display
 * Maps database values to user-friendly labels
 */
export function waFormatJobType(jobType: string | null | undefined, jobTypeOther?: string | null): string {
  if (!jobType) return '';

  const jobTypeMap: Record<string, string> = {
    'PREVENTIVE': 'Preventive',
    'CORRECTIVE': 'Repair',
    'IMPROVEMENT': 'New',
    'OTHER': jobTypeOther || 'Other',
  };

  return jobTypeMap[jobType] || jobType;
}

/**
 * Format product category for display
 * Maps database values to user-friendly labels
 * If category is OTHER and customName is provided, returns the custom name
 */
export function waFormatProductCategory(
  category: string | null | undefined,
  customName?: string | null
): string {
  if (!category) return '';

  const categoryMap: Record<string, string> = {
    'CONSUMABLES': 'Consumables',
    'COMPOSITE_WEAR_PLATES': 'Composite Wear Plates',
    'WEAR_PIPES_TUBES': 'Wear Pipes & Tubes',
    'INTEGRA_SERVICES': 'Integra Services',
    'OTHER': customName || 'Other',
  };

  return categoryMap[category] || category;
}

/**
 * Get product display text based on category
 * Returns appropriate product info based on whether it's consumables or other
 */
export function waGetProductDisplay(data: {
  productCategory?: string | null;
  waProduct?: string | null;
  waProductDiameter?: string | null;
  productDescription?: string | null;
}): string {
  if (!data.productCategory) {
    // Backward compatibility: if no category, show waProduct if available
    return data.waProduct || '';
  }

  if (data.productCategory === 'CONSUMABLES') {
    // For consumables, show product name + diameter
    const product = data.waProduct || '';
    const diameter = data.waProductDiameter ? ` (${data.waProductDiameter} mm)` : '';
    return product + diameter;
  } else {
    // For other categories, show product description
    return data.productDescription || '';
  }
}
