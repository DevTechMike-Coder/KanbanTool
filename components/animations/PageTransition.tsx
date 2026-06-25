"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, EASE, prefersReducedMotion, showWithoutMotion } from "@/lib/gsap";

/**
 * Wraps route content and fades/slides it in whenever the pathname changes.
 * Drop this inside a layout, around `{children}`, to get free page-transition
 * polish without touching every individual page.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (prefersReducedMotion()) {
        showWithoutMotion(containerRef.current);
        return;
      }

      gsap.fromTo(
        containerRef.current,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          ease: EASE.smooth,
          clearProps: "transform,opacity,visibility",
        },
      );
    },
    { dependencies: [pathname] },
  );

  return <div ref={containerRef}>{children}</div>;
}
