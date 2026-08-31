import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { Lock, Eye, ShieldCheck, Mail } from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';

// Last-updated date drives both the visible label AND the JSON-LD `lastReviewed`.
// Update this whenever you materially change the policy.
const LAST_UPDATED_ISO = '2026-05-28';
const LAST_UPDATED_DISPLAY = 'May 28, 2026';

const SECTIONS = [
  {
    title: 'Information We Collect',
    icon: Eye,
    content:
      'We collect information you provide directly to us, such as when you create an account, write a review, or contact us. This may include your name, email address, property details, and the content of your reviews.',
  },
  {
    title: 'How We Use Your Information',
    icon: ShieldCheck,
    content:
      'We use your information to provide and improve our services, moderate reviews to ensure quality, communicate with you about your account, and personalize your experience on the platform.',
  },
  {
    title: 'Data Security',
    icon: Lock,
    content:
      'We take the security of your data seriously. We use industry-standard encryption and security measures to protect your personal information from unauthorized access, loss, or disclosure.',
  },
  {
    title: 'Contact Us',
    icon: Mail,
    content:
      'If you have any questions or concerns about our Privacy Policy or how we handle your data, please contact us at',
    email: 'privacy@rentreview.in',
  },
];

const Privacy = () => {
  useSeo({
    title: 'Privacy Policy | RentReview',
    description:
      "Read RentReview's privacy policy. Learn how we collect, use, and protect your personal information when you use our rental review platform.",
    path: '/privacy',
  });

  // ── JSON-LD structured data ─────────────────────────────────────────────
  const pageSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      url: `${SITE_URL}/privacy`,
      description:
        "RentReview's privacy policy explaining how we collect, use, and protect user data.",
      inLanguage: 'en',
      lastReviewed: LAST_UPDATED_ISO,
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
        { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${SITE_URL}/privacy` },
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
                <span className="text-slate-700 font-medium">Privacy Policy</span>
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
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Last Updated:{' '}
              <time dateTime={LAST_UPDATED_ISO} className="font-medium">
                {LAST_UPDATED_DISPLAY}
              </time>
            </p>
          </header>

          {/* Policy article */}
          <article>
            {/* Main sections */}
            <div className="space-y-8 sm:space-y-10 lg:space-y-12">
              {SECTIONS.map((section, i) => {
                const Icon = section.icon;
                return (
                  <section
                    key={i}
                    aria-labelledby={`section-${i}`}
                    className="flex gap-4 sm:gap-5 lg:gap-6 items-start group"
                  >
                    <div
                      aria-hidden="true"
                      className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl bg-[#41B985]/10 flex items-center justify-center group-hover:bg-[#41B985]/20 transition-colors"
                    >
                      <Icon className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#41B985]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2
                        id={`section-${i}`}
                        className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-2 sm:mb-3"
                      >
                        {section.title}
                      </h2>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                        {section.content}
                        {section.email && (
                          <>
                            {' '}
                            <a
                              href={`mailto:${section.email}`}
                              className="text-[#41B985] font-medium hover:underline break-all"
                            >
                              {section.email}
                            </a>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Detailed text block */}
            <section
              aria-labelledby="detailed-policy"
              className="mt-12 sm:mt-16 lg:mt-20 p-5 sm:p-6 lg:p-8 rounded-2xl bg-slate-50 border border-slate-100"
            >
              <h2
                id="detailed-policy"
                className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6"
              >
                Detailed Policy Information
              </h2>
              <div className="text-slate-600 space-y-5 sm:space-y-6">
                <p className="text-sm sm:text-base leading-relaxed">
                  At RentReview, we believe in being open and honest about how we collect and use your data.
                  This policy describes our privacy practices in plain language, so you can make informed
                  choices about your data.
                </p>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1.5">Cookies</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    We use cookies and similar technologies to remember your preferences and improve your
                    browsing experience. You can manage your cookie settings through your browser at any time.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1.5">Third-Party Sharing</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    We do not sell your personal information to third parties. We only share data when
                    necessary to provide our services, comply with the law, or protect our rights.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1.5">Your Rights</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    You have the right to access, update, or delete your personal information. If you wish
                    to exercise these rights, please reach out to our support team via the{' '}
                    <Link to="/contact" className="text-[#41B985] font-medium hover:underline">
                      Contact page
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>
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

export default Privacy;
