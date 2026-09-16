import {
  categories,
  categoryNames,
  money,
  partCoverage,
  priceBasis,
  quantityFor,
  selectedParts,
  vehicleDescription,
  type BuildState,
  type Category,
  type Part,
} from "./model";

export type CommerceRelationship = "source" | "affiliate" | "dealer" | "distributor" | "reseller";
export type CommerceStatus = "active-source" | "application-needed";

export type PartnerProgram = {
  id: string;
  name: string;
  relationship: Exclude<CommerceRelationship, "source">;
  status: "application-needed";
  url: string;
  network?: string;
  categories: readonly Category[];
  note: string;
  requirements?: readonly string[];
};

export type CommerceOffer = {
  id: string;
  partnerName: string;
  relationship: CommerceRelationship;
  status: CommerceStatus;
  url: string;
  action: string;
  detail: string;
  paid: boolean;
};

export type PartnerApplicationPriority = {
  program: PartnerProgram;
  matchedCategories: readonly string[];
  selectedPartCount: number;
  score: number;
  reason: string;
};

export const partnerApplicationTrackerStatusNames = {
  todo: "To apply",
  ready: "Profile ready",
  submitted: "Submitted",
  approved: "Approved",
  paused: "Paused",
} as const;

export type PartnerApplicationTrackerStatus = keyof typeof partnerApplicationTrackerStatusNames;

export type CommerceApplicationPackInput = {
  name: string;
  notes: string;
  state: BuildState;
  parts: Part[];
  generatedAt?: string;
  applicationStatuses?: Record<string, PartnerApplicationTrackerStatus | string | undefined>;
};

const allCategories = [...categories];
const offRoadCategories: Category[] = ["lift", "bumpers", "winches", "armor"];
const relationshipPriority: Record<Exclude<CommerceRelationship, "source">, number> = {
  affiliate: 4,
  reseller: 3,
  dealer: 3,
  distributor: 2,
};

export const commerceDisclosure =
  "Some retailer or partner links may be paid links in the future. Paid links must be clearly labeled before affiliate tracking, resale checkout or dealer pricing goes live.";

export const noActiveCommerceDisclosure =
  "Current links are reference and application links only; no affiliate tracking, wholesale checkout or dropship fulfillment is active.";

export const relationshipNames: Record<CommerceRelationship, string> = {
  source: "Product source",
  affiliate: "Affiliate",
  dealer: "Dealer",
  distributor: "Distributor",
  reseller: "Reseller",
};

export const commerceStatusNames: Record<CommerceStatus, string> = {
  "active-source": "Source link",
  "application-needed": "Application needed",
};

export const commerceApplicationChecklist = [
  "Confirm the legal business name, mailing address, phone, support email, website and social channels you want partners to review.",
  "Gather requested tax, resale, banking and vendor documents before applying; each program sets its own requirements.",
  "Decide whether each path is an affiliate referral, authorized reseller, dealer account, distributor account or future checkout source.",
  "Prepare a short audience description, Jeep content plan and expected traffic or sales channels for partner applications.",
  "Do not show paid claims, dealer pricing, stock status, shipping promises or checkout until the program has approved the account terms.",
  "Confirm sales-tax, warranty, return, shipping-liability and dropship terms with the partner and your professional advisors before taking orders.",
] as const;

export const affiliateApplicationProfileFields = [
  "Legal applicant name and business name",
  "Contact email and mobile number",
  "Business mailing address and support email",
  "Website URL: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
  "Social channels and content platforms",
  "Audience description and Jeep/off-road content plan",
  "Monthly visitors, followers or email list estimate",
  "Promotion methods: build guides, part comparisons, quote sheets and social posts",
  "Tax classification, resale certificate and banking/payment details when requested",
] as const;

