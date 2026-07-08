import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

// Price IDs — create these in Stripe dashboard, then set as env vars
export const PLANS = {
  family_monthly: {
    priceId: process.env.STRIPE_FAMILY_PRICE_ID!,
    name: "CareTrack Family",
    amount: 2900, // $29/month
    description: "Family transparency portal, AI care plans, caregiver notes",
  },
  caregiver_monthly: {
    priceId: process.env.STRIPE_CAREGIVER_PRICE_ID!,
    name: "CareTrack Caregiver Pro",
    amount: 1500, // $15/month
    description: "Marketplace listing, verified profile badge, priority placement",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
