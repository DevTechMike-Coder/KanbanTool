"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Shared easing curves so animations feel consistent across the app. */
export const EASE = {
  smooth: "power2.out",
  snappy: "power3.out",
  soft: "power1.out",
  bounce: "back.out(1.7)",
} as const;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function showWithoutMotion(targets: gsap.TweenTarget) {
  gsap.set(targets, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    clearProps: "transform,opacity,visibility",
  });
}

export { gsap, useGSAP, ScrollTrigger };
