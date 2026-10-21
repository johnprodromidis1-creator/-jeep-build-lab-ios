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

export type PartnerApplicationGatePhase = "profile" | "network" | "legal" | "business" | "sponsorship" | "watchlist" | "verify";

export type PartnerApplicationOperationRow = {
  programId: string;
  programName: string;
  network?: string;
  url: string;
  relationship: string;
  status: PartnerApplicationTrackerStatus;
  statusLabel: string;
  phaseKey: PartnerApplicationGatePhase;
  phaseLabel: string;
  ownerGate: string;
  nextAction: string;
  note: string;
  reason: string;
};

export type PartnerSubmissionPacketRow = PartnerApplicationOperationRow & {
  matchedCategories: readonly string[];
  selectedPartCount: number;
  requirements: readonly string[];
  prepNote: string;
  approvalLine: string;
};

export type PartnerApplicationSprintRow = PartnerSubmissionPacketRow & {
  rank: number;
  actionLabel: string;
  ownerReview: string;
};

export const partnerApplicationTrackerStatusNames = {
  todo: "To apply",
  ready: "Profile ready",
  submitted: "Submitted",
  approved: "Approved",
  paused: "Paused",
  blocked: "Blocked",
} as const;

export type PartnerApplicationTrackerStatus = keyof typeof partnerApplicationTrackerStatusNames;

export type CommerceApplicationPackInput = {
  name: string;
  notes: string;
  state: BuildState;
  parts: Part[];
  generatedAt?: string;
  applicationStatuses?: Record<string, PartnerApplicationTrackerStatus | string | undefined>;
  applicationStatusNotes?: Record<string, string | undefined>;
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

export const independenceDisclosure =
  "Independent aftermarket planning software. Not affiliated with Jeep, Stellantis, retailers or listed parts brands. Prices are dated snapshots or user notes; final fitment, availability and installation must be confirmed with the seller or installer.";

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
    field: "Independence and fitment disclosure",
    answer: independenceDisclosure,
  },
  {
    field: "Fulfillment role",
    answer: "Jeep Build Lab is currently a planning and referral experience. It does not process checkout, hold inventory, promise dropship fulfillment or handle returns.",
  },
] as const;

export const applicationReviewEvidenceChecklist = [
  {
    label: "Traffic proof",
    detail: "Current analytics, launch-stage estimate, follower count or email-list count used for the traffic or sales estimate.",
  },
  {
    label: "Channel proof",
    detail: "Website, social profile, content plan or sample build/export page the partner can review.",
  },
  {
    label: "Business/contact proof",
    detail: "Legal applicant name, business name, support email, phone and mailing address verified on the live form.",
  },
  {
    label: "Terms proof",
    detail: "Final program terms, agreement choices, opt-ins, exclusions, coupon-code rules and payout rules reviewed before submission.",
  },
  {
    label: "Approval proof",
    detail: "Confirmation email, approved dashboard status, partner-issued tracking URL and clean-browser link test kept outside public source.",
  },
] as const;

export const sponsoredLinkReadinessChecklist = [
  "Apply through the partner program and wait for approval before replacing source links with tracking links.",
  "Label every paid outbound link as sponsored or affiliate before it can earn commission.",
  "Keep source snapshot prices separate from live price, stock, shipping or checkout promises.",
  "Store approved tracking IDs outside the public catalog and test each link before publishing.",
  "Keep a plain-language FTC disclosure visible near paid links and in exports.",
] as const;

export const futureCheckoutReadinessChecklist = [
  "Keep checkout disabled until partner terms explicitly approve resale, dealer ordering, dropship or referral checkout for this site.",
  "If Stripe is added later, prefer Stripe-hosted checkout or Payment Links and keep all secret or restricted keys in Sites secrets, never public source or the mobile app.",
  "Do not collect payment until final price, stock, shipping, return, warranty and installer-fitment responsibility are confirmed for the exact part.",
  "Do not turn on tax calculation or tax language until business registrations and supported jurisdictions are verified.",
  "Verify webhook signatures, separate test/live credentials, Dashboard access controls and account 2FA before any production payment path.",
] as const;

export const stripeSandboxReadiness = {
  status: "Sandbox setup started",
  checkedAt: "2026-09-16",
  evidence: "Stripe sent a sandbox setup guide and business-verification path.",
  nextAction: "Confirm the intended business identity, finish owner-only verification in Stripe and complete test-mode checkout and webhook validation before any production integration.",
  notActive: "No live payments, production checkout, public account identifiers or client-side secret keys.",
} as const;

export const commerceModeReadinessRows = [
  {
    key: "referral",
    mode: "Affiliate / referral links",
    status: "Application path",
    role: "Middleman referral only.",
    unlock: "Partner approval, partner-issued tracking URL, clean-browser test and visible affiliate or sponsored label.",
    notActive: "No commission claim until approved tracking is installed.",
  },
  {
    key: "reseller",
    mode: "Dealer / reseller / dropship terms",
    status: "Partner terms needed",
    role: "Potential order-source path after written terms.",
    unlock: "Written partner terms for resale, dropship, warranty, returns, taxes and customer-support responsibility.",
    notActive: "No wholesale pricing, inventory ownership, fulfillment or return promise.",
  },
  {
    key: "checkout",
    mode: "Stripe / payment checkout",
    status: "Sandbox started; live locked",
    role: "Stripe sandbox setup was evidenced on September 16, 2026; production payment remains a future path.",
    unlock: "Confirm the intended business identity, finish owner-only Stripe verification, then validate approved commerce terms, fulfillment, tax, hosted checkout, webhooks and secret storage in test mode.",
    notActive: "No live Stripe checkout, payment collection, public account identifiers or client-side secret keys.",
  },
] as const;

