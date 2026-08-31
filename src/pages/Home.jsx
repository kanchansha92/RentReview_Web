import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import StatsSection from '../components/StatsSection';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';
import useSeo from '../hooks/useSeo';

const Home = () => {

  useSeo({
    title: 'RentReview  Verified Rental Reviews from Real Tenants',
    description:
      'Read and write honest rental property reviews. Find apartments, houses and condos rated by verified tenants across India.',
    path: '/',
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <main>
        <Hero />

        <StatsSection />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
