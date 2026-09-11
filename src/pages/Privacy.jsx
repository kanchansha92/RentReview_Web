
import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List, Facts, Note } from '../components/legal/LegalPage';
import { CONTACT_EMAIL, ENTITY, RETENTION, PROCESSORS } from '../config/legal';

const SECTIONS = [
    { id: 'short-version', title: 'The short version' },
    { id: 'your-id', title: 'Your ID document' },
    { id: 'what-we-collect', title: 'What we collect' },
    { id: 'public', title: 'What other people can see' },
    { id: 'why', title: 'Why we use it' },
    { id: 'who-else', title: 'Who else sees it' },
    { id: 'safety', title: 'How we keep it safe' },
    { id: 'how-long', title: 'How long we keep it' },
    { id: 'your-choices', title: 'Your choices' },
    { id: 'children', title: 'Under 18s' },
    { id: 'changes', title: 'Changes' },
    { id: 'contact', title: 'Contact us' },
];

const mail = (a) => <a href={`mailto:${a}`} className="break-all">{a}</a>;

const Privacy = () => (
    <LegalPage
        title="Privacy Policy"
        path="/privacy"
        seoDescription="What RentReview collects, who can see it, how long we keep it, and how to delete it. Written in plain language."
        intro="We ask for a government ID before publishing a review. This page explains what happens to it, and to everything else we hold about you."
        sections={SECTIONS}
    >
        <Section id="short-version" title="The short version">
            <div className="rounded-2xl border border-[#41B985]/20 bg-[#41B985]/[0.05] p-5 sm:p-6">
                <List
                    items={[
                        <>We collect your <strong>name, email and your reviews</strong>.</>,
                        <>You send a <strong>government ID once per review</strong>, so we can check you are a real person.</>,
                        <>The ID is <strong>deleted</strong> once your review is checked, or after {RETENTION.idProof} days automatically.</>,
                        <>Your <strong>reviews are public</strong>. Your email, password and ID never are.</>,
                        <>You can <strong>download or delete everything</strong> yourself in Settings, without asking us.</>,
                        <>We <strong>do not sell your data</strong>, and we do not track you across other websites.</>,
                    ]}
                />
            </div>
        </Section>

        <Section id="your-id" title="Your ID document">
            <p>
                This is the most sensitive thing we hold, so it comes first.
            </p>
            <p>
                A review here names a real person at a real address. If anyone could post one
                anonymously, the site would be a tool for harassment. So we check that a real
                person is behind each review. That is the only reason we ask.
            </p>

            <h3 className="text-base font-semibold text-slate-900 pt-2">What happens to it</h3>
            <Facts
                rows={[
                    ['You upload it', 'The ID number is encrypted straight away. The photo is stored where a link alone will not open it. Location data in the photo is removed.'],
                    ['We check it', 'Only our verification staff can open it. Every time someone opens it, we record who and when.'],
                    ['We decide', 'The photo is deleted. Only the last 4 characters of the number are kept.'],
                    [`After ${RETENTION.idProof} days`, 'If nobody has checked it by then, it is deleted automatically anyway.'],
                ]}
            />

            <Note>
                <p>
                    <strong>Your ID is never shown to anyone else.</strong> Not on your review, not
                    to a landlord, not to someone complaining about your review. It is not in the
                    data export you can download either.
                </p>
            </Note>

            <Note tone="warn">
                <p>
                    <strong>You do not have to use Aadhaar.</strong> We accept PAN, Driving
                    License, Passport and Voter ID too, and they all work exactly the same. If
                    you would rather not give us an Aadhaar number, use one of those.
                </p>
            </Note>
        </Section>

        <Section id="what-we-collect" title="What we collect">
            <p>Only what you give us. We do not buy data about you from anyone.</p>
            <Facts
                rows={[
                    ['When you sign up', 'Your name and email. A password, if you are not using Google or Facebook.'],
                    ['When you sign in with Google or Facebook', 'Your name, email and profile picture. Nothing else, and never your password for those accounts.'],
                    ['When you write a review', 'The rating, text, photos and the property address. Plus your ID, as above.'],
                    ['When you contact us', 'Your message and email, so we can reply.'],
                    ['Automatically', 'Your IP address, used to stop spam and repeated login attempts. Not used to track you.'],
                ]}
            />
            <p>
                We do <strong>not</strong> collect your phone number, date of birth or location.
                We also block reviews that contain a phone number, an email address or a long ID
                number including in your own writing because once a page like that is
                published and indexed, it cannot really be taken back.
            </p>
        </Section>

        <Section id="public" title="What other people can see">
            <p>RentReview is a public site, and Google indexes it. Be deliberate about what you write.</p>
            <Facts
                rows={[
                    ['Anyone can see', 'Your reviews, their photos, the property address, and the name you post under.'],
                    ['Only you and our staff', 'Your email address.'],
                    ['Nobody, including us', 'Your password. We only store a scrambled version we cannot reverse.'],
                    ['Only our verification staff', 'Your ID, and only until it is checked.'],
                ]}
            />
            <p>
                If someone complains about your review and we agree with them, the review is{' '}
                <strong>hidden, not deleted</strong>. It disappears from the site, but you can
                still see it, and it can be put back. That way a false complaint cannot silently
                erase what you wrote.
            </p>
        </Section>

        <Section id="why" title="Why we use it">
            <p>We use your data to:</p>
            <List
                items={[
                    'Run your account and publish your reviews.',
                    'Check a real person wrote each review.',
                    'Email you about your account password changes, security alerts.',
                    'Stop spam, fake reviews and abuse.',
                    'Answer your messages and handle complaints.',
                ]}
            />
            <p>
                That is the whole list. We do not sell your data, we do not share it with
                advertisers, and we do not use your reviews or your ID to train AI models.
            </p>
        </Section>

        <Section id="who-else" title="Who else sees it">
            <p>
                We use these companies to run the service. Each one only handles the part it
                needs, and only on our instructions.
            </p>
            <Facts rows={PROCESSORS.map((p) => [p.name, p.purpose])} />
            <p>
                Some are based outside India, so your data may be stored abroad. Apart from
                these, we only share your data if the law requires it, or if someone's safety
                depends on it.
            </p>
        </Section>

        <Section id="safety" title="How we keep it safe">
            <List
                items={[
                    <>Everything is sent over an <strong>encrypted connection</strong>.</>,
                    <>Passwords are <strong>scrambled and cannot be read</strong>, by us or anyone else.</>,
                    <>ID numbers are <strong>encrypted</strong>, with the key kept separate from the database.</>,
                    <>Your login is stored in a way that <strong>website code cannot read</strong>, so it cannot be stolen from your browser.</>,
                    <>Every time a staff member opens an ID, it is <strong>recorded</strong>.</>,
                    <>We <strong>email you</strong> whenever your password or email address changes.</>,
                ]}
            />
            <p>
                The <Link to="/security">Security page</Link> explains all of this in more
                detail, including the things we have not done yet.
            </p>
        </Section>

        <Section id="how-long" title="How long we keep it">
            <Facts
                rows={[
                    ['Your account', 'Until you delete it.'],
                    ['Your reviews and photos', 'Until you delete them, or your account.'],
                    ['Your ID photo', `Until it is checked, or ${RETENTION.idProof} days whichever comes first. Then deleted.`],
                    ['Your ID number', 'Until it is checked. Then only the last 4 characters are kept.'],
                    ['Staying signed in', `${RETENTION.session} days, or until you sign out or change your password.`],
                    ['Password reset links', `${RETENTION.resetTokenMinutes} minutes, and they only work once.`],
                    ['Records of staff opening an ID', `${Math.round(RETENTION.auditLog / 365)} years, then deleted automatically.`],
                ]}
            />
        </Section>

        <Section id="your-choices" title="Your choices">
            <p>
                Two of these you can do right now, yourself, in{' '}
                <Link to="/settings">Settings → Privacy</Link>:
            </p>
            <Facts
                rows={[
                    ['Download your data', 'A copy of your account and every review you have written. It does not include ID data sending a government document back over the internet would create the risk we are trying to avoid.'],
                    ['Delete everything', 'Your account, your reviews, their photos and any ID still waiting to be checked. It happens straight away and cannot be undone.'],
                ]}
            />
            <p>
                You can also fix your name, email and reviews in the app. For anything else —
                a correction you cannot make yourself, or a question email {mail(CONTACT_EMAIL)}.
                We reply within 7 days.
            </p>
            <p>
                Ads use cookies, and only if you accept them. You can change your mind any time
                on the <Link to="/cookies">Cookie page</Link>.
            </p>
            <Note>
                <p>
                    We will never ask you to email us a copy of your ID to prove who you are. If
                    someone does, it is not us.
                </p>
            </Note>
        </Section>

        <Section id="children" title="Under 18s">
            <p>
                RentReview is for adults renting homes. We do not knowingly collect anything
                from under 18s. If you think we have, email {mail(CONTACT_EMAIL)} and we will
                delete it.
            </p>
        </Section>

        <Section id="changes" title="Changes">
            <p>
                We update this page when the site changes, and the date at the top always shows
                the last change. If we ever start collecting something new, we will email you
                before it happens rather than expecting you to spot a new date.
            </p>
        </Section>

        <Section id="contact" title="Contact us">
            <p className="text-lg">
                Email <strong>{mail(CONTACT_EMAIL)}</strong> about anything privacy, your data,
                a security problem, or a complaint about a review.
            </p>
            <p>
                You can also use the <Link to="/contact">contact form</Link>. To complain about a
                review, the fastest route is the <strong>Report</strong> button under it see{' '}
                <Link to="/grievance">Complaints</Link>.
            </p>
            <p>
                If we do not sort out a privacy complaint, you can take it to the Data Protection
                Board of India.
            </p>
            <p className="text-sm text-slate-500">
                Data controller: {ENTITY.legalName}, {ENTITY.address}.
            </p>
        </Section>
    </LegalPage>
);

export default Privacy;
