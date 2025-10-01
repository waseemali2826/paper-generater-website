import React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import {
  PAYMENT_FREQUENCIES,
  TIERS,
  type Frequency,
  formatPKR,
} from "@/lib/pricing";
import {
  cancelAtEndOfPeriod,
  getSubscription,
  isFreePlan,
  nextRenewalDate,
  resumeSubscription,
  setPlan,
} from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import AnimatedPrice from "@/components/ui/animated-price";

export default function SubscriptionPage() {
  const [sub, setSub] = React.useState(getSubscription());
  const [frequency, setFrequency] = React.useState<Frequency>(sub.frequency);

  const onChangePlan = (planId: (typeof TIERS)[number]["id"]) => {
    const updated = setPlan(planId, frequency);
    setSub(updated);
    toast({
      title: "Subscription updated",
      description: `Plan set to ${planId} (${frequency}).`,
    });
  };

  const onFrequencyChange = (f: Frequency) => {
    setFrequency(f);
    const updated = setPlan(sub.planId, f);
    setSub(updated);
    toast({ title: "Billing updated", description: `Billing set to ${f}.` });
  };

  const onCancel = () => {
    const updated = cancelAtEndOfPeriod();
    setSub(updated);
    toast({
      title: "Cancellation scheduled",
      description: "Your subscription will end at period end.",
    });
  };

  const onResume = () => {
    const updated = resumeSubscription();
    setSub(updated);
    toast({
      title: "Subscription resumed",
      description: "Auto-renew is back on.",
    });
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />

              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold text-muted-foreground">
                  Current plan
                </div>
                <div className="text-lg font-extrabold flex items-center gap-2">
                  <span className="capitalize">{sub.planId}</span>
                  <Badge variant="outline" className="capitalize">
                    {sub.frequency}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Next renewal: {nextRenewalDate(sub).toLocaleDateString()}
                </div>
                {sub.cancelAtPeriodEnd && (
                  <div className="mt-2 text-xs text-destructive">
                    Cancels at end of period
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  {sub.cancelAtPeriodEnd ? (
                    <Button
                      variant="outline"
                      onClick={onResume}
                      className="w-full"
                    >
                      Resume
                    </Button>
                  ) : (
                    !isFreePlan(sub) && (
                      <Button
                        variant="destructive"
                        onClick={onCancel}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="rounded-xl bg-white p-6 border border-input card-yellow-shadow mt-4">
              <h2 className="text-2xl font-bold">Manage Subscription</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a plan and billing period. Changes apply immediately and
                renew at the next cycle.
              </p>

              <div className="mt-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-input bg-white p-1">
                  {PAYMENT_FREQUENCIES.map((f) => (
                    <button
                      key={f}
                      onClick={() => onFrequencyChange(f)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full capitalize ${frequency === f ? "bg-primary text-white" : "hover:bg-primary/10"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pricing-grid grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 py-5">
              {TIERS.map((tier) => {
                const price = tier.price[frequency];
                const isCurrent = sub.planId === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`relative flex flex-col gap-4 overflow-hidden rounded-2xl border px-6 py-6 bg-white card-yellow-shadow ${isCurrent ? "border-primary/60" : "border-input"}`}
                  >
                    <h3 className="text-xl font-semibold">{tier.name}</h3>
                    <div className="h-12">
                      {typeof price === "number" ? (
                        <>
                          <AnimatedPrice
                            value={price}
                            className="text-4xl font-extrabold text-primary"
                          />
                          <p className="-mt-1 text-xs font-medium text-muted-foreground">
                            Per user/month
                          </p>
                        </>
                      ) : (
                        <h4 className="text-3xl font-extrabold text-primary">
                          {price}
                        </h4>
                      )}
                    </div>
                    <ul className="space-y-2 text-sm text-foreground">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current plan
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => onChangePlan(tier.id)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isFreePlan(sub) && (
              <div className="rounded-xl bg-white p-6 border border-input card-yellow-shadow">
                <h3 className="text-lg font-semibold text-primary">
                  Billing details
                </h3>
                <div className="mt-2 text-sm text-muted-foreground">
                  Your subscription renews on{" "}
                  <strong>{nextRenewalDate(sub).toLocaleDateString()}</strong>{" "}
                  via auto-renew. You can cancel anytime; access remains until
                  the period ends.
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
