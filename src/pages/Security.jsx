
import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List, Facts, Note } from '../components/legal/LegalPage';
import { CONTACT_EMAIL, RETENTION, LOGIN_LOCKOUT } from '../config/legal';

const SECTIONS = [
    { id: 'account', title: 'Your account' },
    { id: 'id', title: 'Your ID document' },
    { id: 'site', title: 'The site itself' },
    { id: 'gaps', title: 'What we have not done yet' },
    { id: 'breach', title: 'If something goes wrong' },
    { id: 'report', title: 'Found a security problem?' },
    { id: 'you', title: 'What you can do' },
];

const mail = (a) => <a href={`mailto:${a}`} className="break-all">{a}</a>;

const Security = () => (
    <LegalPage
        title="Security"
        path="/security"
        seoDescription="How RentReview protects your account and your ID document, what we have not done yet, and how to report a security problem."
        intro="What protects your account and your ID document described by what it stops, not what it is called."
        sections={SECTIONS}
    >
        <Section id="account" title="Your account">
            <Facts
                rows={[
                    ['Your password', 'Stored scrambled. We cannot read it, which is why we send you a reset link instead of your old password.'],
                    ['Guessing attempts', `After ${LOGIN_LOCKOUT.attempts} wrong passwords, sign-in locks for ${LOGIN_LOCKOUT.minutes} minutes. We email you when that happens.`],
                    ['Wrong email or wrong password', 'We give the same message either way, so nobody can use the login page to find out which email addresses are registered.'],
                    ['Staying signed in', 'Stored in a way that website code cannot read. So even if a bad script got onto a page, it could not steal your login.'],
                    ['Reset links', `Work once, and expire after ${RETENTION.resetTokenMinutes} minutes.`],
                ]}
            />

            <h3 className="text-base font-semibold text-slate-900 pt-2">Changing your email</h3>
            <p>
                This is how accounts usually get stolen for good someone changes the email so
                you can never get back in. Three things stop that:
            </p>
            <List
                items={[
                    <>You must type your <strong>current password</strong>.</>,
                    <>The new address must <strong>confirm by email</strong> before anything changes.</>,
                    <>Your <strong>old address is told immediately</strong>, so you find out even if someone else is doing it.</>,
                ]}
            />
            <Note>
                <p>
                    We always email you when your password or email address changes. These are
                    security alerts, so there is no unsubscribe a silent change is exactly what
                    makes an account impossible to get back.
                </p>
            </Note>
        </Section>

        <Section id="id" title="Your ID document">
            <List
                items={[
                    <>The <strong>number is encrypted</strong>, and the key is kept somewhere other than the database. A stolen copy of the database contains no readable ID numbers.</>,
                    <>The <strong>photo cannot be opened with a link alone</strong> a one-time signed request is needed, so a leaked address is useless.</>,
                    <><strong>Location data is stripped</strong> from the photo when we store it.</>,
                    <>Only <strong>verification staff</strong> can open one, and <strong>every viewing is recorded</strong> who, what and when for {Math.round(RETENTION.auditLog / 365)} years.</>,
                    <>It is <strong>deleted</strong> once checked, or automatically after {RETENTION.idProof} days.</>,
                ]}
            />
            <p>
                The full journey is in the{' '}
                <Link to="/privacy#your-id">Privacy Policy</Link>.
            </p>
        </Section>

        <Section id="site" title="The site itself">
            <List
                items={[
                    <>Everything travels over an <strong>encrypted connection</strong>, and browsers are told never to fall back to an unencrypted one.</>,
                    <>Other websites <strong>cannot act as you</strong>, even while you are signed in here.</>,
                    <>The site <strong>cannot be embedded</strong> inside another page pretending to be us.</>,
                    <>Your browser is told to <strong>only load code from us</strong>, so an injected script has nowhere to load from.</>,
                    <>Sign-up, sign-in, contact and upload forms are <strong>rate limited</strong>, so nobody can hammer them.</>,
                    <>Uploaded files are checked by <strong>what they actually are</strong>, not what they claim to be.</>,
                ]}
            />
        </Section>

        <Section id="gaps" title="What we have not done yet">
            <Note tone="warn">
                <p>
                    A security page listing only good news is an advert. Here is what is
                    missing, so you can judge for yourself.
                </p>
            </Note>
            <List
                items={[
                    <><strong>No two-factor authentication.</strong> Your password is the only thing protecting your account. If you sign in with Google or Facebook, turning on 2FA there is the best thing you can do today.</>,
                    <><strong>You cannot see your signed-in devices</strong> or log one out. Changing your password does sign out everything, so that is the way to do it for now.</>,
                    <><strong>No outside security audit.</strong> Everything here was checked by the people who built it. A site holding government IDs deserves outside eyes, and we have not paid for that yet.</>,
                    <><strong>We still accept Aadhaar.</strong> We do not think a review site has a good reason to hold Aadhaar numbers. Until that changes, please use one of the other documents.</>,
                ]}
            />
        </Section>

        <Section id="breach" title="If something goes wrong">
            <p>
                If your data is ever exposed, we will tell you and the Data Protection Board of
                India. We will say what happened, what was involved and what to do we will not
                wait until we have every answer before saying anything.
            </p>
            <p>
                Because every viewing of an ID is recorded, we can tell exactly which documents
                were touched and by whom. That is the reason those records exist.
            </p>
        </Section>

        <Section id="report" title="Found a security problem?">
            <p>
                Please tell us: {mail(CONTACT_EMAIL)}. Say what you found and how to repeat
                it. <strong>We will reply within 72 hours</strong> and keep you posted until it
                is fixed.
            </p>
            <p>We ask that you:</p>
            <List
                items={[
                    'Give us time to fix it before telling the world.',
                    <>Use your own test account please do not open anyone else's data, and <strong>never their ID documents</strong>.</>,
                    'Stop once you have shown the problem exists. Proving a door opens does not mean walking through it.',
                    'No spamming, no denial-of-service testing, no tricking our staff or users.',
                ]}
            />
            <p>
                Do that and we will not take legal action against you, we will credit you if you
                want, and we will tell you when it is fixed. We do not pay for bug reports, and
                we would rather say so than let you assume otherwise.
            </p>
        </Section>

        <Section id="you" title="What you can do">
            <List
                items={[
                    <>Use a password you use <strong>nowhere else</strong>. Reused passwords are how most accounts anywhere are lost.</>,
                    <>If you get an email about a change you did not make, <strong>reset your password immediately</strong> and tell us at {mail(CONTACT_EMAIL)}.</>,
                    <>Remember your reviews are public and permanent-ish. We block phone numbers and ID numbers, but we cannot judge what you might regret.</>,
                    <>Delete what you no longer want us to have <Link to="/settings">Settings → Privacy</Link> removes everything at once.</>,
                ]}
            />
        </Section>
    </LegalPage>
);

export default Security;
