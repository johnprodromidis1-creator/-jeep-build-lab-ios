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
