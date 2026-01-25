import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
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
    'COMPOSITE_WEAR_PLATES': 'Composite wear plates',
    'WEAR_PIPES_TUBES': 'Wear pipes & Tubes',
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
