import { buildIssues, categoryNames, latestSourceCheckedAt, money, partCoverage, priceBasis, quantityFor, selectedParts, sourceCheckedLabel, vehicleDescription, type BuildState, type Part } from "./model";
import { commerceDisclosure, commerceSummaryForPart, noActiveCommerceDisclosure } from "./commerce";
import { costPlan, stageFor, stageNames, type Stage } from "./planning";

export type ShopBriefInput = {
  name: string;
  notes: string;
  state: BuildState;
  parts: Part[];
  generatedAt?: Date | string;
};

export type InstallerQuoteChecklistItem = {
  key: string;
  status: "ready" | "needs-review" | "open";
  label: string;
  detail: string;
};

const stageOrder: Stage[] = ["now", "later", "owned", "installed"];

function generatedDate(value: Date | string | undefined) {
  const date = value instanceof Date ? value.toISOString() : value ?? new Date().toISOString();
  return date.slice(0, 10);
}

function partLine(part: Part, state: BuildState) {
  const quantity = quantityFor(part, state);
  const lineTotal = part.priceCents * quantity;
  return [
    `- ${categoryNames[part.category]}: ${part.brand} ${part.name}`,
    `  Variant: ${part.variant}`,
    `  Reference: ${part.reference}`,
    `  Price: ${money(part.priceCents)} x ${quantity} = ${money(lineTotal)}`,
    `  Price basis: ${priceBasis(part)}`,
    `  Planner coverage: ${partCoverage(part)}`,
    `  Source: ${part.retailer} - ${part.url}`,
    `  Commerce options: ${commerceSummaryForPart(part)}`,
  ].join("\n");
}

export function installerQuoteChecklist({ notes, state, parts }: Pick<ShopBriefInput, "notes" | "state" | "parts">): InstallerQuoteChecklistItem[] {
  const selected = selectedParts(state, parts);
  const issues = buildIssues(state, parts);
  const errors = issues.filter(issue => issue.level === "error");
  const checks = issues.filter(issue => issue.level === "note");
  const plan = costPlan(state, parts);
  const selectedSourceDate = latestSourceCheckedAt(selected);
  const explicitStages = Object.keys(state.stages ?? {}).length;
  return [
    {
      key: "parts",
      status: selected.length ? "ready" : "open",
      label: selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} ready for quote` : "Select parts before requesting a quote",
      detail: selected.length
        ? "Brief includes exact variant, quantity, source URL, checked date, planner coverage and price basis."
        : "Pick at least one sourced part so the installer can quote a concrete list.",
    },
    {
      key: "fitment",
      status: errors.length ? "needs-review" : "ready",
      label: errors.length ? `${errors.length} fitment conflict${errors.length === 1 ? "" : "s"} to resolve first` : "No blocking fitment conflicts in current checks",
      detail: checks.length ? `${checks.length} shop confirmation check${checks.length === 1 ? "" : "s"} still travel with the brief.` : "Installer still confirms the full combination and installation order.",
    },
    {
      key: "allowances",
      status: state.labor || state.extras ? "ready" : "open",
      label: state.labor || state.extras ? "Labor, tax or shipping allowance entered" : "Labor and supporting-cost allowance still blank",
      detail: state.labor || state.extras ? `Allowances add ${money(plan.allowances)} to the first-phase quote.` : "Enter labor, alignment, calibration, tax, shipping or supporting hardware quotes as they arrive.",
    },
    {
      key: "stages",
      status: selected.length ? "ready" : "open",
      label: selected.length ? `${money(plan.dueNow)} first-phase budget shown` : "Purchase stage plan starts after parts",
      detail: explicitStages ? `${explicitStages} categor${explicitStages === 1 ? "y" : "ies"} manually staged; unmarked parts default to Buy now.` : "Unmarked selected parts default to Buy now; adjust stages before sharing if the install will be phased.",
    },
    {
      key: "source-proof",
      status: selected.length ? "ready" : "open",
      label: selected.length ? `Source proof checked through ${sourceCheckedLabel(selectedSourceDate)}` : "Source proof pending",
      detail: "Prices are snapshots or user notes, not live quotes; installer or seller must confirm current price and availability.",
    },
    {
      key: "owner-notes",
      status: notes.trim() ? "ready" : "open",
      label: notes.trim() ? "Owner notes included" : "Owner notes are blank",
      detail: notes.trim() ? "Notes are included in the shop brief for alignment timing, install preferences or questions." : "Use notes for alignment timing, gear calibration, spare-carrier, warranty or sequencing questions.",
    },
  ];
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
    `- Current equipment: ${state.stockRim}-inch rims, ${state.stockTire}-inch tires`,
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

  lines.push("", "Installer quote checklist");
  lines.push(...installerQuoteChecklist({ notes, state, parts }).map(item => `- ${item.label} [${item.status}]: ${item.detail}`));

  if (selected.length) {
    lines.push("", "Part notes", ...selected.map(part => `- ${part.name}: ${part.notes}`));
  }
  if (notes.trim()) lines.push("", "Owner notes", notes.trim());

  lines.push("", "Confirm the full combination, installation order and current pricing before purchase.");
  return `${lines.join("\n")}\n`;
}
