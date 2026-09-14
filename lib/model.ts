import { z } from "zod";
import catalog from "./catalog.json";

export const categories = ["wheels", "tires", "lift", "bumpers", "winches", "armor"] as const;
export type Category = typeof categories[number];
export const categoryNames: Record<Category, string> = {
  wheels: "Wheels",
  tires: "Tires",
  lift: "Suspension",
  bumpers: "Bumpers",
  winches: "Winches",
  armor: "Side armor",
};

export type Trim = "Sport" | "Sahara" | "Rubicon";
export type Powertrain = "gas" | "4xe";
export const powertrainNames: Record<Powertrain, string> = {
  gas: "3.6L V6 gas",
  "4xe": "4xe plug-in hybrid",
};

export type Part = {
  id: string;
  category: Category;
  brand: string;
  name: string;
  variant: string;
  reference: string;
  priceCents: number;
  retailer: string;
  url: string;
  checkedAt: string;
  yearFrom: number;
  yearTo: number;
  trims: Trim[];
  powertrains?: Powertrain[];
  specs: {
    rim?: number;
    diameter?: number;
    width?: number;
    offset?: number;
    backspacing?: number;
    finish?: string;
    lift?: number;
    maxTire?: number;
    maxTireRubicon?: number;
    winchMount?: boolean;
  };
  notes: string;
  customPrice?: boolean;
};

export const baseCatalog = catalog as Part[];
const stageValue = z.enum(["now", "later", "owned", "installed"]);
const stagesSchema = z.object({
  wheels: stageValue.optional(),
  tires: stageValue.optional(),
  lift: stageValue.optional(),
  bumpers: stageValue.optional(),
  winches: stageValue.optional(),
  armor: stageValue.optional(),
}).strict().default({});
const picksSchema = z.object({
  wheels: z.string().max(100).optional(),
  tires: z.string().max(100).optional(),
  lift: z.string().max(100).optional(),
  bumpers: z.string().max(100).optional(),
  winches: z.string().max(100).optional(),
  armor: z.string().max(100).optional(),
}).strict();

export const stateSchema = z.object({
  year: z.number().int().min(2018).max(2024),
  trim: z.enum(["Sport", "Sahara", "Rubicon"]),
  powertrain: z.enum(["gas", "4xe"]).default("gas"),
  stockRim: z.union([z.literal(17), z.literal(18), z.literal(20)]),
  stockTire: z.number().min(30).max(35),
  vehicleCost: z.number().int().min(0).max(10000000).default(0),
  stages: stagesSchema,
  quantity: z.union([z.literal(4), z.literal(5)]),
  budget: z.number().int().min(0).max(10000000),
  labor: z.number().int().min(0).max(10000000),
  extras: z.number().int().min(0).max(10000000),
  picks: picksSchema,
}).strict().superRefine((s, ctx) => {
  if (s.powertrain === "gas" && s.year > 2023) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "3.6L gas support is limited to 2018-2023.", path: ["year"] });
  }
  if (s.powertrain === "4xe" && (s.year !== 2024 || s.trim !== "Sahara")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "4xe support is limited to 2024 Sahara.", path: ["powertrain"] });
  }
  for (const [cat, id] of Object.entries(s.picks)) {
    if (!baseCatalog.some(p => p.id === id && p.category === cat)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unknown part or category", path: ["picks", cat] });
    }
  }
  for (const category of categories) {
    if (s.stages[category] && !s.picks[category]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Purchase stage requires a selected part.", path: ["stages", category] });
    }
  }
});

export type BuildState = z.infer<typeof stateSchema>;
export const initialState: BuildState = {
  year: 2021,
  trim: "Sport",
  powertrain: "gas",
  stockRim: 17,
  stockTire: 32,
  quantity: 5,
  vehicleCost: 0,
  stages: {},
  budget: 500000,
  labor: 0,
  extras: 0,
  picks: {},
};

