import React, { useState, useMemo, useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  ChevronDown, LifeBuoy, ShieldCheck, User, Home, AlertCircle, MessageSquare,
  Search, X, SearchX, Plus, Minus, ArrowRight, BookOpen,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';
import { Reveal, motion, AnimatePresence, useReducedMotion } from '../animations';

// ── FAQ data ────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    id: 'renter-basics',
    name: 'Renter Basics',
    blurb: 'Writing reviews and what makes a good one.',
    icon: Home,
    faqs: [
      {
        question: 'How do I start writing a review?',
        answer:
          "To write a review, simply click on the 'Write a Review' button in the navigation bar. You'll need to search for the property address first. Once found, you can rate various aspects like property condition, landlord responsiveness, and neighborhood quality.",
      },
      {
        question: 'Is my review really anonymous?',
        answer:
          'Yes. While we require ID verification to prevent fraud, your identity is never shared with landlords or other users. You can choose a display name or remain completely anonymous on your public reviews.',
      },
      {
        question: 'What makes a good property review?',
        answer:
          'A good review is specific, honest, and constructive. Mention both pros and cons, talk about your direct experience with management, and provide details about utility costs or neighborhood noise levels.',
      },
    ],
  },
  {
    id: 'verification',
    name: 'Verification & Safety',
    blurb: 'ID checks, documents and how we store them.',
    icon: ShieldCheck,
    faqs: [
      {
        question: 'Why do I need to verify my ID?',
        answer:
          'ID verification is our primary defense against fake reviews and spam. It ensures that every review comes from a real person who has a genuine connection to the property, maintaining the integrity of our platform.',
      },
      {
        question: 'What documents are accepted for verification?',
        answer:
          "We accept government-issued IDs such as Aadhaar, PAN Card, Driving License, or Passport. Additionally, providing a redacted lease agreement or utility bill significantly speeds up the 'Verified Tenant' badge process.",
      },
      {
        question: 'How do you handle my sensitive data?',
        answer:
          'Data security is our top priority. All uploaded documents are encrypted and stored in secure, restricted-access environments. We never sell your personal data to third parties.',
      },
    ],
  },
  {
    id: 'account',
    name: 'Account & Settings',
    blurb: 'Your profile, preferences and deleting data.',
    icon: User,
    faqs: [
      {
        question: 'How can I update my profile information?',
        answer:
          "You can update your profile details by clicking on your avatar in the navbar and selecting 'Settings'. From there, you can change your display name, email preferences, and notification settings.",
      },
      {
        question: 'Can I delete my account and data?',
        answer:
          "Yes, you can request account deletion from your settings page. This will permanently remove your account information and anonymize any reviews you've written to protect your past privacy.",
      },
    ],
  },
  {
    id: 'legal',
    name: 'Legal & Guidelines',
    blurb: 'Your rights, retaliation and reporting reviews.',
    icon: AlertCircle,
    faqs: [
      {
        question: 'What happens if a landlord threatens me for a review?',
        answer:
          'We take landlord retaliation very seriously. If you feel threatened, please report the incident to us immediately and contact local authorities. Your reviews are protected under consumer free speech laws in most jurisdictions.',
      },
      {
        question: 'How do I report a suspicious review?',
        answer:
          "Every review has a 'Report' flag. If you see content that is offensive, appears fake, or violates our Community Guidelines, please flag it for human moderation.",
      },
    ],
  },
];

// Give every question a stable id once, so open/closed state survives filtering.
const CATEGORIES = FAQ_CATEGORIES.map((cat) => ({
  ...cat,
  faqs: cat.faqs.map((faq, i) => ({ ...faq, id: `${cat.id}-faq-${i}` })),
}));

const ALL_FAQS = CATEGORIES.flatMap((cat) => cat.faqs);

