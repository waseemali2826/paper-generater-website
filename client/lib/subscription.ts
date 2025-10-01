import { auth } from "@/lib/firebase";
import type { Frequency, Tier } from "@/lib/pricing";

export type SubscriptionStatus = "active" | "canceled";

export type Subscription = {
  planId: Tier["id"];
  frequency: Frequency;
  status: SubscriptionStatus;
  currentPeriodEnd: number; // epoch ms
  cancelAtPeriodEnd?: boolean;
  canceledAt?: number | null;
};

const STORAGE_KEY_PREFIX = "papergen:subscription:";

function keyFor(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function getUserKey() {
  const u = auth.currentUser;
  const id = u?.uid || u?.email || "anonymous";
  return keyFor(String(id));
}

export function defaultSubscription(): Subscription {
  const now = Date.now();
  return {
    planId: "individuals",
    frequency: "monthly",
    status: "active",
    currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
    cancelAtPeriodEnd: false,
    canceledAt: null,
  };
}

export function getSubscription(): Subscription {
  try {
    const raw = localStorage.getItem(getUserKey());
    if (!raw) return defaultSubscription();
    const parsed = JSON.parse(raw) as Subscription;
    return parsed;
  } catch {
    return defaultSubscription();
  }
}

function saveSubscription(sub: Subscription) {
  localStorage.setItem(getUserKey(), JSON.stringify(sub));
}

export function setPlan(planId: Tier["id"], frequency: Frequency) {
  const now = Date.now();
  const period = frequency === "monthly" ? 30 : 365; // days
  const sub = getSubscription();
  const updated: Subscription = {
    ...sub,
    planId,
    frequency,
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: now + period * 24 * 60 * 60 * 1000,
  };
  saveSubscription(updated);
  return updated;
}

export function cancelAtEndOfPeriod() {
  const sub = getSubscription();
  const updated: Subscription = {
    ...sub,
    cancelAtPeriodEnd: true,
    status: "active",
    canceledAt: Date.now(),
  };
  saveSubscription(updated);
  return updated;
}

export function resumeSubscription() {
  const sub = getSubscription();
  const updated: Subscription = {
    ...sub,
    cancelAtPeriodEnd: false,
    status: "active",
  };
  saveSubscription(updated);
  return updated;
}

export function isFreePlan(sub: Subscription) {
  return sub.planId === "individuals";
}

export function nextRenewalDate(sub: Subscription) {
  return new Date(sub.currentPeriodEnd);
}
