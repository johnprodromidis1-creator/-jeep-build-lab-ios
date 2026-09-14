import { categories, type Category, type Part } from "./model";

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
