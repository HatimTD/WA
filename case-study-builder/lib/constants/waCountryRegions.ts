/**
 * Country -> WA Region mapping (geographic), robust to mixed data formats.
 *
 * A case's `country` field can arrive as a full English name (Google Places
 * long_name, e.g. "Morocco"), an ISO 3166-1 alpha-2 code (e.g. "MA", from
 * NetSuite / manual entry), or a common alias / French name ("Maroc", "UK").
 * This module normalises ALL of those to one of the five WA regions defined in
 * WA_REGIONS, grouped to match the subsidiary structure in WA_SUBSIDIARIES
 * (WA has no Oceania region — Australia/NZ/Pacific fall under Asia; Russia ->
 * Europe and Turkey -> MEA follow WA's own subsidiary regions).
 *
 * Each entry: [isoAlpha2, canonicalName, ...aliases]. All keys are matched
 * case-insensitively. waGetRegionForCountry() resolves any of them; unknown
 * values return undefined (treated as outside the WA region set).
 */
import type { WaRegion } from './waRegions';

const REGION_COUNTRIES: Record<WaRegion, string[][]> = {
  Europe: [
    ['al', 'Albania'], ['ad', 'Andorra'], ['at', 'Austria'], ['by', 'Belarus'], ['be', 'Belgium'],
    ['ba', 'Bosnia and Herzegovina', 'bosnia'], ['bg', 'Bulgaria'], ['hr', 'Croatia'], ['cy', 'Cyprus'],
    ['cz', 'Czechia', 'czech republic'], ['dk', 'Denmark'], ['ee', 'Estonia'], ['fi', 'Finland'],
    ['fr', 'France'], ['de', 'Germany', 'allemagne', 'deutschland'], ['gr', 'Greece'], ['hu', 'Hungary'],
    ['is', 'Iceland'], ['ie', 'Ireland'], ['it', 'Italy', 'italie'], ['xk', 'Kosovo'], ['lv', 'Latvia'],
    ['li', 'Liechtenstein'], ['lt', 'Lithuania'], ['lu', 'Luxembourg'], ['mt', 'Malta'], ['md', 'Moldova'],
    ['mc', 'Monaco'], ['me', 'Montenegro'], ['nl', 'Netherlands', 'holland'], ['mk', 'North Macedonia', 'macedonia'],
    ['no', 'Norway'], ['pl', 'Poland'], ['pt', 'Portugal'], ['ro', 'Romania'], ['ru', 'Russia', 'russian federation'],
    ['sm', 'San Marino'], ['rs', 'Serbia'], ['sk', 'Slovakia'], ['si', 'Slovenia'],
    ['es', 'Spain', 'espagne'], ['se', 'Sweden'], ['ch', 'Switzerland', 'suisse'], ['ua', 'Ukraine'],
    ['gb', 'United Kingdom', 'uk', 'great britain', 'england', 'royaume-uni'], ['va', 'Vatican City'],
  ],
  MEA: [
    // Middle East
    ['bh', 'Bahrain'], ['ir', 'Iran'], ['iq', 'Iraq'], ['il', 'Israel'], ['jo', 'Jordan'], ['kw', 'Kuwait'],
    ['lb', 'Lebanon'], ['om', 'Oman'], ['ps', 'Palestine'], ['qa', 'Qatar'], ['sa', 'Saudi Arabia'],
    ['sy', 'Syria'], ['tr', 'Turkey', 'türkiye', 'turkiye'], ['ae', 'United Arab Emirates', 'uae'], ['ye', 'Yemen'],
    // Africa
    ['dz', 'Algeria'], ['ao', 'Angola'], ['bj', 'Benin'], ['bw', 'Botswana'], ['bf', 'Burkina Faso'],
    ['bi', 'Burundi'], ['cm', 'Cameroon'], ['cv', 'Cape Verde'], ['cf', 'Central African Republic'],
    ['td', 'Chad'], ['km', 'Comoros'], ['cg', 'Congo'], ['cd', 'DR Congo', 'democratic republic of the congo'],
    ['ci', "Côte d'Ivoire", 'ivory coast'], ['dj', 'Djibouti'], ['eg', 'Egypt'], ['gq', 'Equatorial Guinea'],
    ['er', 'Eritrea'], ['sz', 'Eswatini', 'swaziland'], ['et', 'Ethiopia'], ['ga', 'Gabon'], ['gm', 'Gambia'],
    ['gh', 'Ghana'], ['gn', 'Guinea'], ['gw', 'Guinea-Bissau'], ['ke', 'Kenya'], ['ls', 'Lesotho'],
    ['lr', 'Liberia'], ['ly', 'Libya'], ['mg', 'Madagascar'], ['mw', 'Malawi'], ['ml', 'Mali'],
    ['mr', 'Mauritania'], ['mu', 'Mauritius'], ['ma', 'Morocco', 'maroc'], ['mz', 'Mozambique'],
    ['na', 'Namibia'], ['ne', 'Niger'], ['ng', 'Nigeria'], ['rw', 'Rwanda'], ['sn', 'Senegal'],
    ['sc', 'Seychelles'], ['sl', 'Sierra Leone'], ['so', 'Somalia'], ['za', 'South Africa', 'afrique du sud'],
    ['ss', 'South Sudan'], ['sd', 'Sudan'], ['tz', 'Tanzania'], ['tg', 'Togo'], ['tn', 'Tunisia'],
    ['ug', 'Uganda'], ['zm', 'Zambia'], ['zw', 'Zimbabwe'],
  ],
  Asia: [
    ['af', 'Afghanistan'], ['am', 'Armenia'], ['az', 'Azerbaijan'], ['bd', 'Bangladesh'], ['bt', 'Bhutan'],
    ['bn', 'Brunei'], ['kh', 'Cambodia'], ['cn', 'China'], ['ge', 'Georgia'], ['hk', 'Hong Kong'],
    ['in', 'India'], ['id', 'Indonesia'], ['jp', 'Japan'], ['kz', 'Kazakhstan'], ['kp', 'North Korea'],
    ['kr', 'South Korea', 'korea'], ['kg', 'Kyrgyzstan'], ['la', 'Laos'], ['mo', 'Macau'], ['my', 'Malaysia'],
    ['mv', 'Maldives'], ['mn', 'Mongolia'], ['mm', 'Myanmar', 'burma'], ['np', 'Nepal'], ['pk', 'Pakistan'],
    ['ph', 'Philippines'], ['sg', 'Singapore'], ['lk', 'Sri Lanka'], ['tw', 'Taiwan'], ['tj', 'Tajikistan'],
    ['th', 'Thailand'], ['tl', 'Timor-Leste'], ['tm', 'Turkmenistan'], ['uz', 'Uzbekistan'], ['vn', 'Vietnam'],
    // Oceania (grouped under Asia per WA structure)
    ['au', 'Australia'], ['fj', 'Fiji'], ['nz', 'New Zealand'], ['pg', 'Papua New Guinea'], ['nc', 'New Caledonia'],
  ],
  'Latin America': [
    ['ar', 'Argentina'], ['bo', 'Bolivia'], ['br', 'Brazil', 'brasil', 'brésil'], ['cl', 'Chile'],
    ['co', 'Colombia'], ['cr', 'Costa Rica'], ['cu', 'Cuba'], ['do', 'Dominican Republic'], ['ec', 'Ecuador'],
    ['sv', 'El Salvador'], ['gt', 'Guatemala'], ['hn', 'Honduras'], ['mx', 'Mexico', 'méxico'],
    ['ni', 'Nicaragua'], ['pa', 'Panama'], ['py', 'Paraguay'], ['pe', 'Peru', 'pérou'], ['pr', 'Puerto Rico'],
    ['uy', 'Uruguay'], ['ve', 'Venezuela'],
  ],
  'North America': [
    ['us', 'United States', 'usa', 'united states of america', 'u.s.a.', 'u.s.', 'america'],
    ['ca', 'Canada'],
  ],
};