export const applicationDataBoundaryRows = [
  {
    key: "public",
    label: "Reusable public profile",
    status: "Safe after review",
    detail: "Website URL, app description, audience, promotion methods, catalog basis, build focus and independence disclosure.",
  },
  {
    key: "owner",
    label: "Owner-entered application fields",
    status: "Review on live form",
    detail: "Visible name, business name, country, timezone, currency, contact fields, traffic estimates, agreement choices and opt-ins.",
  },
  {
    key: "private",
    label: "Private credentials and payout data",
    status: "Never store in app",
    detail: "Passwords, tax IDs, banking details, payout credentials, API keys and partner-issued tracking IDs stay inside the partner network or Sites secrets.",
  },
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

export const paidLinkLaunchProofFields = [
  "Approved partner/program name and network",
  "Partner-issued tracking URL stored outside public source",
  "Clean-browser test date and expected landing page",
  "Visible affiliate or sponsored label placement",
  "Disclosure placement and source-price separation",
] as const;

export type PartnerLaunchEvidenceRow = {
  programName: string;
  network?: string;
  status: PartnerApplicationTrackerStatus;
  statusLabel: string;
  proof: readonly string[];
  risk: string;
};

export type PartnerOutreachQueueRow = {
  programId: string;
  programName: string;
  network?: string;
  status: PartnerApplicationTrackerStatus;
  statusLabel: string;
  subject: string;
  action: string;
  reason: string;
  url: string;
  note: string;
};

export const partnerSubmissionReviewChecklist = [
  "Confirm the application is on the expected partner or network domain before entering private details.",
  "Review every visible field, checkbox, opt-in, agreement and program term before final Continue or Submit.",
  "Keep passwords, tax IDs, banking fields and tracking credentials outside the app source and public exports.",
  "Mark a program Submitted only after the partner network confirms the application was received.",
  "Do not publish paid links until approval, tracking-link testing and visible disclosure are complete.",
] as const;

export const partnerSubmissionPrivateFields = [
  "Account name, legal business name, applicant name and DBA",
  "Country, timezone, currency, payout country and tax classification",
  "Mobile number, mailing address, support email and business website",
  "Traffic, follower, revenue, audience and sales estimates",
  "Program agreement acceptance, privacy terms and email marketing opt-in choices",
  "Tax IDs, resale certificates, banking details, passwords and tracking credentials",
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
    requirements: [
      "Live page checked September 16, 2026: affiliate page advertises a 6% commission and 24/7 reporting.",
      "Application flow opens the Tire Rack Affiliate Linking Agreement first; clicking I Agree accepts the legal terms and then opens the application.",
      "Agreement text says Missouri residents cannot participate; confirm current eligibility before accepting.",
      "Use wheel and tire content plus the public Jeep Build Lab URL as the traffic source.",
      "Confirm current program agreement, payout rules and approved tracking assets before adding any paid Tire Rack link.",
    ],
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
      "Live page checked September 16, 2026: RealTruck routes applications through Impact with a 30-day attribution-window claim on the public page.",
      "Review the RealTruck offer terms inside Impact before submitting.",
      "Use Jeep Build Lab's public URL and off-road build-planning audience description.",
      "Confirm Impact account name, country, timezone, currency and Partner Program Agreement acceptance before Continue.",
      "If Impact accepts account details and currency but then stops at 'Password format is invalid' with 'An unknown error occurred. Please try again later.', the account owner must fix the password/account setup directly in Impact or retry later.",
      "If Impact keeps Continue disabled before the account-details step advances, refresh or retry later inside Impact and keep this target blocked until the next form is reviewable.",
      "Do not add RealTruck tracking links until Impact approval and link testing are complete.",
    ],
  },
  {
    id: "carid-affiliate",
    name: "CARiD",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.carid.com/affiliate.html",
    network: "Impact",
    categories: allCategories,
    note: "Automotive parts affiliate path that requires approved tracking links.",
    requirements: [
      "Live browser check September 16, 2026: CARiD affiliate page loads and routes Sign Up With Impact to app.impact.com/campaign-promo-signup/CARiD.brand.",
      "Impact signup gate asks for email, first name, last name, password and mobile number before Continue; owner must handle password/account setup.",
      "Public page describes creator, forum, shop and high-traffic blog use cases, promotional tools, banners, tracking links, custom coupon codes and campaign assets.",
      "Do not add CARiD tracking links until Impact approval and link testing are complete.",
    ],
  },
  {
    id: "4-wheel-parts-affiliate",
    name: "4 Wheel Parts",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.flexoffers.com/affiliate-programs/4-wheel-parts-affiliate-program/",
    network: "FlexOffers",
    categories: allCategories,
    note: "FlexOffers watchlist path; live listing currently shows the advertiser program as deactivated.",
    requirements: [
      "Live page checked September 16, 2026: FlexOffers listing displays Program Status: Deactivated while still showing 2.4% online-sales payout.",
      "Do not apply or publish paid 4 Wheel Parts links unless FlexOffers shows the advertiser active again inside the publisher account.",
      "Current app links stay application references until FlexOffers approval and tracking-link testing are complete.",
    ],
  },
  {
    id: "4-wheel-drive-hardware-affiliate",
    name: "4 Wheel Drive Hardware",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.flexoffers.com/affiliate-programs/4-wheel-drive-hardware-affiliate-program/",
    network: "FlexOffers",
    categories: allCategories,
    note: "FlexOffers affiliate path for a Jeep-focused parts retailer; verify active status inside the publisher account.",
    requirements: [
      "Live page checked September 16, 2026: FlexOffers listing describes 4 Wheel Drive Hardware as a leading online distributor of Jeep parts at 4wd.com.",
      "FlexOffers sign-up and publisher-login links are the application gate; confirm active advertiser status inside the publisher account before applying or publishing paid links.",
      "Do not add 4 Wheel Drive Hardware tracking links until FlexOffers approval and link testing are complete.",
    ],
  },
  {
    id: "cj-pony-parts-creators",
    name: "CJ Pony Parts",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.cjponyparts.com/creators",
    network: "CJ Affiliate",
    categories: allCategories,
    note: "Creator affiliate path for automotive content once a referral link is issued.",
    requirements: [
      "Live browser check September 16, 2026: CJ Creators page is readable, says no minimum follower count, pays monthly by direct deposit, and routes Apply Now to a CJ publisher signup.",
      "CJ branded signup says an active CJ publisher account is required before applying to CJ Pony Parts.",
      "Signup gate asks for language, country, email, password, confirm password and reCAPTCHA before Submit; owner must handle credentials and captcha.",
      "Program panel lists 3% commission, 30-day cookie window, product feed and dedicated affiliate team; contact shown: jlee13@cjponyparts.com.",
      "Keep CJ Pony Parts links unpaid until the creator account is approved and referral links are issued.",
    ],
  },
  {
    id: "dv8-offroad-affiliate",
    name: "DV8 Offroad",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://dv8offroad.com/pages/affiliate",
    categories: offRoadCategories,
    note: "Direct off-road affiliate path for Jeep bumpers, armor, recovery and accessory referrals.",
    requirements: [
      "Live page checked September 16, 2026: DV8 Offroad affiliate page says affiliates can earn 5% commission on qualifying referral sales, with no minimum payout or sales requirement.",
      "Live page says approved affiliates receive links, banners, creative assets and a dedicated 10% coupon code; commissions are paid monthly on net sales excluding returns, tax and shipping.",
      "Application/account flow includes affiliate login/account pages; owner must review form fields, approval email and program exclusions before submitting.",
      "Keep DV8 tracking links inactive until approval, generated links and the coupon code are tested.",
    ],
  },
  {
    id: "arb-affiliate",
    name: "ARB Affiliate",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://arbusa.com/affiliates",
    network: "AvantLink",
    categories: offRoadCategories,
    note: "Direct ARB affiliate path separate from distributor sourcing routes.",
    requirements: [
      "Live page checked September 16, 2026: ARB affiliate page lists a 5% headline rate, accepted affiliate rates from 3-5% depending on creator size and engagement, and a 30-day cookie duration.",
      "Live page routes Apply Now to AvantLink publisher signup for merchant 40329.",
      "ARB page names regular promotions, seasonal campaigns and dedicated affiliate support for accepted affiliates.",
      "Keep ARB paid links separate from distributor/dealer sourcing routes until approval and tracking-link testing are complete.",
    ],
  },
  {
    id: "summit-racing-affiliate",
    name: "Summit Racing",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.summitracing.com/summit-racing-affiliate",
    categories: allCategories,
    note: "Broad automotive affiliate path for parts and accessory referrals after approval.",
    requirements: [
      "Live page checked September 16, 2026: Summit Racing invites YouTubers, bloggers, social influencers and website owners to earn commissions by driving traffic and sales.",
      "The current affiliate-page metadata advertises gear links, tools and 5% commission on every sale.",
      "Review the current Summit Racing program terms, eligible products, application form and payout details before submitting.",
      "Do not publish Summit Racing paid links until approval, link testing and visible affiliate labeling are complete.",
    ],
  },
  {
    id: "jegs-affiliate",
    name: "JEGS",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.jegs.com/affiliate-program",
    network: "Impact",
    categories: allCategories,
    note: "Impact Radius affiliate path for performance and Jeep-adjacent parts; approval needed before paid tracking links.",
    requirements: [
      "Live page checked September 16, 2026: JEGS affiliate program lists 1% commission on referral-site orders, 3% commission on in-house JEGS brand sales and a 5-day referral cookie.",
      "Live page says JEGS carries over 1 million parts, over 700 third-party brands and Jeep/truck parts, with text links, banners and dedicated affiliate support.",
      "Application steps require signing up as an Impact Radius publisher and then applying for the JEGS affiliate program via Impact.",
      "Owner must review the Impact signup, password, mobile, payout and agreement fields before submitting.",
    ],
  },
  {
    id: "genesis-offroad-affiliate",
    name: "Genesis Offroad",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.genesisoffroad.com/pages/affiliates",
    network: "AvantLink",
    categories: offRoadCategories,
    note: "Off-road electrical/accessory affiliate path via AvantLink, useful for recovery and trail-build content.",
    requirements: [
      "Live page checked September 16, 2026: Genesis Offroad affiliate page says commission starts at 5%, with opportunity to grow up to 10% as sales are generated.",
      "Live page routes Apply With AvantLink Now to AvantLink program 36713.",
      "Live page says approved affiliates receive free AvantLink tools, campaign tracking and support.",
      "Review AvantLink account requirements and Genesis program terms before submitting or publishing paid links.",
    ],
  },
  {
    id: "rough-country-partnership",
    name: "Rough Country Partnership",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://www.roughcountry.com/partnership-program",
    categories: allCategories,
    note: "Brand ambassador, sponsorship or collaboration path; treat as sponsorship intake rather than approved affiliate tracking.",
    requirements: [
      "Live page checked September 16, 2026: Rough Country partnership page requires all sponsorship requests to go through the application process.",
      "Minimum requirements include one or more of: 5K+ followers with 3%+ engagement, 500+ expected event attendees, recognized industry authority, or established media/channel reach.",
      "Page says Rough Country does not offer free products for new/unproven pages, personal builds or unrelated content.",
      "Do not describe this as approved affiliate commission until Rough Country confirms the specific paid-link or sponsorship terms.",
    ],
  },
  {
    id: "am-offroad-affiliate",
    name: "AM Offroad",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://amoffroad.com/pages/affiliate-registration-page",
    categories: allCategories,
    note: "Aftermarket off-road affiliate path using offer-code attribution after approval.",
    requirements: [
      "Live page checked September 16, 2026: AM Offroad invites bloggers, social media influencers and webmasters to refer customers to its off-road parts site.",
      "Live page says accepted affiliates receive an affiliate discount code and link for tracking traffic, with monthly commission credit for purchases using the offer code.",
      "Review the registration form, code/link terms and payout details before submitting or displaying paid links.",
    ],
  },
  {
    id: "off-terrain-affiliate",
    name: "Off Terrain",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://offterrain.com/affiliates/",
    categories: offRoadCategories,
    note: "Off-road accessory affiliate path with tiered commission terms after approval.",
    requirements: [
      "Live page checked September 16, 2026: Off Terrain affiliate page lists a tiered commission structure paying up to 10% on sales and a 30-day attribution window.",
      "Page rules ban coupon/deal sites, link spamming, self-purchases, unofficial coupons and using OffTerrain in domain or personal branding.",
      "Payout details require a PayPal email, a $100 minimum threshold and payment after the refund window, generally within 45-60 days of each sale.",
      "Confirm current eligibility, payout terms and link assets before publishing any paid Off Terrain links.",
    ],
  },
  {
    id: "morryde-jeep-affiliate",
    name: "MORryde Jeep",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://morryde.com/morryde-jeep-affiliate-application/",
    categories: ["armor"],
    note: "Jeep accessory affiliate path needs manual URL verification before applying.",
    requirements: [
      "Live check September 16, 2026: listed Jeep affiliate application URL returned 404 and search fell back to MORryde's homepage.",
      "Search result September 16, 2026: MORryde contact path lists sales@MORryde.com and phone (574) 293-1581.",
      "Verify the current MORryde Jeep affiliate route or contact path before entering application details.",
      "Treat this target as blocked until a current application page or partner contact is confirmed.",
    ],
  },
  {
    id: "american-modified-affiliate",
    name: "American Modified Affiliate",
    relationship: "affiliate",
    status: "application-needed",
    url: "https://americanmodified.com/pages/affiliate-application",
    network: "Refersion",
    categories: ["lift", "bumpers", "armor"],
    note: "Direct affiliate path with code and link tracking after Refersion approval.",
    requirements: [
      "Live browser check September 16, 2026: affiliate page embeds an American Modified Refersion registration form, even though page copy also mentions ShareASale.",
      "Form asks for first name, last name, email, password, confirm password and Refersion Terms of Service acceptance before Sign Up.",
      "Commission panel lists online purchase with processed valid payment, 30-day attribution window, percent-of-sale commission and 5.00% base commission.",
      "Do not submit until the owner reviews password setup and Refersion terms; do not publish codes or links until approval and testing are complete.",
    ],
  },
  {
    id: "american-modified-reseller",
    name: "American Modified Wholesale/Dropship",
    relationship: "reseller",
    status: "application-needed",
    url: "https://americanmodified.com/pages/become-a-reseller",
    categories: ["wheels", "lift", "bumpers", "armor"],
    note: "Reseller and dropship-style path that needs business approval and terms.",
    requirements: [
      "Live browser check September 16, 2026: reseller, distributor, dropship and affiliate paths are all mentioned.",
      "Wholesale or dropship inquiries can use the page form or wholesales@americanmodified.com; affiliate signup is a separate Refersion path on the site.",
      "Page lists Keystone Automotive Operations as an authorized distributor route for American Modified products.",
      "Do not claim dropship fulfillment or resale pricing until American Modified approves the exact path and terms.",
    ],
  },
  {
    id: "quadratec-wholesale",
    name: "Quadratec Wholesale",
    relationship: "dealer",
    status: "application-needed",
    url: "https://www.quadratec.com/wholesale",
    categories: allCategories,
    note: "Dealer pricing path for qualifying businesses; current catalog sources already use Quadratec pages.",
    requirements: [
      "Live page checked September 16, 2026: wholesale account path links to QuadratecWholesale.com account application and wholesale/register.",
      "Search result September 16, 2026: account application says all forms must be completed in full and signed by an executive, owner or legal agent of the company applying.",
      "Wholesale outreach route found September 16, 2026: wholesale@quadratec.com.",
      "Dealer requirements call for a licensed automotive business with an operational company at application time.",
      "Confirm free-shipping thresholds, oversized freight handling and wholesale terms before using dealer pricing claims.",
    ],
  },
  {
    id: "extreme-terrain-dealer",
    name: "ExtremeTerrain",
    relationship: "dealer",
    status: "application-needed",
    url: "https://www.extremeterrain.com/dealer.html",
    categories: allCategories,
    note: "Dealer program for eligible shops and resellers after sign-up review.",
    requirements: [
      "Live page checked September 16, 2026: dealer page is reachable but public text extraction exposes mostly navigation and legal copy.",
      "Search result September 16, 2026: dealer contact route lists New.dealer@turn5.com and 855-885-9487; resale-certificate handling points to ResaleCertificates@turn5.com and a CertExpress upload link.",
      "Review the live dealer application/login flow manually and confirm any reseller-certificate requirements before submitting.",
      "Keep ExtremeTerrain links as source/application links until dealer approval and permitted link terms are confirmed.",
    ],
  },
  {
    id: "turn-14-distribution",
    name: "Turn 14 Distribution",
    relationship: "distributor",
    status: "application-needed",
    url: "https://www.turn14.com/become_customer",
    categories: allCategories,
    note: "Wholesale distributor path for approved automotive businesses.",
    requirements: [
      "Live page checked September 16, 2026: requires professional retail storefront, shop facility or proprietary website.",
      "Requires business license, state sales tax license and federal tax ID, plus automotive or powersports specialization.",
      "Search result September 16, 2026: new-dealer contact path lists newdealers@turn14.com, general@turn14.com and 1-877-7TURN14.",
      "Expect an opening order or buy-in and a review of how the business adds value through install, tuning, marketing, photography or content.",
    ],
  },
  {
    id: "meyer-distributing",
    name: "Meyer Distributing",
    relationship: "distributor",
    status: "application-needed",
    url: "https://www.meyerdistributing.com/en-us/customers/applicationterms.aspx",
    categories: allCategories,
    note: "Retailer and wholesaler application path that requires business and tax details.",
    requirements: [
      "Live page checked September 16, 2026: completed forms are emailed to CustApps@meyerdistributing.com.",
      "Download the New Customer Application PDF and state tax exemption form before applying.",
      "The customer application is not an open-account credit application; request a separate credit application from a salesperson if needed.",
    ],
  },
  {
    id: "premier-performance",
    name: "Premier Performance",
    relationship: "distributor",
    status: "application-needed",
    url: "https://apgwholesale.com/pages/become-a-dealer",
    categories: allCategories,
    note: "Wholesale dealer path for approved performance and off-road businesses.",
    requirements: [
      "Live check September 16, 2026: direct Premier fetch hit a proxy error; search results point Premier Performance toward APG Wholesale / Premier dealer access.",
      "Search result September 16, 2026: APG Wholesale dealer page says to fill out the application to begin setting up an account with Premier and notes it is wholesale-only, not retail.",
      "Search result September 16, 2026: APG Wholesale sales route lists salesteam@apgteam.com and 888-497-3666.",
      "Verify the current APG/Premier dealer route before entering business or tax details.",
      "Treat this target as needs-review until the current application host and terms are confirmed.",
    ],
  },
  {
    id: "arb-distributors",
    name: "ARB distributor network",
    relationship: "distributor",
    status: "application-needed",
    url: "https://arbusahelp.zendesk.com/hc/en-us/articles/5963545842969-What-Distributors-can-I-get-your-products-through",
    categories: offRoadCategories,
    note: "Distributor routing reference for ARB-style off-road product sourcing.",
    requirements: [
      "Live page checked September 16, 2026: ARB routes product access through distributors rather than a direct affiliate form.",
      "Listed distributor paths include Keystone Automotive, Meyer Distributing, Premier Performance, Transamerican Auto Parts and Turn 14.",
      "Use ARB as a sourcing-route reference, not a paid-link target, unless a distributor approves a commission or dealer arrangement.",
    ],
  },
] as const satisfies readonly PartnerProgram[];

