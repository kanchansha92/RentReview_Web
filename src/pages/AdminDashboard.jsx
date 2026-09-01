import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ShieldCheck,
    AlertCircle,
    ArrowRight,
    ClipboardCheck,
    FileText,
    Building2,
    Map,
    Loader2,
    UserCog,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { getPendingVerifications, getReviews, getProperties } from '../services/reviewService';
import { getMe } from '../services/authService';
import { selectUser, updateUser } from '../store/authSlice';
import useSeo from '../hooks/useSeo';
import { Stagger, StaggerItem, motion, fadeUp } from '../animations';

const MotionLink = motion.create(Link);


const STAT_CARDS = [
    {
        key: 'pending',
        label: 'Awaiting ID review',
        icon: ClipboardCheck,
        to: '/admin/verifications',
        hint: 'Submissions the automated check could not confirm',
        accent: true,
    },
    {
        key: 'reviews',
        label: 'Reviews published',
        icon: FileText,
        to: '/write-review',
        hint: 'Every review currently live on the site',
    },
    {
        key: 'properties',
        label: 'Properties on record',
        icon: Building2,
        to: '/map',
        hint: 'Includes addresses with no reviews yet',
    },
];

const TOOLS = [
    {
        to: '/admin/verifications',
        icon: ClipboardCheck,
        title: 'ID Verification Queue',
        body:
            'Approve or reject the ID proofs the OCR check left undecided. Both decisions permanently delete the document and mask the stored number.',
    },
    {
        to: '/write-review',
        icon: FileText,
        title: 'Browse all reviews',
        body:
            'The public browse grid - the fastest way to spot a review that needs moderating. Editing and removal still happen from the review itself.',
    },
    {
        to: '/map',
        icon: Map,
        title: 'Map view',
        body:
            'Every geocoded property as a pin. Useful for catching addresses that landed in the wrong place during submission.',
    },
];