export const affiliateApplicationAnswers = [
  {
    field: "Website or app description",
    answer: "Jeep Build Lab is an independent Wrangler JL build planner that helps owners compare sourced rim, tire, suspension, recovery and armor options before they click out to a retailer or partner program.",
  },
  {
    field: "Audience",
    answer: "Jeep Wrangler JL owners and shoppers who want neutral upgrade planning, fitment checks, staged budgets, source-backed exports and shop-ready build briefs.",
  },
  {
    field: "Promotion methods",
    answer: "Build guides, product comparisons, quote sheets, saved-build exports, partner-directory links and social posts that point users to approved retailer or partner pages.",
  },
  {
    field: "Traffic or sales estimate",
    answer: "Use the current verified site analytics, follower counts or launch-stage estimate before submitting. Do not invent volume for an application.",
  },
  {
    field: "Compliance disclosure",
    answer: "Paid links will stay inactive until the partner account is approved, tracking links are tested, and sponsored or affiliate disclosures are shown near the outbound link.",
  },
  {
    field: "Pricing and inventory basis",
    answer: "Catalog prices are dated source snapshots or user-entered notes, not live quotes, checkout totals, inventory promises or dealer pricing.",
  },
  {
    field: "Fulfillment role",
    answer: "Jeep Build Lab is currently a planning and referral experience. It does not process checkout, hold inventory, promise dropship fulfillment or handle returns.",
  },
] as const;

export const sponsoredLinkReadinessChecklist = [
  "Apply through the partner program and wait for approval before replacing source links with tracking links.",
  "Label every paid outbound link as sponsored or affiliate before it can earn commission.",
  "Keep source snapshot prices separate from live price, stock, shipping or checkout promises.",
  "Store approved tracking IDs outside the public catalog and test each link before publishing.",
  "Keep a plain-language FTC disclosure visible near paid links and in exports.",
] as const;

export const paidLinkDisclosureSnippet =
  "Disclosure: Jeep Build Lab may earn a commission from links clearly labeled affiliate or sponsored. Prices, availability and fitment are not guaranteed; confirm the exact product, current price, shipping, returns and installation requirements with the seller before buying.";

export const paidLinkLaunchChecklist = [
  "Partner has approved the account and program terms for this website or app.",
  "Tracking URL came from the approved partner network and was tested from a clean browser.",
  "Outbound button or link is labeled affiliate or sponsored before the user clicks.",
  "Disclosure appears before or near the first paid link on the page or export.",
  "Source snapshot price remains separate from retailer checkout price, stock and shipping claims.",
] as const;

