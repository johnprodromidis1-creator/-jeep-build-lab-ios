import { powertrainNames, quantityFor, type BuildState, type Category, type Part } from "./model";

export const allCatalogFilter = "all";

export const priceBandOptions = [
  { value: allCatalogFilter, label: "All prices" },
  { value: "under-500", label: "Under $500" },
  { value: "500-1000", label: "$500-$999" },
  { value: "1000-2500", label: "$1,000-$2,499" },
  { value: "2500-plus", label: "$2,500+" },
] as const;

export type CatalogFilterState = {
  category: Category;
  query: string;
  brand: string;
  price: string;
  dimension: string;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function inchTerms(label: string, value?: number) {
  if (value === undefined) return "";
  return `${label} ${value} ${value} inch ${value}-inch ${value}"`;
}

export function catalogSearchText(part: Part) {
  const powertrains = part.powertrains?.map(powertrain => powertrainNames[powertrain]).join(" ") ?? powertrainNames.gas;
  const specs = [
    inchTerms("wheel rim diameter", part.specs.rim),
    inchTerms("tire diameter", part.specs.diameter),
    inchTerms("wheel width", part.specs.width),
    part.specs.offset === undefined ? "" : `offset ${part.specs.offset} mm`,
    inchTerms("backspacing", part.specs.backspacing),
    inchTerms("lift height", part.specs.lift),
    inchTerms("max tire", part.specs.maxTire),
    inchTerms("max rubicon tire", part.specs.maxTireRubicon),
    part.specs.winchMount === undefined ? "" : part.specs.winchMount ? "winch mount" : "no winch mount",
  ];
  return [
    part.brand,
    part.name,
    part.variant,
    part.reference,
    part.retailer,
    part.notes,
    powertrains,
    ...specs,
  ].map(text).filter(Boolean).join(" ").toLowerCase();
}

export function dimensionFilterKey(category: Category, part: Part) {
  if (category === "wheels" || category === "tires") {
    return part.specs.rim === undefined ? null : `rim:${part.specs.rim}`;
  }
  if (category === "lift") {
    return part.specs.lift === undefined ? null : `lift:${part.specs.lift}`;
  }
  if (category === "bumpers") {
    return part.specs.winchMount === undefined ? null : `winch:${part.specs.winchMount ? "yes" : "no"}`;
  }
  return null;
}

export function dimensionFilterLabel(category: Category, key: string) {
  const [, raw] = key.split(":");
  if (key.startsWith("rim:")) return category === "tires" ? `Fits ${raw}-inch wheel` : `${raw}-inch wheel`;
  if (key.startsWith("lift:")) return `${raw}-inch lift`;
  if (key === "winch:yes") return "Winch mount";
  if (key === "winch:no") return "No winch mount";
  return raw || "Specification";
}

function dimensionSort(a: string, b: string) {
  if (a.startsWith("winch:") || b.startsWith("winch:")) {
    if (a === b) return 0;
    return a === "winch:yes" ? -1 : 1;
  }
  const [, aValue] = a.split(":");
  const [, bValue] = b.split(":");
  return Number(aValue) - Number(bValue);
}

export function dimensionFilterOptions(parts: Part[], category: Category) {
  const keys = new Set<string>();
  for (const part of parts) {
    if (part.category !== category) continue;
    const key = dimensionFilterKey(category, part);
    if (key) keys.add(key);
  }
  return [...keys].sort(dimensionSort).map(value => ({ value, label: dimensionFilterLabel(category, value) }));
}

function matchesQuery(part: Part, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = catalogSearchText(part);
  return terms.every(term => haystack.includes(term));
}

function matchesPrice(part: Part, state: BuildState, price: string) {
  if (!price || price === allCatalogFilter) return true;
  const linePrice = part.priceCents * quantityFor(part, state);
  if (price === "under-500") return linePrice < 50000;
  if (price === "500-1000") return linePrice >= 50000 && linePrice < 100000;
  if (price === "1000-2500") return linePrice >= 100000 && linePrice < 250000;
  if (price === "2500-plus") return linePrice >= 250000;
  return true;
}

export function hasCatalogFilter(filters: Pick<CatalogFilterState, "query" | "brand" | "price" | "dimension">) {
  return !!filters.query.trim() || filters.brand !== allCatalogFilter || filters.price !== allCatalogFilter || filters.dimension !== allCatalogFilter;
}

export function matchesCatalogFilters(part: Part, state: BuildState, filters: CatalogFilterState) {
  if (part.category !== filters.category) return false;
  if (!matchesQuery(part, filters.query)) return false;
  if (filters.brand && filters.brand !== allCatalogFilter && part.brand !== filters.brand) return false;
  if (!matchesPrice(part, state, filters.price)) return false;
  if (filters.dimension && filters.dimension !== allCatalogFilter && dimensionFilterKey(filters.category, part) !== filters.dimension) return false;
  return true;
}
