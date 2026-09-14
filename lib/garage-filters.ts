import { buildIssues, categoryNames, powertrainNames, selectedParts, vehicleDescription, type Part, type SavedBuild } from "./model";

export const allGarageFilter = "all";

export const garageConflictOptions = [
  { value: allGarageFilter, label: "All statuses" },
  { value: "clean", label: "No conflicts" },
  { value: "needs-review", label: "Needs review" },
] as const;

export const garageSortOptions = [
  { value: "updated-desc", label: "Newest saved" },
  { value: "updated-asc", label: "Oldest saved" },
  { value: "value-desc", label: "Highest value" },
  { value: "value-asc", label: "Lowest value" },
  { value: "upgrades-desc", label: "Most upgrades" },
] as const;

export type GarageSort = typeof garageSortOptions[number]["value"];

export type GarageFilterState = {
  query: string;
  powertrain: string;
  conflicts: string;
  sort: GarageSort;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function updatedTime(build: SavedBuild) {
  const time = Date.parse(build.updatedAt);
  return Number.isFinite(time) ? time : 0;
}

function upgradeCount(build: SavedBuild, parts: Part[]) {
  return selectedParts(build.state, parts).length;
}

export function garageConflictCount(build: SavedBuild, parts: Part[]) {
  return buildIssues(build.state, parts).filter(issue => issue.level === "error").length;
}

export function garageSearchText(build: SavedBuild, parts: Part[]) {
  const selected = selectedParts(build.state, parts);
  return [
    build.name,
    build.notes,
    vehicleDescription(build.state),
    powertrainNames[build.state.powertrain],
    build.savedTotal / 100,
    ...selected.flatMap(part => [
      categoryNames[part.category],
      part.brand,
      part.name,
      part.variant,
      part.reference,
      part.retailer,
      part.notes,
    ]),
  ].map(text).filter(Boolean).join(" ").toLowerCase();
}

function matchesQuery(build: SavedBuild, parts: Part[], query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = garageSearchText(build, parts);
  return terms.every(term => haystack.includes(term));
}

function matchesPowertrain(build: SavedBuild, powertrain: string) {
  return !powertrain || powertrain === allGarageFilter || build.state.powertrain === powertrain;
}

function matchesConflictFilter(build: SavedBuild, parts: Part[], conflicts: string) {
  if (!conflicts || conflicts === allGarageFilter) return true;
  const count = garageConflictCount(build, parts);
  if (conflicts === "clean") return count === 0;
  if (conflicts === "needs-review") return count > 0;
  return true;
}

export function hasGarageFilter(filters: Pick<GarageFilterState, "query" | "powertrain" | "conflicts">) {
  return !!filters.query.trim() || filters.powertrain !== allGarageFilter || filters.conflicts !== allGarageFilter;
}

export function filterGarageBuilds(builds: SavedBuild[], parts: Part[], filters: GarageFilterState) {
  return builds
    .filter(build => matchesQuery(build, parts, filters.query))
    .filter(build => matchesPowertrain(build, filters.powertrain))
    .filter(build => matchesConflictFilter(build, parts, filters.conflicts))
    .sort((a, b) => {
      if (filters.sort === "updated-asc") return updatedTime(a) - updatedTime(b);
      if (filters.sort === "value-desc") return b.savedTotal - a.savedTotal || updatedTime(b) - updatedTime(a);
      if (filters.sort === "value-asc") return a.savedTotal - b.savedTotal || updatedTime(b) - updatedTime(a);
      if (filters.sort === "upgrades-desc") return upgradeCount(b, parts) - upgradeCount(a, parts) || updatedTime(b) - updatedTime(a);
      return updatedTime(b) - updatedTime(a);
    });
}
