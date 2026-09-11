

import { createElement, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  motion,
  animate,
  useInView,
  useReducedMotion,
} from 'motion/react'

import {
  EASE,
  VIEWPORT,
  fadeUp,
  staggerContainer,
  pageVariants,
} from './variants'


const motionTag = (as) => (typeof as === 'string' ? motion[as] || motion.div : as)

/**
 * Reveal fade + rise the first time the element scrolls into view.
 *
 *   <Reveal as="section" delay={0.1}>…</Reveal>
 *
 * @param as       DOM tag to render (default "div"). Keep semantics: use
 *                 "section", "li", "h2" rather than wrapping in extra divs.
 * @param variants Any variant pair from ./variants (default fadeUp).
 * @param delay    Seconds to hold before starting for hand-tuned sequences.
 * @param amount   Fraction of the element that must be visible to trigger.
 */
export const Reveal = ({
  as = 'div',
  variants = fadeUp,
  delay = 0,
  amount,
  once = true,
  children,
  ...rest
}) => {
  // Fold the delay into the variant rather than passing `transition`, which a
  // variant's own transition would otherwise win against.
  const withDelay = useMemo(() => {
    if (!delay) return variants
    return {
      ...variants,
      show: {
        ...variants.show,
        transition: { ...(variants.show?.transition || {}), delay },
      },
    }
  }, [variants, delay])

  return createElement(
    motionTag(as),
    {
      initial: 'hidden',
      whileInView: 'show',
      viewport: { ...VIEWPORT, once, ...(amount != null ? { amount } : null) },
      variants: withDelay,
      ...rest,
    },
    children,
  )
}


export const Stagger = ({
  as = 'div',
  stagger = 0.08,
  delayChildren = 0,
  amount,
  once = true,
  children,
  ...rest
}) => {
  const variants = useMemo(
    () => staggerContainer(stagger, delayChildren),
    [stagger, delayChildren],
  )

  return createElement(
    motionTag(as),
    {
      initial: 'hidden',
      whileInView: 'show',
      viewport: { ...VIEWPORT, once, ...(amount != null ? { amount } : null) },
      variants,
      ...rest,
    },
    children,
  )
}

/** A child of <Stagger>. Deliberately has no viewport of its own. */
export const StaggerItem = ({ as = 'div', variants = fadeUp, children, ...rest }) =>
  createElement(motionTag(as), { variants, ...rest }, children)


export const PageTransition = ({ as = 'div', children, ...rest }) =>
  createElement(
    motionTag(as),
    { initial: 'hidden', animate: 'show', exit: 'exit', variants: pageVariants, ...rest },
    children,
  )


const parseStat = (raw) => {
  const str = String(raw)
  const match = str.match(/-?[\d,]*\.?\d+/)
  if (!match) return null

  const numeric = match[0]
  const target = parseFloat(numeric.replace(/,/g, ''))
  if (!Number.isFinite(target)) return null

  const dot = numeric.indexOf('.')
  return {
    prefix: str.slice(0, match.index),
    suffix: str.slice(match.index + numeric.length),
    target,
    decimals: dot === -1 ? 0 : numeric.length - dot - 1,
    grouped: numeric.includes(','),
  }
}


export const CountUp = ({ value, duration = 1.4, ...rest }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const prefersReduced = useReducedMotion()
  const parsed = useMemo(() => parseStat(value), [value])

  // The markup ships the real value so a crawler (or a JS-disabled reader)
  // sees "10,000+", not "0+". Blank it to zero before the browser paints,
  // but only on the client and only when it's actually going to animate.
  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !parsed || prefersReduced) return
    node.textContent = `${parsed.prefix}${parsed.decimals ? (0).toFixed(parsed.decimals) : '0'}${parsed.suffix}`
  }, [parsed, prefersReduced])

  useEffect(() => {
    const node = ref.current
    if (!node || !parsed || prefersReduced || !inView) return

    const format = (n) => {
      const fixed = n.toFixed(parsed.decimals)
      const grouped = parsed.grouped
        ? Number(fixed).toLocaleString('en-IN', {
            minimumFractionDigits: parsed.decimals,
            maximumFractionDigits: parsed.decimals,
          })
        : fixed
      return `${parsed.prefix}${grouped}${parsed.suffix}`
    }

    const controls = animate(0, parsed.target, {
      duration,
      ease: EASE,
      onUpdate: (n) => {
        node.textContent = format(n)
      },
      // Guarantee the exact source string at rest no rounding drift, and
      // no risk of "9,999+" being the number a reader screenshots.
      onComplete: () => {
        node.textContent = String(value)
      },
    })

    return () => controls.stop()
  }, [inView, parsed, duration, prefersReduced, value])

  return (
    <span ref={ref} {...rest}>
      {value}
    </span>
  )
}
