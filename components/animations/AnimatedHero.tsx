"use client";

import { useRef } from "react";
import { gsap, useGSAP, EASE, prefersReducedMotion, showWithoutMotion } from "@/lib/gsap";

export default function AnimatedHero({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const targets = containerRef.current.children;

      if (prefersReducedMotion()) {
        showWithoutMotion(targets);
        return;
      }

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: EASE.smooth,
          stagger: 0.15,
          clearProps: "transform,opacity,visibility",
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6">
      {children}
    </div>
  );
}