// ── Search helpers ──────────────────────────────────────────────────────
const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps every occurrence of `query` in a <mark>, so a hit is obvious at a glance. */
const Highlight = ({ text, query }) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  const needle = normalize(query);
  return parts.map((part, i) =>
    normalize(part) === needle ? (
      <mark key={i} className="rounded bg-[#41B985]/20 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
};

// ── FAQ accordion item ──────────────────────────────────────────────────
// The answer is conditionally rendered (not just visually hidden) so a closed
// question never leaks its answer into the page text, print output, or a
// select-all copy. Crawlers still get every Q&A from the FAQPage JSON-LD below.
const FAQItem = ({ faq, isOpen, onToggle, query, reduceMotion }) => {
  const panelId = faq.id;
  const buttonId = `${panelId}-trigger`;

  return (
    <div
      className={`group rounded-2xl border bg-white transition-colors duration-200 ${
        isOpen
          ? 'border-[#41B985]/50 shadow-lg shadow-[#41B985]/5'
          : 'border-slate-200/80 hover:border-[#41B985]/40 hover:shadow-md hover:shadow-slate-900/5'
      }`}
    >
      <h4>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2 sm:p-6"
        >
          <span
            className={`text-base font-semibold transition-colors sm:text-[1.0625rem] ${
              isOpen ? 'text-[#0F172A]' : 'text-slate-800 group-hover:text-[#0F172A]'
            }`}
          >
            <Highlight text={faq.question} query={query} />
          </span>
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 sm:h-8 sm:w-8 ${
              isOpen
                ? 'rotate-180 bg-[#41B985] text-white'
                : 'bg-[#41B985]/10 text-[#41B985] group-hover:bg-[#41B985]/20'
            }`}
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
          </span>
        </button>
      </h4>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="mx-5 border-t border-slate-100 pt-4 pb-5 text-sm leading-relaxed text-slate-600 sm:mx-6 sm:pb-6 sm:text-base">
              <Highlight text={faq.answer} query={query} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Help = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState(() => new Set());
  const reduceMotion = useReducedMotion();
  const searchId = useId();
  const resultsRef = useRef(null);

  useSeo({
    title: 'Help Center | RentReview',
    description:
      'Find answers to common questions about writing rental reviews, ID verification, account settings, and tenant rights on RentReview.',
    path: '/help',
  });

  // ── FAQPage JSON-LD schema (the big SEO win for a help page) ─────────────
  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: ALL_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    }),
    []
  );

  const breadcrumbSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Help Center', item: `${SITE_URL}/help` },
      ],
    }),
    []
  );

  const trimmedQuery = query.trim();

  // Filter by topic first, then by the search text (question OR answer body).
  const visibleCategories = useMemo(() => {
    const needle = normalize(trimmedQuery);
    return CATEGORIES
      .filter((cat) => activeCategory === 'all' || cat.id === activeCategory)
      .map((cat) => ({
        ...cat,
        faqs: needle
          ? cat.faqs.filter(
              (f) =>
                normalize(f.question).includes(needle) ||
                normalize(f.answer).includes(needle)
            )
          : cat.faqs,
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [activeCategory, trimmedQuery]);

  const matchCount = visibleCategories.reduce((n, c) => n + c.faqs.length, 0);
  const isFiltered = Boolean(trimmedQuery) || activeCategory !== 'all';

  // A search only helps if you can read the hits open every match automatically.
  useEffect(() => {
    if (!trimmedQuery) return;
    const needle = normalize(trimmedQuery);
    setOpenIds(
      new Set(
        ALL_FAQS.filter(
          (f) =>
            normalize(f.question).includes(needle) ||
            normalize(f.answer).includes(needle)
        ).map((f) => f.id)
      )
    );
  }, [trimmedQuery]);

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visibleIds = visibleCategories.flatMap((c) => c.faqs.map((f) => f.id));
  const allOpen = visibleIds.length > 0 && visibleIds.every((id) => openIds.has(id));
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(visibleIds));

  const clearAll = () => {
    setQuery('');
    setActiveCategory('all');
    setOpenIds(new Set());
  };

  const jumpToCategory = (id) => {
    setActiveCategory(id);
    setQuery('');
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };

  const chipClass = (isActive) =>
    `inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2 sm:px-4 ${
      isActive
        ? 'border-[#41B985] bg-[#41B985] text-white shadow-sm shadow-[#41B985]/25'
        : 'border-slate-200 bg-white text-slate-600 hover:border-[#41B985]/50 hover:bg-[#41B985]/5 hover:text-slate-900'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900">
      <ReviewNavbar />

      <main className="flex-1">
        {/* ── Hero: breadcrumb, title and the search box ───────────────────── */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-[#41B985]/[0.07] via-[#41B985]/[0.02] to-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#41B985]/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-14 lg:px-8 lg:pt-12 lg:pb-16">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
              <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                <li>
                  <Link to="/" className="transition-colors hover:text-[#41B985]">Home</Link>
                </li>
                <li aria-hidden="true" className="text-slate-300">/</li>
                <li><span className="font-medium text-slate-700">Help Center</span></li>
              </ol>
            </nav>

            <Reveal as="header" className="text-center">
              <div
                aria-hidden="true"
                className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#41B985]/20 sm:h-16 sm:w-16"
              >
                <LifeBuoy className="h-7 w-7 text-[#41B985] sm:h-8 sm:w-8" />
              </div>

              <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                How can we help?
              </h1>
              <p className="mx-auto mb-7 max-w-xl text-sm leading-relaxed text-slate-600 sm:mb-8 sm:text-base lg:text-lg">
                Search {ALL_FAQS.length} answers about writing reviews, ID verification,
                your account, and your rights as a tenant.
              </p>

              {/* Search */}
              <div className="mx-auto max-w-xl">
                <label htmlFor={searchId} className="sr-only">
                  Search the help center
                </label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id={searchId}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for an answer…"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-11 text-base text-slate-900 shadow-sm shadow-slate-900/5 transition-all placeholder:text-slate-400 focus:border-[#41B985] focus:outline-none focus:ring-4 focus:ring-[#41B985]/15 sm:py-4"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Live result count, announced to screen readers too. */}
                <p aria-live="polite" className="mt-3 h-5 text-xs text-slate-500 sm:text-sm">
                  {trimmedQuery
                    ? `${matchCount} ${matchCount === 1 ? 'answer matches' : 'answers match'} “${trimmedQuery}”`
                    : ''}
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <article>
            {/* ── Browse by topic ─────────────────────────────────────────── */}
            {!trimmedQuery && (
              <Reveal as="section" aria-labelledby="topics-heading" className="mb-12 sm:mb-16">
                <h2
                  id="topics-heading"
                  className="mb-1.5 flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl"
                >
                  <BookOpen className="h-5 w-5 shrink-0 text-[#41B985]" aria-hidden="true" />
                  Browse by topic
                </h2>
                <p className="mb-5 text-sm text-slate-600 sm:mb-6">
                  Pick the area you need help with, or scroll down for everything.
                </p>

                <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onClick={() => jumpToCategory(cat.id)}
                          className="group flex h-full w-full cursor-pointer items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#41B985]/50 hover:shadow-lg hover:shadow-slate-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2 sm:p-5"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#41B985]/10 text-[#41B985] transition-colors group-hover:bg-[#41B985] group-hover:text-white"
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
                              {cat.name}
                              <ArrowRight
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 text-[#41B985] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                              />
                            </span>
                            <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">
                              {cat.blurb}
                            </span>
                            <span className="mt-2 block text-xs font-medium text-slate-400">
                              {cat.faqs.length} question{cat.faqs.length === 1 ? '' : 's'}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            )}

            {/* ── Questions ───────────────────────────────────────────────── */}
            <section aria-labelledby="faq-heading" ref={resultsRef} className="scroll-mt-24">
              <h2
                id="faq-heading"
                className="mb-4 text-xl font-bold text-slate-900 sm:mb-5 sm:text-2xl lg:text-3xl"
              >
                {trimmedQuery ? 'Search results' : 'Frequently asked questions'}
              </h2>

              {/* Topic chips */}
              <div
                aria-label="Filter questions by topic"
                className="mb-4 flex flex-wrap items-center gap-2 sm:gap-2.5"
              >
                <button
                  type="button"
                  aria-pressed={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                  className={chipClass(activeCategory === 'all')}
                >
                  All topics
                </button>

                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveCategory(cat.id)}
                      className={chipClass(isActive)}
                    >
                      <Icon
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#41B985]'}`}
                      />
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Utility row: expand all / reset */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 sm:mb-8">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Showing <span className="font-semibold text-slate-700">{matchCount}</span> of{' '}
                  {ALL_FAQS.length} answers
                </p>

                <div className="flex items-center gap-4">
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="cursor-pointer text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] sm:text-sm"
                    >
                      Reset filters
                    </button>
                  )}
                  {matchCount > 0 && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#41B985] transition-colors hover:text-[#379e73] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] sm:text-sm"
                    >
                      {allOpen ? (
                        <><Minus className="h-3.5 w-3.5" aria-hidden="true" /> Collapse all</>
                      ) : (
                        <><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Expand all</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Groups */}
              {matchCount > 0 ? (
                <div className="space-y-10 sm:space-y-12">
                  {visibleCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <section
                        key={cat.id}
                        id={cat.id}
                        aria-labelledby={`${cat.id}-heading`}
                        className="scroll-mt-24"
                      >
                        <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
                          <div
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#41B985]/10 sm:h-11 sm:w-11"
                          >
                            <Icon className="h-5 w-5 text-[#41B985]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              id={`${cat.id}-heading`}
                              className="text-lg font-bold text-slate-900 sm:text-xl"
                            >
                              {cat.name}
                            </h3>
                            <p className="text-xs text-slate-500 sm:text-sm">
                              {cat.faqs.length} question{cat.faqs.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {cat.faqs.map((faq) => (
                            <FAQItem
                              key={faq.id}
                              faq={faq}
                              isOpen={openIds.has(faq.id)}
                              onToggle={() => toggle(faq.id)}
                              query={trimmedQuery}
                              reduceMotion={reduceMotion}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                /* ── Empty state ──────────────────────────────────────────── */
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
                  <div
                    aria-hidden="true"
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"
                  >
                    <SearchX className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mb-1.5 text-base font-semibold text-slate-800">
                    No answers matched your search
                  </p>
                  <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-slate-600">
                    Try a different word, browse all topics, or send our support team the
                    question directly.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                    >
                      Show all answers
                    </button>
                    <Link
                      to="/contact"
                      className="rounded-lg bg-[#41B985] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#379e73]"
                    >
                      Ask support
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* ── Still need help ─────────────────────────────────────────── */}
            <Reveal
              as="section"
              aria-labelledby="more-help-heading"
              className="relative mt-14 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white sm:mt-16 sm:rounded-3xl sm:p-8 lg:mt-20 lg:p-10"
            >
              <LifeBuoy
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-white/5 sm:h-52 sm:w-52"
              />

              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#41B985] sm:h-14 sm:w-14"
                >
                  <MessageSquare className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 id="more-help-heading" className="mb-1.5 text-lg font-bold sm:text-xl">
                    Still stuck?
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                    Send our support team a message we reply within 24 hours,
                    Monday to Friday, 9am to 6pm IST.
                  </p>
                </div>

                <Link
                  to="/contact"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#41B985] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#379e73] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:text-base"
                >
                  Contact support
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>

            {/* Related links */}
            <p className="mt-8 text-center text-xs text-slate-600 sm:mt-10 sm:text-sm">
              See also:{' '}
              <Link to="/guidelines" className="font-medium text-[#41B985] hover:underline">
                Community Guidelines
              </Link>{' '}
              ·{' '}
              <Link to="/terms" className="font-medium text-[#41B985] hover:underline">
                Terms of Service
              </Link>{' '}
              ·{' '}
              <Link to="/privacy" className="font-medium text-[#41B985] hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Footer note */}
            <aside
              role="note"
              className="mt-10 border-t border-slate-100 pt-8 text-center sm:mt-12 sm:pt-10 lg:mt-16 lg:pt-12"
            >
              <p className="mx-auto max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                These answers describe how RentReview works today and are updated as the
                platform changes. For anything account-specific, please contact support
                directly rather than posting details in a review.
              </p>
            </aside>
          </article>

          {/* JSON-LD structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
