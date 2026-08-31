import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';

const CTASection = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleWriteReviewClick = () => {
    navigate(user ? '/add-review' : '/signin');
  };

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-[#41B985] px-4 py-12 text-center text-white sm:px-6 sm:py-14 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        {/* Decorative house icon */}
        <div className="mb-6 sm:mb-7 lg:mb-8" aria-hidden="true">
          <svg
            className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            viewBox="0 0 64 64"
            fill="none"
          >
            <path
              d="M10.6667 24L32 8L53.3333 24V50.6667C53.3333 52.1394 52.1394 53.3333 50.6667 53.3333H13.3333C11.8606 53.3333 10.6667 52.1394 10.6667 50.6667V24Z"
              stroke="white"
              strokeWidth="5.33299"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M26.6667 53.3333V32H37.3333V53.3333"
              stroke="white"
              strokeWidth="5.33299"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2
          id="cta-heading"
          className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl"
        >
          Ready to Share Your Experience?
        </h2>

        {/* Subheading */}
        <p className="mt-4 max-w-3xl text-base text-white/90 sm:mt-5 sm:text-lg lg:text-xl">
          Join thousands of renters making smarter housing decisions. Add your honest review about your rental property today.
        </p>

        {/* CTA buttons -stack on mobile, side-by-side on sm+ */}
        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:mt-10">
          <button
            type="button"
            onClick={handleWriteReviewClick}
            className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-[#030213] transition-colors hover:bg-slate-50 sm:px-8 sm:py-4 sm:text-lg"
          >
            Write a Review
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path d="M3.3335 8H12.6668" stroke="#030213" strokeWidth="1.33306" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="#030213" strokeWidth="1.33306" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Use <Link> for Browse Reviews -pure navigation, crawler-friendly */}
          <Link
            to="/write-review"
            className="inline-flex items-center justify-center rounded-lg border border-white/60 bg-white/10 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/20 sm:px-8 sm:py-4 sm:text-lg"
          >
            Browse Reviews
          </Link>
        </div>

        {/* Trust-signal line */}
        <p className="mt-6 text-xs text-white/80 sm:text-sm lg:mt-8">
          No credit card required <span aria-hidden="true">•</span> Free forever{' '}
          <span aria-hidden="true">•</span> Anonymous option available
        </p>
      </div>
    </section>
  );
};

export default CTASection;
