import React from 'react';
import { ShieldCheck, Search, Users, MessageSquare } from 'lucide-react';
import { Reveal, Stagger, StaggerItem, motion, fadeUp } from '../animations';

const FEATURES = [
  {
    title: 'Verified and Anonymous',
    description: 'Choose to submit reviews with ID verification for credibility or anonymously to protect your privacy.',
    icon: ShieldCheck,
    iconColor: '#41B985',
    iconBg: 'rgba(65, 185, 133, 0.1)',
  },
  {
    title: 'Easy Submission',
    description: 'Add your rental review in minutes with our simple form. Share photos, rate amenities, and provide details.',
    icon: Search,
    iconColor: '#155DFC',
    iconBg: '#DBEAFE',
  },
  {
    title: 'Help Your Community',
    description: 'Your honest review helps thousands of renters avoid bad landlords and find quality properties.',
    icon: Users,
    iconColor: '#9810FA',
    iconBg: '#F3E8FF',
  },
  {
    title: 'Share Complete Details',
    description: 'Rate maintenance, landlord responsiveness, neighborhood safety, and more to give a full picture.',
    icon: MessageSquare,
    iconColor: '#F54900',
    iconBg: '#FFEDD4',
  },
];

const Features = () => {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="bg-[#F9FAFB] py-12 sm:py-14 md:py-16 lg:py-20 xl:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <Reveal as="header" className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-12 sm:space-y-4 lg:mb-16">
          <h2
            id="features-heading"
            className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-4xl"
          >
            Why Choose RentReview?
          </h2>
          <p className="text-base text-[#4A5565] sm:text-lg md:text-xl">
            We provide the tools and community you need to make confident rental decisions
          </p>
        </Reveal>

        {/* Features list -semantic <ul> since these are a list of items.
            <Stagger>/<StaggerItem> render the same <ul>/<li>; the cards just
            share one scroll timeline so they arrive left-to-right. */}
        <Stagger as="ul" stagger={0.09} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-6 xl:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem
                as="li"
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col space-y-4 rounded-[14px] bg-white p-5 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.08),0px_4px_6px_-4px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0px_15px_25px_-3px_rgba(0,0,0,0.12),0px_6px_10px_-4px_rgba(0,0,0,0.1)] sm:space-y-5 sm:p-6 lg:p-7 lg:space-y-6"
              >
                {/* The icon tile gets its own small pop on card hover -it is the
                    one element in the card with enough contrast to carry it. */}
                <motion.div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] sm:h-14 sm:w-14 sm:rounded-[14px]"
                  style={{ backgroundColor: feature.iconBg }}
                  aria-hidden="true"
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <Icon
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    style={{ color: feature.iconColor }}
                    strokeWidth={2.3}
                  />
                </motion.div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg font-semibold text-[#101828] sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#4A5565] sm:text-[15px]">
                    {feature.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
};

export default Features;
