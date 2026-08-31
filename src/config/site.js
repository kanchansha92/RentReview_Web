
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://rentreview.in').replace(/\/+$/, '');

export const SITE_NAME = 'RentReview';


export const absoluteUrl = (path = '/') => {
    if (!path) return SITE_URL;
    if (/^https?:\/\//i.test(path)) return path;
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};


export const DEFAULT_OG_IMAGE = absoluteUrl('/og-image.jpg');

// Organization/schema.org logo. Google's logo guidelines want a real raster
// image (not SVG) at least 112×112.
export const LOGO_URL = absoluteUrl('/logo.png');

export default SITE_URL;
