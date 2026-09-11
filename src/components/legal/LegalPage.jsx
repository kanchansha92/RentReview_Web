
import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Info, AlertTriangle, Check } from 'lucide-react';
import ReviewNavbar from '../ReviewNavbar';
import Footer from '../Footer';
import useSeo from '../../hooks/useSeo';
import { SITE_URL } from '../../config/site';
import { serializeJsonLd } from '../../utils/jsonLd';
import { LAST_UPDATED_ISO, LAST_UPDATED_DISPLAY } from '../../config/legal';

// ── A section ────────────────────────────────────────────────────────────────

export const Section = ({ id, title, children }) => (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28 group">
        <h2
            id={`${id}-h`}
            className="relative text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4"
        >
            <span
                aria-hidden="true"
                className="absolute -left-5 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-full bg-[#41B985]/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:block"
            />
            {title}
            <a
                href={`#${id}`}
                aria-label={`Link to ${title}`}
                className="ml-2 align-middle text-base font-normal text-slate-300 opacity-0 transition-opacity duration-200 hover:text-[#41B985] focus:opacity-100 group-hover:opacity-100"
            >
                #
            </a>
        </h2>
        <div className="space-y-4 text-[15px] sm:text-base leading-7 sm:leading-8 text-slate-700 [&_a]:text-[#2f8a62] [&_a]:underline [&_a]:decoration-[#41B985]/40 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-[#41B985] hover:[&_a]:decoration-[#41B985] [&_strong]:text-slate-900 [&_strong]:font-semibold">
            {children}
        </div>
    </section>
);

// ── A short list ─────────────────────────────────────────────────────────────
export const List = ({ items }) => (
    <ul className="space-y-3 list-none">
        {items.map((item, i) => (
            <li key={i} className="flex gap-3">
                <span
                    aria-hidden="true"
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#41B985]/12 text-[#2f8a62]"
                >
                    <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">{item}</span>
            </li>
        ))}
    </ul>
);

// ── A two-column fact list ───────────────────────────────────────────────────
// Two columns fit a phone without scrolling sideways, and almost everything
// these pages need to say is a pair: this thing → for this long, this data →
// to these people. Wrapped in a card so a run of them reads as a table without
// behaving like one.
export const Facts = ({ rows }) => (
    <dl className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {rows.map(([term, detail], i) => (
            <div
                key={i}
                className={`grid gap-1 px-4 py-3.5 sm:grid-cols-[11.5rem_1fr] sm:gap-6 sm:px-5 ${
                    i % 2 ? 'bg-slate-50/60' : 'bg-white'
                }`}
            >
                <dt className="font-semibold text-slate-900 text-[15px]">{term}</dt>
                <dd className="text-[15px] leading-7 text-slate-600">{detail}</dd>
            </div>
        ))}
    </dl>
);

// ── A note ───────────────────────────────────────────────────────────────────
// One box style, two tones, used sparingly. `tone="warn"` only for something a
// reader would be worse off not noticing.
export const Note = ({ tone = 'plain', children }) => {
    const warn = tone === 'warn';
    const Icon = warn ? AlertTriangle : Info;
    return (
        <div
            className={`flex gap-3.5 rounded-2xl border p-4 text-[15px] leading-7 sm:p-5 ${
                warn
                    ? 'border-amber-200/80 bg-amber-50/70 text-amber-950'
                    : 'border-slate-200/80 bg-slate-50/80 text-slate-700'
            }`}
        >
            <Icon
                aria-hidden="true"
                className={`mt-1 h-[18px] w-[18px] shrink-0 ${warn ? 'text-amber-600' : 'text-[#2f8a62]'}`}
            />
            <div className="min-w-0 flex-1 space-y-2">{children}</div>
        </div>
    );
};

// ── Contents rail ────────────────────────────────────────────────────────────
// Highlights the section you are currently reading. Purely an affordance the
// links work identically with JavaScript disabled.
const useActiveSection = (sections) => {
    const [active, setActive] = useState(sections[0]?.id ?? null);

    useEffect(() => {
        if (!sections.length || typeof IntersectionObserver === 'undefined') return;

        const seen = new Map();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => seen.set(e.target.id, e));
                const visible = [...seen.values()]
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length) setActive(visible[0].target.id);
            },
            { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
        );

        sections.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [sections]);

    return active;
};

