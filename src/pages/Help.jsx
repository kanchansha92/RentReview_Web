import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  ChevronDown, LifeBuoy, ShieldCheck, User, Home, AlertCircle, Info, MessageSquare,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';

// ── FAQ data ────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    id: 'renter-basics',
    name: 'Renter Basics',
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

const STEPS = [
  {
    number: '01',
    title: 'Pick a topic',
    description: 'Filter the questions below to the area you need help with.',
  },
  {
    number: '02',
    title: 'Open the answer',
    description: 'Tap any question to read the full explanation from our team.',
  },
  {
    number: '03',
    title: 'Ask us directly',
    description: 'Not covered here? Message support and we reply within 24 hours.',
  },
];

// ── FAQ Accordion item ──────────────────────────────────────────────────
// The answer is conditionally rendered (not just visually hidden) so a closed
// question never leaks its answer into the page text, print output, or a
// select-all copy. Crawlers still get every Q&A from the FAQPage JSON-LD below.
const FAQItem = ({ question, answer, panelId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonId = `${panelId}-trigger`;

  return (
    <div
      className={`rounded-2xl border bg-white transition-all duration-300 ${
        isOpen
          ? 'border-[#41B985]/40 shadow-lg shadow-[#41B985]/5'
          : 'border-slate-100 hover:border-[#41B985]/40 hover:shadow-lg hover:shadow-[#41B985]/5'
      }`}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full cursor-pointer items-start justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2 rounded-2xl sm:p-6 lg:px-8"
        >
          <span className="text-base font-bold text-slate-800 sm:text-lg">
            {question}
          </span>
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 sm:h-8 sm:w-8 ${
              isOpen ? 'rotate-180 bg-[#41B985] text-white' : 'bg-[#41B985]/10 text-[#41B985]'
            }`}
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
          </span>
        </button>
      </h3>

      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={buttonId}>
          <p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6 sm:text-base lg:px-8">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const Help = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  useSeo({
    title: 'Help Center | RentReview',
    description:
      'Find answers to common questions about writing rental reviews, ID verification, account settings, and tenant rights on RentReview.',
    path: '/help',
  });

  // ── FAQPage JSON-LD schema (the big SEO win for a help page) ─────────────
  const faqSchema = useMemo(() => {
    const allFaqs = FAQ_CATEGORIES.flatMap((cat) => cat.faqs);
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    };
  }, []);

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

  const visibleCategories =
    activeCategory === 'all'
      ? FAQ_CATEGORIES
      : FAQ_CATEGORIES.filter((cat) => cat.id === activeCategory);

  const totalQuestions = FAQ_CATEGORIES.reduce((n, c) => n + c.faqs.length, 0);

  const chipClass = (isActive) =>
    `inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 sm:px-4 sm:py-2.5 ${
      isActive
        ? 'border-[#41B985] bg-[#41B985] text-white shadow-sm shadow-[#41B985]/20'
        : 'border-slate-200 bg-white text-slate-600 hover:border-[#41B985]/40 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <ReviewNavbar />

      <main className="flex-1 py-10 px-4 sm:py-14 sm:px-6 lg:py-20 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-500 list-none">
              <li>
                <Link to="/" className="hover:text-[#41B985] transition-colors">Home</Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">/</li>
              <li>
                <span className="text-slate-700 font-medium">Help Center</span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="text-center mb-10 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-5">
              <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#41B985]" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#41B985] uppercase">
                Support
              </span>
            </div>

            <div
              aria-hidden="true"
              className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-[#41B985]/10 mb-5 sm:mb-6"
            >
              <LifeBuoy className="text-[#41B985] w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-3 sm:mb-4 tracking-tight">
              Help Center
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
              Answers to the {totalQuestions} questions renters ask us most -about
              writing reviews, ID verification, your account, and your rights as a tenant.
            </p>
          </header>

          <article>
            {/* ── How to use this page ────────────────────────────────────── */}
            <section
              aria-labelledby="start-here-heading"
              className="bg-slate-900 text-white p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl mb-10 sm:mb-12 lg:mb-16 relative overflow-hidden"
            >
              <LifeBuoy
                aria-hidden="true"
                className="absolute -right-6 -bottom-6 sm:-right-8 sm:-bottom-8 text-white/5 w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52 pointer-events-none"
              />

              <h2
                id="start-here-heading"
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-5 sm:mb-6 lg:mb-8 relative z-10 flex items-center gap-2 sm:gap-3"
              >
                <Info className="text-[#41B985] w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true" />
                Start Here
              </h2>

              <ol className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 lg:gap-8 list-none">
                {STEPS.map((step, index) => (
                  <li key={step.number} className="flex sm:flex-col gap-4 sm:gap-0 items-start">
                    <div
                      aria-hidden="true"
                      className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#41B985] text-white flex items-center justify-center font-bold text-sm sm:text-base sm:mb-4"
                    >
                      {step.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-1.5">
                        <span className="sr-only">Step {index + 1}: </span>
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── Category filter ─────────────────────────────────────────── */}
            <section aria-labelledby="faq-heading">
              <h2
                id="faq-heading"
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-4 sm:mb-5 text-center"
              >
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-600 text-center mb-6 sm:mb-8">
                Browse everything, or narrow down to a single topic.
              </p>

              <div
                role="tablist"
                aria-label="Filter questions by topic"
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 lg:mb-12"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                  className={chipClass(activeCategory === 'all')}
                >
                  All Topics
                </button>

                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(cat.id)}
                      className={chipClass(isActive)}
                    >
                      <Icon
                        aria-hidden="true"
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#41B985]'}`}
                      />
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* ── Question groups ──────────────────────────────────────── */}
              <div className="space-y-10 sm:space-y-12 lg:space-y-16">
                {visibleCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <section
                      key={cat.id}
                      id={cat.id}
                      aria-labelledby={`${cat.id}-heading`}
                      className="scroll-mt-24"
                    >
                      {/* Group heading -mirrors the Privacy page section rows */}
                      <div className="flex gap-4 sm:gap-5 items-center mb-4 sm:mb-6">
                        <div
                          aria-hidden="true"
                          className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl bg-[#41B985]/10 flex items-center justify-center"
                        >
                          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-[#41B985]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            id={`${cat.id}-heading`}
                            className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800"
                          >
                            {cat.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500">
                            {cat.faqs.length} question{cat.faqs.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {cat.faqs.map((faq, index) => (
                          <FAQItem
                            key={faq.question}
                            question={faq.question}
                            answer={faq.answer}
                            panelId={`${cat.id}-faq-${index}`}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>

            {/* ── Still need help ─────────────────────────────────────────── */}
            <section
              aria-labelledby="more-help-heading"
              className="mt-12 sm:mt-16 lg:mt-20 p-5 sm:p-6 lg:p-8 bg-[#41B985]/10 border border-[#41B985]/20 rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                <div
                  aria-hidden="true"
                  className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white flex items-center justify-center"
                >
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-[#41B985]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    id="more-help-heading"
                    className="text-lg sm:text-xl font-bold text-[#064E3B] mb-1.5 sm:mb-2"
                  >
                    Didn't find your answer?
                  </h2>
                  <p className="text-sm sm:text-base text-[#064E3B]/80 leading-relaxed">
                    Send our support team a message -we reply within 24 hours,
                    Monday to Friday, 9am to 6pm IST.
                  </p>
                </div>

                <Link
                  to="/contact"
                  className="shrink-0 inline-flex items-center justify-center rounded-lg bg-[#41B985] px-6 py-3 text-sm sm:text-base font-medium text-white transition-colors hover:bg-[#379e73]"
                >
                  Contact Support
                </Link>
              </div>
            </section>

            {/* Related links */}
            <p className="mt-8 sm:mt-10 text-center text-xs sm:text-sm text-slate-600">
              See also:{' '}
              <Link to="/guidelines" className="text-[#41B985] font-medium hover:underline">
                Community Guidelines
              </Link>{' '}
              ·{' '}
              <Link to="/terms" className="text-[#41B985] font-medium hover:underline">
                Terms of Service
              </Link>{' '}
              ·{' '}
              <Link to="/privacy" className="text-[#41B985] font-medium hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Footer note */}
            <aside
              role="note"
              className="mt-10 sm:mt-12 lg:mt-16 pt-8 sm:pt-10 lg:pt-12 text-center border-t border-slate-100"
            >
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
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
