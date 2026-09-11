
import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import LegalPage, { Section, List, Facts, Note } from '../components/legal/LegalPage';
import { GRIEVANCE_OFFICER } from '../config/legal';

const SECTIONS = [
    { id: 'short-version', title: 'The short version' },
    { id: 'good-review', title: 'What makes a good review' },
    { id: 'not-allowed', title: 'What is not allowed' },
    { id: 'examples', title: 'Two examples' },
    { id: 'photos', title: 'Photos' },
    { id: 'moderation', title: 'How moderation works' },
    { id: 'reporting', title: 'Reporting a review' },
    { id: 'enforcement', title: 'If you break the rules' },
];

const DOS = [
    'Write about a place you actually rented, lived in, or genuinely viewed.',
    'Be specific: the condition of the flat, how repairs were handled, how quickly the deposit came back.',
    'Say how long you stayed and roughly when. A problem from five years ago may well be fixed.',
    'Include what was good as well as what was not. Nobody trusts a review with only one side.',
    'Separate fact from opinion. "The lift was out for three weeks" is a fact; "the worst building in the city" is an opinion, and that is fine as long as it reads like one.',
];

const DONTS = [
    'Hate speech, harassment, threats, or abuse of any kind.',
    "Anyone's personal details: phone numbers, email addresses, workplaces, ID numbers, or a flat number that identifies a person.",
    'Reviews written for someone else, paid for, or posted to settle a score.',
    'Promotion of any kind: listings, agent contact details, or services.',
    'Accusations of a crime stated as fact, or details of an ongoing legal case.',
];

