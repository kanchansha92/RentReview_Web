

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List, Facts, Note } from '../components/legal/LegalPage';
import { getConsent, setConsent, onConsentChange } from '../components/CookieConsent';
import { CONTACT_EMAIL, RETENTION } from '../config/legal';

const SECTIONS = [
    { id: 'choice', title: 'Your choice' },
    { id: 'needed', title: 'Cookies we need' },
    { id: 'ads', title: 'Advertising cookies' },
    { id: 'not-used', title: 'What we do not use' },
    { id: 'browser', title: 'Removing cookies yourself' },
];

// ── The switch ───────────────────────────────────────────────────────────────
const ConsentControl = () => {
    const [consent, setLocal] = useState(() => getConsent());

    // Someone may decide in another tab, or by using the banner. Stay in step.
    useEffect(() => onConsentChange(setLocal), []);

    const choose = (value) => {
        setConsent(value);
        setLocal(value);
    };

    const status =
        consent === 'granted'
            ? 'Advertising cookies are on.'
            : consent === 'denied'
              ? 'Advertising cookies are off.'
              : 'Advertising cookies are off, because you have not chosen yet.';

    const btn =
        'rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#41B985] disabled:cursor-default';

    return (
        <div className="rounded-xl border border-slate-200 p-5">
            <p role="status" className="text-[15px] font-semibold text-slate-900">
                {status}
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                    type="button"
                    onClick={() => choose('granted')}
                    disabled={consent === 'granted'}
                    className={`${btn} ${
                        consent === 'granted'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-[#41B985] text-white hover:bg-[#379d70]'
                    }`}
                >
                    {consent === 'granted' ? 'Accepted' : 'Accept'}
                </button>

                <button
                    type="button"
                    onClick={() => choose('denied')}
                    disabled={consent === 'denied'}
                    className={`${btn} ${
                        consent === 'denied'
                            ? 'bg-slate-100 text-slate-500'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    {consent === 'denied' ? 'Refused' : 'Refuse'}
                </button>
            </div>

            <p className="mt-3.5 text-sm leading-6 text-slate-500">
                Takes effect immediately nothing to save, no page to reload. Refusing does not
                sign you out or take away any feature.
            </p>
        </div>
    );
};

const Cookies = () => (
    <LegalPage
        title="Cookies"
        path="/cookies"
        seoDescription="Every cookie RentReview uses, in plain language, with a switch to accept or refuse advertising cookies."
        intro="A cookie is a small note your browser keeps for a website. Here is every one we use, and a switch to turn the optional ones off."
        sections={SECTIONS}
    >
        <Section id="choice" title="Your choice">
            <ConsentControl />
            <p>
                This covers advertising cookies only. The ones in the next section keep you
                signed in, so they cannot be turned off without breaking sign-in.
            </p>
        </Section>

        <Section id="needed" title="Cookies we need">
            <p>
                These make the site work. They collect nothing about you and are not shared with
                anyone.
            </p>
            <Facts
                rows={[
                    ['Keeping you signed in', `Two cookies. One is your login, stored so page code cannot read it. The other stops other websites acting as you. Both last ${RETENTION.session} days, or until you sign out.`],
                    ['Signing in with Google or Facebook', 'One cookie, for a few minutes, to check the reply comes back to the request you started. Deleted straight after.'],
                    ['Your cookie choice', 'We remember whether you said yes or no, so the banner stops asking.'],
                ]}
            />
        </Section>

        <Section id="ads" title="Advertising cookies">
            <p>
                We may show ads through Google AdSense, which sets its own cookies to measure
                them.
            </p>
            <Note>
                <p>
                    <strong>Nothing loads until you say yes.</strong> The Google code is not on
                    the page at all not blocked, not hidden, just not there. So until you
                    accept, Google gets nothing from your visit. If you refuse, it never does.
                </p>
                <p>
                    Ignoring the banner counts as "no". And refusing is one click, exactly like
                    accepting a choice that is harder to make one way is not a free choice.
                </p>
            </Note>
            <p>
                You can also control Google's ads everywhere at{' '}
                <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer nofollow">
                    myadcenter.google.com
                </a>
                .
            </p>
        </Section>

        <Section id="not-used" title="What we do not use">
            <List
                items={[
                    <><strong>No analytics.</strong> No Google Analytics, and nothing recording what you click or scroll.</>,
                    <><strong>No social media pixels.</strong> Facebook is for signing in, and only if you choose it.</>,
                    <><strong>No following you around the web</strong>, and we never sell cookie data.</>,
                    <><strong>No cookie wall.</strong> Everything works the same whether you accept or refuse.</>,
                ]}
            />
        </Section>

        <Section id="browser" title="Removing cookies yourself">
            <p>
                Every browser can show and delete cookies. Look under <strong>Privacy</strong> in
                your settings Chrome, Safari, Firefox and Edge all have it there.
            </p>
            <p>
                Two things to expect. Clearing cookies for this site will{' '}
                <strong>sign you out</strong>, because that is what keeps you signed in. It also
                forgets your cookie choice, so the banner will ask again.
            </p>
            <p>
                If your browser blocks storage completely private mode, or strict settings —
                we treat that as "no", and nothing optional loads.
            </p>
            <p>
                Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See
                also the <Link to="/privacy">Privacy Policy</Link> and{' '}
                <Link to="/security">Security</Link>.
            </p>
        </Section>
    </LegalPage>
);

export default Cookies;
