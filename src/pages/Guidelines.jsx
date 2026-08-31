import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { Shield, ShieldAlert, CheckCircle2, CircleX, Info, Heart } from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';

const DOS = [
  'Share personal, first-hand experiences',
  'Be specific about property conditions and management',
  'Provide constructive feedback',
  'Include both pros and cons where applicable',
  'Keep reviews honest and objective',
];

const DONTS = [
  'Use hate speech, harassment, or threats',
  'Post personal information of landlords or staff',
  'Use profanity or offensive language',
  'Post spam, promotional content, or fake reviews',
  'Discuss legal proceedings without context',
];

const Guidelines = () => {
  useSeo({
    title: 'Community Guidelines | RentReview',
    description:
      "Read RentReview's community guidelines for posting helpful, honest rental reviews. Learn what's encouraged, what's not allowed, and how moderation works.",
    path: '/guidelines',
  });

  // ── JSON-LD structured data ─────────────────────────────────────────────
  const pageSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Community Guidelines',
      url: `${SITE_URL}/guidelines`,
      description:
        "RentReview's community guidelines defining acceptable content, moderation policy, and enforcement actions.",
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        name: 'RentReview',
        url: SITE_URL,
      },
    }),
    []
  );

  const breadcrumbSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Community Guidelines', item: `${SITE_URL}/guidelines` },
      ],
    }),
    []
  );

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
                <span className="text-slate-700 font-medium">Community Guidelines</span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="text-center mb-10 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-5">
              <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#41B985]" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#41B985] uppercase">
                Community
              </span>
            </div>

            <div
              aria-hidden="true"
              className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-[#41B985]/10 mb-5 sm:mb-6"
            >
              <Shield className="text-[#41B985] w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-3 sm:mb-4 tracking-tight">
              Community Guidelines
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
              Our guidelines ensure that RentReview remains a helpful, safe, and trustworthy community for all renters.
            </p>
          </header>

          {/* Guidelines article */}
          <article>
            {/* ── Core Philosophy ─────────────────────────────────────────── */}
            <section
              aria-labelledby="philosophy-heading"
              className="bg-slate-900 text-white p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl mb-10 sm:mb-12 lg:mb-16 relative overflow-hidden"
            >
              <Heart
                aria-hidden="true"
                className="absolute -right-6 -bottom-6 sm:-right-8 sm:-bottom-8 text-white/5 w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52 pointer-events-none"
              />
              <h2
                id="philosophy-heading"
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 relative z-10 flex items-center gap-2 sm:gap-3"
              >
                <Info className="text-[#41B985] w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true" />
                Our Core Philosophy
              </h2>
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed relative z-10">
                We believe in the power of transparency to improve the rental industry. Our platform is built on
                trust, honesty, and mutual respect. We expect all members to contribute in a way that is helpful
                to others while maintaining a standard of decorum.
              </p>
            </section>

            {/* ── Dos and Don'ts ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-12 lg:mb-16">
              {/* Dos */}
              <section
                aria-labelledby="dos-heading"
                className="bg-emerald-50/50 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-emerald-100"
              >
                <h2
                  id="dos-heading"
                  className="text-base sm:text-lg lg:text-xl font-bold text-emerald-900 mb-4 sm:mb-5 lg:mb-6 flex items-center gap-2 sm:gap-3"
                >
                  <CheckCircle2 className="text-emerald-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true" />
                  Community Dos
                </h2>
                <ul className="space-y-3 sm:space-y-4 list-none">
                  {DOS.map((item, index) => (
                    <li key={index} className="flex gap-2.5 sm:gap-3 items-start text-emerald-800">
                      <span
                        aria-hidden="true"
                        className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 sm:mt-2"
                      />
                      <span className="text-sm sm:text-base font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Don'ts */}
              <section
                aria-labelledby="donts-heading"
                className="bg-red-50/50 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-red-100"
              >
                <h2
                  id="donts-heading"
                  className="text-base sm:text-lg lg:text-xl font-bold text-red-900 mb-4 sm:mb-5 lg:mb-6 flex items-center gap-2 sm:gap-3"
                >
                  <CircleX className="text-red-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true" />
                  Community Don'ts
                </h2>
                <ul className="space-y-3 sm:space-y-4 list-none">
                  {DONTS.map((item, index) => (
                    <li key={index} className="flex gap-2.5 sm:gap-3 items-start text-red-800">
                      <span
                        aria-hidden="true"
                        className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 sm:mt-2"
                      />
                      <span className="text-sm sm:text-base font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* ── Moderation Policy ───────────────────────────────────────── */}
            <section
              aria-labelledby="moderation-heading"
              className="p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50"
            >
              <h2
                id="moderation-heading"
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-5 lg:mb-6 flex items-center gap-2 sm:gap-3"
              >
                <ShieldAlert className="text-orange-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true" />
                Moderation Policy
              </h2>
              <div className="text-slate-600 space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  To maintain the integrity of our platform, we use a combination of automated systems and manual
                  review to moderate content. Reviews that violate our guidelines may be removed without notice.
                </p>
                <p>
                  If you encounter a review that you believe violates these guidelines, please use the "Report"
                  button located on the review card. Our moderation team will investigate and take appropriate
                  action.
                </p>
              </div>
            </section>

            {/* ── Enforcement note ────────────────────────────────────────── */}
            <aside
              role="note"
              className="mt-10 sm:mt-12 lg:mt-16 text-center text-slate-500 text-xs sm:text-sm leading-relaxed"
            >
              <p>
                Failure to follow these guidelines may result in content removal, account suspension, or a
                permanent ban from the platform. We reserve the right to interpret and enforce these guidelines
                at our sole discretion.
              </p>
            </aside>

            {/* Related links */}
            <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-slate-600">
              See also:{' '}
              <Link to="/terms" className="text-[#41B985] font-medium hover:underline">
                Terms of Service
              </Link>{' '}
              ·{' '}
              <Link to="/privacy" className="text-[#41B985] font-medium hover:underline">
                Privacy Policy
              </Link>
            </p>
          </article>

          {/* JSON-LD structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
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

export default Guidelines;
