import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ISO-4217 currency code → display symbol. Anything not in the map falls
 * back to the code itself (e.g. "PLN").
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥',
  MAD: 'MAD',
  PLN: 'zł',
};

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
