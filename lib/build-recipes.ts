import { initialState, type BuildState, type Category } from "./model";

export type BuildRecipe = {
  id: string;
  label: string;
  name: string;
  title: string;
  body: string;
  focus: Category;
  notes: string;
  state: BuildState;
};

export const buildRecipes: BuildRecipe[] = [
  {
    id: "budget-refresh",
    label: "VALUE REFRESH",
    name: "Low-cost visual refresh",
    title: "Load a low-cost visual refresh",
    body: "Black 17-inch RockTrix rims, stock-friendly Ridge Grapplers and simple step-cover planning.",
    focus: "wheels",
    notes: "Starter plan for a budget visual refresh that keeps sizing close to stock. Confirm wheel load rating, lug hardware, step-cover fit and whether your current side steps are compatible before buying.",
    state: {
      ...initialState,
      year: 2021,
      trim: "Sport",
      powertrain: "gas",
      stockRim: 17,
      stockTire: 32,
      stages: { wheels: "now", tires: "later", armor: "later" },
      picks: {
        wheels: "rocktrix-rt117-matte-black",
        tires: "nitto-217100",
        armor: "quadratec-diver-down-side-step-covers",
      },
    },
  },
  {
    id: "daily-trail",
    label: "RIMS FIRST",
    name: "Daily trail starter",
    title: "Load a daily trail rim-and-tire plan",
    body: "17-inch bronze Method rims, 33-inch all-terrain tires and a modest 2-inch spacer lift.",
    focus: "wheels",
    notes: "Starter plan for a mild daily-driver trail build. Use it as a checked starting point, then confirm rim width, offset, tire load rating, spare capacity and final clearance with a Jeep-capable shop.",
    state: {
      ...initialState,
      year: 2021,
      trim: "Sport",
      powertrain: "gas",
      stockRim: 17,
      stockTire: 32,
      stages: { wheels: "now", tires: "now", lift: "later" },
      picks: {
        wheels: "method-MR70178550900",
        tires: "nitto-217180",
        lift: "aev-spacer",
      },
    },
  },
  {
    id: "recovery-ready",
    label: "RECOVERY",
    name: "Recovery-ready trail build",
    title: "Load a recovery-ready trail plan",
    body: "17-inch black Method rims, 35-inch tires, 2.5-inch lift, winch bumper, 10k synthetic winch and side armor.",
    focus: "bumpers",
    notes: "Starter plan for a recovery-focused gas JL build. It includes bumper, winch and side armor planning items, but still needs installer confirmation for wiring, fog-light brackets, installed weight and recovery-rating details.",
    state: {
      ...initialState,
      year: 2021,
      trim: "Sahara",
      powertrain: "gas",
      stockRim: 18,
      stockTire: 32,
      stages: {
        wheels: "now",
        tires: "now",
        lift: "now",
        bumpers: "later",
        winches: "later",
        armor: "later",
      },
      picks: {
        wheels: "method-MR70178550500",
        tires: "nitto-217020",
        lift: "lift-16400-0073",
        bumpers: "qrc-12057-0140",
        winches: "warn-evo",
        armor: "qrc-armor",
      },
    },
  },
  {
    id: "beach-weekend-4xe",
    label: "BEACH 4XE",
    name: "Beach weekend 4xe",
    title: "Load a beach-weekend 4xe plan",
    body: "Stock 20-inch rim path with 4xe-ready Ridge Grapplers, Mopar lift and practical side steps.",
    focus: "tires",
    notes: "Starter plan for a 2024 Sahara 4xe weekend build that preserves the stock 20-inch rim path. Confirm sand-pressure guidance, lift installation, step wiring or drilling needs and final clearance with the seller or installer.",
    state: {
      ...initialState,
      year: 2024,
      trim: "Sahara",
      powertrain: "4xe",
      stockRim: 20,
      stockTire: 32,
      stages: { tires: "now", lift: "later", armor: "later" },
      picks: {
        tires: "nitto-217330-4xe",
        lift: "mopar-77072522ae-4xe",
        armor: "go-rhino-rb20-running-boards",
      },
    },
  },
  {
    id: "overland-weekend",
    label: "OVERLAND",
    name: "Overland weekend recovery",
    title: "Load an overland weekend plan",
    body: "Rubicon-friendly 34-inch tires, bronze rims, spacer lift, full bumper, winch and rock sliders.",
    focus: "armor",
    notes: "Starter plan for a weekend overland/recovery build. It keeps hard fitment checks clean, but needs installer review for loaded weight, winch wiring, recovery points, spare-carrier load and trail clearance.",
    state: {
      ...initialState,
      year: 2021,
      trim: "Rubicon",
      powertrain: "gas",
      stockRim: 17,
      stockTire: 33,
      stages: {
        wheels: "now",
        tires: "now",
        lift: "later",
        bumpers: "later",
        winches: "later",
        armor: "later",
      },
      picks: {
        wheels: "method-MR70179050912N",
        tires: "nitto-217530",
        lift: "aev-spacer",
        bumpers: "arb-bondi-deluxe-front-bumper",
        winches: "warn-zeon-10s-synthetic",
        armor: "body-armor-pro-series-rock-sliders",
      },
    },
  },
  {
    id: "sahara-4xe",
    label: "4XE SAMPLE",
    name: "2024 Sahara 4xe starter",
    title: "Load a 2024 Sahara 4xe sample",
    body: "Mopar 2-inch 4xe lift, 33-inch Ridge Grappler tires and stock 20-inch rims.",
    focus: "tires",
    notes: "Sample plan using the sourced Mopar 2-inch 4xe lift and a 33-inch Ridge Grappler for stock 20-inch rims. Confirm the complete combination before buying.",
    state: {
      ...initialState,
      year: 2024,
      trim: "Sahara",
      powertrain: "4xe",
      stockRim: 20,
      stockTire: 32,
      stages: { tires: "now", lift: "later" },
      picks: {
        tires: "nitto-217310-4xe",
        lift: "mopar-77072522ae-4xe",
      },
    },
  },
];
