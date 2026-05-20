export type ProductType = "tee-basic" | "tee-premium" | "hoodie" | "bomber";
export type Currency = "CAD" | "UAH" | "USD" | "PLN";

export const PRICE_TABLE: Record<ProductType, Record<Currency, number>> = {
  "tee-basic":   { CAD: 45,  UAH: 1650, USD: 33,  PLN: 135 },
  "tee-premium": { CAD: 58,  UAH: 2100, USD: 43,  PLN: 174 },
  "hoodie":      { CAD: 95,  UAH: 3500, USD: 70,  PLN: 285 },
  "bomber":      { CAD: 185, UAH: 6800, USD: 136, PLN: 555 },
};

export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  CA: "CAD",
  UA: "UAH",
  US: "USD",
  PL: "PLN",
};

export const CURRENCIES: { code: Currency; symbol: string; flag: string; countryCode: string; name: string }[] = [
  { code: "CAD", symbol: "CA$", flag: "🇨🇦", countryCode: "CA", name: "Канада" },
  { code: "UAH", symbol: "₴",   flag: "🇺🇦", countryCode: "UA", name: "Україна" },
  { code: "USD", symbol: "$",   flag: "🇺🇸", countryCode: "US", name: "США" },
  { code: "PLN", symbol: "zł",  flag: "🇵🇱", countryCode: "PL", name: "Польща" },
];

export function currencyForCountry(countryCode: string | undefined | null): Currency {
  if (!countryCode) return "CAD";
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? "CAD";
}

export function priceOf(type: ProductType, currency: Currency): number {
  return PRICE_TABLE[type][currency];
}

export function formatPrice(amount: number, currency: Currency): string {
  const meta = CURRENCIES.find((c) => c.code === currency)!;
  switch (currency) {
    case "UAH":
      return `${Math.round(amount)} ${meta.symbol}`;
    case "PLN":
      return `${Math.round(amount)} ${meta.symbol}`;
    case "CAD":
    case "USD":
      return `${meta.symbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  }
}
