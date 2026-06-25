"use client";

import { useRef } from "react";
import { gsap, useGSAP, EASE, prefersReducedMotion, showWithoutMotion } from "@/lib/gsap";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger children of the container instead of animating it as one block. */
  stagger?: boolean;
  /** Pixels to travel during the entrance. */
  distance?: number;
  /** Animation delay in seconds. */
  delay?: number;
  as?: "div" | "section";
}

/**
 * Fades + slides content up into view as it scrolls into the viewport.
 * Pass `stagger` to animate direct children one-by-one instead of as a block
 * (handy for grids of cards).
 */
export default function RevealOnScroll({
  children,
  className,
  stagger = false,
  distance = 28,
  delay = 0,
  as = "div",
}: RevealOnScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const Tag = as;

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const targets = stagger
        ? Array.from(containerRef.current.children)
        : containerRef.current;

      if (prefersReducedMotion()) {
        showWithoutMotion(targets);
        return;
      }

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: distance },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          delay,
          ease: EASE.smooth,
          stagger: stagger ? 0.09 : 0,
          clearProps: "transform,opacity,visibility",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <Tag ref={containerRef as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
