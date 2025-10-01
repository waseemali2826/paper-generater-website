import React from "react";

type AnimatedNumberProps = {
  value: number;
  format?: (n: number) => string;
  duration?: number; // ms
  className?: string;
};

export default function AnimatedNumber({
  value,
  format,
  duration = 1200,
  className,
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = React.useState<string>(
    format ? format(0) : "0",
  );
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number | null>(null);
  const observedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !observedRef.current) {
          observedRef.current = true;

          const start = performance.now();
          startRef.current = start;
          const from = 0;
          const to = value;

          const step = (t: number) => {
            if (!startRef.current) return;
            const progress = Math.min(1, (t - startRef.current) / duration);
            const current = Math.round(from + (to - from) * progress);
            setDisplay(format ? format(current) : String(current));
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(step);
            }
          };

          rafRef.current = requestAnimationFrame(step);
        }
      });
    };

    const obs = new IntersectionObserver(onIntersect, { threshold: 0.3 });
    obs.observe(el);

    return () => {
      obs.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, format]);

  React.useEffect(() => {
    // If value changes after mount and we've already observed, animate again
    if (!observedRef.current) return;
    const start = performance.now();
    startRef.current = start;
    const from = Number(display.replace(/[^0-9]/g, "")) || 0;
    const to = value;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (t: number) => {
      if (!startRef.current) return;
      const progress = Math.min(1, (t - startRef.current) / duration);
      const current = Math.round(from + (to - from) * progress);
      setDisplay(format ? format(current) : String(current));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span ref={ref} className={className} aria-hidden>
      {display}
    </span>
  );
}