export const saveSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  notes: z.string().max(1500),
  state: stateSchema,
}).strict();
export type SavedBuild = { id: string; name: string; notes: string; state: BuildState; updatedAt: string; savedTotal: number };
export type Issue = { level: "error" | "note"; message: string; category?: Category };

const relatedConflictCategories: Record<Category, readonly Category[]> = {
  wheels: ["wheels", "tires"],
  tires: ["wheels", "tires", "lift"],
  lift: ["lift", "tires", "wheels"],
  bumpers: ["bumpers"],
  winches: ["winches", "bumpers"],
  armor: ["armor"],
};

function issueKey(issue: Issue) {
  return `${issue.category ?? "build"}:${issue.message}`;
}

export function publicBuildState(s: BuildState): BuildState {
  return stateSchema.parse({
    year: s.year,
    trim: s.trim,
    powertrain: s.powertrain ?? "gas",
    stockRim: s.stockRim,
    stockTire: s.stockTire,
    vehicleCost: s.vehicleCost ?? 0,
    stages: { ...(s.stages ?? {}) },
    quantity: s.quantity,
    budget: s.budget,
    labor: s.labor,
    extras: s.extras,
    picks: { ...(s.picks ?? {}) },
  });
}

export function encodeSharedBuildState(s: BuildState) {
  return encodeURIComponent(JSON.stringify(publicBuildState(s)));
}

export function decodeSharedBuildStatePayload(payload: string) {
  return stateSchema.parse(JSON.parse(decodeURIComponent(payload)));
}

function partPowertrains(p: Part): Powertrain[] {
  return p.powertrains ?? ["gas"];
}

function powertrainList(p: Part) {
  return partPowertrains(p).map(powertrain => powertrainNames[powertrain]).join(", ");
}

export function defaultEquipment(trim: Trim, powertrain: Powertrain): Pick<BuildState, "stockRim" | "stockTire"> {
  if (powertrain === "4xe") return { stockRim: 20 as const, stockTire: 32 };
  return { stockRim: trim === "Sahara" ? 18 : 17, stockTire: trim === "Rubicon" ? 33 : 32 };
}

export function vehicleDescription(s: BuildState) {
  return `${s.year} Wrangler JL Unlimited 4-door ${s.trim}, ${powertrainNames[s.powertrain]}`;
}

export function partCoverage(p: Part) {
  return `${p.yearFrom}-${p.yearTo} JL four-door · ${p.trims.join(", ")} · ${powertrainList(p)}`;
}

export function selectedParts(s: BuildState, parts: Part[] = baseCatalog) {
  return categories.map(c => parts.find(p => p.id === s.picks[c])).filter((p): p is Part => !!p);
}

export function partCompatibility(p: Part, s: BuildState): string | null {
  if (s.year < p.yearFrom || s.year > p.yearTo) {
    return `${p.brand} ${p.name} is documented for ${p.yearFrom}-${p.yearTo}; your Jeep is ${s.year}.`;
  }
  if (!p.trims.includes(s.trim)) {
    return `${p.brand} ${p.name} is documented for ${p.trims.join(", ")} trims, not ${s.trim}.`;
  }
  if (!partPowertrains(p).includes(s.powertrain)) {
    return `${p.brand} ${p.name} is documented for ${powertrainList(p)}, not ${powertrainNames[s.powertrain]}.`;
  }
  return null;
}

export function fitsVehicle(p: Part, s: BuildState) {
  return partCompatibility(p, s) === null;
}

export function quantityFor(p: Part, s: BuildState) {
  return p.category === "wheels" || p.category === "tires" ? s.quantity : 1;
}

export function totalFor(s: BuildState, parts: Part[] = baseCatalog) {
  const subtotal = selectedParts(s, parts).reduce((n, p) => n + p.priceCents * quantityFor(p, s), 0);
  return { subtotal, total: subtotal + s.labor + s.extras };
}

