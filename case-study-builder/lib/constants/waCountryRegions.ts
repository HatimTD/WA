/**
 * Country -> WA Region mapping (geographic).
 *
 * WA organises the world into the five regions defined in WA_REGIONS
 * (Europe, MEA, Asia, Latin America, North America), mirroring the subsidiary
 * groupings in WA_SUBSIDIARIES (lib/constants/waRegions.ts). WA has no separate
 * Oceania region, so Australia / New Zealand are grouped under Asia (Asia-Pacific).
 *
 * Keys are lowercased country names; lookups are case-insensitive. Common
 * abbreviations / alternate spellings are included. Countries not listed return
 * undefined (treated as outside the WA region set).
 */
import type { WaRegion } from './waRegions';

const COUNTRY_TO_REGION: Record<string, WaRegion> = {
  // --- Europe ---
  france: 'Europe', germany: 'Europe', spain: 'Europe', italy: 'Europe', poland: 'Europe',
  'united kingdom': 'Europe', uk: 'Europe', 'great britain': 'Europe', england: 'Europe',
  russia: 'Europe', sweden: 'Europe', netherlands: 'Europe', belgium: 'Europe', switzerland: 'Europe',
  austria: 'Europe', portugal: 'Europe', norway: 'Europe', finland: 'Europe', denmark: 'Europe',
  ireland: 'Europe', 'czech republic': 'Europe', czechia: 'Europe', greece: 'Europe', romania: 'Europe',
  hungary: 'Europe', ukraine: 'Europe', slovakia: 'Europe', bulgaria: 'Europe', croatia: 'Europe',
  serbia: 'Europe', slovenia: 'Europe', luxembourg: 'Europe', lithuania: 'Europe', latvia: 'Europe',
  estonia: 'Europe', iceland: 'Europe', belarus: 'Europe',

  // --- MEA (Middle East & Africa) ---
  'south africa': 'MEA', morocco: 'MEA', turkey: 'MEA', 'türkiye': 'MEA', egypt: 'MEA',
  'saudi arabia': 'MEA', 'united arab emirates': 'MEA', uae: 'MEA', nigeria: 'MEA', kenya: 'MEA',
  algeria: 'MEA', tunisia: 'MEA', israel: 'MEA', qatar: 'MEA', kuwait: 'MEA', oman: 'MEA',
  bahrain: 'MEA', jordan: 'MEA', lebanon: 'MEA', iraq: 'MEA', iran: 'MEA', ghana: 'MEA',
  tanzania: 'MEA', zambia: 'MEA', zimbabwe: 'MEA', angola: 'MEA', mozambique: 'MEA', namibia: 'MEA',
  botswana: 'MEA', senegal: 'MEA', 'ivory coast': 'MEA', "côte d'ivoire": 'MEA', ethiopia: 'MEA',
  libya: 'MEA', cameroon: 'MEA', sudan: 'MEA',

  // --- Asia (incl. Asia-Pacific / Oceania) ---
  japan: 'Asia', china: 'Asia', india: 'Asia', 'south korea': 'Asia', korea: 'Asia',
  indonesia: 'Asia', thailand: 'Asia', vietnam: 'Asia', malaysia: 'Asia', singapore: 'Asia',
  philippines: 'Asia', australia: 'Asia', 'new zealand': 'Asia', pakistan: 'Asia', bangladesh: 'Asia',
  taiwan: 'Asia', 'hong kong': 'Asia', 'sri lanka': 'Asia', myanmar: 'Asia', cambodia: 'Asia',
  mongolia: 'Asia', nepal: 'Asia', kazakhstan: 'Asia', uzbekistan: 'Asia', laos: 'Asia', brunei: 'Asia',

  // --- Latin America ---
  peru: 'Latin America', chile: 'Latin America', brazil: 'Latin America', argentina: 'Latin America',
  mexico: 'Latin America', colombia: 'Latin America', panama: 'Latin America', bolivia: 'Latin America',
  ecuador: 'Latin America', venezuela: 'Latin America', uruguay: 'Latin America', paraguay: 'Latin America',
  guatemala: 'Latin America', 'costa rica': 'Latin America', 'dominican republic': 'Latin America',
  honduras: 'Latin America', nicaragua: 'Latin America', 'el salvador': 'Latin America', cuba: 'Latin America',

  // --- North America ---
  usa: 'North America', 'united states': 'North America', 'united states of america': 'North America',
  'u.s.a.': 'North America', us: 'North America', canada: 'North America',
};

/** Resolve a free-text country name to its WA region (case-insensitive). */
export function waGetRegionForCountry(country: string | null | undefined): WaRegion | undefined {
  if (!country) return undefined;
  return COUNTRY_TO_REGION[country.trim().toLowerCase()];
}

/** All country keys (lowercased) belonging to a WA region — for case-insensitive filtering. */
export function waGetCountriesForRegion(region: string): string[] {
  return Object.entries(COUNTRY_TO_REGION)
    .filter(([, r]) => r === region)
    .map(([country]) => country);
}
