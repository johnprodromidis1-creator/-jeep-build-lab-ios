export type DecimalInputOptions = {
  places: 1 | 2;
  min: number;
  max: number;
  emptyAsZero?: boolean;
};

export function formatDecimalUnits(value: number, places: 1 | 2): string {
  return (value / 10 ** places).toFixed(places);
}

// Convert decimal digits directly to integer cents/tenths, without floating-point rounding.
export function parseDecimalUnits(raw: string, places: 1 | 2): number | null {
  const text = raw.trim();
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d*)(?:\.\d*)?$/.test(text) || !/\d/.test(text)) return null;
  const [whole, fraction = ''] = text.replaceAll(',', '').split('.');
  if (fraction.length > places) return null;
  const value = Number((whole || '0') + fraction.padEnd(places, '0'));
  return Number.isSafeInteger(value) ? value : null;
}

export function finishDecimalInput(raw: string, previous: number, options: DecimalInputOptions) {
  const {places, min, max, emptyAsZero} = options;
  const value = raw.trim() === '' && emptyAsZero ? 0 : parseDecimalUnits(raw, places);
  if (value === null || value < min || value > max) {
    return {
      value: previous,
      message: `Kept ${formatDecimalUnits(previous, places)}. Enter ${formatDecimalUnits(min, places)}–${formatDecimalUnits(max, places)}, with up to ${places} decimal ${places === 1 ? 'place' : 'places'}.`,
    };
  }
  return {value, message: ''};
}