const partnerApplicationGateMap: Record<string, { phaseKey: PartnerApplicationGatePhase; phaseLabel: string; ownerGate: string; nextAction: string }> = {
  "tire-rack-affiliate": {
    phaseKey: "legal",
    phaseLabel: "Legal agreement first",
    ownerGate: "Owner must review and accept the Tire Rack linking agreement before the application opens.",
    nextAction: "Open Tire Rack, review the agreement, then complete the application only after the final legal screen is checked.",
  },
  "realtruck-affiliate": {
    phaseKey: "network",
    phaseLabel: "Impact account blocker",
    ownerGate: "Impact account setup, password rules and agreement fields must be resolved by the owner.",
    nextAction: "Retry or fix the Impact account setup, then wait for RealTruck approval before using tracking links.",
  },
  "carid-affiliate": {
    phaseKey: "network",
    phaseLabel: "Impact application",
    ownerGate: "Impact requires email, password, mobile and campaign terms before submission.",
    nextAction: "Prepare the reusable Jeep Build Lab profile, then review CARiD's Impact campaign fields before submitting.",
  },
  "4-wheel-parts-affiliate": {
    phaseKey: "watchlist",
    phaseLabel: "Deactivated watchlist",
    ownerGate: "FlexOffers currently shows the advertiser deactivated.",
    nextAction: "Do not apply or publish paid links until FlexOffers shows the program active inside a publisher account.",
  },
  "4-wheel-drive-hardware-affiliate": {
    phaseKey: "network",
    phaseLabel: "FlexOffers account",
    ownerGate: "FlexOffers publisher account and advertiser-active status must be reviewed.",
    nextAction: "Check active status in FlexOffers, then apply with Jeep Build Lab's public profile if available.",
  },
  "cj-pony-parts-creators": {
    phaseKey: "network",
    phaseLabel: "CJ publisher gate",
    ownerGate: "CJ signup requires account credentials and reCAPTCHA before applying to CJ Pony Parts.",
    nextAction: "Create or log into a CJ publisher account, then apply to CJ Pony Parts after reviewing the campaign panel.",
  },
  "dv8-offroad-affiliate": {
    phaseKey: "profile",
    phaseLabel: "Direct affiliate form",
    ownerGate: "Owner must review DV8 form fields, approval email language, exclusions and coupon-code terms.",
    nextAction: "Apply with the public profile, then keep DV8 links inactive until generated links and coupon code are tested.",
  },
  "arb-affiliate": {
    phaseKey: "network",
    phaseLabel: "AvantLink signup",
    ownerGate: "AvantLink publisher account, payout and ARB merchant terms must be reviewed.",
    nextAction: "Apply through ARB's AvantLink merchant route after confirming creator size, engagement and site details.",
  },
  "summit-racing-affiliate": {
    phaseKey: "legal",
    phaseLabel: "Terms review",
    ownerGate: "Owner must review the current application form, payout details, eligible products and affiliate agreement.",
    nextAction: "Open Summit's verified live affiliate page, review the current terms and submit only after the owner confirms the form.",
  },
  "jegs-affiliate": {
    phaseKey: "network",
    phaseLabel: "Impact Radius signup",
    ownerGate: "Impact Radius publisher account, password, mobile, payout and agreement fields need owner review.",
    nextAction: "Apply through the JEGS Impact path after confirming the public profile and private account fields.",
  },
  "genesis-offroad-affiliate": {
    phaseKey: "network",
    phaseLabel: "AvantLink program",
    ownerGate: "AvantLink publisher account and Genesis program 36713 terms must be reviewed.",
    nextAction: "Apply through AvantLink, then wait for approval and partner-issued tracking links.",
  },
  "rough-country-partnership": {
    phaseKey: "sponsorship",
    phaseLabel: "Sponsorship criteria",
    ownerGate: "Rough Country asks for qualifying follower, engagement, event, industry or media proof.",
    nextAction: "Use this as an ambassador/sponsorship application only if the current audience evidence meets the criteria.",
  },
  "am-offroad-affiliate": {
    phaseKey: "profile",
    phaseLabel: "Direct affiliate registration",
    ownerGate: "Owner must review offer-code, payout and registration terms before submitting.",
    nextAction: "Apply with the public profile, then keep discount code and paid links inactive until approval and testing.",
  },
  "off-terrain-affiliate": {
    phaseKey: "profile",
    phaseLabel: "Direct affiliate form",
    ownerGate: "PayPal email, $100 payout threshold, content rules and coupon restrictions require owner review.",
    nextAction: "Apply only after confirming payout details and rule compliance, then test all issued links before publishing.",
  },
  "morryde-jeep-affiliate": {
    phaseKey: "verify",
    phaseLabel: "Route verification",
    ownerGate: "The listed MORryde Jeep affiliate URL returned 404.",
    nextAction: "Send or review the MORryde outreach draft and wait for a current application route before entering details.",
  },
  "american-modified-affiliate": {
    phaseKey: "network",
    phaseLabel: "Refersion signup",
    ownerGate: "Refersion account credentials and terms must be reviewed by the owner.",
    nextAction: "Apply through the Refersion form only after password setup and terms are checked.",
  },
  "american-modified-reseller": {
    phaseKey: "business",
    phaseLabel: "Wholesale/dropship review",
    ownerGate: "Reseller or dropship terms, business details and fulfillment responsibilities must be confirmed.",
    nextAction: "Use the outreach draft or reseller form to ask which path fits before claiming dropship or resale terms.",
  },
  "quadratec-wholesale": {
    phaseKey: "business",
    phaseLabel: "Dealer eligibility",
    ownerGate: "Licensed automotive business, signed application and wholesale account requirements must be reviewed.",
    nextAction: "Apply only if the business eligibility and required signatures are ready.",
  },
  "extreme-terrain-dealer": {
    phaseKey: "business",
    phaseLabel: "Dealer-flow review",
    ownerGate: "Dealer flow and resale-certificate handling need manual review.",
    nextAction: "Use the Turn5 dealer contact path or live dealer flow before entering business/private details.",
  },
  "turn-14-distribution": {
    phaseKey: "business",
    phaseLabel: "Distributor business proof",
    ownerGate: "Professional storefront/site, business license, tax license, federal tax ID and value-add proof are expected.",
    nextAction: "Prepare business documents before submitting a Turn 14 customer application.",
  },
  "meyer-distributing": {
    phaseKey: "business",
    phaseLabel: "Forms-first distributor",
    ownerGate: "New customer application and tax exemption forms must be downloaded, completed and emailed.",
    nextAction: "Prepare the required forms and ask Meyer for credit terms separately if needed.",
  },
  "premier-performance": {
    phaseKey: "verify",
    phaseLabel: "Route confirmation",
    ownerGate: "Direct Premier route needs confirmation through APG/Premier before private details are entered.",
    nextAction: "Use the APG/Premier draft or current dealer page to confirm the right application host.",
  },
  "arb-distributors": {
    phaseKey: "verify",
    phaseLabel: "Sourcing route only",
    ownerGate: "ARB distributor list is a sourcing reference, not a direct commission approval path.",
    nextAction: "Apply through an approved distributor only after written commission, dealer or reseller terms are confirmed.",
  },
};

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

function commerceCsvCell(value: unknown) {
  return "\"" + String(value ?? "").replace(/^[=+@-]/, "'$&").replaceAll("\"", "\"\"") + "\"";
}

export function partnerProgramsForBuild(state: BuildState, parts: Part[]): PartnerProgram[] {
  const selected = selectedParts(state, parts);
  return selected.length ? partnerProgramsForParts(selected) : [...partnerPrograms];
}

