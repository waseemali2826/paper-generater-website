export type Frequency = "monthly" | "yearly";

export const PAYMENT_FREQUENCIES: Frequency[] = ["monthly", "yearly"];

export const TIERS = [
  {
    id: "individuals",
    name: "Individuals",
    price: {
      monthly: "Free",
      yearly: "Free",
    },
    description:
      "Personal use for teachers: generate and export test papers quickly.",
    features: [
      "AI-generated questions",
      "Export to printable PDF with templates",
      "Customizable marking schemes",
      "Save & reuse templates",
      "Single teacher account",
    ],
    cta: "Try free",
  },
  {
    id: "teams",
    name: "Teams",
    price: {
      monthly: 899,
      yearly: 749,
    },
    description: "Collaboration for departments and small schools.",
    features: [
      "Shared templates & collaborative editing",
      "Per-teacher accounts & role permissions",
      "Versioned paper history",
      "Export & distribute PDFs to students",
      "Up to 10 seats (expandable)",
    ],
    cta: "Get started",
    popular: true,
  },
  {
    id: "organizations",
    name: "Organizations",
    price: {
      monthly: 1499,
      yearly: 1299,
    },
    description: "Enterprise features for large institutes and districts.",
    features: [
      "Single sign-on (SSO) & centralized billing",
      "Dedicated onboarding & priority support",
      "Unlimited seats and shared library",
      "Advanced analytics & reporting",
      "Custom integrations (LMS/CSV)",
    ],
    cta: "Contact sales",
  },
] as const;

export type Tier = (typeof TIERS)[number];

export const formatPKR = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
