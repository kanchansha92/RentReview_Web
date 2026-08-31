import React from 'react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Divya Sharma',
    location: 'Bangalore, Karnataka',
    quote:
      '"RentReview saved me from making a terrible decision. I shared my honest review about my previous landlord and it felt great to warn others. The anonymous option gave me peace of mind."',
    rating: 5,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya',
  },
  {
    id: 2,
    name: 'Shankar Sharma',
    location: 'Mumbai, Maharashtra',
    quote:
      '"Finally found a platform where I could read honest experiences! Adding my review was so easy! I uploaded photos, rated everything, and submitted in just 10 minutes. Happy to help fellow renters!"',
    rating: 5,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shankar',
  },
  {
    id: 3,
    name: 'Diya Sharma',
    location: 'Pune, Maharashtra',
    quote:
      '"I love how detailed the reviews are! Photos, pros and cons - it\'s all there. I chose the verified option to give my positive review more credibility. Great platform to share both good and bad experiences!"',
    rating: 5,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya',
  },
];

const StarIcon = ({ className = 'h-4 w-4 sm:h-5 sm:w-5' }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 1L12.65 6.37L18.58 7.24L14.29 11.42L15.3 17.32L10 14.54L4.7 17.32L5.71 11.42L1.42 7.24L7.35 6.37L10 1Z"
      fill="#FDC700"
      stroke="#FDC700"
      strokeWidth="1.66651"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Testimonials = () => {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden bg-gradient-to-br from-[#41B985]/5 to-[#41B985]/10 px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <header className="mb-10 text-center sm:mb-12 lg:mb-16">
          <h2
            id="testimonials-heading"
            className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-4xl"
          >
            What Our Community Says
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#4A5565] sm:mt-4 sm:text-lg lg:text-xl">
            Real stories from real renters who found their perfect home
          </p>
        </header>

        {/* Testimonials -semantic list of blockquotes */}
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:gap-8">
          {TESTIMONIALS.map((t) => (
            <li key={t.id} className="h-full">
              <figure
                className="flex h-full flex-col rounded-[14px] bg-white p-5 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.08),0px_4px_6px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_15px_25px_-3px_rgba(0,0,0,0.12),0px_6px_10px_-4px_rgba(0,0,0,0.1)] sm:p-6"
              >
                {/* Rating -accessible to screen readers as a single statement */}
                <div
                  role="img"
                  aria-label={`Rated ${t.rating} out of 5 stars`}
                  className="mb-4 flex gap-0.5 sm:mb-5 sm:gap-1 lg:mb-6"
                >
                  {[...Array(t.rating)].map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>

                {/* The actual quote -semantic <blockquote> */}
                <blockquote className="flex-grow">
                  <p className="text-sm italic leading-relaxed text-[#364153] sm:text-base sm:leading-[26px]">
                    {t.quote}
                  </p>
                </blockquote>

                {/* Attribution -semantic <figcaption> + <cite> */}
                <figcaption className="mt-6 flex items-center gap-3 sm:mt-8">
                  <img
                    src={t.image}
                    alt=""
                    loading="lazy"
                    width="48"
                    height="48"
                    className="h-10 w-10 shrink-0 rounded-full bg-slate-100 object-cover sm:h-12 sm:w-12"
                  />
                  <div className="min-w-0">
                    <cite className="block truncate text-sm font-semibold not-italic text-[#101828] sm:text-base">
                      {t.name}
                    </cite>
                    <p className="truncate text-xs text-[#4A5565] sm:text-sm">
                      {t.location}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Testimonials;