function partnerApplicationPrioritiesForPrograms(programs: readonly PartnerProgram[], selected: readonly Part[]): PartnerApplicationPriority[] {
  return programs.map((program, order) => {
    const matchedParts = selected.filter(part => (program.categories as readonly Category[]).includes(part.category));
    const matchedCategories = [...new Set(((selected.length && matchedParts.length) ? matchedParts.map(part => part.category) : program.categories).map(category => categoryNames[category]))];
    const selectedPartCount = matchedParts.length;
    const score = selected.length
      ? selectedPartCount * 20 + matchedCategories.length * 5 + relationshipPriority[program.relationship] + (program.network ? 3 : 0)
      : matchedCategories.length * 3 + relationshipPriority[program.relationship] + (program.network ? 3 : 0);
    const reason = selected.length
      ? selectedPartCount
        ? `Matches ${selectedPartCount} selected part${selectedPartCount === 1 ? "" : "s"} across ${matchedCategories.join(", ")}.`
        : `Full-roster target; not matched to selected parts yet, but covers ${matchedCategories.join(", ")}.`
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

export function partnerApplicationPrioritiesForBuild(state: BuildState, parts: Part[]): PartnerApplicationPriority[] {
  const selected = selectedParts(state, parts);
  return partnerApplicationPrioritiesForPrograms(partnerProgramsForBuild(state, parts), selected);
}

export function partnerApplicationPrioritiesForAllPrograms(state: BuildState, parts: Part[]): PartnerApplicationPriority[] {
  return partnerApplicationPrioritiesForPrograms(partnerPrograms, selectedParts(state, parts));
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
const actionableApplicationStatuses: readonly PartnerApplicationTrackerStatus[] = ["todo", "ready"];

function applicationTrackerStatusKey(status: unknown): PartnerApplicationTrackerStatus {
  return typeof status === "string" && Object.prototype.hasOwnProperty.call(partnerApplicationTrackerStatusNames, status)
    ? status as PartnerApplicationTrackerStatus
    : "todo";
}

function applicationTrackerStatusLabel(status: unknown) {
  return partnerApplicationTrackerStatusNames[applicationTrackerStatusKey(status)];
}

function applicationTrackerNote(programId: string, notes: CommerceApplicationPackInput["applicationStatusNotes"]) {
  return typeof notes?.[programId] === "string" ? notes[programId]!.trim() : "";
}

function partnerApplicationGate(program: PartnerProgram) {
  return partnerApplicationGateMap[program.id] ?? {
    phaseKey: "profile" as const,
    phaseLabel: "Profile review",
    ownerGate: "Owner must review form fields, program terms and private details before submission.",
    nextAction: "Prepare the public Jeep Build Lab profile, review the live form, then submit only after final confirmation.",
  };
}

function partnerProgramLabel(program: PartnerProgram) {
  return `${program.name}${program.network ? ` via ${program.network}` : ""}`;
}

export function partnerApplicationOperationRows(
  priorities: readonly PartnerApplicationPriority[],
  applicationStatuses: CommerceApplicationPackInput["applicationStatuses"],
  applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"],
): PartnerApplicationOperationRow[] {
  return priorities.map(priority => {
    const program = priority.program;
    const status = applicationTrackerStatusKey(applicationStatuses?.[program.id]);
    const gate = partnerApplicationGate(program);
    const note = applicationTrackerNote(program.id, applicationStatusNotes);
    const nextAction = status === "approved"
      ? "Collect partner-issued tracking URLs, test clean-browser landing pages and label links before activation."
      : status === "submitted"
        ? "Watch for approval, terms, tracking-link rules and any partner verification requests."
        : status === "blocked"
          ? "Resolve the blocker or partner-site issue before retrying this application."
          : status === "paused"
            ? "Leave skipped until the owner resets this program to To apply or Profile ready."
            : gate.nextAction;
    return {
      programId: program.id,
      programName: program.name,
      network: program.network,
      url: safeCommerceUrl(program.url),
      relationship: relationshipNames[program.relationship],
      status,
      statusLabel: partnerApplicationTrackerStatusNames[status],
      phaseKey: gate.phaseKey,
      phaseLabel: gate.phaseLabel,
      ownerGate: gate.ownerGate,
      nextAction,
      note,
      reason: priority.reason,
    };
  });
}

function partnerApplicationOperationsSection(
  priorities: readonly PartnerApplicationPriority[],
  applicationStatuses: CommerceApplicationPackInput["applicationStatuses"],
  applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"],
) {
  const rows = partnerApplicationOperationRows(priorities, applicationStatuses, applicationStatusNotes);
  if (!rows.length) return "Application operations ledger\n- No partner application path is in scope for this build.";
  return [
    "Application operations ledger",
    ...rows.map(row => `- ${row.programName}${row.network ? ` via ${row.network}` : ""}: ${row.phaseLabel}. Tracker: ${row.statusLabel}. Owner gate: ${row.note || row.ownerGate} Next: ${row.nextAction}`),
  ].join("\n");
}

function partnerSubmissionApprovalLine(programLabel: string) {
  return `I approve submitting the visible ${programLabel} application fields, agreement choices, opt-ins and private account details after reviewing the final form.`;
}

export function partnerSubmissionPacketRows(
  priorities: readonly PartnerApplicationPriority[],
  applicationStatuses: CommerceApplicationPackInput["applicationStatuses"],
  applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"],
): PartnerSubmissionPacketRow[] {
  const operations = partnerApplicationOperationRows(priorities, applicationStatuses, applicationStatusNotes);
  const operationByProgram = new Map(operations.map(row => [row.programId, row]));
  return priorities.map(priority => {
    const program = priority.program;
    const operation = operationByProgram.get(program.id) ?? partnerApplicationOperationRows([priority], applicationStatuses, applicationStatusNotes)[0];
    const label = partnerProgramLabel(program);
    return {
      ...operation,
      matchedCategories: priority.matchedCategories,
      selectedPartCount: priority.selectedPartCount,
      requirements: program.requirements ?? [],
      prepNote: program.note,
      approvalLine: partnerSubmissionApprovalLine(label),
    };
  });
}

function sprintActionLabel(status: PartnerApplicationTrackerStatus) {
  if (status === "approved") return "Activate carefully";
  if (status === "submitted") return "Watch approval";
  if (status === "ready") return "Review + submit";
  if (status === "blocked") return "Fix blocker";
  if (status === "paused") return "Paused";
  return "Prep application";
}

function sprintOwnerReview(status: PartnerApplicationTrackerStatus) {
  if (status === "approved") return "Use only partner-issued tracking URLs after a clean-browser test and visible affiliate or sponsored labels.";
  if (status === "submitted") return "Wait for approval, terms, and tracking-link rules before changing any public link behavior.";
  if (status === "ready") return "Open the live form, verify owner-private fields and terms, then submit only after the final screen is checked.";
  if (status === "blocked") return "Resolve the password, account, eligibility, legal, or partner-site issue before retrying.";
  if (status === "paused") return "Keep this program out of the active sprint until the owner resets it.";
  return "Paste only reviewed public answers; complete private fields yourself on the partner site.";
}

export function partnerApplicationSprintRows(
  priorities: readonly PartnerApplicationPriority[],
  applicationStatuses: CommerceApplicationPackInput["applicationStatuses"],
  applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"],
): PartnerApplicationSprintRow[] {
  return partnerSubmissionPacketRows(priorities, applicationStatuses, applicationStatusNotes).map((row, index) => ({
    ...row,
    rank: index + 1,
    actionLabel: sprintActionLabel(row.status),
    ownerReview: sprintOwnerReview(row.status),
  }));
}

function partnerSubmissionPacketSection(row: PartnerSubmissionPacketRow, index: number) {
  return [
    `Application ${index + 1}: ${row.programName}${row.network ? ` via ${row.network}` : ""}`,
    `Tracker status: ${row.statusLabel}`,
    ...(row.note ? [`Tracker note: ${row.note}`] : []),
    `Relationship: ${row.relationship}`,
    `Application phase: ${row.phaseLabel}`,
    `Application link: ${row.url}`,
    `Matched categories: ${row.matchedCategories.join(", ")}`,
    `Selected part count: ${row.selectedPartCount}`,
    `Match reason: ${row.reason}`,
    `Owner gate: ${row.note || row.ownerGate}`,
    `Next safe action: ${row.nextAction}`,
    `Prep note: ${row.prepNote}`,
    "",
    "Program-specific requirements to verify",
    row.requirements.length ? row.requirements.map((item, requirementIndex) => `${requirementIndex + 1}. ${item}`).join("\n") : "No program-specific requirements are recorded beyond live form review.",
    "",
    "Copy-ready public application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Private fields to complete only on the live partner form",
    partnerSubmissionPrivateFields.map((item, privateIndex) => `${privateIndex + 1}. ${item}`).join("\n"),
    "",
    "Final owner approval line",
    row.approvalLine,
  ].join("\n");
}

function nextApplicationPriority(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  return priorities.find(priority => actionableApplicationStatuses.includes(applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]))) ?? null;
}

export function partnerOutreachQueueRows(
  priorities: readonly PartnerApplicationPriority[],
  applicationStatuses: CommerceApplicationPackInput["applicationStatuses"],
  applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"],
  limit = 3,
): PartnerOutreachQueueRow[] {
  const queueStatusOrder: Record<PartnerApplicationTrackerStatus, number> = {
    ready: 0,
    todo: 1,
    submitted: 2,
    approved: 3,
    paused: 4,
    blocked: 5,
  };
  return priorities
    .map(priority => ({ priority, status: applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) }))
    .filter(({ status }) => actionableApplicationStatuses.includes(status))
    .sort((a, b) => queueStatusOrder[a.status] - queueStatusOrder[b.status] || b.priority.score - a.priority.score)
    .slice(0, limit)
    .map(({ priority, status }) => ({
      programId: priority.program.id,
      programName: priority.program.name,
      network: priority.program.network,
      status,
      statusLabel: partnerApplicationTrackerStatusNames[status],
      subject: `Jeep Build Lab partner application - ${priority.program.name}`,
      action: status === "ready"
        ? "Review the live form, verify private details, then submit only after the final screen is checked."
        : "Prepare the public profile and draft outreach before entering owner-private details in the partner network.",
      reason: priority.reason,
      url: safeCommerceUrl(priority.program.url),
      note: applicationTrackerNote(priority.program.id, applicationStatusNotes),
    }));
}

export function paidLinkLaunchStatus(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  const approved = priorities.filter(priority => applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) === "approved");
  const submitted = priorities.filter(priority => applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) === "submitted");
  const blocked = priorities.filter(priority => applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) === "blocked");
  const locked = priorities.length - approved.length;
  return [
    "Paid-link launch status",
    approved.length
      ? `- Approved programs ready for tracking-link setup: ${approved.length} (${approved.map(priority => partnerProgramLabel(priority.program)).join("; ")}).`
      : "- Approved programs ready for tracking-link setup: 0. Paid links remain locked.",
    submitted.length
      ? `- Submitted applications still waiting on approval or terms: ${submitted.length} (${submitted.map(priority => partnerProgramLabel(priority.program)).join("; ")}).`
      : "- Submitted applications still waiting on approval or terms: 0.",
    blocked.length
      ? `- Blocked applications to resolve before launch: ${blocked.length} (${blocked.map(priority => partnerProgramLabel(priority.program)).join("; ")}).`
      : "- Blocked applications to resolve before launch: 0.",
    `- Unapproved relevant programs still locked: ${locked}.`,
    "- Launch rule: only approved, partner-issued tracking URLs may be labeled affiliate or sponsored; all other links stay source or application references.",
  ].join("\n");
}

export function partnerLaunchEvidenceRows(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]): PartnerLaunchEvidenceRow[] {
  return priorities
    .map(priority => ({ priority, status: applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) }))
    .filter(({ status }) => status === "submitted" || status === "approved")
    .map(({ priority, status }) => ({
      programName: priority.program.name,
      network: priority.program.network,
      status,
      statusLabel: partnerApplicationTrackerStatusNames[status],
      proof: paidLinkLaunchProofFields,
      risk: status === "approved"
        ? "Approved still needs a partner-issued tracking URL, clean-browser test and visible label before paid links go live."
        : "Submitted is not approved; keep links as source or application references until terms and tracking are issued.",
    }));
}

function partnerLaunchEvidenceSection(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"]) {
  const rows = partnerLaunchEvidenceRows(priorities, applicationStatuses);
  return [
    "Partner launch evidence",
    ...(rows.length
      ? rows.flatMap(row => [
        `- ${row.programName}${row.network ? ` via ${row.network}` : ""} - ${row.statusLabel}`,
        `  Risk: ${row.risk}`,
        `  Proof fields: ${row.proof.join("; ")}`,
      ])
    : ["- No submitted or approved partner programs yet."]),
  ].join("\n");
}

function commerceModeReadinessSection() {
  return [
    "Commerce mode readiness",
    ...commerceModeReadinessRows.flatMap(row => [
      `- ${row.mode} - ${row.status}`,
      `  Role: ${row.role}`,
      `  Unlock: ${row.unlock}`,
      `  Not active: ${row.notActive}`,
    ]),
  ].join("\n");
}

