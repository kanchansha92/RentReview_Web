import React, { useState, useEffect, useRef } from 'react'
import {
  Search, ArrowRight, CheckCircle2, Star, TrendingUp, MapPin, Loader2, Lock,
} from 'lucide-react'
import heroImage from '../assets/hero-house.png'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser } from '../store/authSlice'
import { getProperties } from '../services/reviewService'
import { API_BASE_URL } from '../config/api'
import { serializeJsonLd } from '../utils/jsonLd'
import { SITE_URL, LOGO_URL, DEFAULT_OG_IMAGE } from '../config/site'

const TRUST_BADGES = ['ID Verified Reviews', '100% Free to Use', 'Privacy Protected']

const PLACES_BASE = `${API_BASE_URL}/places`

// Parse an Ola autocomplete prediction into our address shape
// (same logic as AddressAutocomplete.jsx -kept inline for now)
function parsePrediction(p) {
  const description = p.description || ''
  const main = p.structured_formatting?.main_text || description.split(',')[0] || ''

  let parts = description
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^india$/i.test(s))

  let zipCode = ''
  for (let i = parts.length - 1; i >= 0; i--) {
    const m = parts[i].match(/\b(\d{6})\b/)
    if (m) {
      zipCode = m[1]
      parts[i] = parts[i].replace(/\s*\d{6}\s*/, '').trim()
      if (!parts[i]) parts.splice(i, 1)
      break
    }
  }

  const state = parts.length >= 1 ? parts.pop() : ''
  const city = parts.length >= 1 ? parts.pop() : ''
  const streetAddress = parts.length > 0 ? parts.join(', ') : main

  return {
    streetAddress,
    city,
    state,
    zipCode,
    lat: p.geometry?.location?.lat ?? null,
    lng: p.geometry?.location?.lng ?? null,
    // Building name for display in the auth-required prompt
    _displayName: main,
  }
}

