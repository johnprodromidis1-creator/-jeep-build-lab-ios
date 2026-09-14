import {
  categories,
  categoryNames,
  money,
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
  categories: readonly Category[];
  note: string;
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

export type CommerceApplicationPackInput = {
  name: string;
  notes: string;
  state: BuildState;
  parts: Part[];
  generatedAt?: string;
};

const allCategories = [...categories];
const offRoadCategories: Category[] = ["lift", "bumpers", "winches", "armor"];

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

export const partnerPrograms = [
  {
    id: "tire-rack-affiliate",
    name: "Tire Rack",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.tirerack.com/affiliate",
    categories: ["wheels", "tires"],
    note: "Commission path for tire and wheel referrals after approval and tracking setup.",
  },
  {
    id: "realtruck-affiliate",
    name: "RealTruck",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://realtruck.com/affiliate/",
    categories: allCategories,
    note: "Affiliate network path for truck and Jeep accessory referrals after approval.",
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

function selectedPartCommerceLine(part: Part, state: BuildState) {
  const programs = partnerProgramsForPart(part).map(program => program.name).join(", ") || "No matching partner program listed yet.";
  return [
    `- ${categoryNames[part.category]}: ${part.brand} ${part.name} - ${part.variant}`,
    `  Reference: ${part.reference}`,
    `  Quantity: ${quantityFor(part, state)} at ${money(part.priceCents)} each`,
    `  Source: ${part.retailer} - ${safeCommerceUrl(part.url)}`,
    `  Matching programs: ${programs}`,
  ].join("\n");
}

function partnerProgramApplicationLine(program: PartnerProgram) {
  return [
    `- ${program.name} (${relationshipNames[program.relationship]})`,
    `  Status: ${commerceStatusNames[program.status]}`,
    `  Categories: ${programCategories(program)}`,
    `  Application link: ${safeCommerceUrl(program.url)}`,
    `  Prep note: ${program.note}`,
  ].join("\n");
}

export function buildCommerceApplicationPack({ name, notes, state, parts, generatedAt = new Date().toISOString() }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = selected.length ? partnerProgramsForParts(selected) : [...partnerPrograms];
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
    "Selected build source links",
    selected.length ? selected.map(part => selectedPartCommerceLine(part, state)).join("\n") : "- No parts are selected yet. The program directory below is not narrowed to a build.",
    "",
    "Relevant application links",
    programs.map(partnerProgramApplicationLine).join("\n"),
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
