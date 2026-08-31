import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';


const platformLinks = [
  { id: 'footer-browse-properties', label: 'Browse Properties', to: '/write-review' },
  { id: 'footer-write-review', label: 'Write a Review', to: '/add-review' },
  { id: 'footer-how-it-works', label: 'How It Works', hash: 'how-it-works' },
];

const companyLinks = [
  { id: 'footer-about-us', label: 'About Us', to: '/about' },
  { id: 'footer-privacy-policy', label: 'Privacy Policy', to: '/privacy' },
  { id: 'footer-terms-of-service', label: 'Terms of Service', to: '/terms' },
];

const supportLinks = [
  { id: 'footer-help-center', label: 'Help Center', to: '/help' },
  { id: 'footer-contact-us', label: 'Contact Us', to: '/contact' },
  { id: 'footer-community-guidelines', label: 'Community Guidelines', to: '/guidelines' },
];

const LINK_CLASS =
  'text-sm text-[#D1D5DC] hover:text-white transition-colors focus:outline-none focus:underline rounded-sm';

const FooterColumn = ({ id, title, navLabel, links }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Smooth-scroll to an element by id. If we're not on the home page, navigate
  // home first and then scroll once the page is mounted.
  const handleHashClick = (e, hash) => {
    e.preventDefault();
    const scrollToTarget = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scrollToTarget, 100); // wait for the home page to render
    } else {
      scrollToTarget();
    }
  };

  return (
    <nav id={id} aria-label={navLabel}>
      <h3 className="text-base font-semibold mb-4 sm:mb-5 lg:mb-6 text-white">
        {title}
      </h3>
      <ul className="space-y-3 sm:space-y-4 list-none">
        {links.map((item) => (
          <li key={item.id}>
            {item.to ? (
              <Link id={item.id} to={item.to} className={LINK_CLASS}>
                {item.label}
              </Link>
            ) : (
              <a
                id={item.id}
                href={`#${item.hash}`}
                onClick={(e) => handleHashClick(e, item.hash)}
                className={`${LINK_CLASS} cursor-pointer`}
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer
      id="site-footer"
      className="bg-[#101828] text-white py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 mb-10 sm:mb-12">
          {/* Brand Column -spans full width on tablet, single col on desktop */}
          <div id="footer-brand" className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#41B985]" />
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#41B985] uppercase">
                RentReview
              </span>
            </div>
          
            <Link to="/" id="footer-brand-link" className="inline-block group">
              <p className="text-xl sm:text-2xl font-bold mb-3 tracking-tight group-hover:text-[#41B985] transition-colors">
                Rent<span className="text-[#41B985]">Review</span>
              </p>
            </Link>
            <p className="text-sm leading-relaxed text-[#D1D5DC] max-w-xs">
              Making rental decisions easier with verified reviews from real tenants.
            </p>
          </div>

          {/* Link Columns */}
          <FooterColumn
            id="footer-platform"
            title="Platform"
            navLabel="Platform links"
            links={platformLinks}
          />
          <FooterColumn
            id="footer-company"
            title="Company"
            navLabel="Company links"
            links={companyLinks}
          />
          <FooterColumn
            id="footer-support"
            title="Support"
            navLabel="Support links"
            links={supportLinks}
          />
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-[#1E2939] text-center">
          <p className="text-xs sm:text-sm text-[#D1D5DC]">
            © {new Date().getFullYear()} RentReview. All rights reserved.{' '}
            <span className="block sm:inline mt-1 sm:mt-0 text-[#9CA3AF]">
              Building trust in the rental community.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;