function stripeSandboxReadinessSection() {
  return [
    "Stripe sandbox readiness",
    `- Status: ${stripeSandboxReadiness.status}`,
    `- Checked: ${stripeSandboxReadiness.checkedAt}`,
    `- Evidence: ${stripeSandboxReadiness.evidence}`,
    `- Next: ${stripeSandboxReadiness.nextAction}`,
    `- Not active: ${stripeSandboxReadiness.notActive}`,
  ].join("\n");
}

function applicationDataBoundarySection() {
  return [
    "Application data boundary",
    ...applicationDataBoundaryRows.flatMap(row => [
      `- ${row.label} - ${row.status}`,
      `  ${row.detail}`,
    ]),
  ].join("\n");
}

function partnerOutreachQueueSection(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const rows = partnerOutreachQueueRows(priorities, applicationStatuses, applicationStatusNotes, 5);
  return [
    "Gmail-ready outreach queue",
    ...(rows.length
      ? rows.flatMap(row => [
        `- ${row.programName}${row.network ? ` via ${row.network}` : ""} - ${row.statusLabel}`,
        `  Subject: ${row.subject}`,
        `  Action: ${row.action}`,
        `  Match: ${row.reason}`,
        ...(row.note ? [`  Tracker note: ${row.note}`] : []),
        `  Link: ${row.url}`,
      ])
      : ["- No unblocked or unpaused partner application needs outreach right now."]),
    "- Draft only: Jeep Build Lab does not send email, submit forms or enter passwords.",
  ].join("\n");
}

function applicationTrackerSummary(programs: readonly PartnerProgram[], priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const counts = Object.fromEntries(applicationTrackerStatuses.map(status => [status, 0])) as Record<PartnerApplicationTrackerStatus, number>;
  for (const program of programs) counts[applicationTrackerStatusKey(applicationStatuses?.[program.id])] += 1;
  const next = nextApplicationPriority(priorities, applicationStatuses);
  const notes = priorities
    .map(priority => ({ priority, note: applicationTrackerNote(priority.program.id, applicationStatusNotes) }))
    .filter(({ note }) => note.length > 0);
  return [
    "Application tracker summary",
    ...applicationTrackerStatuses.map(status => `- ${partnerApplicationTrackerStatusNames[status]}: ${counts[status]}`),
    next
      ? `- Next application: ${partnerProgramLabel(next.program)} (${applicationTrackerStatusLabel(applicationStatuses?.[next.program.id])})`
      : "- Next application: No unblocked application target is ready; reset a blocked or paused program when it can move again.",
    ...(notes.length ? ["Tracker notes", ...notes.map(({ priority, note }) => `- ${partnerProgramLabel(priority.program)}: ${note}`)] : []),
  ].join("\n");
}

function blockedApplicationFollowupSection(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const blocked = priorities
    .filter(priority => applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) === "blocked")
    .map(priority => ({ priority, note: applicationTrackerNote(priority.program.id, applicationStatusNotes) }));
  if (!blocked.length) return "";
  return [
    "Blocked application follow-up",
    ...blocked.map(({ priority, note }) => `- ${partnerProgramLabel(priority.program)}: ${note || "Resolve the partner-site issue before retrying."}`),
    "- Reset a blocked program only after the password, account, eligibility or partner-site issue is resolved and the application can be reviewed again.",
  ].join("\n");
}

function pausedApplicationFollowupSection(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const paused = priorities
    .filter(priority => applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) === "paused")
    .map(priority => ({ priority, note: applicationTrackerNote(priority.program.id, applicationStatusNotes) }));
  if (!paused.length) return "";
  return [
    "Paused application follow-up",
    ...paused.map(({ priority, note }) => `- ${partnerProgramLabel(priority.program)}: ${note || "Paused by owner; reset when this program is worth pursuing again."}`),
    "- Paused programs are skipped as next-application targets until reset to To apply or Profile ready.",
  ].join("\n");
}

function blockedApplicationTargets({ state, parts, applicationStatuses, applicationStatusNotes }: Pick<CommerceApplicationPackInput, "state" | "parts" | "applicationStatuses" | "applicationStatusNotes">) {
  return partnerApplicationPrioritiesForBuild(state, parts)
    .filter(priority => applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]) === "blocked")
    .map(priority => ({ priority, note: applicationTrackerNote(priority.program.id, applicationStatusNotes) }));
}

function blockedApplicationSupportEmailForPriority(priority: PartnerApplicationPriority, note: string, name: string, state: BuildState) {
  const programLabel = partnerProgramLabel(priority.program);
  return {
    subject: `Partner application support - ${programLabel}`,
    body: [
      `Hi ${priority.program.network ?? priority.program.name} support team,`,
      "",
      `I'm trying to continue the ${programLabel} partner application for Jeep Build Lab, an independent Wrangler JL build planner.`,
      "",
      "Public site: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
      `Application path: ${safeCommerceUrl(priority.program.url)}`,
      `Tracker status: ${partnerApplicationTrackerStatusNames.blocked}`,
      `Tracker note: ${note || "The partner form is blocked before the application can be reviewed."}`,
      `Fit for program: ${priority.reason}`,
      `Build context: ${name.trim() || "Untitled build"} - ${vehicleDescription(state)}`,
      "",
      "Could you confirm the required next step so I can complete the application review without creating duplicate accounts or entering credentials into the wrong flow?",
      "",
      "I can provide account-identifying details inside the partner portal or a secure support channel if needed.",
      "",
      "Thanks,",
      "John",
    ].join("\n"),
  };
}

