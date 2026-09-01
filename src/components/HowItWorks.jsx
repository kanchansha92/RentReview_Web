import React from 'react';
import { Reveal, Stagger, StaggerItem, motion, fadeUp, EASE, VIEWPORT } from '../animations';

const STEPS = [
  {
    number: '01',
    title: 'Search Your Property',
    description:
      'Enter your rental property address or search for it in our database to get started.',
  },
  {
    number: '02',
    title: 'Write Your Review',
    description:
      'Share your experience about the landlord, maintenance, amenities, neighborhood, and overall living conditions.',
  },
  {
    number: '03',
    title: 'Submit & Help Others',
    description:
      'Choose verified or anonymous submission. Your review helps future tenants make better rental decisions.',
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="overflow-hidden bg-white py-12 sm:py-14 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <Reveal as="header" className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-12 sm:space-y-4 md:mb-16 lg:mb-20">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-4xl"
          >
            How RentReview Works
          </h2>
          <p className="text-base text-[#4A5565] sm:text-lg md:text-xl">
            Get started in three simple steps and join our trusted community
          </p>
        </Reveal>

        <div className="relative">
          {/* Horizontal connector line -md+ only, positioned through circle centers.
              It draws itself out from the centre as the section arrives, which is
              what makes the three steps read as one sequence rather than three
              unrelated cards. scaleX is a cheap, compositor-only animation. */}
          <motion.div
            aria-hidden="true"
            className="absolute left-[16.67%] right-[16.67%] hidden h-px origin-center bg-[#D1D5DC] md:top-7 md:block lg:top-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
          />

          {/* Steps -semantic ordered list since order matters */}
          <Stagger
            as="ol"
            stagger={0.14}
            delayChildren={0.1}
            className="relative z-10 grid list-none grid-cols-1 gap-10 md:grid-cols-3 md:gap-6 lg:gap-12"
          >
            {STEPS.map((step, index) => (
              <StaggerItem
                as="li"
                key={step.number}
                variants={fadeUp}
                className="flex flex-col items-center text-center"
              >
                {/* Numbered circle -decorative, hidden from screen readers (the <ol> provides order semantically) */}
                <motion.div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#3EB489] text-xl font-bold text-white shadow-sm lg:h-16 lg:w-16 lg:text-2xl"
                  variants={{
                    hidden: { scale: 0.5, opacity: 0 },
                    show: {
                      scale: 1,
                      opacity: 1,
                      transition: { type: 'spring', stiffness: 260, damping: 18 },
                    },
                  }}
                >
                  {step.number}
                </motion.div>

                <div className="mt-4 space-y-2 px-2 sm:mt-5 sm:space-y-3 sm:px-4 md:mt-6">
                  <h3 className="text-lg font-semibold text-[#101828] sm:text-xl lg:text-2xl">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#4A5565] sm:text-base">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