export const partnerPrograms = [
  {
    id: "tire-rack-affiliate",
    name: "Tire Rack",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.tirerack.com/affiliate",
    categories: ["wheels", "tires"],
    note: "Commission path for tire and rim referrals after approval and tracking setup.",
  },
  {
    id: "realtruck-affiliate",
    name: "RealTruck",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://realtruck.com/affiliate/",
    network: "Impact",
    categories: allCategories,
    note: "Impact affiliate application path for truck and Jeep accessory referrals after approval.",
    requirements: [
      "Review the RealTruck offer terms inside Impact before submitting.",
      "Use Jeep Build Lab's public URL and off-road build-planning audience description.",
      "Do not add RealTruck tracking links until Impact approval and link testing are complete.",
    ],
  },
  {
    id: "carid-affiliate",
    name: "CARiD",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.carid.com/affiliate.html",
    categories: allCategories,
    note: "Automotive parts affiliate path that requires approved tracking links.",
  },
  {
    id: "4-wheel-parts-affiliate",
    name: "4 Wheel Parts",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.flexoffers.com/affiliate-programs/4-wheel-parts-affiliate-program/",
    categories: allCategories,
    note: "Off-road retailer affiliate path via FlexOffers after publisher approval.",
  },
  {
    id: "cj-pony-parts-creators",
    name: "CJ Pony Parts",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.cjponyparts.com/creators",
    categories: allCategories,
    note: "Creator affiliate path for automotive content once a referral link is issued.",
  },
  {
    id: "morryde-jeep-affiliate",
    name: "MORryde Jeep",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://morryde.com/morryde-jeep-affiliate-application/",
    categories: ["armor"],
    note: "Jeep accessory affiliate application for relevant armor and utility products.",
  },
  {
    id: "american-modified-reseller",
    name: "American Modified",
    relationship: "reseller",
    status: "application-needed",
    url: "https://americanmodified.com/en-ca/pages/become-a-reseller",
    categories: ["wheels", "lift", "bumpers", "armor"],
    note: "Reseller and dropship-style path that needs business approval and terms.",
  },
  {
    id: "quadratec-wholesale",
    name: "Quadratec Wholesale",
    relationship: "dealer",
    status: "application-needed",
    url: "https://www.quadratec.com/wholesale",
    categories: allCategories,
    note: "Dealer pricing path for qualifying businesses; current catalog sources already use Quadratec pages.",
  },
  {
    id: "extreme-terrain-dealer",
    name: "ExtremeTerrain",
    relationship: "dealer",
    status: "application-needed",
    url: "https://www.extremeterrain.com/dealer.html",
    categories: allCategories,
    note: "Dealer program for eligible shops and resellers after sign-up review.",
  },
  {
    id: "turn-14-distribution",
    name: "Turn 14 Distribution",
    relationship: "distributor",
    status: "application-needed",
    url: "https://www.turn14.com/become_customer",
    categories: allCategories,
    note: "Wholesale distributor path for approved automotive businesses.",
  },
  {
    id: "meyer-distributing",
    name: "Meyer Distributing",
    relationship: "distributor",
    status: "application-needed",
    url: "https://www.meyerdistributing.com/en-us/customers/applicationterms.aspx",
    categories: allCategories,
    note: "Retailer and wholesaler application path that requires business and tax details.",
  },
  {
    id: "premier-performance",
    name: "Premier Performance",
    relationship: "distributor",
    status: "application-needed",
    url: "https://premierwd.com/become-a-dealer/",
    categories: allCategories,
    note: "Wholesale dealer path for approved performance and off-road businesses.",
  },
  {
    id: "arb-distributors",
    name: "ARB distributor network",
    relationship: "distributor",
    status: "application-needed",
    url: "https://arbusahelp.zendesk.com/hc/en-us/articles/5963545842969-What-Distributors-can-I-get-your-products-through",
    categories: offRoadCategories,
    note: "Distributor routing reference for ARB-style off-road product sourcing.",
  },
] as const satisfies readonly PartnerProgram[];

export function safeCommerceUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Commerce links must use HTTPS.");
  return parsed.toString();
}

export function partnerProgramsForPart(part: Pick<Part, "category">) {
  return partnerPrograms.filter(program => (program.categories as readonly Category[]).includes(part.category));
}

export function partnerProgramsForParts(parts: readonly Pick<Part, "category">[]): PartnerProgram[] {
  const seen = new Set<string>();
  return parts.flatMap(partnerProgramsForPart).filter(program => {
    if (seen.has(program.id)) return false;
    seen.add(program.id);
    return true;
  });
}

export function sourceOfferForPart(part: Part): CommerceOffer {
  return {
    id: `source-${part.id}`,
    partnerName: part.retailer,
    relationship: "source",
    status: "active-source",
    url: safeCommerceUrl(part.url),
    action: "View product source",
    detail: "Dated catalog source for this exact part or product family.",
    paid: false,
  };
}

export function commerceOffersForPart(part: Part): CommerceOffer[] {
  return [
    sourceOfferForPart(part),
    ...partnerProgramsForPart(part).map(program => ({
      id: program.id,
      partnerName: program.name,
      relationship: program.relationship,
      status: program.status,
      url: safeCommerceUrl(program.url),
      action: "Open program",
      detail: program.note,
      paid: false,
    })),
  ];
}

export function commerceSummaryForPart(part: Part) {
  return commerceOffersForPart(part)
    .map(offer => `${offer.partnerName} (${relationshipNames[offer.relationship]}, ${commerceStatusNames[offer.status]})`)
    .join("; ");
}

function programCategories(program: PartnerProgram) {
  return program.categories.map(category => categoryNames[category]).join(", ");
}

function selectedCategorySummary(parts: readonly Pick<Part, "category">[]) {
  const labels = [...new Set(parts.map(part => categoryNames[part.category]))];
  return labels.length ? labels.join(", ") : "No selected categories";
}