// Build flat lookup maps from the structured table above.
const COUNTRY_TO_REGION: Record<string, WaRegion> = {}; // any key (lowercased) -> region
const KEY_TO_NAME: Record<string, string> = {};         // any key (lowercased) -> canonical name
const NAME_TO_KEYS: Record<string, string[]> = {};      // canonical name (lowercased) -> all variant keys
for (const region of Object.keys(REGION_COUNTRIES) as WaRegion[]) {
  for (const [code, name, ...aliases] of REGION_COUNTRIES[region]) {
    const keys = [code, name, ...aliases];
    NAME_TO_KEYS[name.toLowerCase()] = keys.map((k) => k.toLowerCase());
    for (const key of keys) {
      const lk = key.trim().toLowerCase();
      COUNTRY_TO_REGION[lk] = region;
      KEY_TO_NAME[lk] = name;
    }
  }
}

/** Resolve a country value (name, ISO alpha-2 code, or alias) to its WA region. */
export function waGetRegionForCountry(country: string | null | undefined): WaRegion | undefined {
  if (!country) return undefined;
  return COUNTRY_TO_REGION[country.trim().toLowerCase()];
}

/** All country keys (names + codes + aliases, lowercased) belonging to a WA region — for case-insensitive filtering. */
export function waGetCountriesForRegion(region: string): string[] {
  return Object.entries(COUNTRY_TO_REGION)
    .filter(([, r]) => r === region)
    .map(([key]) => key);
}

/**
 * Canonical display name for ANY country value — code, alias or local spelling.
 * "MA" / "Maroc" / "morocco" -> "Morocco"; unknown values are returned unchanged.
 */
export function waGetCountryDisplayName(country: string | null | undefined): string {
  if (!country) return '';
  const v = country.trim();
  return KEY_TO_NAME[v.toLowerCase()] ?? v;
}

/**
 * All stored-value variants (ISO code + canonical name + aliases) for the country
 * a value belongs to — so a single "Morocco" filter option can match rows stored
 * as "MA", "Maroc" or "Morocco". Unknown values return just themselves.
 */
export function waGetCountryVariants(country: string | null | undefined): string[] {
  if (!country) return [];
  const v = country.trim();
  const canonical = KEY_TO_NAME[v.toLowerCase()];
  return canonical ? NAME_TO_KEYS[canonical.toLowerCase()] : [v];
}
