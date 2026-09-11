
import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List, Facts, Note } from '../components/legal/LegalPage';
import { CONTACT_EMAIL, ENTITY, GRIEVANCE_OFFICER } from '../config/legal';

const SECTIONS = [
    { id: 'how', title: 'How to complain' },
    { id: 'what-happens', title: 'What happens next' },
    { id: 'outcomes', title: 'What we might decide' },
    { id: 'reply', title: 'Replying instead of removing' },
    { id: 'your-data', title: 'Complaints about your own data' },
    { id: 'officer', title: 'Grievance Officer' },
];

const mail = (a) => <a href={`mailto:${a}`} className="break-all">{a}</a>;

const Grievance = () => {
    const officerNamed = Boolean(GRIEVANCE_OFFICER.name);

    return (
        <LegalPage
            title="Complaints"
            path="/grievance"
            seoTitle="Complaints & Grievance Redressal | RentReview"
            seoDescription="How to complain about a review on RentReview, or reply to one. No account needed. We reply within 24 hours and decide within 15 days."
            intro="If a review is about you or your property, you do not need an account to do something about it."
            sections={SECTIONS}
        >
            <Section id="how" title="How to complain">
                <p>
                    <strong>Easiest way:</strong> open the review and press <strong>Report</strong>{' '}
                    underneath it. No account, no sign-up. It asks for your name, an email to
                    reply to, and what is wrong.
                </p>
                <p>
                    <strong>Or email</strong> {mail(GRIEVANCE_OFFICER.email)}. So we can act on
                    your first message, please include:
                </p>
                <List
                    items={[
                        'A link to the review, or the address and roughly when it appeared.',
                        'Who you are owner, agent, landlord, or the person named.',
                        'What is wrong, quoting the words if you can.',
                        'What you want: it removed, corrected, or a reply published.',
                        'Anything that backs it up a tenancy agreement, messages, dates.',
                    ]}
                />
                <p>You can complain about a review that:</p>
                <List
                    items={[
                        'Says something false about you or your property.',
                        'Contains personal information a phone number, a photo of someone, an ID number.',
                        'Is abusive, or attacks someone for their religion, caste, gender or background.',
                        'Is fake from someone who was never a tenant, or posted repeatedly to damage a rating.',
                        'Uses your photos without permission.',
                    ]}
                />
                <Note>
                    <p>
                        <strong>We will never ask you for an ID document to make a complaint.</strong>{' '}
                        We may ask questions only someone connected to the property could answer,
                        but we will not ask you to email us a government document. Anyone who
                        does is not us.
                    </p>
                </Note>
            </Section>

            <Section id="what-happens" title="What happens next">
                <Facts
                    rows={[
                        ['Within 24 hours', 'You get an email confirming we have it, with a reference number.'],
                        ['Within a few days', 'A person reads the complaint and the review together. We may come back to you, or to the person who wrote it.'],
                        ['Within 15 days', 'We tell you what we decided and why.'],
                        ['Urgent cases', 'Anything exposing someone’s personal details jumps the queue and is handled as fast as we can.'],
                    ]}
                />
                <Note>
                    <p>
                        <strong>Reporting a review does not automatically remove it.</strong> If it
                        did, the Report button would just be a delete button for any criticism. A
                        person weighs your complaint against the review and gives you a reason
                        either way.
                    </p>
                </Note>
            </Section>

            <Section id="outcomes" title="What we might decide">
                <Facts
                    rows={[
                        ['Leave it', 'The review stays. We tell you why, and you can come back with new information.'],
                        ['Hide it', 'It disappears from the site and from the property rating. We hide rather than delete, so it can be put back if we got it wrong.'],
                        ['Edit it', 'If only part is a problem a phone number, a name we remove that part and the rest stays.'],
                        ['Publish your reply', 'Your response appears under the review. See below.'],
                        ['Act on the account', 'If someone is posting fake or abusive reviews repeatedly, we suspend them.'],
                    ]}
                />
            </Section>

            <Section id="reply" title="Replying instead of removing">
                <p>
                    Often this is the better option. A removed review tells future tenants
                    nothing. A review with your answer underneath tells them a lot including
                    that you responded.
                </p>
                <p>
                    When you report a review you can include a reply you would like published. It
                    appears directly under the review.
                </p>
                <p>
                    A person publishes it rather than you posting it directly. Nothing on this
                    site can prove someone owns an address, so an automatic "verified owner"
                    badge would be a claim we cannot stand behind and worth faking. Replies are
                    checked the same way reviews are, so a reply containing someone's phone
                    number or ID number will be blocked.
                </p>
            </Section>

            <Section id="your-data" title="Complaints about your own data">
                <p>
                    If your complaint is about how <em>we</em> handled your personal data, email{' '}
                    {mail(CONTACT_EMAIL)}.
                </p>
                <p>
                    Downloading or deleting your data does not need a complaint at all it is a
                    button in <Link to="/settings">Settings → Privacy</Link> and it works
                    immediately. The <Link to="/privacy#your-choices">Privacy Policy</Link>{' '}
                    explains the rest.
                </p>
            </Section>

            <Section id="officer" title="Grievance Officer">
                <p>
                    Indian law requires us to publish a named contact for complaints, under the
                    IT Rules 2021 and the Digital Personal Data Protection Act 2023.
                </p>

                {officerNamed ? (
                    <Facts
                        rows={[
                            ['Name', GRIEVANCE_OFFICER.name],
                            ['Role', GRIEVANCE_OFFICER.designation],
                            ['Email', mail(GRIEVANCE_OFFICER.email)],
                            ['Address', ENTITY.address],
                            ['We reply within', `${GRIEVANCE_OFFICER.acknowledgeHours} hours`],
                            ['We decide within', `${GRIEVANCE_OFFICER.resolveDays} days`],
                        ]}
                    />
                ) : (
                    <Note tone="warn">
                        <p>
                            <strong>We have not appointed a named officer yet.</strong> The law
                            asks for a specific person, and we are not going to print a job title
                            and pretend that counts.
                        </p>
                        <p>
                            Until we do, every complaint to {mail(GRIEVANCE_OFFICER.email)} is
                            handled to the same deadlines: a reply within{' '}
                            {GRIEVANCE_OFFICER.acknowledgeHours} hours, a decision within{' '}
                            {GRIEVANCE_OFFICER.resolveDays} days.
                        </p>
                    </Note>
                )}

                <h3 className="text-base font-semibold text-slate-900 pt-2">
                    If you are still unhappy
                </h3>
                <List
                    items={[
                        'Reply and tell us what you think we got wrong. Someone else will look at it.',
                        'For data complaints, you can go to the Data Protection Board of India.',
                        'For content decisions, you can appeal to the Grievance Appellate Committee.',
                        'None of this affects your right to go to court.',
                    ]}
                />
            </Section>
        </LegalPage>
    );
};

export default Grievance;
