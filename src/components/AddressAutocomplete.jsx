import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Info } from 'lucide-react';
import { API_BASE_URL } from '../config/api';


// Backend proxy for the Ola Places endpoints. Mounted at /api/places.
const PLACES_BASE = `${API_BASE_URL}/places`;

function parsePrediction(p) {
    const description = p.description || '';
    const main = p.structured_formatting?.main_text || description.split(',')[0] || '';

    // Split, trim, drop empties and trailing "India"
    let parts = description
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && !/^india$/i.test(s));

    // Extract a 6-digit PIN from anywhere in the remaining parts
    let zipCode = '';
    for (let i = parts.length - 1; i >= 0; i--) {
        const m = parts[i].match(/\b(\d{6})\b/);
        if (m) {
            zipCode = m[1];
            parts[i] = parts[i].replace(/\s*\d{6}\s*/, '').trim();
            if (!parts[i]) parts.splice(i, 1);
            break;
        }
    }

    // Pop state (last) and city (second-to-last) off the end of the array
    const state = parts.length >= 1 ? parts.pop() : '';
    const city = parts.length >= 1 ? parts.pop() : '';

   
    const streetAddress = parts.length > 0 ? parts.join(', ') : main;

    return {
        streetAddress,
        city,
        state,
        zipCode,
        lat: p.geometry?.location?.lat ?? null,
        lng: p.geometry?.location?.lng ?? null,
    };
}

// Append city/state hints to the query if the user hasn't already typed them.
function enrichQuery(q, cityHint, stateHint) {
    const lower = q.toLowerCase();
    const extras = [];
    if (cityHint && !lower.includes(cityHint.toLowerCase())) extras.push(cityHint);
    if (stateHint && !lower.includes(stateHint.toLowerCase())) extras.push(stateHint);
    return extras.length ? `${q}, ${extras.join(', ')}` : q;
}

export default function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    cityHint = '',
    stateHint = '',
    label = 'Street Address',
    required = true,
    placeholder = 'Start typing an address or building name…',
    id = 'streetAddress',
}) {
    const [predictions, setPredictions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    
    const [notice, setNotice] = useState('');

    const boxRef = useRef(null);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // component that no longer exists.
    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        abortRef.current?.abort();
    }, []);

    const handleType = (v) => {
        onChange(v);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        if (!v || v.trim().length < 2) {
            setPredictions([]);
            setOpen(false);
            setSearched(false);
            setNotice('');
            return;
        }

        debounceRef.current = setTimeout(async () => {
            const enriched = enrichQuery(v.trim(), cityHint, stateHint);
            setLoading(true);
            setOpen(true);
            setSearched(false);
            setError('');
            setNotice('');

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const url = `${PLACES_BASE}/autocomplete?input=${encodeURIComponent(enriched)}`;
                const res = await fetch(url, { signal: controller.signal });
                // The proxy is rate-limited per IP, so a shared office NAT can
                // trip it. Show a soft note and keep everything the user already
                // has -predictions, and anything they've already selected.
                if (res.status === 429) {
                    setNotice('Suggestions paused for a moment -keep typing your address');
                    return;
                }
                if (!res.ok) throw new Error(`Address lookup returned ${res.status}`);
            
                // status code below decides the message.
                const data = await res.json().catch(() => ({}));
                setPredictions(data.predictions || []);
                setSearched(true);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('[address]', err);
                    setError('Could not fetch address suggestions. Try again.');
                    setPredictions([]);
                    setSearched(true);
                }
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const pick = (prediction) => {
   
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = null;
        abortRef.current?.abort();
        abortRef.current = null;

        const parsed = parsePrediction(prediction);
        onSelect(parsed);
        setOpen(false);
        setPredictions([]);
        setLoading(false);
    };

    return (
        <div className="relative flex flex-col gap-1.5" ref={boxRef}>
            <label htmlFor={id} className="text-sm font-medium text-[#0A0A0A]">
                {label}
                {required && <span className="text-[#41B985]"> *</span>}
            </label>

            <div className="relative">
                <input
                    id={id}
                    type="text"
                    required={required}
                    value={value}
                    onChange={(e) => handleType(e.target.value)}
                    onFocus={() => predictions.length && setOpen(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls="address-suggestions"
                    className="h-10 w-full rounded-lg bg-[#F3F3F5] px-3 pr-9 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 focus:ring-[#41B985]"
                />
                <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#717182]"
                    aria-hidden="true"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MapPin className="h-4 w-4" />
                    )}
                </span>
            </div>

            {/* Errors */}
            {error && <p className="text-xs text-red-600">{error}</p>}

            {/* Soft notice (rate limit) -deliberately not styled as an error */}
            {!error && notice && <p className="text-xs text-slate-500">{notice}</p>}

            {open && (
                <div
                    id="address-suggestions"
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg"
                >
                    {loading && (
                        <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Searching…
                        </div>
                    )}

                    {!loading &&
                        predictions.map((p) => {
                            const main = p.structured_formatting?.main_text || p.description;
                            const secondary = p.structured_formatting?.secondary_text || '';
                            return (
                                <button
                                    key={p.place_id}
                                    type="button"
                                    role="option"
                                    aria-selected="false"
                                    onClick={() => pick(p)}
                                    className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
                                >
                                    <MapPin
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#41B985]"
                                        aria-hidden="true"
                                    />
                                    <span className="flex flex-col min-w-0">
                                        <span className="font-medium text-slate-800 truncate">{main}</span>
                                        {secondary && (
                                            <span className="text-xs text-slate-500 truncate">{secondary}</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}

                    {!loading && notice && predictions.length === 0 && (
                        <div className="flex items-start gap-2.5 px-4 py-3 text-sm">
                            <Info
                                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                                aria-hidden="true"
                            />
                            <p className="text-slate-600">{notice}</p>
                        </div>
                    )}

                    {!loading && searched && predictions.length === 0 && !error && !notice && (
                        <div className="flex items-start gap-2.5 px-4 py-3 text-sm">
                            <Info
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#41B985]"
                                aria-hidden="true"
                            />
                            <div className="text-slate-600">
                                <p className="font-medium text-[#0A0A0A]">
                                    No matches. Try a nearby landmark or street name.
                                </p>
                                <p className="mt-0.5 text-xs leading-snug text-slate-500">
                                    You can also just fill in City and State below and submit - the
                                    property will still be placed on the map.
                                </p>
                            </div>
                        </div>
                    )}

                    {!loading && predictions.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-1.5 text-[10px] text-slate-400">
                            Powered by Ola Maps
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}