
import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List, Facts, Note } from '../components/legal/LegalPage';
import { CONTACT_EMAIL, ENTITY, RETENTION, GRIEVANCE_OFFICER } from '../config/legal';

const SECTIONS = [
    { id: 'short-version', title: 'The short version' },
    { id: 'who-can-use', title: 'Who can use this' },
    { id: 'your-account', title: 'Your account' },
    { id: 'what-you-post', title: 'What you post' },
    { id: 'rules', title: 'What is not allowed' },
    { id: 'complaints', title: 'Complaints and takedowns' },
    { id: 'our-role', title: 'What RentReview is not' },
    { id: 'ads', title: 'Ads' },
    { id: 'ending', title: 'Ending your account' },
    { id: 'liability', title: 'Limits of our liability' },
    { id: 'law', title: 'Which law applies' },
    { id: 'changes', title: 'Changes' },
    { id: 'contact', title: 'Contact us' },
];

const mail = (a) => <a href={`mailto:${a}`} className="break-all">{a}</a>;

const Terms = () => (
    <LegalPage
        title="Terms of Service"
        path="/terms"
        seoDescription="The rules for using RentReview: who can post, what a review may and may not say, how complaints are handled, and what we are not responsible for. Written in plain language."
        intro="These are the rules for using RentReview. They matter most in two moments  when you write a review, and when someone complains about one  so those two parts come first."
        sections={SECTIONS}
    >
        <Section id="short-version" title="The short version">
            <div className="rounded-2xl border border-[#41B985]/20 bg-[#41B985]/[0.05] p-5 sm:p-6">
                <List
                    items={[
                        <>Using the site means you <strong>accept these terms</strong>. If you do not, please do not use it.</>,
                        <>You must be <strong>18 or over</strong> and write only about places you have actually rented or visited.</>,
                        <>Your review must be <strong>your own honest experience</strong>  not rumour, not revenge, not an advert.</>,
                        <>Reviews are <strong>public and indexed by search engines</strong>. Write them as if the landlord will read them, because they will.</>,
                        <>You <strong>keep ownership</strong> of what you write. You give us permission to publish it here.</>,
                        <>We can <strong>hide or remove</strong> content that breaks these rules, and you can appeal that.</>,
                    ]}
                />
            </div>
        </Section>

        <Section id="who-can-use" title="Who can use this">
            <p>
                RentReview is for adults renting homes in India. You may use it if you are{' '}
                <strong>18 or over</strong> and able to enter a contract. If you are using it on
                behalf of a company, you are confirming you are allowed to agree to these terms
                for it.
            </p>
            <p>
                You may read the site without an account. You need an account to write a review,
                reply to one, or report one.
            </p>
        </Section>

        <Section id="your-account" title="Your account">
            <Facts
                rows={[
                    ['One person, one account', 'Do not run several accounts to make a property look better or worse than it is.'],
                    ['Real details', 'Sign up with a name and email address you actually use. We email you about password and email changes, and those warnings only work if they reach you.'],
                    ['Your password is yours', 'Keep it to yourself. Anything done from your account is treated as done by you.'],
                    ['Verification', `We ask for a government ID once per review, so that a real person stands behind each one. The document is deleted once checked, or after ${RETENTION.idProof} days.`],
                ]}
            />
            <p>
                What happens to that ID is explained in full on the{' '}
                <Link to="/privacy">Privacy Policy</Link>. Short version: nobody but our
                verification staff ever sees it, and it is never attached to your review.
            </p>
            <Note>
                <p>
                    We will never ask you to email us your ID, your password, or a one-time code.
                    If someone does, it is not us.
                </p>
            </Note>
        </Section>

        <Section id="what-you-post" title="What you post">
            <p>
                You keep ownership of your reviews and photos. By posting them you give us a
                licence to store, display and distribute them on RentReview  including in search
                results and on the property's page  for as long as they are published. That
                licence ends when you delete the content, except for copies already cached or
                indexed elsewhere, which we cannot reach.
            </p>
            <Facts
                rows={[
                    ['It must be first-hand', 'Write about a place you rented, lived in, or genuinely viewed. Not what a friend told you.'],
                    ['It must be honest', 'Opinions are fine, and welcome. Stating something as a fact when it is not is not.'],
                    ['Photos must be yours', 'Only upload pictures you took. Do not upload photos of people who have not agreed to it.'],
                    ['No personal details', 'We block reviews containing phone numbers, email addresses and long ID numbers  including your own. Once a page like that is indexed, it cannot really be taken back.'],
                ]}
            />
            <p>
                The <Link to="/guidelines">Community Guidelines</Link> go through this with
                examples of reviews that pass and reviews that do not.
            </p>
            <Note tone="warn">
                <p>
                    <strong>A review is public and permanent-ish.</strong> Search engines copy
                    pages quickly and forget them slowly. Deleting a review removes it from
                    RentReview, but we cannot remove it from someone else's cache or screenshot.
                </p>
            </Note>
        </Section>

        <Section id="rules" title="What is not allowed">
            <p>Do not use RentReview to:</p>
            <List
                items={[
                    <>Post anything <strong>false, misleading or defamatory</strong> about a person or property.</>,
                    <>Harass, threaten or abuse anyone, or post <strong>hate speech</strong>.</>,
                    <>Publish someone's <strong>private information</strong>  their phone number, address, workplace or documents.</>,
                    <>Post <strong>paid, fake or incentivised reviews</strong>, for yourself or anyone else.</>,
                    <>Advertise, spam, or promote a property, agent or service.</>,
                    <>Scrape, copy in bulk, or resell content from the site.</>,
                    <>Break the site  probing for weaknesses, overloading it, or getting around our rate limits.</>,
                ]}
            />
            <p>
                Found a security weakness rather than causing one? Please report it privately 
                the <Link to="/security">Security page</Link> explains how.
            </p>
        </Section>

        <Section id="complaints" title="Complaints and takedowns">
            <p>
                Anyone can report a review with the <strong>Report</strong> button beneath it. A
                person reads every report.
            </p>
            <Facts
                rows={[
                    ['If we agree with the complaint', 'The review is hidden, not deleted. It disappears from the site, but you can still see it in My Reviews, and it can be put back.'],
                    ['If we do not', 'The review stays up and the person who reported it is told.'],
                    ['Either way', 'You are notified, and you can reply to the decision.'],
                    ['How fast', `${GRIEVANCE_OFFICER.acknowledgeHours} hours to acknowledge a complaint, ${GRIEVANCE_OFFICER.resolveDays} days to resolve it.`],
                ]}
            />
            <p>
                Hiding rather than deleting is deliberate: a false complaint should not be able
                to quietly erase what you wrote. The full process, including how to escalate if
                you disagree with us, is on the <Link to="/grievance">Complaints page</Link>.
            </p>
            <p>
                We may also remove content or suspend an account without a complaint if it
                clearly breaks these terms or the law.
            </p>
        </Section>

        <Section id="our-role" title="What RentReview is not">
            <p>
                We are a place for tenants to publish their own experiences. That has limits
                worth being clear about.
            </p>
            <Facts
                rows={[
                    ['Reviews are opinions', 'They are the views of the people who wrote them, not ours. We check that a real person wrote each one  not that every statement in it is correct.'],
                    ['We are not an agent or broker', 'We do not list, let, sell or inspect property, and we take no part in any deal you make with a landlord.'],
                    ['We do not give legal advice', 'Nothing here is advice about your tenancy, your deposit or your rights. Speak to a lawyer or a tenants’ association.'],
                    ['Ratings are averages', 'A score is an average of what people chose to post. It is a starting point for your own checks, not a verdict.'],
                ]}
            />
            <p>
                Check a property yourself before you commit to it  visit it, read the agreement,
                and meet the landlord.
            </p>
        </Section>

        <Section id="ads" title="Ads">
            <p>
                RentReview is free to use and is paid for by advertising. Ads only load if you
                accept advertising cookies, and you can change your mind at any time on the{' '}
                <Link to="/cookies">Cookie page</Link>.
            </p>
            <p>
                Advertisers have no say in reviews, ratings or moderation decisions, and nobody
                can pay to have a review removed or a rating changed.
            </p>
        </Section>

        <Section id="ending" title="Ending your account">
            <Facts
                rows={[
                    ['You can leave any time', 'Settings → Privacy deletes your account, your reviews, their photos and any ID still waiting to be checked. It happens straight away and cannot be undone.'],
                    ['Take your data with you', 'Download a copy of your account and every review you have written before you go.'],
                    ['We can suspend an account', 'For repeated or serious breaches of these terms, or where the law requires it. Where we reasonably can, we tell you why first.'],
                    ['We can close the service', 'If we ever shut RentReview down, we will give notice and time to export your reviews.'],
                ]}
            />
        </Section>

        <Section id="liability" title="Limits of our liability">
            <p>
                RentReview is provided as it is. We work to keep it accurate and available, but
                we cannot promise the site will never be down, never contain a mistake, or that
                every review on it is true.
            </p>
            <p>
                To the extent the law allows, we are not liable for losses arising from something
                someone else posted, from a decision you made based on a review, or from a
                dispute between you and a landlord. Nothing here limits liability that cannot be
                limited by law  including for death, personal injury, or our own fraud.
            </p>
            <Note>
                <p>
                    If you believe a review about you is false, the fastest route is the{' '}
                    <strong>Report</strong> button on the review itself. It reaches a person, and
                    it is far quicker than a legal letter.
                </p>
            </Note>
        </Section>

        <Section id="law" title="Which law applies">
            <p>
                These terms are governed by the laws of India, and the courts of India have
                jurisdiction over any dispute arising from them.
            </p>
            <p>
                As an intermediary, we follow the Information Technology Act 2000 and the IT
                Rules 2021, and we handle personal data under the Digital Personal Data
                Protection Act 2023. The <Link to="/privacy">Privacy Policy</Link> and the{' '}
                <Link to="/grievance">Complaints page</Link> set out what that means in practice.
            </p>
        </Section>

        <Section id="changes" title="Changes">
            <p>
                We update this page as the site changes, and the date at the top always shows the
                last change. If we change something that materially affects you, we will email
                you rather than expecting you to notice a new date. Carrying on using the site
                after a change means you accept the updated terms.
            </p>
        </Section>

        <Section id="contact" title="Contact us">
            <p className="text-lg">
                Email <strong>{mail(CONTACT_EMAIL)}</strong> about anything to do with these
                terms.
            </p>
            <p>
                You can also use the <Link to="/contact">contact form</Link>. To complain about a
                specific review, use the <strong>Report</strong> button under it  see{' '}
                <Link to="/grievance">Complaints</Link>. For questions about your data, see the{' '}
                <Link to="/privacy">Privacy Policy</Link>.
            </p>
            <p className="text-sm text-slate-500">
                Service operated by {ENTITY.legalName}, {ENTITY.address}.
            </p>
        </Section>
    </LegalPage>
);

export default Terms;