// ── A rules card ─────────────────────────────────────────────────────────────
// One card per section rather than two side by side: the column is narrow, and
// a list of full sentences reads badly at half width.
const Rules = ({ tone, title, items }) => {
    const good = tone === 'good';
    const Icon = good ? Check : X;
    return (
        <div
            className={`overflow-hidden rounded-2xl border ${
                good
                    ? 'border-[#41B985]/25 bg-[#41B985]/[0.05]'
                    : 'border-rose-200/70 bg-rose-50/50'
            }`}
        >
            <p
                className={`px-5 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] sm:px-6 ${
                    good ? 'text-[#2f8a62]' : 'text-rose-700'
                }`}
            >
                {title}
            </p>
            <ul className="space-y-3 px-5 py-4 list-none sm:px-6 sm:py-5">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                        <span
                            aria-hidden="true"
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                good
                                    ? 'bg-[#41B985]/15 text-[#2f8a62]'
                                    : 'bg-rose-500/12 text-rose-600'
                            }`}
                        >
                            <Icon className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1 text-slate-700">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// ── A worked example ─────────────────────────────────────────────────────────
const Example = ({ verdict, tone, quote, why }) => {
    const good = tone === 'good';
    return (
        <figure className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <figcaption
                className={`flex items-center gap-2 border-b px-5 py-2.5 text-[13px] font-semibold sm:px-6 ${
                    good
                        ? 'border-[#41B985]/20 bg-[#41B985]/[0.06] text-[#2f8a62]'
                        : 'border-rose-200/70 bg-rose-50/60 text-rose-700'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        good ? 'bg-[#41B985]/20' : 'bg-rose-500/15'
                    }`}
                >
                    {good ? (
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    ) : (
                        <X className="h-2.5 w-2.5" strokeWidth={3} />
                    )}
                </span>
                {verdict}
            </figcaption>
            <blockquote className="px-5 py-4 text-[15px] italic leading-7 text-slate-600 sm:px-6">
                {quote}
            </blockquote>
            <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[14px] leading-6 text-slate-600 sm:px-6">
                {why}
            </p>
        </figure>
    );
};

const Guidelines = () => (
    <LegalPage
        title="Community Guidelines"
        path="/guidelines"
        eyebrow="Community"
        seoDescription="How to write a rental review that actually helps someone: what belongs in a review, what gets one taken down, how moderation works, and what happens if you break the rules."
        intro="RentReview is only worth reading if the reviews on it are honest, first-hand and specific. These are the rules that keep them that way, with examples of a review that stays up and one that does not."
        sections={SECTIONS}
    >
        <Section id="short-version" title="The short version">
            <div className="rounded-2xl border border-[#41B985]/20 bg-[#41B985]/[0.05] p-5 sm:p-6">
                <List
                    items={[
                        <>Write only about places you have <strong>actually rented or viewed</strong>.</>,
                        <>Say what happened, <strong>not what you heard</strong>. Detail is what makes a review useful.</>,
                        <>Criticise the <strong>property and the service</strong>, not the person.</>,
                        <>Never post <strong>anyone's personal details</strong>, including your own.</>,
                        <>Reviews are <strong>public and indexed by search engines</strong>. Write as though the landlord will read it, because they will.</>,
                    ]}
                />
            </div>
        </Section>

        <Section id="good-review" title="What makes a good review">
            <p>
                The reviews people thank us for are rarely the angriest ones. They are the
                specific ones: a date, a number, a repair that took three weeks instead of
                "bad maintenance".
            </p>
            <Rules tone="good" title="Do" items={DOS} />
            <p>
                If you are not sure whether something belongs in a review, ask whether it would
                have helped <em>you</em> before you signed the agreement. If it would, write it
                down.
            </p>
        </Section>

        <Section id="not-allowed" title="What is not allowed">
            <Rules tone="bad" title="Do not" items={DONTS} />
            <p>
                These are the same rules set out in the{' '}
                <Link to="/terms">Terms of Service</Link>. The difference here is only that this
                page shows you what they look like in practice.
            </p>
        </Section>

        <Section id="examples" title="Two examples">
            <p>
                Both of these are about a flat with a real problem. Only one of them stays up.
            </p>

            <Example
                tone="good"
                verdict="Stays up"
                quote={
                    <>
                        "Lived here 14 months, moved out in March. The 2BHK matched the photos and
                        the caretaker fixed a leaking geyser within a week. Water supply cut out
                        most afternoons through the summer, though, and the deposit took two
                        months and several reminders to come back. Good value for the location if
                        you can plan around the water."
                    </>
                }
                why="First-hand, dated, specific, and it says what was good as well as what was not. A reader can act on every sentence."
            />

            <Example
                tone="bad"
                verdict="Removed"
                quote={
                    <>
                        "Total scam. The owner is a fraud, call him on 98xxx xxxxx and see for
                        yourself. A neighbour told me he does this to everyone. Do not rent here."
                    </>
                }
                why="Second-hand, publishes a phone number, and accuses a named person of a crime as though it were established fact. It also tells a reader nothing they can use."
            />

            <Note>
                <p>
                    The second review is not removed for being negative. Strongly negative
                    reviews are welcome and we do not edit them. It is removed for being about a
                    person rather than a property, and for repeating something the writer did not
                    see.
                </p>
            </Note>
        </Section>

        <Section id="photos" title="Photos">
            <Facts
                rows={[
                    ['Only your own', 'Upload pictures you took yourself. Listing photos and images from elsewhere on the internet are not yours to post.'],
                    ['No people', 'Do not upload photos showing anyone who has not agreed to appear, including neighbours, staff and children.'],
                    ['No documents', 'Agreements, receipts and IDs often carry names, signatures and numbers. Describe them instead of photographing them.'],
                    ['Location is stripped', 'We remove location data from every photo before it is stored, so an image does not quietly publish an address.'],
                ]}
            />
        </Section>

        <Section id="moderation" title="How moderation works">
            <p>
                Every review passes through automated checks before it appears. Those checks
                block the things that cannot be undone once they are indexed: phone numbers,
                email addresses and long ID numbers, including your own.
            </p>
            <p>
                Beyond that, a person decides. We check that a real person stands behind each
                review, not that every statement in it is correct. We are not able to judge
                whether your geyser was fixed in a week, and we do not pretend to.
            </p>
            <Note>
                <p>
                    Nobody can pay to have a review removed, hidden or reworded, and advertisers
                    have no say in moderation decisions.
                </p>
            </Note>
        </Section>

        <Section id="reporting" title="Reporting a review">
            <p>
                If a review breaks these guidelines, use the <strong>Report</strong> button
                underneath it. It reaches a person, and it is far quicker than a legal letter.
            </p>
            <Facts
                rows={[
                    ['Say which rule it breaks', 'A report that points at a specific line is dealt with quickly. "I disagree with this" is not something we can act on.'],
                    ['How fast', `${GRIEVANCE_OFFICER.acknowledgeHours} hours to acknowledge your report, ${GRIEVANCE_OFFICER.resolveDays} days to resolve it.`],
                    ['If we agree', 'The review is hidden rather than deleted. It disappears from the site, the writer still sees it in My Reviews, and it can be put back.'],
                    ['If we do not', 'The review stays up and we tell you why.'],
                ]}
            />
            <p>
                Either side can appeal a decision. The full process, including how to escalate if
                you disagree with us, is on the <Link to="/grievance">Complaints page</Link>.
            </p>
        </Section>

        <Section id="enforcement" title="If you break the rules">
            <p>
                We would rather fix a review than lose it, so the first step is almost always the
                smallest one.
            </p>
            <Facts
                rows={[
                    ['First time, minor', 'The review is hidden and you are told what went wrong. Edit it and it goes straight back up.'],
                    ['Repeated', 'The account is suspended while we look at everything posted from it.'],
                    ['Serious', 'Threats, doxxing, or a campaign of fake reviews ends the account permanently, and we may remove the content without prior notice where the law requires it.'],
                ]}
            />
            <p className="text-sm text-slate-500">
                We interpret and enforce these guidelines ourselves, and we will tell you which
                rule was applied and why. See also the{' '}
                <Link to="/terms">Terms of Service</Link> and the{' '}
                <Link to="/privacy">Privacy Policy</Link>.
            </p>
        </Section>
    </LegalPage>
);

export default Guidelines;
