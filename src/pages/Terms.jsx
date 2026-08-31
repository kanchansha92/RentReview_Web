import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { Gavel, AlertCircle, Scale, ShieldAlert } from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';

// Effective date drives both the visible label AND the JSON-LD `lastReviewed`.
// Update this whenever you materially change the terms.
const EFFECTIVE_DATE_ISO = '2026-05-28';
const EFFECTIVE_DATE_DISPLAY = 'May 28, 2026';

const TERMS = [
  {
    title: '1. Acceptance of Terms',
    icon: Scale,
    content:
      'By accessing or using RentReview, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our platform.',
  },
  {
    title: '2. User Conduct',
    icon: Gavel,
    content:
      'Users are responsible for the content they post. Reviews must be honest, based on personal experience, and free from harassment, hate speech, or defamatory language. We reserve the right to remove content at our discretion.',
  },
  {
    title: '3. Service Accuracy',
    icon: AlertCircle,
    content:
      'While we strive for accuracy, reviews reflect personal opinions. RentReview does not guarantee the completeness or reliability of any feedback or property information on the platform.',
  },
  {
    title: '4. Platform Rights',
    icon: ShieldAlert,
    content:
      'We reserve the right to modify or terminate the service for any reason, without notice, at any time. We also reserve the right to refuse service to anyone for any reason.',
  },
];

const Terms = () => {
  useSeo({
    title: 'Terms of Service | RentReview',
    description:
      "Read RentReview's Terms of Service. Understand your rights and responsibilities when using our rental review platform.",
    path: '/terms',
  });

  // ── JSON-LD structured data ─────────────────────────────────────────────
  const pageSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Service',
      url: `${SITE_URL}/terms`,
      description:
        "RentReview's Terms of Service governing user access and conduct on the platform.",
      inLanguage: 'en',
      lastReviewed: EFFECTIVE_DATE_ISO,
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
        { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: `${SITE_URL}/terms` },
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
                <span className="text-slate-700 font-medium">Terms of Service</span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="text-center mb-10 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#41B985]" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#41B985] uppercase">
                Legal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-3 sm:mb-4 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Effective Date:{' '}
              <time dateTime={EFFECTIVE_DATE_ISO} className="font-medium">
                {EFFECTIVE_DATE_DISPLAY}
              </time>
            </p>
          </header>

          {/* Terms article */}
          <article>
            {/* Intro callout */}
            <div className="mb-8 sm:mb-10 lg:mb-12 p-5 sm:p-6 lg:p-8 bg-[#41B985]/10 border border-[#41B985]/20 rounded-2xl text-[#064E3B]">
              <p className="text-sm sm:text-base font-medium leading-relaxed">
                Welcome to RentReview. These Terms of Service ("Terms") govern your access to and use of the
                RentReview website and services. Please read them carefully before using our platform.
              </p>
            </div>

            {/* Terms grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-8">
              {TERMS.map((term, i) => {
                const Icon = term.icon;
                return (
                  <section
                    key={i}
                    aria-labelledby={`term-${i}`}
                    className="p-5 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 hover:border-[#41B985]/40 hover:shadow-lg hover:shadow-[#41B985]/5 transition-all duration-300 bg-white"
                  >
                    <div
                      aria-hidden="true"
                      className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl bg-[#41B985]/10 flex items-center justify-center mb-4 sm:mb-5 lg:mb-6"
                    >
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-[#41B985]" />
                    </div>
                    <h2
                      id={`term-${i}`}
                      className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 mb-3 sm:mb-4"
                    >
                      {term.title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {term.content}
                    </p>
                  </section>
                );
              })}
            </div>

            {/* See also: Privacy Policy */}
            <p className="mt-8 sm:mt-10 lg:mt-12 text-sm text-slate-600 text-center">
              See also:{' '}
              <Link to="/privacy" className="text-[#41B985] font-medium hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Footer disclaimer */}
            <aside
              role="note"
              className="mt-10 sm:mt-12 lg:mt-16 pt-8 sm:pt-10 lg:pt-12 text-center border-t border-slate-100"
            >
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto italic leading-relaxed">
                Disclaimer: These terms are for demonstration purposes as part of the implementation. For a
                real platform, please consult with legal counsel to ensure compliance with local laws and
                regulations.
              </p>
            </aside>
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

export default Terms;
