"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import Container from "@/components/layout/Container";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  PAYMENT_FREQUENCIES,
  TIERS,
  type Tier,
  type Frequency,
  formatPKR,
} from "@/lib/pricing";

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.12)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.12)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:45px_45px] opacity-100" />
);

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),rgba(0,0,0,0))]" />
);

const Tab = ({
  text,
  selected,
  setSelected,
  discount = false,
}: {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
  discount?: boolean;
}) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "group relative w-fit px-4 py-2 text-sm font-semibold capitalize rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors",
        selected
          ? "bg-primary text-white shadow-sm"
          : "text-foreground hover:text-primary hover:bg-primary/10",
        discount && "flex items-center justify-center gap-2.5",
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute inset-0 z-0 rounded-full bg-primary shadow-sm"
        />
      )}
      {discount && (
        <Badge
          className={cn(
            "relative z-10 text-xs whitespace-nowrap ml-2 bg-[#6FA3FF] text-white border border-transparent hover:bg-[#6FA3FF]",
          )}
        >
          Save 30%
        </Badge>
      )}
    </button>
  );
};

function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    const controls = animate(mv, [from, to], {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  const formatted = useMemo(() => formatPKR(display), [display]);
  return (
    <div className="text-4xl font-extrabold text-primary">{formatted}</div>
  );
}

const PricingCard = ({
  tier,
  paymentFrequency,
}: {
  tier: Tier;
  paymentFrequency: keyof Tier["price"];
}) => {
  const price = tier.price[paymentFrequency];
  const isHighlighted = (tier as any).highlighted;
  const isPopular = (tier as any).popular;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-6 overflow-hidden rounded-2xl border px-6 py-6 transition",
        "bg-white text-foreground",
        "border-input hover:border-primary/50",
        "card-yellow-shadow",
        isPopular && "border-2 border-primary/60 shadow-lg",
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <h2 className="flex items-center gap-3 text-xl font-semibold capitalize">
        {tier.name}
        {isPopular && <Badge className="mt-1 px-1 py-0">Most Popular</Badge>}
      </h2>

      <div className="relative h-14">
        {typeof price === "number" ? (
          <>
            <AnimatedPrice value={price as number} />
            <p className="-mt-1 text-xs font-medium text-muted-foreground">
              Per user/month
            </p>
          </>
        ) : (
          <h1 className="text-4xl font-extrabold text-primary">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {tier.description}
        </h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className={cn("flex items-center gap-2 text-sm text-foreground")}
            >
              <BadgeCheck strokeWidth={1} size={16} className="text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button className={cn("h-fit w-full rounded-lg")}>{tier.cta}</Button>
    </div>
  );
};

export default function Pricing() {
  const [selectedPaymentFreq, setSelectedPaymentFreq] = useState<Frequency>(
    PAYMENT_FREQUENCIES[0],
  );

  return (
    <section id="pricing" className="flex flex-col items-center gap-12 py-16">
      <Container className="py-6">
        <div className="space-y-7 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold md:text-5xl text-primary">
              Plans and Pricing
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent pricing in PKR. Choose monthly for flexibility
              or yearly to save 35%. All plans include core monitoring, alerting
              and fast performance out of the box.
            </p>
          </div>
          <div className="mx-auto flex w-fit items-center gap-1 rounded-full bg-white border border-input p-1 shadow-sm">
            {PAYMENT_FREQUENCIES.map((freq) => (
              <Tab
                key={freq}
                text={freq}
                selected={selectedPaymentFreq === freq}
                setSelected={(text) =>
                  setSelectedPaymentFreq(text as Frequency)
                }
                discount={freq === "yearly"}
              />
            ))}
          </div>
        </div>

        <div className="pricing-grid grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 py-8">
          {TIERS.map((tier, i) => (
            <PricingCard
              key={i}
              tier={tier as Tier}
              paymentFrequency={selectedPaymentFreq}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 py-6">
          <div className="rounded-xl border border-input bg-white px-6 py-6 card-yellow-shadow">
            <h3 className="text-lg font-bold text-primary mb-2">
              What’s included
            </h3>
            <p className="text-muted-foreground text-sm">
              AI-powered question generation, customizable templates, PDF
              export, and the ability to set marking schemes and difficulty
              levels. All plans include secure cloud storage and regular
              updates.
            </p>
          </div>
          <div className="rounded-xl border border-input bg-white px-6 py-6 card-yellow-shadow">
            <h3 className="text-lg font-bold text-primary mb-2">
              Fair billing
            </h3>
            <p className="text-muted-foreground text-sm">
              Monthly billing for flexibility; yearly subscriptions include a
              discount for teams and organizations. Per-teacher pricing scales
              naturally as your school grows — no hidden fees.
            </p>
          </div>
          <div className="rounded-xl border border-input bg-white px-6 py-6 card-yellow-shadow">
            <h3 className="text-lg font-bold text-primary mb-2">Support</h3>
            <p className="text-muted-foreground text-sm">
              Standard email support for all users. Teams and Organizations get
              priority onboarding, dedicated account assistance, and SLA-backed
              response times on enterprise plans.
            </p>
          </div>
        </div>

        <div id="faq" className="w-full mt-8">
          <div className="max-w-6xl mx-auto rounded-xl border border-input bg-white px-6 py-8 card-yellow-shadow">
            <h3 className="text-lg font-bold text-primary mb-3">FAQs</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Answers to common questions about plans, billing, and features.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <strong>Can I edit generated papers?</strong> Yes — all
                AI-generated papers are fully editable. Adjust questions, add
                instructions, or change marks before exporting.
              </li>
              <li>
                <strong>Which languages are supported?</strong> PaperGen
                supports English by default; additional language support is
                available and expanding based on demand.
              </li>
              <li>
                <strong>Do you offer refunds?</strong> We offer a 14-day refund
                for annual plans if you are not satisfied. Contact support to
                start a refund request.
              </li>
              <li>
                <strong>How secure is my data?</strong> Your data is stored
                using industry-standard encryption. We do not sell your content.
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
