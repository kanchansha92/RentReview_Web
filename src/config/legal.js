// ─────────────────────────────────────────────────────────────────────────────
// One place for every fact the legal pages state.
//
// The Privacy Policy, Cookie Policy, Security page and Grievance page all make
// claims about the same system: how long an ID proof survives, who to write to,
// when the policy last changed. Repeating those numbers in four files is how a
// policy quietly starts lying someone changes ID_PROOF_RETENTION_DAYS in the
// backend .env, updates the sentence on one page, and misses the other three.
//
// So the pages import from here, and here is the only file to edit.
//
// ⚠️  THE VALUES BELOW MUST MATCH THE RUNNING SYSTEM.
//     RETENTION.idProof mirrors backend ID_PROOF_RETENTION_DAYS (default 30).
//     RETENTION.auditLog mirrors backend AUDIT_LOG_RETENTION_DAYS (default 730).
//     If you change either environment variable, change it here too.
// ─────────────────────────────────────────────────────────────────────────────

// Update this whenever you materially change any legal page. It drives the
// visible "Last updated" line and the JSON-LD `lastReviewed` on every page.
export const LAST_UPDATED_ISO = '2026-09-09';
export const LAST_UPDATED_DISPLAY = 'September 9, 2026';

// The legal entity behind the service. Fill in the registered name and address
// once the entity exists India's DPDP Act requires a Data Fiduciary to be
// identifiable, and "RentReview" alone does not identify anyone.
export const ENTITY = {
    name: 'RentReview',
    // TODO: replace with the registered entity name and full postal address.
    legalName: 'RentReview',
    address: 'India',
};

// One address for everything. Four separate mailboxes were published earlier;
// a mailbox nobody reads turns a published address into a broken promise, and
// one that is actually read beats four that are not. Change it here and it
// changes on every page.
export const CONTACT_EMAIL = 'care@rentreview.in';

// The named keys are kept so each page can still say WHAT it is for even though
// they all resolve to the same inbox. If separate mailboxes are ever set up,
// this is the only place to split them again.
export const CONTACTS = {
    privacy: CONTACT_EMAIL,
    security: CONTACT_EMAIL,
    grievance: CONTACT_EMAIL,
    support: CONTACT_EMAIL,
};

// ── Grievance Officer (IT Rules 2021, Rule 3(2)) ─────────────────────────────
// Rule 3(2)(a) requires an intermediary to publish the NAME and CONTACT of a
// Grievance Officer a named human, not a role address. Until `name` holds a
// real person the Grievance page says so plainly rather than implying
// compliance we do not have.
export const GRIEVANCE_OFFICER = {
    // TODO: replace with the appointed officer's real name before going public.
    name: '',
    designation: 'Grievance Officer',
    email: CONTACT_EMAIL,
    // Rule 3(2)(a)(i): acknowledge within 24 hours, resolve within 15 days.
    acknowledgeHours: 24,
    resolveDays: 15,
};

// Days a piece of data survives. Each entry is quoted directly on the pages.
export const RETENTION = {
    idProof: 30,          // ID_PROOF_RETENTION_DAYS
    auditLog: 730,        // AUDIT_LOG_RETENTION_DAYS (2 years)
    session: 7,           // JWT_EXPIRES_IN
    resetTokenMinutes: 15,
    verifyTokenHours: 24,
    emailChangeTokenHours: 1,
};

// Login throttling, quoted on the Security page.
export const LOGIN_LOCKOUT = {
    attempts: 8,
    minutes: 15,
};

// Identity documents the review form accepts. Kept in step with ID_TYPES in
// pages/Addreview.jsx.
export const ID_TYPES = [
    'Aadhaar Card',
    'PAN Card',
    'Driving License',
    'Passport',
    'Voter ID',
];

// Third parties that process personal data on our behalf. Named individually
// because "trusted partners" is not a disclosure.
export const PROCESSORS = [
    {
        name: 'MongoDB Atlas',
        purpose: 'Database hosting accounts, reviews, encrypted ID numbers',
        location: 'India / Singapore region',
    },
    {
        name: 'Cloudinary',
        purpose: 'Storage of review photos and identity documents',
        location: 'EU / US',
    },
    {
        name: 'Render',
        purpose: 'Application server hosting',
        location: 'Singapore',
    },
    {
        name: 'Netlify',
        purpose: 'Website hosting and delivery',
        location: 'Global CDN',
    },
    {
        name: 'SMTP email provider',
        purpose: 'Account, security and contact-form email',
        location: 'Varies by provider',
    },
    {
        name: 'Ola Maps',
        purpose: 'Address autocomplete receives only the address text you type',
        location: 'India',
    },
    {
        name: 'OpenStreetMap Nominatim',
        purpose: 'Address lookup fallback receives only the address text you type',
        location: 'EU',
    },
    {
        name: 'Google AdSense',
        purpose: 'Advertising loads only after you accept advertising cookies',
        location: 'Global',
    },
];
