"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

export default function CountUp({
  value,
  duration = 0.9,
  delay = 0,
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const elRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(0);

  useGSAP(
    () => {
      const el = elRef.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        el.textContent = value.toLocaleString();
        prevValueRef.current = value;
        return;
      }

      const startVal = prevValueRef.current;
      const counter = { val: startVal };
      gsap.to(counter, {
        val: value,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(counter.val).toLocaleString();
        },
      });

      prevValueRef.current = value;
    },
    { dependencies: [value] },
  );

  return (
    <span ref={elRef} className={className}>
      0
    </span>
  );
}
