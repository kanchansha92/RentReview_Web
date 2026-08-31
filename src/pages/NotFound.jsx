import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import useSeo from '../hooks/useSeo';



const NotFound = () => {
    useSeo({ title: 'Page not found -RentReview', robots: 'noindex, follow' });

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4 py-12 text-center">
            <div className="flex w-full max-w-md flex-col items-center gap-6">
                <div
                    aria-hidden="true"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4] ring-4 ring-[#DCFCE7]"
                >
                    <Compass className="h-7 w-7 text-[#3EB489]" strokeWidth={2.5} />
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#3EB489]">
                        404
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] sm:text-3xl">
                        We couldn't find that page
                    </h1>
                    <p className="text-sm leading-relaxed text-[#64748B] sm:text-base">
                        The link may be out of date, or the property may have been removed. Everything else is
                        still where you left it.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-3">
                    <Link
                        to="/"
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#3EB489] px-4 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-[#35a37b] active:scale-95"
                    >
                        <Home className="h-4 w-4" aria-hidden="true" />
                        Go to homepage
                    </Link>
                    <Link
                        to="/write-review"
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#3EB489] bg-white px-4 text-sm font-bold text-[#3EB489] transition-all hover:bg-[#F0FDF4] active:scale-95"
                    >
                        <Search className="h-4 w-4" aria-hidden="true" />
                        Browse properties
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default NotFound;