const Hero = () => {
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [addressResults, setAddressResults] = useState([])
  // True when the places proxy answered 429 -shown as a soft note, never an error.
  const [addressLimited, setAddressLimited] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  // When a guest clicks an address suggestion, we stash the parsed result
  // here and swap the dropdown body for a sign-in prompt.
  const [authPrompt, setAuthPrompt] = useState(null)
  const wrapperRef = useRef(null)
  const abortRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setAuthPrompt(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // If the user signs in WHILE the prompt is showing, automatically continue
  // to the AddReview page with the address they were trying to review.
  useEffect(() => {
    if (user && authPrompt) {
      const { _displayName, ...property } = authPrompt
      setAuthPrompt(null)
      setIsOpen(false)
      navigate('/add-review', { state: { property } })
    }
  }, [user, authPrompt, navigate])

  // Debounced parallel search: DB properties + Ola Maps suggestions
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      setAddressResults([])
      setAddressLimited(false)
      setIsOpen(false)
      setAuthPrompt(null)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      setIsOpen(true)

      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const [dbData, olaData] = await Promise.all([
        getProperties({ search: query.trim() }).catch(() => ({ properties: [] })),
        fetch(
          `${PLACES_BASE}/autocomplete?input=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        )
          .then((r) => {
            // The proxy is rate-limited per IP, so a shared office NAT can trip
            // it. That is a soft pause, not a failure -flag it and leave any
            // suggestions already on screen alone.
            if (r.status === 429) return { rateLimited: true }
            if (!r.ok) return { predictions: [] }
            return r.json().catch(() => ({ predictions: [] }))
          })
          .catch((err) => {
            if (err.name !== 'AbortError') console.error('[hero] Ola Maps error:', err)
            return { predictions: [] }
          }),
      ])

      setResults(dbData.properties || [])
      if (olaData.rateLimited) {
        setAddressLimited(true)
      } else {
        setAddressLimited(false)
        setAddressResults((olaData.predictions || []).slice(0, 4))
      }
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleAddReviewClick = () => {
    user ? navigate('/write-review') : navigate('/signin')
  }

  const handleSearch = () => {
    if (query.trim()) {
      setIsOpen(false)
      navigate(`/write-review?search=${encodeURIComponent(query.trim())}`)
    }
  }

  // ── User clicked an Ola address suggestion ─────────────────────────────
  // Auth-gated: if they're not signed in, show an inline prompt instead of
  // silently bouncing them to /signin (which would lose the address).
  const handleAddressPick = (prediction) => {
    const parsed = parsePrediction(prediction)

    if (!user) {
      setAuthPrompt(parsed)
      return
    }

    const { _displayName, ...property } = parsed
    setIsOpen(false)
    navigate('/add-review', { state: { property } })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) handleSearch()
    else handleAddReviewClick()
  }

  const hasDbResults = results.length > 0
  const hasAddressResults = addressResults.length > 0
  const hasAnyResults = hasDbResults || hasAddressResults

  // ── JSON-LD: @graph with cross-linked entities ─────────────────────────
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'RentReview',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: LOGO_URL },
        description:
          'RentReview is a community platform where verified tenants share honest reviews of rental properties to help renters make informed housing decisions.',
        foundingDate: '2026',
        areaServed: { '@type': 'Country', name: 'India' },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'RentReview',
        description:
          'Share and discover verified rental reviews from real tenants. Make informed decisions about your next home.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-IN',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/write-review?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: 'RentReview Verified Rental Reviews from Real Tenants',
        description:
          'Read and write honest rental property reviews. Find apartments, houses, and condos rated by verified tenants in your city.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        primaryImageOfPage: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
        inLanguage: 'en-IN',
      },
    ],
  }

  return (
    <section
      aria-labelledby="hero-heading"
      aria-describedby="hero-subhead"
      className="relative bg-[#F0FDF4]/50 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[85vh] lg:px-8 lg:py-16"
    >
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-10%] h-[300px] w-[300px] rounded-full bg-[#3EB489]/5 blur-[80px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[250px] w-[250px] rounded-full bg-blue-50/50 blur-[70px] sm:h-[400px] sm:w-[400px] sm:blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="relative z-10 space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#166534] ring-1 ring-inset ring-[#BBF7D0] sm:px-4 sm:py-1.5 sm:text-[13px]">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              Trusted by 50,000+ Renters
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h1
                id="hero-heading"
                className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
              >
                Share Your Rental{' '}
                <br className="hidden sm:block" />
                <span className="text-[#3EB489]">Experience</span>
              </h1>
              <p
                id="hero-subhead"
                className="max-w-xl text-base leading-relaxed text-[#475569] sm:text-lg lg:text-[19px]"
              >
                Your past rental is someone else's future home. Help fellow renters
                make informed decisions by sharing honest reviews.
              </p>
            </div>

            <form
              ref={wrapperRef}
              onSubmit={handleSubmit}
              action="/write-review"
              method="get"
              role="search"
              aria-label="Search properties"
              className="relative max-w-2xl"
              onFocus={() => hasAnyResults && setIsOpen(true)}
            >
              <label htmlFor="property-search" className="sr-only">
                Search properties by address, city, or state
              </label>

              <div className="group flex items-center gap-1.5 rounded-2xl border border-[#E2E8F0] bg-white p-1.5 shadow-2xl shadow-emerald-900/5 transition-all focus-within:border-[#3EB489] focus-within:ring-4 focus-within:ring-[#3EB489]/10 sm:gap-2 sm:p-2">
                <div className="flex flex-1 items-center gap-2 px-2 sm:gap-3 sm:px-4">
                  <Search
                    className="h-5 w-5 shrink-0 text-[#94A3B8] transition-colors group-focus-within:text-[#3EB489] sm:h-[22px] sm:w-[22px]"
                    aria-hidden="true"
                  />
                  <input
                    id="property-search"
                    name="search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by address, city, or state…"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls="hero-search-results"
                    aria-autocomplete="list"
                    className="w-full min-w-0 bg-transparent py-3 text-sm font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none sm:py-4 sm:text-base"
                  />
                </div>
                <button
                  type="submit"
                  aria-label={query.trim() ? 'Search properties' : 'Add a property review'}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3EB489] px-3 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] hover:bg-[#35a37b] active:scale-95 sm:gap-2 sm:px-6 sm:py-4 sm:text-base lg:px-8 cursor-pointer"
                >
                  {searching ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : query.trim() ? (
                    <>
                      <Search className="h-5 w-5" aria-hidden="true" />
                      <span className="hidden sm:inline">Search</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Add Review</span>
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>

              {isOpen && (
                <ul
                  id="hero-search-results"
                  role="listbox"
                  aria-label="Property and address suggestions"
                  className="absolute top-full left-0 right-0 z-[60] mt-2 max-h-[480px] overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
                >
                  {/* ── AUTH-REQUIRED PROMPT (guest clicked an address) ── */}
                  {authPrompt ? (
                    <li className="px-5 py-6 sm:px-8 sm:py-7">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4] ring-4 ring-[#DCFCE7]"
                          aria-hidden="true"
                        >
                          <Lock className="h-6 w-6 text-[#3EB489]" strokeWidth={2.5} />
                        </div>

                        <div className="space-y-1.5 max-w-sm">
                          <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A]">
                            Sign in to write a review
                          </h3>
                          <p className="text-sm text-[#64748B] leading-relaxed">
                            You'll need an account to review{' '}
                            <span className="font-semibold text-[#0F172A]">
                              {authPrompt._displayName || authPrompt.streetAddress}
                            </span>
                            . It only takes a minute, and your reviews stay verified.
                          </p>
                        </div>

                        <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row sm:gap-3">
                          <button
                            type="button"
                            onClick={() => navigate('/signin')}
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#3EB489] px-4 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-[#35a37b] active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                          >
                            Sign In
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#3EB489] bg-white px-4 text-sm font-bold text-[#3EB489] transition-all hover:bg-[#F0FDF4] active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                          >
                            Create Account
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAuthPrompt(null)}
                          className="text-xs font-semibold text-[#64748B] underline-offset-4 hover:text-[#0F172A] hover:underline cursor-pointer focus:outline-none focus-visible:underline"
                        >
                          ← Back to search results
                        </button>
                      </div>
                    </li>
                  ) : (
                    <>
                      {/* ── NORMAL RESULTS ── */}
                      {searching && !hasAnyResults && (
                        <li className="flex items-center gap-3 px-4 py-4 text-[#64748B] sm:px-6">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                          <span className="text-sm font-medium">Searching…</span>
                        </li>
                      )}

                      {/* Section 1: Existing reviewed properties -public */}
                      {hasDbResults && (
                        <>
                          <li
                            role="presentation"
                            className="sticky top-0 z-10 bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:px-6"
                          >
                            Existing Reviews
                          </li>
                          {results.map((prop) => (
                            <li key={prop._id} role="option" aria-selected="false">
                              <Link
                                to={`/property/${prop._id}`}
                                onClick={() => setIsOpen(false)}
                                className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-emerald-50 last:border-0 sm:gap-4 sm:px-6 sm:py-4 focus:outline-none focus-visible:bg-emerald-50"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4]" aria-hidden="true">
                                  <MapPin className="h-4 w-4 text-[#3EB489]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-[#0F172A]">
                                    {prop.title}
                                  </p>
                                  <p className="truncate text-xs text-[#64748B]">
                                    {[prop.city, prop.state].filter(Boolean).join(', ') || prop.location}
                                  </p>
                                </div>
                                {prop.rating > 0 && (
                                  <div
                                    className="flex shrink-0 items-center gap-1"
                                    role="img"
                                    aria-label={`Rated ${Number(prop.rating).toFixed(1)} out of 5 stars`}
                                  >
                                    <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />
                                    <span className="text-xs font-bold text-[#475569]">
                                      {Number(prop.rating).toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </Link>
                            </li>
                          ))}
                        </>
                      )}

                      {/* Section 2: Ola Maps address suggestions -auth-gated */}
                      {hasAddressResults && (
                        <>
                          <li
                            role="presentation"
                            className="sticky top-0 z-10 bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:px-6"
                          >
                            Write a Review
                          </li>
                          {addressResults.map((prediction) => {
                            const main =
                              prediction.structured_formatting?.main_text ||
                              prediction.description?.split(',')[0] ||
                              ''
                            const secondary =
                              prediction.structured_formatting?.secondary_text ||
                              prediction.description?.split(',').slice(1).join(',').trim() ||
                              ''
                            return (
                              <li
                                key={prediction.place_id}
                                role="option"
                                aria-selected="false"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleAddressPick(prediction)}
                                  aria-label={`Write a review for ${main}`}
                                  className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-emerald-50 last:border-0 sm:gap-4 sm:px-6 sm:py-4 focus:outline-none focus-visible:bg-emerald-50 cursor-pointer"
                                >
                                  <div
                                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50"
                                    aria-hidden="true"
                                  >
                                    <MapPin className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                                      {main}
                                    </p>
                                    {secondary && (
                                      <p className="truncate text-xs text-[#64748B]">
                                        {secondary}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    aria-hidden="true"
                                    className="mt-1.5 shrink-0 text-[10px] font-bold uppercase tracking-widest text-amber-600"
                                  >
                                    + Review
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </>
                      )}

                      {/* Places proxy rate-limited -soft note, not an error. */}
                      {!searching && addressLimited && (
                        <li className="flex items-center gap-3 px-4 py-3 text-[#64748B] sm:px-6">
                          <MapPin className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" />
                          <span className="text-sm">
                            Suggestions paused for a moment -keep typing your address
                          </span>
                        </li>
                      )}

                      {!searching && !hasAnyResults && !addressLimited && (
                        <li className="flex items-center gap-3 px-4 py-4 text-[#64748B] sm:px-6 sm:py-5">
                          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="text-sm font-medium">No matches for "{query}"</span>
                        </li>
                      )}

                      {hasAnyResults && (
                        <li>
                          <Link
                            to={`/write-review?search=${encodeURIComponent(query.trim())}`}
                            onClick={() => setIsOpen(false)}
                            className="block w-full bg-[#F0FDF4] px-4 py-3 text-center text-sm font-semibold text-[#3EB489] transition-colors hover:bg-[#DCFCE7] sm:px-6 focus:outline-none focus-visible:bg-[#DCFCE7]"
                          >
                            View all results for "{query}"
                          </Link>
                        </li>
                      )}

                      {hasAddressResults && (
                        <li
                          role="presentation"
                          className="border-t border-slate-100 px-4 py-1.5 text-[10px] text-slate-400 sm:px-6"
                        >
                          Address suggestions powered by Ola Maps
                        </li>
                      )}
                    </>
                  )}
                </ul>
              )}
            </form>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1 sm:gap-x-6 sm:gap-y-4 lg:gap-x-8">
              {TRUST_BADGES.map((text) => (
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

          <div className="relative">
            <div className="group relative overflow-hidden rounded-[24px] border-[8px] border-white bg-white shadow-2xl shadow-emerald-900/10 sm:rounded-[32px] sm:border-[10px] lg:rounded-[40px] lg:border-[12px]">
              <img
                src={heroImage}
                alt="A welcoming modern rental home -RentReview helps you find verified reviews from real tenants in Bangalore and across India"
                width="600"
                height="550"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-[260px] w-full object-cover transition-transform duration-1000 group-hover:scale-110 sm:h-[400px] md:h-[450px] lg:h-[550px]"
              />

              <figure className="absolute bottom-3 left-3 right-3 rounded-2xl border border-slate-50 bg-white/95 p-3 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-8 sm:right-8 sm:rounded-3xl sm:p-4">
                <div className="flex items-start gap-3 sm:gap-5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#3EB489] sm:h-14 sm:w-14"
                    aria-hidden="true"
                  >
                    <Star className="h-5 w-5 sm:h-7 sm:w-7" fill="currentColor" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div
                      className="flex gap-0.5 text-[#F59E0B] sm:gap-1"
                      role="img"
                      aria-label="5 out of 5 stars"
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" fill="currentColor" aria-hidden="true" />
                      ))}
                    </div>
                    <figcaption className="text-base font-black text-[#0F172A] sm:text-lg">
                      Excellent Location!
                    </figcaption>
                    <blockquote className="text-xs italic font-medium leading-snug text-[#64748B] sm:text-[14px]">
                      "Great neighborhood and responsive landlord."
                    </blockquote>
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
    </section>
  )
}

export default Hero