export function buildIssues(s: BuildState, parts: Part[] = baseCatalog): Issue[] {
  const issues: Issue[] = [];
  const selected = selectedParts(s, parts);
  const wheel = selected.find(p => p.category === "wheels");
  const tire = selected.find(p => p.category === "tires");
  const lift = selected.find(p => p.category === "lift");
  const bumper = selected.find(p => p.category === "bumpers");
  for (const p of selected) {
    const reason = partCompatibility(p, s);
    if (reason) issues.push({ level: "error", category: p.category, message: reason });
  }
  const rim = wheel?.specs.rim ?? s.stockRim;
  if (tire && tire.specs.rim !== rim) {
    issues.push({ level: "error", category: "tires", message: `Wheel diameter mismatch: ${tire.specs.rim}″ tire requires a ${tire.specs.rim}″ wheel. Your selected wheels are ${rim}″.` });
  }
  if (wheel && !tire && rim !== s.stockRim) {
    issues.push({ level: "error", category: "tires", message: `Wheel diameter mismatch: your current tires fit ${s.stockRim}″ wheels and cannot mount on these ${rim}″ wheels. Add ${rim}″ tires or keep your current wheels.` });
  }
  const diameter = tire?.specs.diameter ?? s.stockTire;
  const max = lift ? (s.trim === "Rubicon" ? (lift.specs.maxTireRubicon ?? lift.specs.maxTire) : lift.specs.maxTire) : undefined;
  if (max && diameter > max) issues.push({ level: "error", category: "tires", message: `${diameter}″ tires exceed this lift's listed ${max}″ tire limit for your trim.` });
  if (tire && !lift && diameter > s.stockTire + .2) issues.push({ level: "note", message: "Larger-than-stock tires: clearance is unverified. Check lift, fenders, steering and suspension travel before purchase." });
  if (lift && !wheel) issues.push({ level: "note", message: "Factory wheels with this lift need additional clearance checks; wheel changes or spacers may be required." });
  if (wheel || tire) issues.push({ level: "note", message: "Confirm rim width, offset/backspacing, brake clearance, tire load rating and spare-carrier capacity. Matching diameters alone does not establish fitment." });
  if (lift) issues.push({ level: "note", message: "Budget for alignment and any required geometry correction, tire calibration or gearing changes. The preview does not simulate suspension travel." });
  if (selected.some(p => p.category === "winches")) {
    issues.push({ level: "note", message: bumper?.specs.winchMount ? "Winch plate included; confirm the exact winch's clearance, rated capacity and wiring with the bumper supplier." : "A rated winch mount is required and is not included in this build. Choose a bumper or budget for a suitable mount." });
  }
  if (bumper?.id === "tactik-hd" && s.trim === "Sport") issues.push({ level: "note", message: "Sport fog lamps need Mopar 68298651AA mounting brackets; that extra cost is not in the parts total." });
  if (bumper?.id.startsWith("qrc-") && s.trim === "Rubicon") issues.push({ level: "note", message: "QRC bumper does not accept fog lights from the factory Rubicon steel bumper; check your original bumper option." });
  if (selected.some(p => p.category === "armor") && s.trim === "Rubicon") issues.push({ level: "note", message: "Factory Rubicon rock rails must be removed for the selected QRC side armor." });
  return issues;
}

export function buildErrorsForOption(p: Part, s: BuildState, parts: Part[] = baseCatalog) {
  const related = new Set(relatedConflictCategories[p.category]);
  const next = { ...s, picks: { ...s.picks, [p.category]: p.id } };
  return buildIssues(next, parts).filter(issue => issue.level === "error" && (!issue.category || related.has(issue.category)));
}

export function optionAddsBuildError(p: Part, s: BuildState, parts: Part[] = baseCatalog) {
  if (s.picks[p.category] === p.id) return buildErrorsForOption(p, s, parts).length > 0;
  const currentErrors = new Set(buildIssues(s, parts).filter(issue => issue.level === "error").map(issueKey));
  return buildErrorsForOption(p, s, parts).some(issue => !currentErrors.has(issueKey(issue)));
}

export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100);