const Contents = ({ sections, active, className = '' }) => (
    <nav aria-label="On this page" className={className}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            On this page
        </p>
        <ul className="space-y-0.5 list-none border-l border-slate-200">
            {sections.map((s) => {
                const isActive = s.id === active;
                return (
                    <li key={s.id}>
                        <a
                            href={`#${s.id}`}
                            aria-current={isActive ? 'true' : undefined}
                            className={`-ml-px block border-l-2 py-1.5 pl-4 text-[14.5px] transition-colors duration-150 ${
                                isActive
                                    ? 'border-[#41B985] font-medium text-slate-900'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                            }`}
                        >
                            {s.title}
                        </a>
                    </li>
                );
            })}
        </ul>
    </nav>
);

// ── Page shell ───────────────────────────────────────────────────────────────
const LegalPage = ({
    title,
    intro,
    seoTitle,
    seoDescription,
    path,
    eyebrow = 'Legal',   // the small label above the title
    sections = [],   // [{ id, title }] the contents list
    children,
}) => {
    useSeo({ title: seoTitle || `${title} | RentReview`, description: seoDescription, path });

    const active = useActiveSection(sections);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 800);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const pageSchema = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            url: `${SITE_URL}${path}`,
            description: seoDescription,
            inLanguage: 'en',
            lastReviewed: LAST_UPDATED_ISO,
            isPartOf: { '@type': 'WebSite', name: 'RentReview', url: SITE_URL },
        }),
        [title, path, seoDescription]
    );

    const breadcrumbSchema = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}${path}` },
            ],
        }),
        [title, path]
    );

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            <ReviewNavbar />

            {/* Header band a soft wash of the brand green, so the page opens
                with something other than a wall of text. */}
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-[#41B985]/[0.07] via-[#41B985]/[0.02] to-white">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#41B985]/10 blur-3xl"
                />
                <div className="relative mx-auto w-full max-w-[70rem] px-5 pb-12 pt-10 sm:px-8 sm:pb-14 sm:pt-12">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-[#2f8a62]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>

                    <header className="mt-7 max-w-[42rem]">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#41B985]/25 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f8a62] backdrop-blur-sm">
                            {eyebrow}
                        </span>
                        <h1 className="mt-4 text-[2.125rem] font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-[2.75rem]">
                            {title}
                        </h1>
                        {intro && (
                            <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
                        )}
                        <p className="mt-6 text-sm text-slate-500">
                            Last updated{' '}
                            <time dateTime={LAST_UPDATED_ISO} className="font-medium text-slate-600">
                                {LAST_UPDATED_DISPLAY}
                            </time>
                        </p>
                    </header>
                </div>
            </div>

            <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16">
                <div className="mx-auto flex w-full max-w-[70rem] gap-14">

                    {/* Sticky contents, wide screens only. */}
                    {sections.length > 0 && (
                        <aside className="hidden w-56 shrink-0 lg:block">
                            <div className="sticky top-24">
                                <Contents sections={sections} active={active} />
                            </div>
                        </aside>
                    )}

                    <div className="w-full min-w-0 max-w-[42rem]">
                        {/* Inline contents for narrow screens. */}
                        {sections.length > 0 && (
                            <Contents
                                sections={sections}
                                active={active}
                                className="mb-12 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 lg:hidden"
                            />
                        )}

                        <article className="space-y-14">{children}</article>

                        <div className="mt-16 border-t border-slate-100 pt-6 text-sm text-slate-400">
                            Questions about this page? Use the{' '}
                            <Link
                                to="/contact"
                                className="text-[#2f8a62] underline decoration-[#41B985]/40 underline-offset-4 transition-colors hover:text-[#41B985]"
                            >
                                contact form
                            </Link>
                            .
                        </div>
                    </div>

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

            {/* Back to top appears once the reader is well down the page. */}
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
                className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg shadow-slate-900/5 transition-all duration-200 hover:border-[#41B985]/40 hover:text-[#2f8a62] ${
                    showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                }`}
            >
                <ArrowUp className="h-5 w-5" />
            </button>

            <Footer />
        </div>
    );
};

export default LegalPage;