export function buildBlockedApplicationSupportDraft({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const blocked = blockedApplicationTargets({ state, parts, applicationStatuses, applicationStatusNotes });
  if (!blocked.length) return "No blocked partner applications need a support ticket draft right now.";
  return [
    "Jeep Build Lab blocked partner support ticket drafts",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    blocked.map(({ priority, note }, index) => {
      const draft = blockedApplicationSupportEmailForPriority(priority, note, name, state);
      return [
        `Draft ${index + 1}: ${partnerProgramLabel(priority.program)}`,
        `Subject: ${draft.subject}`,
        "",
        draft.body,
      ].join("\n");
    }).join("\n\n"),
    "",
    "Do not include in an ordinary support email",
    "- Passwords, tax IDs, banking details, payout credentials or tracking IDs.",
    "- Claims that affiliate tracking, dealer pricing, checkout, inventory ownership or dropship fulfillment is already approved.",
  ].join("\n");
}

export function buildBlockedApplicationSupportMailtoUrl(input: CommerceApplicationPackInput) {
  const [first] = blockedApplicationTargets(input);
  if (!first) {
    return `mailto:?subject=${encodeURIComponent("Jeep Build Lab partner support")}&body=${encodeURIComponent("No blocked partner application needs a support ticket draft right now.")}`;
  }
  const draft = blockedApplicationSupportEmailForPriority(first.priority, first.note, input.name, input.state);
  return `mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
}

function affiliateApplicationAnswerLines() {
  return affiliateApplicationAnswers.map(({ field, answer }, index) => `${index + 1}. ${field}: ${answer}`).join("\n");
}

function nextApplicationTargetLines(priorities: readonly PartnerApplicationPriority[], applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const next = nextApplicationPriority(priorities, applicationStatuses);
  if (!next) {
    return ["Next application target", "- No unblocked partner application is next. Reset a blocked or paused program when it can move again."];
  }
  const note = applicationTrackerNote(next.program.id, applicationStatusNotes);
  return [
    "Next application target",
    `- Program: ${partnerProgramLabel(next.program)}`,
    `- Tracker status: ${applicationTrackerStatusLabel(applicationStatuses?.[next.program.id])}`,
    ...(note ? [`- Tracker note: ${note}`] : []),
    `- Relationship: ${relationshipNames[next.program.relationship]}`,
    ...(next.program.network ? [`- Network: ${next.program.network}`] : []),
    `- Application link: ${safeCommerceUrl(next.program.url)}`,
    `- Match reason: ${next.reason}`,
    ...(next.program.requirements?.length ? [`- Requirements: ${next.program.requirements.join(" ")}`] : []),
  ];
}

export function buildPartnerOutreachEmailDraft({ name, state, parts, applicationStatuses }: CommerceApplicationPackInput) {
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  const next = nextApplicationPriority(priorities, applicationStatuses);
  if (!next) {
    return [
      "No outreach draft needed right now.",
      "No unblocked or unpaused partner application is ready to pursue. Reset a paused or blocked program only after it can move again, and keep approved tracking links labeled and tested before publishing.",
    ].join("\n");
  }
  return partnerOutreachEmailDraftForPriority(next, name, state);
}

export function buildPartnerOutreachMailtoUrl(input: CommerceApplicationPackInput) {
  const draft = buildPartnerOutreachEmailDraft(input);
  const lines = draft.split("\n");
  const hasSubject = lines[0]?.startsWith("Subject:");
  const subject = hasSubject ? lines[0].replace(/^Subject:\s*/, "").trim() : "Jeep Build Lab partner outreach";
  const body = hasSubject ? lines.slice(lines[1] === "" ? 2 : 1).join("\n").trim() : draft;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function partnerOutreachEmailDraftForPriority(priority: PartnerApplicationPriority, name: string, state: BuildState) {
  const program = priority.program;
  return [
    `Subject: Jeep Build Lab partner application - ${program.name}`,
    "",
    `Hi ${program.name} team,`,
    "",
    "I'm preparing a partner application for Jeep Build Lab, an independent Wrangler JL build planner that helps owners compare sourced rims, tires, suspension, recovery and armor options before they click out to a retailer or partner program.",
    "",
    "Public site: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
    `Current build context: ${name.trim() || "Untitled build"} - ${vehicleDescription(state)}`,
    `Why this program fits: ${priority.reason}`,
    `Application path: ${safeCommerceUrl(program.url)}`,
    ...(program.network ? [`Partner network: ${program.network}`] : []),
    "",
    "Current commerce posture: links are reference and application links only until a partner approves terms, tracking is tested, and sponsored or affiliate labels are shown near outbound links.",
    "",
    `Details to verify before sending: legal business name, applicant name, phone, mailing address, tax/payment details, traffic estimate, and ${program.requirements?.length ? "these program requirements: " + program.requirements.join(" ") : "any partner-specific requirements."}`,
    "",
    "Thanks,",
    "John",
  ].join("\n");
}

export function buildPartnerOutreachDraftPack({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  const drafts = priorities.filter(priority => actionableApplicationStatuses.includes(applicationTrackerStatusKey(applicationStatuses?.[priority.program.id])));
  const blockedFollowup = blockedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab partner outreach draft pack",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory."}`,
    `Draft count: ${drafts.length} unsubmitted program${drafts.length === 1 ? "" : "s"} out of ${priorities.length} relevant program${priorities.length === 1 ? "" : "s"}.`,
    "",
    partnerOutreachQueueSection(priorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    ...(blockedFollowup ? ["", buildBlockedApplicationSupportDraft({ name, notes: "", state, parts, generatedAt, applicationStatuses, applicationStatusNotes })] : []),
    "",
    drafts.length
      ? drafts.map((priority, index) => [
        `Draft ${index + 1}: ${partnerProgramLabel(priority.program)}`,
        `Tracker status: ${applicationTrackerStatusLabel(applicationStatuses?.[priority.program.id])}`,
        ...(applicationTrackerNote(priority.program.id, applicationStatusNotes) ? [`Tracker note: ${applicationTrackerNote(priority.program.id, applicationStatusNotes)}`] : []),
        `Relationship: ${relationshipNames[priority.program.relationship]}`,
        `Matched categories: ${priority.matchedCategories.join(", ")}`,
        "",
        partnerOutreachEmailDraftForPriority(priority, name, state),
      ].join("\n")).join("\n\n")
      : "No unblocked or unpaused partner application is ready to pursue. Reset a paused or blocked program only after it can move again, and keep approved tracking links labeled and tested before publishing.",
    "",
    "Do not send without verifying",
    "- Replace private applicant, traffic, tax, banking, address and phone fields inside the partner network or email client.",
    "- Do not claim approved affiliate tracking, reseller terms, dealer pricing, wholesale checkout or dropship fulfillment until the partner approves those terms.",
  ].join("\n");
}

export function buildPartnerSubmissionReviewSheet({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  const target = nextApplicationPriority(priorities, applicationStatuses);
  const blockedFollowup = blockedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab partner submission review sheet",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory."}`,
    "",
    "Target application",
    target ? [
      `- Program: ${partnerProgramLabel(target.program)}`,
      `- Tracker status: ${applicationTrackerStatusLabel(applicationStatuses?.[target.program.id])}`,
      ...(applicationTrackerNote(target.program.id, applicationStatusNotes) ? [`- Tracker note: ${applicationTrackerNote(target.program.id, applicationStatusNotes)}`] : []),
      `- Relationship: ${relationshipNames[target.program.relationship]}`,
      `- Application link: ${safeCommerceUrl(target.program.url)}`,
      `- Match reason: ${target.reason}`,
      ...(target.program.requirements?.length ? [`- Program requirements: ${target.program.requirements.join(" ")}`] : []),
    ].join("\n") : "- No relevant partner program found for this build.",
    "",
    applicationTrackerSummary(programs, priorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(priorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Public profile fields ready to reuse after review",
    "- Website URL: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
    "- Website or app description: Jeep Build Lab is an independent Wrangler JL build planner with sourced part comparisons, fitment checks, saved-build exports and shop-ready briefs.",
    "- Audience: Jeep Wrangler JL owners comparing rims, tires, suspension, bumpers, winches and armor before buying.",
    `- Catalog basis: ${parts.length} sourced variants with dated source snapshots; no live-price, inventory or checkout claim.`,
    `- Build focus: ${selected.length ? selectedCategorySummary(selected) : "Full Jeep Build Lab audience."}`,
    "",
    "Owner-private or legal fields to verify on the live form",
    partnerSubmissionPrivateFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationDataBoundarySection(),
    "",
    "Submission review checklist",
    partnerSubmissionReviewChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Future checkout guardrails",
    futureCheckoutReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    stripeSandboxReadinessSection(),
    "",
    commerceModeReadinessSection(),
    "",
    partnerLaunchEvidenceSection(priorities, applicationStatuses),
    "",
    "Before marking Submitted",
    "- Capture the partner network confirmation or application receipt.",
    "- Leave affiliate, sponsored, dealer, wholesale and dropship claims inactive until approval is received.",
    "- Store approved tracking IDs, payout credentials and tax records outside the public app source.",
    "",
    "Suggested owner approval line",
    target
      ? `I approve submitting the visible ${partnerProgramLabel(target.program)} application fields, agreement choices, opt-ins and private account details after reviewing the final form.`
      : "I approve submitting the visible partner application fields, agreement choices, opt-ins and private account details after reviewing the final form.",
    "",
    "Owner notes",
    notes.trim() || "No notes provided.",
  ].join("\n");
}

function buildPartnerSubmissionPacketsForScope(
  { name, notes, state, parts, generatedAt, applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput & { generatedAt: string },
  programs: readonly PartnerProgram[],
  priorities: readonly PartnerApplicationPriority[],
  scope: string,
  countBasis: string,
) {
  const rows = partnerSubmissionPacketRows(priorities, applicationStatuses, applicationStatusNotes);
  const blockedFollowup = blockedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab partner submission packets",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${scope}`,
    `Packet count: ${rows.length} partner application packet${rows.length === 1 ? "" : "s"} out of ${programs.length} ${countBasis}.`,
    "",
    "How to use these packets",
    "1. Open the partner application link for one program.",
    "2. Paste only reviewed public answers that match the form field.",
    "3. Enter private legal, phone, tax, banking, password and payout fields yourself on the live partner or network site.",
    "4. Review every agreement, checkbox, opt-in and final page before you submit.",
    "5. Mark the tracker Submitted only after the partner site confirms receipt.",
    "",
    `Current commerce status: ${noActiveCommerceDisclosure}`,
    `Independence disclosure: ${independenceDisclosure}`,
    "",
    applicationTrackerSummary(programs, priorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerApplicationOperationsSection(priorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Reusable public profile",
    "- Website URL: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
    "- Audience: Jeep Wrangler JL owners comparing rims, tires, suspension, bumpers, winches and armor before buying.",
    "- Promotion methods: build guides, part comparisons, quote sheets, saved-build exports, partner-directory links and social posts.",
    `- Catalog basis: ${parts.length} sourced variants with dated source snapshots; no live-price, inventory or checkout claim.`,
    `- Build focus: ${scope}`,
    "",
    "Submission packets",
    rows.length ? rows.map((row, index) => partnerSubmissionPacketSection(row, index)).join("\n\n---\n\n") : "No partner application packets are in scope for this build.",
    "",
    "Do not submit or paste",
    "- Passwords, tax IDs, banking details, payout credentials, API keys or partner-issued tracking IDs into public app storage.",
    "- Claims that affiliate tracking, dealer pricing, wholesale checkout, inventory ownership or dropship fulfillment is already approved.",
    "- Paid-link labels or commission claims before approval, partner-issued tracking URLs, clean-browser testing and visible disclosure placement.",
    "",
    "Owner notes",
    notes.trim() || "No notes provided.",
  ].join("\n");
}

export function buildPartnerSubmissionPackets({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  return buildPartnerSubmissionPacketsForScope(
    { name, notes, state, parts, generatedAt, applicationStatuses, applicationStatusNotes },
    partnerProgramsForBuild(state, parts),
    partnerApplicationPrioritiesForBuild(state, parts),
    selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory.",
    "relevant program" + (partnerProgramsForBuild(state, parts).length === 1 ? "" : "s"),
  );
}

export function buildAllPartnerSubmissionPackets({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  return buildPartnerSubmissionPacketsForScope(
    { name, notes, state, parts, generatedAt, applicationStatuses, applicationStatusNotes },
    partnerPrograms,
    partnerApplicationPrioritiesForAllPrograms(state, parts),
    `Full partner roster (${partnerPrograms.length} programs)${selected.length ? `; current build context: ${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : ""}`,
    "total partner programs",
  );
}

export function buildAffiliateApplicationAnswers({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  const blockedFollowup = blockedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
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
    `- Independence disclosure: ${independenceDisclosure}`,
    "",
    ...nextApplicationTargetLines(priorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(priorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Next outreach email draft",
    buildPartnerOutreachEmailDraft({ name, notes: "", state, parts, generatedAt, applicationStatuses, applicationStatusNotes }),
    "",
    "Common application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Do not paste without verifying",
    "- Replace traffic, sales, legal business, tax, banking, address and phone fields with current private details inside the partner network.",
    "- Do not claim approved affiliate tracking, live checkout, dealer pricing, inventory ownership or dropship fulfillment until a partner has approved those terms.",
  ].join("\n");
}

function partnerProgramApplicationLine(program: PartnerProgram, applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const note = applicationTrackerNote(program.id, applicationStatusNotes);
  return [
    `- ${program.name} (${relationshipNames[program.relationship]})`,
    `  Status: ${commerceStatusNames[program.status]}`,
    `  Application tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[program.id])}`,
    ...(note ? [`  Tracker note: ${note}`] : []),
    ...(program.network ? [`  Network: ${program.network}`] : []),
    `  Categories: ${programCategories(program)}`,
    `  Application link: ${safeCommerceUrl(program.url)}`,
    `  Prep note: ${program.note}`,
    ...(program.requirements?.length ? [`  Requirements: ${program.requirements.join(" ")}`] : []),
  ].join("\n");
}

function suggestedApplicationLine(priority: PartnerApplicationPriority, index: number, applicationStatuses: CommerceApplicationPackInput["applicationStatuses"], applicationStatusNotes?: CommerceApplicationPackInput["applicationStatusNotes"]) {
  const note = applicationTrackerNote(priority.program.id, applicationStatusNotes);
  return `${index + 1}. ${partnerProgramLabel(priority.program)} - ${priority.reason} Tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[priority.program.id])}.${note ? ` Note: ${note}` : ""}`;
}

export function buildPartnerApplicationLinks({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const priorities = allPriorities.slice(0, 5);
  const blockedFollowup = blockedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab partner application links",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory."}`,
    "",
    commerceDisclosure,
    noActiveCommerceDisclosure,
    independenceDisclosure,
    "",
    "Sponsored-link readiness",
    sponsoredLinkReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerApplicationOperationsSection(allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(allPriorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Submission review checklist",
    partnerSubmissionReviewChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Suggested application order",
    priorities.map((priority, index) => suggestedApplicationLine(priority, index, applicationStatuses, applicationStatusNotes)).join("\n"),
    "",
    programs.map((program, index) => [
      `${index + 1}. ${program.name} - ${relationshipNames[program.relationship]}`,
      ...(program.network ? [`   Network: ${program.network}`] : []),
      `   Categories: ${programCategories(program)}`,
      `   Status: ${commerceStatusNames[program.status]}`,
      `   Application tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[program.id])}`,
      ...(applicationTrackerNote(program.id, applicationStatusNotes) ? [`   Tracker note: ${applicationTrackerNote(program.id, applicationStatusNotes)}`] : []),
      `   Link: ${safeCommerceUrl(program.url)}`,
      `   Note: ${program.note}`,
      ...(program.requirements?.length ? [`   Requirements: ${program.requirements.join(" ")}`] : []),
    ].join("\n")).join("\n"),
  ].join("\n");
}

function trackerNextAction(status: PartnerApplicationTrackerStatus) {
  if (status === "approved") return "Use only approved tested tracking links and keep paid labels visible.";
  if (status === "submitted") return "Watch for approval, terms, tracking-link rules and any requested verification.";
  if (status === "ready") return "Submit the application after private business, tax, traffic and contact fields are verified.";
  if (status === "blocked") return "Resolve password, account, eligibility or partner-site errors before retrying this application.";
  if (status === "paused") return "Resolve the blocker or confirm this program is still worth pursuing.";
  return "Prepare the profile, verify private details and apply through the listed link.";
}

export function buildPartnerApplicationTrackerCsv({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  const operationRows = partnerApplicationOperationRows(priorities, applicationStatuses, applicationStatusNotes);
  const operationByProgram = new Map(operationRows.map(row => [row.programId, row]));
  const rows = [
    ["Jeep Build Lab partner application tracker"],
    ["Build", name.trim() || "Untitled build"],
    ["Generated", new Date(generatedAt).toISOString().slice(0, 10)],
    ["Vehicle", vehicleDescription(state)],
    ["Scope", selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory."],
    ["Commerce status", noActiveCommerceDisclosure],
    ["Independence disclosure", independenceDisclosure],
    [],
    ["Rank", "Program", "Network", "Relationship", "Tracker status", "Tracker note", "Application phase", "Owner gate", "Commerce status", "Matched categories", "Selected part count", "Match reason", "Application link", "Requirements", "Prep note", "Next action"],
    ...priorities.map((priority, index) => {
      const status = applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]);
      const operation = operationByProgram.get(priority.program.id);
      return [
        index + 1,
        priority.program.name,
        priority.program.network ?? "",
        relationshipNames[priority.program.relationship],
        partnerApplicationTrackerStatusNames[status],
        applicationTrackerNote(priority.program.id, applicationStatusNotes),
        operation?.phaseLabel ?? "",
        operation?.note || operation?.ownerGate || "",
        commerceStatusNames[priority.program.status],
        priority.matchedCategories.join("; "),
        priority.selectedPartCount,
        priority.reason,
        safeCommerceUrl(priority.program.url),
        priority.program.requirements?.join(" ") ?? "",
        priority.program.note,
        operation?.nextAction ?? trackerNextAction(status),
      ];
    }),
  ];
  return rows.map(row => row.map(commerceCsvCell).join(",")).join("\r\n");
}

export function buildAllPartnerApplicationSubmissionChecklistCsv({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForAllPrograms(state, parts);
  const operationRows = partnerApplicationOperationRows(priorities, applicationStatuses, applicationStatusNotes);
  const operationByProgram = new Map(operationRows.map(row => [row.programId, row]));
  const scope = `Full partner roster (${partnerPrograms.length} programs)${selected.length ? `; current build context: ${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : ""}`;
  const rows = [
    ["Jeep Build Lab all-partner submission checklist"],
    ["Build", name.trim() || "Untitled build"],
    ["Generated", new Date(generatedAt).toISOString().slice(0, 10)],
    ["Vehicle", vehicleDescription(state)],
    ["Scope", scope],
    ["Commerce status", noActiveCommerceDisclosure],
    ["Public answer count", affiliateApplicationAnswers.length],
    ["Owner-private field count", partnerSubmissionPrivateFields.length],
    ["Submission rule", "Open each partner form, paste only reviewed public answers, complete private fields yourself, and submit only after the final page is checked."],
    [],
    ["Rank", "Program", "Network", "Relationship", "Tracker status", "Tracker note", "Application phase", "Owner gate", "Next safe action", "Matched categories", "Selected part count", "Match reason", "Application link", "Program requirements", "Public answers ready", "Owner-private fields to verify", "Do not claim before approval"],
    ...priorities.map((priority, index) => {
      const status = applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]);
      const operation = operationByProgram.get(priority.program.id);
      return [
        index + 1,
        priority.program.name,
        priority.program.network ?? "",
        relationshipNames[priority.program.relationship],
        partnerApplicationTrackerStatusNames[status],
        applicationTrackerNote(priority.program.id, applicationStatusNotes),
        operation?.phaseLabel ?? "",
        operation?.note || operation?.ownerGate || "",
        operation?.nextAction ?? trackerNextAction(status),
        priority.matchedCategories.join("; "),
        priority.selectedPartCount,
        priority.reason,
        safeCommerceUrl(priority.program.url),
        priority.program.requirements?.join(" ") ?? "",
        affiliateApplicationAnswers.map(item => `${item.field}: ${item.answer}`).join(" | "),
        partnerSubmissionPrivateFields.join(" | "),
        "Approved affiliate tracking, dealer pricing, wholesale checkout, inventory ownership, dropship fulfillment or paid-link revenue.",
      ];
    }),
  ];
  return rows.map(row => row.map(commerceCsvCell).join(",")).join("\r\n");
}

export function buildAllPartnerApplicationWorksheetCsv({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const rows = partnerApplicationSprintRows(partnerApplicationPrioritiesForAllPrograms(state, parts), applicationStatuses, applicationStatusNotes);
  const scope = `Full partner roster (${rows.length} programs)${selected.length ? `; current build context: ${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : ""}`;
  const worksheetRows = rows.flatMap(row => {
    const common = [
      row.rank,
      row.programName,
      row.network ?? "",
      row.relationship,
      row.statusLabel,
      row.note,
      row.phaseLabel,
      row.note || row.ownerGate,
      row.nextAction,
      safeCommerceUrl(row.url),
    ];
    const publicRows = affiliateApplicationAnswers.map(item => [
      ...common,
      "Public answer",
      item.field,
      item.answer,
      "Paste only after confirming the live field matches this answer.",
      "Safe to paste after review",
    ]);
    const privateRows = partnerSubmissionPrivateFields.map(item => [
      ...common,
      "Owner-private field",
      item,
      "Complete on the partner site only.",
      "Do not save tax, banking, password, phone, payout or tracking credentials in Jeep Build Lab.",
      "Owner entry required",
    ]);
    const requirementRows = (row.requirements.length ? row.requirements : ["Review the live partner form, agreement checkboxes and program terms before submitting."]).map(item => [
      ...common,
      "Live requirement",
      "Requirement to verify",
      item,
      "Confirm on the partner site before final submission.",
      "Verify live",
    ]);
    const evidenceRows = applicationReviewEvidenceChecklist.map(item => [
      ...common,
      "Review evidence",
      item.label,
      item.detail,
      "Gather or confirm outside the public app before final submission.",
      "Evidence required",
    ]);
    return [
      ...publicRows,
      ...privateRows,
      ...requirementRows,
      ...evidenceRows,
      [
        ...common,
        "Final approval",
        "Owner approval line",
        row.approvalLine,
        "Use only after reviewing every visible field, agreement choice and opt-in.",
        "Owner approval required",
      ],
      [
        ...common,
        "Paid-link lock",
        "Do not claim before approval",
        "Approved affiliate tracking, dealer pricing, wholesale checkout, inventory ownership, dropship fulfillment or paid-link revenue.",
        "Wait for partner approval, issued tracking URLs, clean-browser testing and visible labels.",
        "Locked",
      ],
    ];
  });
  const output = [
    ["Jeep Build Lab field-by-field partner application worksheet"],
    ["Build", name.trim() || "Untitled build"],
    ["Generated", new Date(generatedAt).toISOString().slice(0, 10)],
    ["Vehicle", vehicleDescription(state)],
    ["Scope", scope],
    ["Commerce status", noActiveCommerceDisclosure],
    ["Worksheet rule", "Use one row at a time while reviewing the live partner form. Public answers may be pasted after review; owner-private fields stay on the partner site."],
    [],
    ["Rank", "Program", "Network", "Relationship", "Tracker status", "Tracker note", "Application phase", "Owner gate", "Next safe action", "Application link", "Worksheet section", "Field or checkpoint", "Answer or instruction", "Owner action", "Paste status"],
    ...worksheetRows,
  ];
  return output.map(row => row.map(commerceCsvCell).join(",")).join("\r\n");
}

export function buildAllPartnerApplicationSprintPlan({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForAllPrograms(state, parts);
  const rows = partnerApplicationSprintRows(priorities, applicationStatuses, applicationStatusNotes);
  const next = rows.find(row => row.status === "ready") ?? rows.find(row => row.status === "todo");
  return [
    "Jeep Build Lab all-partner application sprint",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${rows.length} partner targets${selected.length ? `; current build context: ${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : ""}`,
    `Commerce status: ${noActiveCommerceDisclosure}`,
    "",
    "Sprint rule",
    "Open each listed partner page, paste only reviewed public Jeep Build Lab answers, complete private owner fields yourself, and submit only after the final partner form screen is reviewed.",
    "",
    next ? `Next target: ${next.programName}${next.network ? ` via ${next.network}` : ""} - ${next.actionLabel}` : "Next target: no unblocked target is ready; reset a paused or blocked program when it can move.",
    "",
    "Copy-ready public answers",
    affiliateApplicationAnswerLines(),
    "",
    "Owner-only fields to verify on the partner site",
    partnerSubmissionPrivateFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Review evidence to gather before submitting",
    applicationReviewEvidenceChecklist.map((item, index) => `${index + 1}. ${item.label}: ${item.detail}`).join("\n"),
    "",
    "Application sprint rows",
    ...rows.flatMap(row => [
      `${row.rank}. ${row.programName}${row.network ? ` via ${row.network}` : ""} - ${row.actionLabel}`,
      `   Tracker status: ${row.statusLabel}`,
      ...(row.note ? [`   Tracker note: ${row.note}`] : []),
      `   Phase: ${row.phaseLabel}`,
      `   Relationship: ${row.relationship}`,
      `   Matched categories: ${row.matchedCategories.join(", ")}`,
      `   Application link: ${row.url}`,
      `   Owner gate: ${row.note || row.ownerGate}`,
      `   Next safe action: ${row.nextAction}`,
      `   Owner review: ${row.ownerReview}`,
      `   Program requirements: ${row.requirements.length ? row.requirements.join(" ") : "Review the live form and partner terms before submitting."}`,
      `   Final approval line: ${row.approvalLine}`,
      "",
    ]),
    "Paid-link lock",
    "Do not claim approved affiliate tracking, dealer pricing, wholesale checkout, inventory ownership, dropship fulfillment or paid-link revenue until the relevant partner approves terms and issued links are tested.",
  ].join("\n");
}

export function buildPartnerApplicationSessionRunbook({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const rows = partnerApplicationSprintRows(partnerApplicationPrioritiesForAllPrograms(state, parts), applicationStatuses, applicationStatusNotes);
  const openRows = [...rows.filter(row => row.status === "ready" || row.status === "todo")]
    .sort((a, b) => (a.status === "ready" ? 0 : 1) - (b.status === "ready" ? 0 : 1));
  const sessionRows = openRows.slice(0, 8);
  const submittedOrApprovedRows = rows.filter(row => row.status === "submitted" || row.status === "approved");
  const scope = `${rows.length} partner targets${selected.length ? `; current build context: ${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : ""}`;
  return [
    "Jeep Build Lab partner application session runbook",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${scope}`,
    `Session target count: ${sessionRows.length} active target${sessionRows.length === 1 ? "" : "s"} ready to work now; ${openRows.length} open across the roster.`,
    `Commerce status: ${noActiveCommerceDisclosure}`,
    "",
    "Session rule",
    "Use this during a live application session. Do not submit until the final partner page is reviewed; private fields stay on the partner site.",
    "",
    "Before opening forms",
    "1. Open each partner page from the listed application link and confirm the visible domain, network, terms, opt-ins and application type.",
    "2. Paste public answers only when the live field asks for the same thing; never paste passwords, tax IDs, banking details, payout credentials or partner-issued tracking IDs into Jeep Build Lab.",
    "3. Keep paid links inactive until the partner approves the account, issues tracking URLs, and those links pass clean-browser testing with visible affiliate or sponsored labels.",
    "",
    "Review evidence to gather",
    applicationReviewEvidenceChecklist.map((item, index) => `${index + 1}. ${item.label}: ${item.detail}`).join("\n"),
    "",
    "Owner-only fields to have ready",
    partnerSubmissionPrivateFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Copy-ready public answers",
    affiliateApplicationAnswerLines(),
    "",
    "Session targets",
    sessionRows.length ? sessionRows.flatMap(row => [
      `${row.rank}. ${row.programName}${row.network ? ` via ${row.network}` : ""} - ${row.actionLabel}`,
      `   Tracker status: ${row.statusLabel}${row.note ? ` - ${row.note}` : ""}`,
      `   Application link: ${safeCommerceUrl(row.url)}`,
      `   Owner gate: ${row.note || row.ownerGate}`,
      `   Next safe action: ${row.nextAction}`,
      `   Program requirements: ${row.requirements.length ? row.requirements.join(" ") : "Review the live form and partner terms before submitting."}`,
      `   Paste rule: Use only the reviewed public answers above when the live form field matches.`,
      `   Final owner approval line: ${row.approvalLine}`,
      "",
    ]).join("\n") : "No todo or profile-ready target is open. Reset a paused or blocked program before starting another application session.",
    "",
    "After each submission",
    "1. Mark Submitted only after the partner form confirms submission or a confirmation email arrives.",
    "2. Store confirmation emails, dashboard URLs, partner-issued tracking IDs, terms, payout settings and clean-browser test notes outside public source.",
    "3. For approved programs, add the tracking URL only after labels, disclosure placement and destination testing are verified.",
    "",
    "Submitted or approved programs already in follow-up",
    submittedOrApprovedRows.length ? submittedOrApprovedRows.map(row => `- ${row.programName}${row.network ? ` via ${row.network}` : ""}: ${row.statusLabel}. ${row.ownerReview}`).join("\n") : "- None yet.",
    "",
    "Blocked or paused handling",
    "Use Blocked only when a password, account, eligibility, legal, or partner-site issue prevents final review. Use Paused when the program is not worth pursuing this session. Reset only when the owner is ready to apply.",
  ].join("\n");
}

export function buildAllPartnerPublicAnswerDeck({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const priorities = partnerApplicationPrioritiesForAllPrograms(state, parts);
  const rows = partnerApplicationSprintRows(priorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab public application answer deck",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${rows.length} partner targets${selected.length ? `; current build context: ${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : ""}`,
    `Catalog basis: ${parts.length} sourced variants with dated source snapshots; no live-price, inventory or checkout claim.`,
    `Commerce status: ${noActiveCommerceDisclosure}`,
    `Independence disclosure: ${independenceDisclosure}`,
    "",
    "Safe-to-paste public answers",
    affiliateApplicationAnswerLines(),
    "",
    "Partner roster links",
    ...rows.flatMap(row => [
      `${row.rank}. ${row.programName}${row.network ? ` via ${row.network}` : ""} - ${row.actionLabel}`,
      `   Application link: ${row.url}`,
      `   Tracker status: ${row.statusLabel}${row.note ? ` - ${row.note}` : ""}`,
      `   Relationship: ${row.relationship}`,
      `   Matched categories: ${row.matchedCategories.join(", ")}`,
      `   Owner gate to review: ${row.note || row.ownerGate}`,
      `   What to do next: ${row.nextAction}`,
      `   Requirements to verify live: ${row.requirements.length ? row.requirements.join(" ") : "Review the partner form and terms before submitting."}`,
      "",
    ]),
    "Owner-private fields not in this paste deck",
    partnerSubmissionPrivateFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Submission rule",
    "Open each partner page yourself, review final visible fields and agreements, then submit only after the final screen matches your intent. Keep paid links inactive until each partner approves and issues tested tracking URLs.",
  ].join("\n");
}

export function buildPartnerApplicationTargetPrep(row: PartnerApplicationSprintRow) {
  return [
    "Jeep Build Lab single partner application prep",
    `Program: ${row.programName}${row.network ? ` via ${row.network}` : ""}`,
    `Tracker status: ${row.statusLabel}${row.note ? ` - ${row.note}` : ""}`,
    `Application phase: ${row.phaseLabel}`,
    `Relationship: ${row.relationship}`,
    `Application link: ${safeCommerceUrl(row.url)}`,
    `Matched categories: ${row.matchedCategories.join(", ")}`,
    `Match reason: ${row.reason}`,
    `Owner gate: ${row.note || row.ownerGate}`,
    `Next safe action: ${row.nextAction}`,
    `Owner review: ${row.ownerReview}`,
    "",
    "Safe-to-paste public answers",
    affiliateApplicationAnswerLines(),
    "",
    "Requirements to verify live",
    row.requirements.length ? row.requirements.map((item, index) => `${index + 1}. ${item}`).join("\n") : "Review the partner form and terms before submitting.",
    "",
    "Owner-private fields not in this prep",
    partnerSubmissionPrivateFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Final owner approval line",
    row.approvalLine,
    "",
    "Paid-link lock",
    "Do not claim approved affiliate tracking, dealer pricing, wholesale checkout, inventory ownership, dropship fulfillment or paid-link revenue until this partner approves terms and issued links are tested.",
  ].join("\n");
}

export function buildPartnerApplicationTrackerText({ name, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const priorities = partnerApplicationPrioritiesForBuild(state, parts);
  const blockedFollowup = blockedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(priorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab partner application tracker summary",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    `Scope: ${selected.length ? `${selected.length} selected part${selected.length === 1 ? "" : "s"} (${selectedCategorySummary(selected)})` : "No selected parts; full partner directory."}`,
    `Commerce status: ${noActiveCommerceDisclosure}`,
    `Independence disclosure: ${independenceDisclosure}`,
    "",
    applicationTrackerSummary(programs, priorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerApplicationOperationsSection(priorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(priorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Program status lines",
    ...priorities.map((priority, index) => {
      const status = applicationTrackerStatusKey(applicationStatuses?.[priority.program.id]);
      const note = applicationTrackerNote(priority.program.id, applicationStatusNotes);
      return [
        `${index + 1}. ${partnerProgramLabel(priority.program)} - ${partnerApplicationTrackerStatusNames[status]}`,
        `   Match: ${priority.reason}`,
        ...(note ? [`   Note: ${note}`] : []),
        `   Next: ${trackerNextAction(status)}`,
        `   Link: ${safeCommerceUrl(priority.program.url)}`,
      ].join("\n");
    }),
    "",
    "Reminder: Do not claim approved affiliate tracking, dealer pricing, checkout, inventory ownership or dropship fulfillment until partner terms are approved and tested.",
  ].join("\n");
}

export function buildAffiliateApplicationProfile({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const priorities = allPriorities.slice(0, 5);
  const blockedFollowup = blockedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab affiliate application profile template",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    "Public profile",
    "- Website URL: https://jeep-build-lab.johnprodromidis1.chatgpt.site/",
    `- Independence disclosure: ${independenceDisclosure}`,
    "- Audience: Jeep Wrangler JL owners comparing rims, tires, suspension, bumpers, winches and armor before buying.",
    `- Catalog basis: ${parts.length} sourced variants with dated source snapshots; no live-price, inventory or checkout claim.`,
    `- Build focus: ${selected.length ? selectedCategorySummary(selected) : "No selected build yet; use the full partner directory."}`,
    "- Promotion methods: build guides, part comparisons, quote sheets, source-backed exports and social posts.",
    "- Compliance posture: paid links stay inactive until each program approves the account, issues terms and passes link testing.",
    "",
    "Fields to verify before submitting",
    affiliateApplicationProfileFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Review evidence to gather before submitting",
    applicationReviewEvidenceChecklist.map((item, index) => `${index + 1}. ${item.label}: ${item.detail}`).join("\n"),
    "",
    applicationDataBoundarySection(),
    "",
    "Common application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Application guardrails",
    sponsoredLinkReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerApplicationOperationsSection(allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(allPriorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Submission review checklist",
    partnerSubmissionReviewChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Suggested application order",
    priorities.map((priority, index) => suggestedApplicationLine(priority, index, applicationStatuses, applicationStatusNotes)).join("\n"),
    "",
    "Next outreach email draft",
    buildPartnerOutreachEmailDraft({ name, notes, state, parts, generatedAt, applicationStatuses, applicationStatusNotes }),
    "",
    "Partner focus",
    programs.map(program => [
      `- ${program.name}${program.network ? ` via ${program.network}` : ""}`,
      `  Application tracker: ${applicationTrackerStatusLabel(applicationStatuses?.[program.id])}`,
      ...(applicationTrackerNote(program.id, applicationStatusNotes) ? [`  Tracker note: ${applicationTrackerNote(program.id, applicationStatusNotes)}`] : []),
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

export function buildPaidLinkDisclosurePack({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const blockedFollowup = blockedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
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
    `- ${independenceDisclosure}`,
    "",
    "Build focus",
    `- ${selected.length ? selectedCategorySummary(selected) : "No selected parts; use the full Jeep Build Lab audience."}`,
    "",
    paidLinkLaunchStatus(allPriorities, applicationStatuses),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerApplicationOperationsSection(allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(allPriorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Pre-publish paid-link checks",
    paidLinkLaunchChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Launch proof to verify",
    paidLinkLaunchProofFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    partnerLaunchEvidenceSection(allPriorities, applicationStatuses),
    "",
    "Placement rules",
    "- Put the disclosure before or near the first paid outbound link.",
    "- Label each individual paid link or button as sponsored or affiliate.",
    "- Keep source-price snapshots and checkout claims separate.",
    "- Remove paid labels from links that are still only application or source references.",
    "",
    "Future checkout guardrails",
    futureCheckoutReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    stripeSandboxReadinessSection(),
    "",
    commerceModeReadinessSection(),
    "",
    "Owner notes",
    notes.trim() || "No notes provided.",
  ].join("\n");
}

export function buildCommerceApplicationPack({ name, notes, state, parts, generatedAt = new Date().toISOString(), applicationStatuses, applicationStatusNotes }: CommerceApplicationPackInput) {
  const selected = selectedParts(state, parts);
  const programs = partnerProgramsForBuild(state, parts);
  const allPriorities = partnerApplicationPrioritiesForBuild(state, parts);
  const priorities = allPriorities.slice(0, 5);
  const blockedFollowup = blockedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  const pausedFollowup = pausedApplicationFollowupSection(allPriorities, applicationStatuses, applicationStatusNotes);
  return [
    "Jeep Build Lab partner application pack",
    `Build: ${name.trim() || "Untitled build"}`,
    `Generated: ${new Date(generatedAt).toISOString().slice(0, 10)}`,
    `Vehicle: ${vehicleDescription(state)}`,
    "",
    "Commerce status",
    `- ${commerceDisclosure}`,
    `- ${noActiveCommerceDisclosure}`,
    `- ${independenceDisclosure}`,
    "",
    "Affiliate application profile fields",
    affiliateApplicationProfileFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    applicationDataBoundarySection(),
    "",
    "Common application answers",
    affiliateApplicationAnswerLines(),
    "",
    "Sponsored-link readiness",
    sponsoredLinkReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Future checkout guardrails",
    futureCheckoutReadinessChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    stripeSandboxReadinessSection(),
    "",
    commerceModeReadinessSection(),
    "",
    "Paid-link disclosure snippet",
    paidLinkDisclosureSnippet,
    "",
    "Pre-publish paid-link checks",
    paidLinkLaunchChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Launch proof to verify",
    paidLinkLaunchProofFields.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    partnerLaunchEvidenceSection(allPriorities, applicationStatuses),
    "",
    paidLinkLaunchStatus(allPriorities, applicationStatuses),
    "",
    applicationTrackerSummary(programs, allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerApplicationOperationsSection(allPriorities, applicationStatuses, applicationStatusNotes),
    "",
    partnerOutreachQueueSection(allPriorities, applicationStatuses, applicationStatusNotes),
    ...(blockedFollowup ? ["", blockedFollowup] : []),
    ...(pausedFollowup ? ["", pausedFollowup] : []),
    "",
    "Submission review checklist",
    partnerSubmissionReviewChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Suggested application order",
    priorities.map((priority, index) => suggestedApplicationLine(priority, index, applicationStatuses, applicationStatusNotes)).join("\n"),
    "",
    "Next outreach email draft",
    buildPartnerOutreachEmailDraft({ name, notes, state, parts, generatedAt, applicationStatuses, applicationStatusNotes }),
    "",
    "Selected build source links",
    selected.length ? selected.map(part => selectedPartCommerceLine(part, state)).join("\n") : "- No parts are selected yet. The program directory below is not narrowed to a build.",
    "",
    "Relevant application links",
    programs.map(program => partnerProgramApplicationLine(program, applicationStatuses, applicationStatusNotes)).join("\n"),
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
