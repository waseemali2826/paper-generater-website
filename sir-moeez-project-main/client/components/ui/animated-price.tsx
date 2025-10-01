import { useEffect, useRef, useState, useMemo } from "react";
import { useMotionValue, animate } from "framer-motion";
import { formatPKR } from "@/lib/pricing";

export default function AnimatedPrice({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState<number>(value);
  const prev = useRef<number>(value);

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
    <div className={className || "text-4xl font-extrabold text-primary"}>
      {formatted}
    </div>
  );
}