export function partnerProgramsForBuild(state: BuildState, parts: Part[]): PartnerProgram[] {
  const selected = selectedParts(state, parts);
  return selected.length ? partnerProgramsForParts(selected) : [...partnerPrograms];
}

export function partnerApplicationPrioritiesForBuild(state: BuildState, parts: Part[]): PartnerApplicationPriority[] {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  return programs.map((program, order) => {
    const matchedParts = selected.filter(part => (program.categories as readonly Category[]).includes(part.category));
    const matchedCategories = [...new Set((selected.length ? matchedParts.map(part => part.category) : program.categories).map(category => categoryNames[category]))];
    const selectedPartCount = matchedParts.length;
    const score = selected.length
      ? selectedPartCount * 20 + matchedCategories.length * 5 + relationshipPriority[program.relationship] + (program.network ? 3 : 0)
      : matchedCategories.length * 3 + relationshipPriority[program.relationship] + (program.network ? 3 : 0);
    const reason = selected.length
      ? `Matches ${selectedPartCount} selected part${selectedPartCount === 1 ? "" : "s"} across ${matchedCategories.join(", ")}.`
      : `Covers ${matchedCategories.length} catalog categor${matchedCategories.length === 1 ? "y" : "ies"} before you narrow a build.`;
    return { program, matchedCategories, selectedPartCount, score, reason, order };
  }).sort((a, b) => b.score - a.score || a.order - b.order)
    .map(priority => ({
      program: priority.program,
      matchedCategories: priority.matchedCategories,
      selectedPartCount: priority.selectedPartCount,
      score: priority.score,
      reason: priority.reason,
    }));
}

function selectedPartCommerceLine(part: Part, state: BuildState) {
  const programs = partnerProgramsForPart(part).map(program => program.name).join(", ") || "No matching partner program listed yet.";
  return [
    `- ${categoryNames[part.category]}: ${part.brand} ${part.name} - ${part.variant}`,
    `  Reference: ${part.reference}`,
    `  Quantity: ${quantityFor(part, state)} at ${money(part.priceCents)} each`,
    `  Price basis: ${priceBasis(part)}`,
    `  Planner coverage: ${partCoverage(part)}`,
    `  Source: ${part.retailer} - ${safeCommerceUrl(part.url)}`,
    `  Matching programs: ${programs}`,
  ].join("\n");
}

const applicationTrackerStatuses = Object.keys(partnerApplicationTrackerStatusNames) as PartnerApplicationTrackerStatus[];
const actionableApplicationStatuses: readonly PartnerApplicationTrackerStatus[] = ["todo", "ready", "paused"];

function applicationTrackerStatusKey(status: unknown): PartnerApplicationTrackerStatus {
  return typeof status === "string" && Object.prototype.hasOwnProperty.call(partnerApplicationTrackerStatusNames, status)
    ? status as PartnerApplicationTrackerStatus
    : "todo";
}

function applicationTrackerStatusLabel(status: unknown) {
  return partnerApplicationTrackerStatusNames[applicationTrackerStatusKey(status)];
}

function partnerProgramLabel(program: PartnerProgram) {
  return `${program.name}${program.network ? ` via ${program.network}` : ""}`;
}

function nextApplicationPriority(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  return priorities.find(priority => actionableApplicationStatuses.includes(applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]))) ?? null;
}

function applicationTrackerSummary(programs: readonly PartnerProgram[], priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  const counts = Object.fromEntries(applicationTrackerStatuses.map(status => [status, 0])) as Record<PartnerApplicationTrackerStatus, number>;
  for (const program of programs) counts[applicationTrackerStatusKey(applicationStatuses?.[program.id])] += 1;
  const next = nextApplicationPriority(priorities, applicationStatuses);
  return [
    "Application tracker summary",
    ...applicationTrackerStatuses.map(status => `- ${partnerApplicationTrackerStatusNames[status]}: ${counts[status]}`),
    next
      ? `- Next application: ${partnerProgramLabel(next.program)} (${applicationTrackerStatusLabel(applicationStatuses?.[next.program.id])})`
      : "- Next application: All tracked programs are submitted or approved.",
  ].join("\n");
}

