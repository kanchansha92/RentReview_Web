import React, { useEffect, useRef } from 'react';

// The publisher id comes from the environment -no placeholder ships to prod.
// With VITE_ADSENSE_CLIENT unset the component renders nothing at all.
const ENV_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || '';
const ENV_SLOT = import.meta.env.VITE_ADSENSE_SLOT || '';


const isPlaceholder = (value) => !value || /^X+$/i.test(value);

const GoogleAd = ({ client = ENV_CLIENT, slot = ENV_SLOT, format = 'auto', responsive = 'true' }) => {
  // AdSense throws on a second push for the same <ins>, and StrictMode mounts
  // every effect twice -so push at most once per mounted element.
  const pushedRef = useRef(false);

  const configured = !isPlaceholder(client) && !isPlaceholder(slot);

  useEffect(() => {
    if (!configured) return;

    // Load the adsbygoogle script if it's not already there
    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    if (pushedRef.current) return;
    pushedRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Google Ads error:', e);
    }
  }, [client, configured]);

  // Not fully configured -render nothing rather than an empty ad frame.
  if (!configured) return null;

  return (
    <div className="w-full flex justify-center my-6 overflow-hidden bg-gray-50 rounded shadow-sm border border-gray-100 p-2">
      <ins
        className="adsbygoogle w-full max-w-5xl"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
      {/* For local testing visibility, an ad might not show if the domains aren't verified out-of-the-box */}
    </div>
  );
};

export default GoogleAd;
