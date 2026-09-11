
/** Signature easing: fast out of the gate, long soft landing (easeOutQuint). */
export const EASE = [0.22, 1, 0.36, 1]

/** Slight overshoot, for elements that should feel "placed" (modals, toasts). */
export const EASE_BACK = [0.34, 1.28, 0.64, 1]

export const DURATION = {
  fast: 0.18,   // hovers, taps, icon swaps
  base: 0.32,   // the default for almost everything
  slow: 0.5,    // hero elements, large section reveals
}


export const VIEWPORT = { once: true, amount: 0.2, margin: '0px 0px -80px 0px' }

// ── Reusable variant objects ──────────────────────────────────────────────

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE } },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE } },
}

export const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
}

export const fadeLeft = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { duration: DURATION.slow, ease: EASE } },
}

export const fadeRight = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: DURATION.slow, ease: EASE } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE } },
}

/** Container that releases its children one after another. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

// ── Page transitions ──────────────────────────────────────────────────────
// Kept deliberately small (8px, opacity) and short. A route change already
// costs the reader their place on the page; a big movement on top of that
// reads as slowness, not polish.
export const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

// ── Overlays ──────────────────────────────────────────────────────────────
export const backdropVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
}

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: EASE_BACK } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16, ease: 'easeIn' } },
}

/** Sheet that slides down from under a sticky header (mobile nav). */
export const sheetVariants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: 'auto',
    transition: { height: { duration: 0.3, ease: EASE }, opacity: { duration: 0.2, delay: 0.05 } },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { height: { duration: 0.22, ease: 'easeIn' }, opacity: { duration: 0.12 } },
  },
}

/** Small popover anchored to a trigger (avatar menu, filter dropdown). */
export const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -6 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.16, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
}

/** Inline validation errors: a nudge, not a full shake. */
export const errorVariants = {
  hidden: { opacity: 0, y: -6, height: 0 },
  show: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.22, ease: EASE } },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

// ── Interaction presets ───────────────────────────────────────────────────
// Spread these onto any motion element: {...hoverLift}
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: DURATION.fast, ease: EASE } },
  whileTap: { y: -1 },
}

export const hoverScale = {
  whileHover: { scale: 1.03, transition: { duration: DURATION.fast, ease: EASE } },
  whileTap: { scale: 0.97 },
}

export const tapScale = {
  whileTap: { scale: 0.97 },
}
