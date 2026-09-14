import { buildIssues, categoryNames, money, quantityFor, selectedParts, vehicleDescription, type BuildState, type Part } from "./model";
import { commerceDisclosure, commerceSummaryForPart, noActiveCommerceDisclosure } from "./commerce";
import { costPlan, stageFor, stageNames, type Stage } from "./planning";

export type ShopBriefInput = {
  name: string;
  notes: string;
  state: BuildState;
  parts: Part[];
  generatedAt?: Date | string;
};

const stageOrder: Stage[] = ["now", "later", "owned", "installed"];

function generatedDate(value: Date | string | undefined) {
  const date = value instanceof Date ? value.toISOString() : value ?? new Date().toISOString();
  return date.slice(0, 10);
}

function partLine(part: Part, state: BuildState) {
  const quantity = quantityFor(part, state);
  const lineTotal = part.priceCents * quantity;
  const priceType = part.customPrice ? "personal quote" : `source snapshot ${part.checkedAt}`;
  return [
    `- ${categoryNames[part.category]}: ${part.brand} ${part.name}`,
    `  Variant: ${part.variant}`,
    `  Reference: ${part.reference}`,
    `  Price: ${money(part.priceCents)} x ${quantity} = ${money(lineTotal)} (${priceType})`,
    `  Source: ${part.retailer} - ${part.url}`,
    `  Commerce options: ${commerceSummaryForPart(part)}`,
  ].join("\n");
}

export function buildShopBrief({ name, notes, state, parts, generatedAt }: ShopBriefInput) {
  const selected = selectedParts(state, parts);
  const issues = buildIssues(state, parts);
  const errors = issues.filter(issue => issue.level === "error");
  const checks = issues.filter(issue => issue.level === "note");
  const plan = costPlan(state, parts);
  const lines = [
    "Jeep Build Lab shop brief",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${generatedDate(generatedAt)}`,
    "",
    "Vehicle",
    `- ${vehicleDescription(state)}`,
    `- Current equipment: ${state.stockRim}-inch wheels, ${state.stockTire}-inch tires`,
    "",
    "Budget snapshot",
    `- Buy now parts: ${money(plan.now)}`,
    `- Buy later parts: ${money(plan.later)}`,
    `- Already owned / installed catalog value: ${money(plan.covered)}`,
    `- Labor allowance: ${money(state.labor)}`,
    `- Tax, shipping and extras allowance: ${money(state.extras)}`,
    `- Upgrades left to fund: ${money(plan.remaining)}`,
    `- Entered vehicle price: ${money(state.vehicleCost ?? 0)}`,
    `- Vehicle plus unfunded upgrades: ${money(plan.project)}`,
    "",
    "Commerce disclosure",
    `- ${commerceDisclosure}`,
    `- ${noActiveCommerceDisclosure}`,
    "",
    "Selected parts",
  ];

  if (!selected.length) {
    lines.push("- No aftermarket parts selected yet.");
  } else {
    for (const stage of stageOrder) {
      const staged = selected.filter(part => stageFor(state, part.category) === stage);
      if (!staged.length) continue;
      lines.push("", stageNames[stage], ...staged.map(part => partLine(part, state)));
    }
  }

  lines.push("", `Fitment conflicts (${errors.length})`);
  lines.push(...(errors.length ? errors.map(issue => `- ${issue.message}`) : ["- No blocking fitment conflicts detected by the current checks."]));

  lines.push("", `Shop confirmation checks (${checks.length})`);
  lines.push(...(checks.length ? checks.map(issue => `- ${issue.message}`) : ["- No extra confirmation checks yet."]));

  if (selected.length) {
    lines.push("", "Part notes", ...selected.map(part => `- ${part.name}: ${part.notes}`));
  }
  if (notes.trim()) lines.push("", "Owner notes", notes.trim());

  lines.push("", "Confirm the full combination, installation order and current pricing before purchase.");
  return `${lines.join("\n")}\n`;
}
