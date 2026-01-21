/**
 * WA Region and Subsidiary Constants
 * Based on NetSuite configuration
 */

export const WA_REGIONS = [
  { value: 'Europe', label: 'Europe' },
  { value: 'MEA', label: 'MEA' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Latin America', label: 'Latin America' },
  { value: 'North America', label: 'North America' },
] as const;

export type WaRegion = (typeof WA_REGIONS)[number]['value'];

/**
 * Subsidiary data with NetSuite Internal IDs
 */
export const WA_SUBSIDIARIES = {
  // Europe
  'WA Ltd': { id: '24', region: 'Europe', currency: 'GBP' },
  'WA Deutschland': { id: '5', region: 'Europe', currency: 'EUR' },
  'Alunox': { id: '9', region: 'Europe', currency: 'EUR' },
  'Corodur': { id: '6', region: 'Europe', currency: 'EUR' },
  'WA France': { id: '58', region: 'Europe', currency: 'EUR' },
  'Usi-Site': { id: '82', region: 'Europe', currency: 'EUR' },
  'WA Italiana': { id: '65', region: 'Europe', currency: 'EUR' },
  'WA Polska': { id: '70', region: 'Europe', currency: 'PLN' },
  'Dalforsan': { id: '77', region: 'Europe', currency: 'EUR' },
  'WA España': { id: '74', region: 'Europe', currency: 'EUR' },
  'WA Russia': { id: '71', region: 'Europe', currency: 'RUB' },
  'Produr': { id: '60', region: 'Europe', currency: 'EUR' },

  // MEA (Middle East & Africa)
  'Speedmet': { id: '78', region: 'MEA', currency: 'ZAR' },
  'WA South Africa': { id: '72', region: 'MEA', currency: 'ZAR' },
  'WA Maroc': { id: '68', region: 'MEA', currency: 'MAD' },
  'WA Kaynak': { id: '83', region: 'MEA', currency: 'TRY' },

  // Asia
  'WA Far East': { id: '50', region: 'Asia', currency: 'SGD' },
  'WA Thailand': { id: '26', region: 'Asia', currency: 'THB' },
  'WA Vietnam': { id: '81', region: 'Asia', currency: 'VND' },
  'WA Japan': { id: '66', region: 'Asia', currency: 'JPY' },
  'WA Malaysia': { id: '100', region: 'Asia', currency: 'MYR' },
  'WA South Asia': { id: '63', region: 'Asia', currency: 'INR' },
  'WA China': { id: '56', region: 'Asia', currency: 'CNY' },
  'WA Services Pte. Ltd': { id: '90', region: 'Asia', currency: 'SGD' },
  'WA Singapore': { id: 'SG', region: 'Asia', currency: 'SGD' },
  'PHS': { id: '113', region: 'Asia', currency: 'PHP' },

  // Latin America
  'WA Argentina': { id: '55', region: 'Latin America', currency: 'ARS' },
  'WA Brazil': { id: '101', region: 'Latin America', currency: 'BRL' },
  'WA Panamericana': { id: '67', region: 'Latin America', currency: 'USD' },
  'WA Peru': { id: '69', region: 'Latin America', currency: 'PEN' },

  // North America
  'WA USA': { id: '49', region: 'North America', currency: 'USD' },
  'Track-Weld': { id: 'TW', region: 'North America', currency: 'USD' },
  'Weld Mold': { id: 'WM', region: 'North America', currency: 'USD' },
} as const;

export type WaSubsidiaryName = keyof typeof WA_SUBSIDIARIES;

/**
 * Get subsidiaries by region
 */
export function waGetSubsidiariesByRegion(region: WaRegion): string[] {
  return Object.entries(WA_SUBSIDIARIES)
    .filter(([, data]) => data.region === region)
    .map(([name]) => name);
}

/**
 * Get region for a subsidiary
 */
export function waGetRegionForSubsidiary(subsidiaryName: string): WaRegion | undefined {
  const subsidiary = WA_SUBSIDIARIES[subsidiaryName as WaSubsidiaryName];
  return subsidiary?.region as WaRegion | undefined;
}

/**
 * Get NetSuite ID for a subsidiary
 */
export function waGetNetSuiteId(subsidiaryName: string): string | undefined {
  const subsidiary = WA_SUBSIDIARIES[subsidiaryName as WaSubsidiaryName];
  return subsidiary?.id;
}