function affiliateApplicationAnswerLines() {
  return affiliateApplicationAnswers.map(({ field, answer }, index) => `${index + 1}. ${field}: ${answer}`).join("\n");
}

function nextApplicationTargetLines(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  const next = nextApplicationPriority(priorities, applicationStatuses);
  if (!next) {
    return ["Next application target", "- All tracked programs for this build are submitted or approved."];
  }
  return [
    "Next application target",
    `- Program: ${partnerProgramLabel(next.program)}`,
    `- Tracker status: ${applicationTrackerStatusLabel(applicationStatuses?.[next.program.id])}`,
    `- Relationship: ${relationshipNames[next.program.relationship]}`,
    ...(next.program.network ? [`- Network: ${next.program.network}`] : []),
    `- Application link: ${safeCommerceUrl(next.program.url)}`,
    `- Match reason: ${next.reason}`,
    ...(next.program.requirements?.length ? [`- Requirements: ${next.program.requirements.join(" ")}`] : []),
  ];
}

export function buildAffiliateApplicationAnswers({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  return [
    "Jeep Build Lab affiliate application answer kit",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    "Public profile basis",
    "- Website URL: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
    `- Catalog basis: ${parts.length} sourced variants with dated source snapshots; no live-price, inventory or checkout claim.`,
    `- Build focus: ${selected.length ? selectedCategorySummary(selected) : "No selected build yet; describe the full Jeep Build Lab audience."}`,
    `- Commerce status: ${noActiveCommerceDisclosure}`,
    "",
    ...nextApplicationTargetLines(priorities, applicationStatuses),
    "",
    "Common application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Do not paste without verifying",
    "- Replace traffic, sales, legal business, tax, banking, address and phone fields with current private details inside the partner network.",
    "- Do not claim approved affiliate tracking, live checkout, dealer pricing, inventory ownership or dropship fulfillment until a partner has approved those terms.",
  ].join("\n");
}

function partnerProgramApplicationLine(program: PartnerProgram, applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  return [
    `- ${program.name} (${relationshipNames[program.relationship]})`,
    `  Status: ${commerceStatusNames[program.status]}`,
    `  Application tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[program.id])}`,
    ...(program.network ? [`  Network: ${program.network}`] : []),
    `  Categories: ${programCategories(program)}`,
    `  Application link: ${safeCommerceUrl(program.url)}`,
    `  Prep note: ${program.note}`,
    ...(program.requirements?.length ? [`  Requirements: ${program.requirements.join(" ")}`] : []),
  ].join("\n");
}

function suggestedApplicationLine(priority: PartnerApplicationPriority, index: number, applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  return `${index + 1}. ${partnerProgramLabel(priority.program)} - ${priority.reason} Tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[priority.program.id])}.`;
}

export function buildPartnerApplicationLinks({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const priorities = allPriorities.slice(0, 5);
  return [
    "Jeep Build Lab partner application links",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory."}`,
    "",
    commerceDisclosure,
    noActiveCommerceDisclosure,
    "",
    "Sponsored-link readiness",
    sponsoredLinkReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses),
    "",
    "Suggested application order",
    priorities.map((priority, index) => suggestedApplicationLine(priority, index, applicationStatuses)).join("\n"),
    "",
    programs.map((program, index) => [
      `${index + 1}. ${program.name} - ${relationshipNames[program.relationship]}`,
      ...(program.network ? [`   Network: ${program.network}`] : []),
      `   Categories: ${programCategories(program)}`,
      `   Status: ${commerceStatusNames[program.status]}`,
      `   Application tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[program.id])}`,
      `   Link: ${safeCommerceUrl(program.url)}`,
      `   Note: ${program.note}`,
      ...(program.requirements?.length ? [`   Requirements: ${program.requirements.join(" ")}`] : []),
    ].join("\n")).join("\n"),
  ].join("\n");
}

export function buildAffiliateApplicationProfile({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const priorities = allPriorities.slice(0, 5);
  return [
    "Jeep Build Lab affiliate application profile template",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    "Public profile",
    "- Website URL: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
    "- Audience: Jeep Wrangler JL owners comparing rims, tires, suspension, bumpers, winches and armor before buying.",
    `- Catalog basis: ${parts.length} sourced variants with dated source snapshots; no live-price, inventory or checkout claim.`,
    `- Build focus: ${selected.length ? selectedCategorySummary(selected) : "No selected build yet; use the full partner directory."}`,
    "- Promotion methods: build guides, part comparisons, quote sheets, source-backed exports and social posts.",
    "- Compliance posture: paid links stay inactive until each program approves the account, issues terms and passes link testing.",
    "",
    "Fields to verify before submitting",
    affiliateApplicationProfileFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Common application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Application guardrails",
    sponsoredLinkReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses),
    "",
    "Suggested application order",
    priorities.map((priority, index) => suggestedApplicationLine(priority, index, applicationStatuses)).join("\n"),
    "",
    "Partner focus",
    programs.map(program => [
      `- ${program.name}${program.network ? ` via ${program.network}` : ""}`,
      `  Application tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[program.id])}`,
      `  Relationship: ${relationshipNames[program.relationship]}`,
      `  Categories: ${programCategories(program)}`,
      `  Link: ${safeCommerceUrl(program.url)}`,
      `  Note: ${program.note}`,
    ].join("\n")).join("\n"),
    "",
    "Private fields",
    "- Enter legal name, phone, address, tax, banking and tracking credentials only inside the partner network after review.",
    "- Do not store passwords, banking info, tax IDs, private phone numbers or affiliate tracking credentials in the public app source.",
    "",
    "Owner notes",
    notes.trim() || "No notes provided.",
  ].join("\n");
}

export function buildPaidLinkDisclosurePack({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  return [
    "Jeep Build Lab paid-link disclosure pack",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    "Use this disclosure only after partner approval, tracking-link testing and visible sponsored or affiliate labeling.",
    "",
    "Disclosure snippet",
    paidLinkDisclosureSnippet,
    "",
    "Current commerce status",
    `- ${commerceDisclosure}`,
    `- ${noActiveCommerceDisclosure}`,
    "",
    "Build focus",
    `- ${selected.length ? selectedCategorySummary(selected) : "No selected parts; use the full Jeep Build Lab audience."}`,
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses),
    "",
    "Pre-publish paid-link checks",
    paidLinkLaunchChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Placement rules",
    "- Put the disclosure before or near the first paid outbound link.",
    "- Label each individual paid link or button as sponsored or affiliate.",
    "- Keep source-price snapshots and checkout claims separate.",
    "- Remove paid labels from links that are still only application or source references.",
    "",
    "Owner notes",
    notes.trim() || "No notes provided.",
  ].join("\n");
}

export function buildCommerceApplicationPack({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const priorities = allPriorities.slice(0, 5);
  return [
    "Jeep Build Lab partner application pack",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    "Commerce status",
    `- ${commerceDisclosure}`,
    `- ${noActiveCommerceDisclosure}`,
    "",
    "Affiliate application profile fields",
    affiliateApplicationProfileFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Common application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Sponsored-link readiness",
    sponsoredLinkReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Paid-link disclosure snippet",
    paidLinkDisclosureSnippet,
    "",
    "Pre-publish paid-link checks",
    paidLinkLaunchChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses),
    "",
    "Suggested application order",
    priorities.map((priority, index) => suggestedApplicationLine(priority, index, applicationStatuses)).join("\n"),
    "",
    "Selected build source links",
    selected.length ? selected.map(part => selectedPartCommerceLine(part, state)).join("\n") : "- No parts are selected yet. The program directory below is not narrowed to a build.",
    "",
    "Relevant application links",
    programs.map(program => partnerProgramApplicationLine(program, applicationStatuses)).join("\n"),
    "",
    "Application prep checklist",
    commerceApplicationChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Owner notes",
    notes.trim() || "No notes provided.",
    "",
    "Disclosure reminder",
    "Keep paid links clearly labeled and keep source snapshots separate from live pricing, inventory or checkout claims.",
  ].join("\n");
}