const AdminDashboard = () => {
    // Admin surface — never index it. robots.txt disallows /admin/ as well, but
    // that only asks politely; this tag is the one crawlers act on per-page.
    useSeo({ title: 'Admin | RentReview', noindex: true });

    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const isAdmin = user?.role === 'admin';

    // A non-admin fires no requests, so it must not start in a loading state.
    const [loading, setLoading] = useState(isAdmin);
    const [stats, setStats] = useState({ pending: null, reviews: null, properties: null });
    const [error, setError] = useState('');

    
    const roleRef = useRef(user?.role);
    roleRef.current = user?.role;

    useEffect(() => {
        let cancelled = false;

        getMe()
            .then((fresh) => {
                if (cancelled || !fresh?.role) return;
                // Dispatch only on an actual change: an unconditional merge
                // produces a new user object and re-renders every subscriber
                // for nothing.
                if (fresh.role !== roleRef.current) {
                    dispatch(updateUser({ role: fresh.role }));
                }
            })
            // A failure here is not worth a banner — the page still renders
            // whatever the cached role allows, which is the status quo.
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [dispatch]);

    useEffect(() => {
        if (!isAdmin) return;

        let cancelled = false;
      
        setLoading(true);

        Promise.allSettled([
            getPendingVerifications({ limit: 1 }),
            getReviews({ limit: 1 }),
            getProperties({ limit: 1, includeEmpty: 1 }),
        ]).then((results) => {
            if (cancelled) return;

            const [pending, reviews, properties] = results;
            const totalOf = (r) => (r.status === 'fulfilled' ? r.value?.total ?? null : null);

            setStats({
                pending: totalOf(pending),
                reviews: totalOf(reviews),
                properties: totalOf(properties),
            });

            // Surface a message only if something actually failed, and only the
            // first one — three stacked "server error" banners say nothing extra.
            const failed = results.find((r) => r.status === 'rejected');
            if (failed) setError(failed.reason?.message || 'Some figures could not be loaded.');

            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [isAdmin]);

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB] font-sans">
            <ReviewNavbar />

            <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <header className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#41B985]" aria-hidden="true" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                            Admin
                        </h1>
                    </div>
                    <p className="max-w-2xl text-sm text-[#4A5565]">
                        {isAdmin
                            ? `Signed in as ${user?.email || user?.name || 'an admin'}. Everything below is gated server-side as well - this page only decides what to show you.`
                            : 'Moderation tools for RentReview.'}
                    </p>
                </header>

                {!isAdmin && (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
                        <AlertCircle className="h-8 w-8 text-slate-400" aria-hidden="true" />
                        <p className="text-base font-bold text-slate-700">Admins only</p>
                        <p className="max-w-md text-sm text-slate-500">
                            This account doesn't have the admin role. Grant it from the server with{' '}
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                                node src/scripts/promoteAdmin.js {user?.email || 'you@example.com'}
                            </code>
                            .
                        </p>
                        <p className="max-w-md text-xs text-slate-400">
                            Already ran it? Reload this page - the role is re-read from the server on
                            every visit, so you don't need to sign out and back in.
                        </p>
                        <Link to="/" className="mt-1 text-sm font-semibold text-[#41B985] hover:underline">
                            Back to home
                        </Link>
                    </div>
                )}

                {isAdmin && (
                    <>
                        {error && (
                            <p
                                role="alert"
                                className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                {error}
                            </p>
                        )}

                        {/* ── Counts ───────────────────────────────────────── */}
                        <Stagger as="ul" stagger={0.07} className="mb-8 grid list-none grid-cols-1 gap-3 sm:grid-cols-3">
                            {STAT_CARDS.map(({ key, label, icon: Icon, to, hint, accent }) => {
                                const value = stats[key];
                                return (
                                    <StaggerItem as="li" variants={fadeUp} key={key}>
                                        <MotionLink
                                            to={to}
                                            whileHover={{ y: -3 }}
                                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                            className="flex h-full flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-colors hover:border-[#41B985]/40 hover:bg-[#F6FDFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    {label}
                                                </span>
                                                <Icon
                                                    className={`h-4 w-4 ${accent ? 'text-[#41B985]' : 'text-slate-400'}`}
                                                    aria-hidden="true"
                                                />
                                            </div>

                                            {loading ? (
                                                <Loader2
                                                    className="h-6 w-6 animate-spin text-slate-300"
                                                    aria-label="Loading"
                                                />
                                            ) : (
                                                <span
                                                    className={`text-3xl font-bold tabular-nums ${
                                                        accent && value > 0 ? 'text-[#41B985]' : 'text-[#0A0A0A]'
                                                    }`}
                                                >
                                                    {/* null means the request failed — an em dash is honest,
                                                        a 0 would read as "queue is clear". */}
                                                    {value === null ? '-' : value.toLocaleString()}
                                                </span>
                                            )}

                                            <span className="text-xs text-slate-500">{hint}</span>
                                        </MotionLink>
                                    </StaggerItem>
                                );
                            })}
                        </Stagger>

                        {/* ── Tools ────────────────────────────────────────── */}
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                            Tools
                        </h2>
                        <Stagger as="ul" stagger={0.07} className="grid list-none grid-cols-1 gap-3 lg:grid-cols-3">
                            {TOOLS.map(({ to, icon: Icon, title, body }) => (
                                <StaggerItem as="li" variants={fadeUp} key={to}>
                                    <MotionLink
                                        to={to}
                                        whileHover={{ y: -3 }}
                                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                        className="group flex h-full flex-col gap-2 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-colors hover:border-[#41B985]/40 hover:bg-[#F6FDFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2"
                                    >
                                        <Icon className="h-5 w-5 text-[#41B985]" aria-hidden="true" />
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-[#0A0A0A]">
                                            {title}
                                            <ArrowRight
                                                className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="text-sm leading-relaxed text-[#4A5565]">{body}</span>
                                    </MotionLink>
                                </StaggerItem>
                            ))}
                        </Stagger>

                        {/* Roles are granted from the server only — there is no API for it,
                            so saying where the switch lives beats leaving an admin hunting. */}
                        <p className="mt-8 flex items-start gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs text-slate-500">
                            <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                            <span>
                                Admin access is granted from the server, not from this page:{' '}
                                <code className="rounded bg-slate-100 px-1.5 py-0.5">
                                    node src/scripts/promoteAdmin.js someone@example.com
                                </code>
                            </span>
                        </p>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
