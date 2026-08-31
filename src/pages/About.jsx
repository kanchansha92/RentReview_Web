import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  Rocket,
  Sparkles,
  Star,
  Heart,
  Eye,
  Users,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import Footer from '../components/Footer';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { SITE_URL, LOGO_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';

// ── Content ──────────────────────────────────────────────────────────────────

const HERO_BADGES = ['Built by Renters', '100% Free Forever', 'Privacy First'];


const VALUES = [
  {
    title: 'Anonymity',
    description:
      'Say what you really think without fear. Your identity belongs to you, and we protect it with strong encryption.',
    icon: Shield,
    iconColor: '#155DFC',
    iconBg: '#DBEAFE',
  },
  {
    title: 'Verification',
    description:
      'Quality over quantity. We verify identity proof to ensure every review is a genuine lived experience.',
    icon: CheckCircle2,
    iconColor: '#41B985',
    iconBg: 'rgba(65, 185, 133, 0.1)',
  },
  {
    title: 'Empowerment',
    description:
      'Knowledge is the ultimate leverage. We give tenants the data they need to negotiate better leases.',
    icon: Rocket,
    iconColor: '#9810FA',
    iconBg: '#F3E8FF',
  },
  {
    title: 'Community',
    description:
      'Every review is a renter helping a stranger. Together we make the market fairer, one honest story at a time.',
    icon: Heart,
    iconColor: '#F54900',
    iconBg: '#FFEDD4',
  },
];

const DIFFERENTIATORS = [
  {
    title: 'Radical transparency',
    description:
      'Landlords have always known everything about tenants. We flip the script -real histories of real homes, out in the open.',
    icon: Eye,
  },
  {
    title: 'Verified, never fabricated',
    description:
      'Identity-proof verification keeps fake praise and revenge reviews out, so what you read is what actually happened.',
    icon: ShieldCheck,
  },
  {
    title: 'For renters, not listings',
    description:
      "We don't sell placements or promote properties. No ads from landlords, no sponsored rankings -just honest experiences.",
    icon: Users,
  },
  {
    title: 'The full picture',
    description:
      'Maintenance, deposits, landlord responsiveness, neighborhood safety -the details that never make it into a listing.',
    icon: MessageSquare,
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

const About = () => {
  useSeo({
    title: 'About RentReview -Verified Rental Reviews from Real Tenants',
    description:
      "Learn about RentReview's mission to bring radical transparency to the rental market. Built by renters, for renters -read verified reviews to make informed housing decisions.",
    path: '/about',
  });

  const orgSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'RentReview',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
      description:
        'Verified rental reviews from real tenants. RentReview helps renters make informed decisions through transparent, anonymous feedback about properties and landlords.',
      foundingDate: '2026',
      areaServed: { '@type': 'Country', name: 'India' },
      sameAs: [],
    }),
    []
  );

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#3EB489]/20 selection:text-[#3EB489]">
      <ReviewNavbar />
      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="about-hero-heading"
          className="relative overflow-hidden bg-[#F0FDF4]/50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
        >
          {/* Decorative background blobs -same treatment as the homepage hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <div className="absolute left-[-10%] top-[-10%] h-[300px] w-[300px] rounded-full bg-[#3EB489]/5 blur-[80px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />
            <div className="absolute bottom-[10%] right-[5%] h-[250px] w-[250px] rounded-full bg-blue-50/50 blur-[70px] sm:h-[400px] sm:w-[400px] sm:blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-4 py-1.5 text-xs font-bold text-[#166534] ring-1 ring-inset ring-[#BBF7D0] sm:text-[13px]">
              <Sparkles className="h-3.5 w-3.5 text-[#3EB489]" aria-hidden="true" />
              Built by Renters, for Renters
            </div>

            <h1
              id="about-hero-heading"
              className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Renting deserves{' '}
              <br className="hidden sm:block" />
              <span className="text-[#3EB489]">honesty.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#475569] sm:mt-6 sm:text-lg lg:text-xl">
              We're not just a review site. We're a community leveling the playing
              field for tenants everywhere -one verified review at a time.
            </p>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:mt-10 sm:gap-x-8">
              {HERO_BADGES.map((text) => (
                <li
                  key={text}
                  className="flex items-center gap-2 text-sm font-bold text-[#475569] sm:text-[15px]"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534]"
                    aria-hidden="true"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Our Story ─────────────────────────────────────────────────── */}
        <section
          id="our-story"
          aria-labelledby="our-story-heading"
          className="scroll-mt-20 bg-white py-14 sm:py-16 md:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Image card -framed like the homepage hero image */}
              <div className="relative order-2 lg:order-1">
                <div className="group relative overflow-hidden rounded-[24px] border-[8px] border-white bg-white shadow-2xl shadow-emerald-900/10 sm:rounded-[32px] sm:border-[10px] lg:rounded-[40px] lg:border-[12px]">
                  <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                    alt="A bright modern apartment interior representing the rental properties RentReview helps tenants evaluate"
                    width="1000"
                    height="600"
                    loading="lazy"
                    className="h-[260px] w-full object-cover transition-transform duration-1000 group-hover:scale-110 sm:h-[380px] lg:h-[480px]"
                  />
                  <figure className="absolute bottom-3 left-3 right-3 rounded-2xl border border-slate-50 bg-white/95 p-3 shadow-2xl backdrop-blur-md sm:bottom-5 sm:left-6 sm:right-auto sm:rounded-3xl sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#3EB489] sm:h-12 sm:w-12"
                        aria-hidden="true"
                      >
                        <Star className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-black tracking-tight text-[#0F172A] sm:text-xl">
                          Est. 2024
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#166534] sm:text-xs">
                          Bangalore HQ
                        </div>
                      </div>
                    </div>
                  </figure>
                </div>
              </div>

              {/* Text content */}
              <div className="order-1 space-y-6 sm:space-y-8 lg:order-2">
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2">
                    <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#3EB489]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#3EB489] sm:text-xs">
                      Our Story
                    </span>
                  </div>
                  <h2
                    id="our-story-heading"
                    className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-4xl"
                  >
                    Built by renters who{' '}
                    <span className="text-[#3EB489]">had enough.</span>
                  </h2>
                  <p className="text-base leading-relaxed text-[#4A5565] sm:text-lg">
                    RentReview started in a cramped, overpriced apartment. After
                    discovering years of hidden issues our landlord never mentioned,
                    we realized the market was fundamentally broken.
                  </p>
                  <p className="text-base leading-relaxed text-[#4A5565] sm:text-lg">
                    Information was one-sided. Landlords knew everything about
                    tenants, but tenants knew nothing about their future homes. So
                    we decided to flip the script -a platform where honest, verified
                    experiences are shared openly, and every renter walks into a
                    lease knowing exactly what they're signing up for.
                  </p>
                </div>

                {/* Mini stat chips */}
                <ul className="flex flex-wrap gap-3 sm:gap-4">
                  <li className="min-w-[150px] flex-1 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 shadow-sm sm:px-6 sm:py-5">
                    <div className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
                      100%
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B] sm:text-xs">
                      Free for Tenants
                    </div>
                  </li>
                  <li className="min-w-[150px] flex-1 rounded-2xl border border-[#BBF7D0] bg-[#DCFCE7] px-5 py-4 shadow-sm sm:px-6 sm:py-5">
                    <div className="text-2xl font-bold tracking-tight text-[#166534] sm:text-3xl">
                      Verified
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#166534]/60 sm:text-xs">
                      Identity Proof
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats band -matches the homepage's green StatsSection ────── */}
       

        {/* ── Core Values ───────────────────────────────────────────────── */}
        <section
          aria-labelledby="values-heading"
          className="bg-[#F9FAFB] py-12 sm:py-14 md:py-16 lg:py-20 xl:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-12 sm:space-y-4 lg:mb-16">
              <h2
                id="values-heading"
                className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-4xl"
              >
                What We Stand For
              </h2>
              <p className="text-base text-[#4A5565] sm:text-lg md:text-xl">
                The principles behind every review, every feature, and every decision we make
              </p>
            </header>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 xl:gap-8">
              {VALUES.map((value) => {
                const Icon = value.icon;
                return (
                  <li
                    key={value.title}
                    className="flex flex-col space-y-4 rounded-[14px] bg-white p-5 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.08),0px_4px_6px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_15px_25px_-3px_rgba(0,0,0,0.12),0px_6px_10px_-4px_rgba(0,0,0,0.1)] sm:space-y-5 sm:p-6 lg:p-7"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] sm:h-14 sm:w-14 sm:rounded-[14px]"
                      style={{ backgroundColor: value.iconBg }}
                      aria-hidden="true"
                    >
                      <Icon
                        className="h-6 w-6 sm:h-7 sm:w-7"
                        style={{ color: value.iconColor }}
                        strokeWidth={2.3}
                      />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-lg font-semibold text-[#101828] sm:text-xl">
                        {value.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#4A5565] sm:text-[15px]">
                        {value.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── How We're Different ───────────────────────────────────────── */}
        <section
          aria-labelledby="different-heading"
          className="bg-white py-12 sm:py-14 md:py-16 lg:py-20 xl:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-12 sm:space-y-4 lg:mb-16">
              <h2
                id="different-heading"
                className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-4xl"
              >
                How We're Different
              </h2>
              <p className="text-base text-[#4A5565] sm:text-lg md:text-xl">
                Most rental platforms work for landlords. This one works for you.
              </p>
            </header>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
              {DIFFERENTIATORS.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-5 transition-colors hover:border-[#BBF7D0] hover:bg-[#F0FDF4] sm:gap-5 sm:p-6 lg:p-7"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#3EB489] sm:h-12 sm:w-12"
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.3} />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <h3 className="text-lg font-semibold text-[#101828] sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#4A5565] sm:text-[15px]">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

     
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgSchema) }}
        />
      </main>
      <Footer />
    </div>
  );
};

export default About;
