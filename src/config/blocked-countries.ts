export interface BlockedCountry {
  country: string;
  country_name: string;
}

export const BLOCKED_COUNTRIES: BlockedCountry[] = [
  { country: 'CN', country_name: 'China' },
  { country: 'HK', country_name: 'Hong Kong' },
  { country: 'IQ', country_name: 'Iraq' },
  { country: 'IR', country_name: 'Iran' },
  { country: 'SY', country_name: 'Syria' },
  { country: 'LB', country_name: 'Lebanon' },
  { country: 'BY', country_name: 'Belarus' },
  { country: 'LY', country_name: 'Libya' },
  { country: 'YE', country_name: 'Yemen' },
  { country: 'VE', country_name: 'Venezuela' },
  { country: 'CU', country_name: 'Cuba' },
  { country: 'AF', country_name: 'Afghanistan' },
  { country: 'CF', country_name: 'Central African Republic' },
  { country: 'SD', country_name: 'Sudan' },
  { country: 'SO', country_name: 'Somalia' },
  { country: 'KP', country_name: 'North Korea' },
  { country: 'SS', country_name: 'South Sudan' },
  { country: 'RU', country_name: 'Russia' },
];
