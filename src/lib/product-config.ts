export const waitlistConfig = {
  goal: 100,
  publicThreshold: 10,
  count: parsePublicCount(import.meta.env.PUBLIC_WAITLIST_COUNT),
};

export const serviceIsOpen = (count = waitlistConfig.count) => count >= waitlistConfig.goal;

export const launchCurrencies = [
  'EUR',
  'USD',
  'GBP',
  'CAD',
  'AUD',
  'NZD',
  'SGD',
  'HKD',
  'INR',
  'PLN',
] as const;

export const plannedCurrencies = [
  ...launchCurrencies,
  'DKK',
  'ISK',
  'NOK',
  'SEK',
  'JPY',
  'CNY',
  'CHF',
  'TWD',
  'KRW',
  'UAH',
  'ILS',
] as const;

export const excludedFirstPhaseMarkets = ['CN'] as const;

export const priceGrid = {
  EUR: { full: 18, founding: 12 },
  USD: { full: 21, founding: 12 },
  GBP: { full: 18, founding: 12 },
  CAD: { full: 29, founding: 12 },
  AUD: { full: 29.5, founding: 12 },
  DKK: { full: 145, founding: 90 },
  ISK: { full: 2_600, founding: 1_400 },
  NOK: { full: 245, founding: 145 },
  SEK: { full: 245, founding: 145 },
  JPY: { full: 3_280, founding: 2_186 },
  CNY: { full: 140, founding: 94 },
  CHF: { full: 18, founding: 12 },
  TWD: { full: 669, founding: 445 },
  KRW: { full: 3_000, founding: 2_000 },
  UAH: { full: 800, founding: 600 },
  ILS: { full: 65, founding: 42 },
  PLN: { full: 60, founding: 40 },
} as const;

export type PriceCurrency = keyof typeof priceGrid;

export const aliasInactiveAfterDays = 30;

export const fullAnnualPrice = {
  amount: 18,
  currency: 'EUR',
  label: '€18 / year',
} as const;

export function waitlistCountIsPublic(count = waitlistConfig.count) {
  return count >= waitlistConfig.publicThreshold;
}

function parsePublicCount(value: string | undefined) {
  const parsed = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
