import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Star, DollarSign, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { API_BASE_URL } from '../config/api';
import { fetchProperties, selectProperties, selectPropertiesStatus, selectPropertiesError, selectPropertiesTotal } from '../store/reviewSlice';
import useSeo from '../hooks/useSeo';

const BENGALURU_CENTER = [12.9716, 77.5946];


const MAX_GEOCODES = 25;

// Properties requested per load. The backend caps this at 500; anything beyond
// what comes back is reported to the user rather than silently missing.
const PAGE_LIMIT = 200;

// ─── Custom green pin (DivIcon avoids the default-icon bundler bug) ──────
const propertyIcon = L.divIcon({
    className: 'bg-transparent border-0',
    html: `
    <div style="position:relative;width:40px;height:40px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));">
      <svg viewBox="0 0 24 32" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12z" fill="#41B985"/>
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12z" fill="none" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="4.5" fill="white"/>
      </svg>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -38],
});


const FitBounds = ({ points }) => {
    const map = useMap();
    const fittedCount = useRef(0);
    useEffect(() => {
        if (points.length === 0 || points.length <= fittedCount.current) return;
        fittedCount.current = points.length;
        map.fitBounds(points, { padding: [60, 60], maxZoom: 15 });
    }, [map, points]);
    return null;
};


async function geocode(q) {
    if (!q || !q.trim()) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/places/geocode?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) return null;
        const data = await res.json().catch(() => ({}));
        if (data && data.lat != null && data.lng != null) {
            return { lat: Number(data.lat), lng: Number(data.lng) };
        }
    } catch {
        /* ignore -the property is reported as unplaceable */
    }
    return null;
}

// If a coordinate is already used (pins would stack exactly), nudge this one a
// little so every property gets its own visible, hoverable pin.
function spreadIfDuplicate(lat, lng, used) {
    // Stored coords can arrive as strings -coerce before any arithmetic or
    // .toFixed(), otherwise the nudge below silently concatenates.
    lat = Number(lat);
    lng = Number(lng);
    let key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    let attempt = 0;
    while (used.has(key)) {
        attempt += 1;
        const angle = Math.random() * 2 * Math.PI;
        const dist = 0.0012 * attempt; // ~130 m per step
        lat += dist * Math.cos(angle);
        lng += dist * Math.sin(angle);
        key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    }
    used.add(key);
    return [lat, lng];
}

const MapView = () => {
    useSeo({
        title: 'Rental Property Map | Explore Reviews Across India | RentReview',
        description:
            'See every reviewed rental property on an interactive map. Explore verified tenant reviews by neighborhood before you choose where to rent.',
        path: '/map',
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const properties = useSelector(selectProperties);
    const status = useSelector(selectPropertiesStatus);
    const errorGlobal = useSelector(selectPropertiesError);
    // Server-side match count. `null` on backends that don't report one, in
    // which case we say nothing rather than guessing.
    const propertiesTotal = useSelector(selectPropertiesTotal);

    const [located, setLocated] = useState([]);

    // Status local logic
    const loading = status === 'loading' || status === 'idle';
    const error = errorGlobal || '';
    const [locating, setLocating] = useState(0);
    // Properties we could not put on the map: geocoding failed, or they fell
    // outside the geocoding cap. Surfaced in the UI instead of swallowed.
    const [unplaceable, setUnplaceable] = useState(0);

    // The API can hand back a non-array on a partial failure -never iterate
    // it unguarded.
    const propertyList = useMemo(
        () => (Array.isArray(properties) ? properties : []),
        [properties]
    );

    // Past PAGE_LIMIT the map simply stops having pins for properties that
    // exist. Without saying so, that is indistinguishable from an empty area.
    const truncated =
        typeof propertiesTotal === 'number' && propertiesTotal > propertyList.length;


    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProperties({ limit: PAGE_LIMIT }));
        }
    }, [dispatch, status]);

    // 2) Place pins: stored coords first, geocode the rest, spreading duplicates
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const used = new Set();
            const ready = [];
            const needGeo = [];

            for (const p of propertyList) {
                const lat = Number(p?.coords?.lat);
                const lng = Number(p?.coords?.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    ready.push({ ...p, position: spreadIfDuplicate(lat, lng, used) });
                } else {
                    needGeo.push(p);
                }
            }

           
            const queue = needGeo.slice(0, MAX_GEOCODES);
            let failures = needGeo.length - queue.length;

            if (!cancelled) {
                setLocated([...ready]);
                setLocating(queue.length);
                setUnplaceable(failures);
            }

            for (const p of queue) {
                if (cancelled) return;
                const full = [p.streetAddress, p.city, p.state].filter(Boolean).join(', ');
                const cityState = [p.city, p.state].filter(Boolean).join(', ');
                const coords = (await geocode(full)) || (cityState ? await geocode(cityState) : null);
                if (cancelled) return;

                if (coords) {
                    ready.push({ ...p, position: spreadIfDuplicate(coords.lat, coords.lng, used) });
                    setLocated([...ready]);
                } else {
                    failures += 1;
                    setUnplaceable(failures);
                }
                setLocating((n) => Math.max(0, n - 1));
                await new Promise((r) => setTimeout(r, 1100));
                if (cancelled) return;
            }
        })();

        return () => { cancelled = true; };
    }, [propertyList]);

    const points = useMemo(() => located.map((p) => p.position), [located]);

    return (
        <>
            <style>{`
        .leaflet-popup-content-wrapper { padding: 0; border-radius: 12px; box-shadow: 0 3px 14px rgba(0,0,0,0.4); }
        .leaflet-popup-content { margin: 0; width: 260px !important; }
        .leaflet-popup-tip { background: #fff; box-shadow: 0 3px 14px rgba(0,0,0,0.4); }
        .leaflet-popup-close-button { color: #757575 !important; font-size: 18px !important; padding: 8px 8px 0 0 !important; }
      `}</style>

            <div className="flex h-screen flex-col bg-[#F9FAFB] font-sans">
                <ReviewNavbar />

                <main className="min-h-0 flex-1 px-4 py-4 sm:px-6 lg:px-[42.5px]">
                    <div className="relative h-full w-full overflow-hidden rounded-[10px] border border-black/10 bg-[#DDDDDD]">

                        {loading && (
                            <div className="absolute inset-0 z-[500] flex items-center justify-center gap-2 bg-[#DDDDDD] text-sm text-slate-500">
                                <Loader2 className="h-5 w-5 animate-spin" /> Loading map…
                            </div>
                        )}

                        {error && !loading && (
                            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#F9FAFB] p-8 text-center">
                                <div className="max-w-md">
                                    <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
                                    <p className="mt-3 text-base font-semibold text-slate-800">Couldn't load properties</p>
                                    <p className="mt-1 text-sm text-slate-500">{error}</p>
                                </div>
                            </div>
                        )}

                        {!loading && locating > 0 && (
                            <div className="absolute right-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Locating {locating} propert{locating === 1 ? 'y' : 'ies'}…
                            </div>
                        )}

                        {!loading && truncated && (
                            <div
                                role="status"
                                className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow"
                            >
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                Showing {propertyList.length} of {propertiesTotal} properties
                            </div>
                        )}

                        {!loading && locating === 0 && unplaceable > 0 && (
                            <div
                                role="status"
                                className="absolute right-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow"
                            >
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                {unplaceable} propert{unplaceable === 1 ? 'y' : 'ies'} couldn't be placed on the map
                            </div>
                        )}

                        <MapContainer center={BENGALURU_CENTER} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {points.length > 0 && <FitBounds points={points} />}

                            {located.map((p) => (
                                <Marker
                                    key={p._id}
                                    position={p.position}
                                    icon={propertyIcon}
                                    eventHandlers={{
                                        mouseover: (e) => e.target.openPopup(),
                                    }}
                                >
                                    <Popup>
                                        <PropertyPopup property={p} onViewDetails={() => navigate(`/property/${p._id}`)} />
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </main>

                <footer className="shrink-0 border-t border-black/10 bg-white py-3 text-center">
                    <div className="mx-auto w-full max-w-[1376px] px-4 sm:px-6 lg:px-[42.5px]">
                        <p className="text-sm text-[#4A5565]">© 2026 RentReview. Helping renters make informed decisions.</p>
                        <p className="mt-0.5 text-xs text-[#4A5565]">All reviews are from community members. Always verify property details before signing a lease.</p>
                    </div>
                </footer>
            </div>
        </>
    );
};

const PropertyPopup = ({ property, onViewDetails }) => (
    <div className="flex flex-col gap-2 p-5 font-sans">
        <h3 className="text-base font-medium leading-snug text-[#333333]">{property.title}</h3>

        <div className="flex items-center gap-1 text-sm text-[#4A5565]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>
                {property.location
                    || [property.streetAddress, property.city, property.state].filter(Boolean).join(', ')
                    || 'Location unavailable'}
            </span>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#FDC700] text-[#FDC700]" />
                <span className="text-[13px] font-medium text-[#333333]">
                    {(Number.isFinite(Number(property.rating)) ? Number(property.rating) : 0).toFixed(1)}
                </span>
            </div>
            <span className="text-xs text-[#6A7282]">({property.reviewsCount || 0} reviews)</span>
        </div>

        <div className="flex items-center justify-between">
            {property.price != null ? (
                <div className="flex items-center gap-1 text-[#333333]">
                    <DollarSign className="h-4 w-4 text-[#6A7282]" />
                    <span className="text-[13px] font-medium">${property.price}/mo</span>
                </div>
            ) : <span />}
            <span className="rounded-[4px] bg-[#41B985]/10 px-2 py-1 text-xs text-[#41B985]">{property.type}</span>
        </div>

        <button
            type="button"
            onClick={onViewDetails}
            className="mt-1 flex h-9 items-center justify-center gap-1.5 rounded bg-[#41B985] text-sm font-medium text-white transition-colors hover:bg-[#36a374]"
        >
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
        </button>
    </div>
);

export default MapView;