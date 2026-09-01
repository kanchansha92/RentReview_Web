import React from 'react';
import { Stagger, StaggerItem, CountUp, fadeUp } from '../animations';

const STATS = [
  { label: 'Properties Reviewed', value: '10,000+' },
  { label: 'Reviews Submitted', value: '25,000+' },
  { label: 'Active Contributors', value: '50,000+' },
  { label: 'Platform Rating', value: '4.8/5' },
];

const StatsSection = () => {
  return (
    <section
      aria-labelledby="stats-heading"
      className="bg-[#3EB489] py-8 sm:py-10 md:py-12 lg:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Visually hidden heading -read by screen readers and indexed by crawlers */}
        <h2 id="stats-heading" className="sr-only">
          RentReview by the numbers
        </h2>

        {/* Description list -each stat is a (term, definition) pair, the correct
            semantic markup for a stats grid. <Stagger> renders that same <dl>;
            it only adds the shared scroll timeline the four stats ride in on. */}
        <Stagger
          as="dl"
          stagger={0.1}
          className="grid grid-cols-2 gap-y-8 gap-x-4 md:grid-cols-4 md:gap-4 lg:gap-6"
        >
          {STATS.map((stat) => (
            <StaggerItem
              key={stat.label}
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              {/* CountUp keeps the real value in the markup and ticks up to it
                  once the row scrolls into view -it falls back to the plain
                  number when the reader prefers reduced motion. */}
              <dd className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl xl:text-[2.75rem]">
                <CountUp value={stat.value} />
              </dd>
              <dt className="mt-1 text-xs font-medium text-white/90 sm:mt-2 sm:text-sm lg:text-base">
                {stat.label}
              </dt>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

export default StatsSection;
