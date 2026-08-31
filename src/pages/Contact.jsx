import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  Mail, Phone, MapPin, Send,
  Clock, CheckCircle2, Loader2, Sparkles, ShieldCheck,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { API_BASE_URL } from '../config/api';
import useSeo from '../hooks/useSeo';
import { SITE_URL, LOGO_URL } from '../config/site';
import { serializeJsonLd } from '../utils/jsonLd';

// ── Contact details (single source of truth for both UI and JSON-LD) ─────
const CONTACT = {
  email: 'support@rentreview.in',
  phone: '+91 80 0000 0000',
  phoneTel: '+918000000000', // for tel: link
  responseTime: 'Avg. response: 2 hours',
  hours: 'Mon-Fri, 9am - 6pm IST',
  addressLine1: 'Bangalore, Karnataka',
  addressLine2: 'India',
  addressTagline: 'Visit us for a coffee!',
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '', // honeypot — hidden from humans, filled in by bots
  });
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useSeo({
    title: 'Contact RentReview -Get in Touch with Our Support Team',
    description:
      'Reach out to the RentReview team for support, feedback, or partnership inquiries. We respond to all messages within 24 hours.',
    path: '/contact',
  });

  // ── JSON-LD: ContactPage + Organization with ContactPoint ────────────────
  // The ContactPoint schema is what Google uses to populate the Knowledge
  // Panel "Contact" section for your brand. This is the big SEO win here.
  const pageSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact RentReview',
      url: `${SITE_URL}/contact`,
      description:
        'Get in touch with the RentReview team for support, feedback, or partnership inquiries.',
      mainEntity: {
        '@type': 'Organization',
        name: 'RentReview',
        url: SITE_URL,
        logo: LOGO_URL,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: CONTACT.email,
            telephone: CONTACT.phone,
            availableLanguage: ['English', 'Hindi'],
            areaServed: 'IN',
            hoursAvailable: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00',
            },
          },
        ],
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
        { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
      ],
    }),
    []
  );

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear this field's server-side error as soon as the user edits it.
    setFieldErrors((prev) => (prev[id] ? { ...prev, [id]: undefined } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitState === 'submitting') return;

    setSubmitState('submitting');
    setSubmitError('');
    setFieldErrors({});

    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          website: formData.website, // honeypot
        }),
      });

      // A 429 / 502 from the API still returns JSON, but a proxy or cold-start
      // failure can return HTML — don't let JSON.parse mask the real status.
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        throw new Error(
          data.message ||
            (res.status === 429
              ? 'Too many messages sent. Please try again later.'
              : 'We could not send your message. Please try again.')
        );
      }

      setSubmitState('success');
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });

      // Auto-clear success state after 6 seconds so the form is usable again
      setTimeout(() => setSubmitState('idle'), 6000);
    } catch (err) {
      setSubmitState('error');
      setSubmitError(
        err?.name === 'TypeError'
          ? 'Could not reach the server. Please check your connection and try again.'
          : err.message || 'Something went wrong. Please try again.'
      );
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#1E293B] placeholder:font-medium placeholder:text-[#94A3B8] transition-all focus:border-[#3EB489] focus:outline-none focus:ring-4 focus:ring-[#3EB489]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-5 sm:py-3.5 sm:text-base';

  const labelClass =
    'ml-1 text-[11px] font-bold uppercase tracking-wider text-[#64748B] sm:text-xs';

  // Per-field validation message returned by the API.
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p id={`${name}-error`} className="ml-1 text-xs font-semibold text-red-600">
        {fieldErrors[name]}
      </p>
    ) : null;

  // Shared props for the four inputs: wires up aria-invalid / aria-describedby
  // so screen readers announce the error alongside the field.
  const fieldProps = (name) => ({
    id: name,
    value: formData[name],
    onChange: handleChange,
    disabled: submitState === 'submitting',
    'aria-invalid': fieldErrors[name] ? true : undefined,
    'aria-describedby': fieldErrors[name] ? `${name}-error` : undefined,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans selection:bg-[#3EB489]/20 selection:text-[#3EB489]">
      <ReviewNavbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="contact-hero-heading"
          className="relative overflow-hidden bg-[#F0FDF4]/50 px-4 pb-28 pt-14 sm:px-6 sm:pb-36 sm:pt-16 lg:px-8 lg:pb-44 lg:pt-24"
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
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 flex justify-center sm:mb-8">
              <ol className="flex list-none flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                <li>
                  <Link to="/" className="transition-colors hover:text-[#3EB489]">Home</Link>
                </li>
                <li aria-hidden="true" className="text-slate-300">/</li>
                <li>
                  <span className="font-medium text-slate-700">Contact</span>
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-4 py-1.5 text-xs font-bold text-[#166534] ring-1 ring-inset ring-[#BBF7D0] sm:text-[13px]">
              <Sparkles className="h-3.5 w-3.5 text-[#3EB489]" aria-hidden="true" />
              We reply within 24 hours
            </div>

            <h1
              id="contact-hero-heading"
              className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              We'd love to{' '}
              <span className="text-[#3EB489]">hear from you.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#475569] sm:mt-6 sm:text-lg lg:text-xl">
              Questions, feedback, or help with a review -our team is here for you.
              Send us a message and we'll get back to you fast.
            </p>
          </div>
        </section>

        {/* ── Main card: green info panel + form ────────────────────────── */}
        <section
          aria-label="Contact form and information"
          className="relative z-10 -mt-16 px-4 pb-16 sm:-mt-20 sm:px-6 sm:pb-20 lg:-mt-24 lg:px-8 lg:pb-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-100 sm:rounded-[36px] lg:grid-cols-5 lg:rounded-[40px]">

              {/* ── Green info panel ──────────────────────────────────── */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#3EB489] to-[#2E9B74] p-7 text-white sm:p-9 lg:col-span-2 lg:p-11">
                {/* Decorative circles */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                  <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/[0.07]" />
                  <div className="absolute bottom-24 right-8 h-16 w-16 rounded-full bg-white/10" />
                </div>

                <div className="relative z-10 flex h-full flex-col">
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    Contact Information
                  </h2>
                  <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
                    Reach us directly, or use the form -whatever works for you.
                  </p>

                  <ul className="mt-8 list-none space-y-6 sm:mt-10 sm:space-y-7">
                    {/* Email */}
                    <li className="group flex items-start gap-4">
                      <div
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110"
                      >
                        <Mail className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                          Email Support
                        </h3>
                        <a
                          href={`mailto:${CONTACT.email}`}
                          className="mt-0.5 block break-all text-base font-bold underline-offset-4 transition-opacity hover:underline hover:opacity-90 sm:text-lg"
                        >
                          {CONTACT.email}
                        </a>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-white/80 sm:text-sm">
                          <Clock size={13} aria-hidden="true" />
                          {CONTACT.responseTime}
                        </p>
                      </div>
                    </li>

                    {/* Phone */}
                    <li className="group flex items-start gap-4">
                      <div
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110"
                      >
                        <Phone className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                          Call Us
                        </h3>
                        <a
                          href={`tel:${CONTACT.phoneTel}`}
                          className="mt-0.5 block text-base font-bold underline-offset-4 transition-opacity hover:underline hover:opacity-90 sm:text-lg"
                        >
                          {CONTACT.phone}
                        </a>
                        <p className="mt-1 text-xs font-bold text-white/80 sm:text-sm">
                          {CONTACT.hours}
                        </p>
                      </div>
                    </li>

                    {/* Office */}
                    <li className="group flex items-start gap-4">
                      <div
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110"
                      >
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                          Our Office
                        </h3>
                        <address className="mt-0.5 text-base font-bold not-italic sm:text-lg">
                          {CONTACT.addressLine1}
                          <br />
                          {CONTACT.addressLine2}
                        </address>
                        <p className="mt-1 text-xs font-bold text-white/80 sm:text-sm">
                          {CONTACT.addressTagline}
                        </p>
                      </div>
                    </li>
                  </ul>

                  {/* Trust marker -pinned to the bottom of the panel */}
                  <div className="mt-10 flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:mt-auto sm:pt-4 lg:p-5">
                    <div
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15"
                    >
                      <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black sm:text-base">Safe &amp; Secure</h3>
                      <p className="text-xs font-medium leading-snug text-white/80 sm:text-[13px]">
                        Your data is encrypted and we never share your identity with landlords.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Form ──────────────────────────────────────────────── */}
              <div className="p-7 sm:p-9 lg:col-span-3 lg:p-11">
                <div className="mb-6 flex items-center gap-2 sm:mb-7">
                  <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#3EB489]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#3EB489] sm:text-xs">
                    Send a Message
                  </span>
                </div>

                <h2 className="text-xl font-black tracking-tight text-[#0F172A] sm:text-2xl lg:text-3xl">
                  Tell us how we can help
                </h2>
                <p className="mt-2 text-sm font-medium text-[#64748B] sm:text-base">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>

                {/* Success message */}
                {submitState === 'success' && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mt-6 flex items-start gap-3 rounded-2xl border border-[#86EFAC] bg-[#DCFCE7] p-4 text-[#166534] sm:p-5"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true" />
                    <div className="text-sm sm:text-base">
                      <p className="font-bold">Message sent!</p>
                      <p className="font-medium opacity-90">Our team will get back to you within 24 hours.</p>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {submitState === 'error' && submitError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 sm:p-5 sm:text-base"
                  >
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" noValidate>
                  {/* Honeypot: hidden from humans and assistive tech, irresistible to bots. */}
                  <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
                    <label htmlFor="website">Leave this field empty</label>
                    <input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="name" className={labelClass}>Full Name</label>
                      <input
                        {...fieldProps('name')}
                        type="text"
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Jane Doe"
                        className={inputClass}
                      />
                      <FieldError name="name" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="email" className={labelClass}>Email Address</label>
                      <input
                        {...fieldProps('email')}
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        placeholder="jane@example.com"
                        className={inputClass}
                      />
                      <FieldError name="email" />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="subject" className={labelClass}>Subject</label>
                    <input
                      {...fieldProps('subject')}
                      type="text"
                      required
                      maxLength={150}
                      placeholder="How can we help?"
                      className={inputClass}
                    />
                    <FieldError name="subject" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="message" className={labelClass}>Message</label>
                    <textarea
                      {...fieldProps('message')}
                      required
                      rows={5}
                      maxLength={5000}
                      placeholder="Tell us more about your inquiry..."
                      className={`${inputClass} resize-none`}
                    />
                    <FieldError name="message" />
                  </div>
                  <button
                    type="submit"
                    disabled={submitState === 'submitting'}
                    className="mt-2 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#3EB489] py-3.5 text-base font-black text-white shadow-lg shadow-emerald-100 transition-all hover:scale-[1.01] hover:bg-[#35a37b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 sm:py-4 sm:text-lg"
                  >
                    {submitState === 'submitting' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send size={20} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
