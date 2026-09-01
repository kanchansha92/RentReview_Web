// ── Animation barrel ──────────────────────────────────────────────────────
// One import path for everything motion-related:
//
//   import { Reveal, Stagger, StaggerItem, motion, fadeUp } from '../animations'
//
// ./variants.js    — durations, easing curves and the shared variant objects.
// ./components.jsx — the wrappers pages actually render.
// motion/react     — re-exported so a component that needs `motion.div` or
//                    `AnimatePresence` directly doesn't have to import from
//                    two places (and so swapping the underlying library later
//                    is a change to this file, not to fifty others).

export * from './variants'
export * from './components'
export { AnimatePresence, motion, useReducedMotion } from 'motion/react'
