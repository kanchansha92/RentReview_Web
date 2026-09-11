import { useEffect } from 'react';
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, absoluteUrl } from '../config/site';

 
const upsert = (selector, tagName, attrs) => {
    let el = document.head.querySelector(selector);
    const created = !el;
    const prevAttrs = created ? null : Array.from(el.attributes).map((a) => [a.name, a.value]);

    if (created) {
        el = document.createElement(tagName);
        document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

    return () => {
        if (created) {
            if (el.parentNode) el.parentNode.removeChild(el);
            return;
        }
        // Restore exactly what was there: drop attributes this call added
        // that didn't previously exist, then put back the original values.
        const prevKeys = new Set(prevAttrs.map(([k]) => k));
        Array.from(el.attributes).forEach((a) => {
            if (!prevKeys.has(a.name)) el.removeAttribute(a.name);
        });
        prevAttrs.forEach(([k, v]) => el.setAttribute(k, v));
    };
};


export default function useSeo({
    title,
    description,
    path,
    image,
    type = 'website',
    noindex = false,
    robots,
}) {
    useEffect(() => {
    
        if (!title && !description && !path && !image && !robots && !noindex) return undefined;

        const cleanups = [];

        if (title) {
            const prevTitle = document.title;
            document.title = title;
            cleanups.push(() => { document.title = prevTitle; });
        }

        if (description) {
            cleanups.push(upsert('meta[name="description"]', 'meta', { name: 'description', content: description }));
        }

        const robotsContent = robots || (noindex ? 'noindex, nofollow' : 'index, follow');
        cleanups.push(upsert('meta[name="robots"]', 'meta', { name: 'robots', content: robotsContent }));

        const canonicalUrl = path ? absoluteUrl(path) : null;
        if (canonicalUrl) {
            cleanups.push(upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: canonicalUrl }));
        }

        const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
        const ogTitle = title || SITE_NAME;
        const ogDescription = description || '';

        cleanups.push(upsert('meta[property="og:type"]', 'meta', { property: 'og:type', content: type }));
        cleanups.push(upsert('meta[property="og:site_name"]', 'meta', { property: 'og:site_name', content: SITE_NAME }));
        cleanups.push(upsert('meta[property="og:title"]', 'meta', { property: 'og:title', content: ogTitle }));
        if (ogDescription) {
            cleanups.push(upsert('meta[property="og:description"]', 'meta', { property: 'og:description', content: ogDescription }));
        }
        cleanups.push(upsert('meta[property="og:image"]', 'meta', { property: 'og:image', content: ogImage }));
        if (canonicalUrl) {
            cleanups.push(upsert('meta[property="og:url"]', 'meta', { property: 'og:url', content: canonicalUrl }));
        }

        cleanups.push(upsert('meta[name="twitter:card"]', 'meta', { name: 'twitter:card', content: 'summary_large_image' }));
        cleanups.push(upsert('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: ogTitle }));
        if (ogDescription) {
            cleanups.push(upsert('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: ogDescription }));
        }
        cleanups.push(upsert('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: ogImage }));

        // Cleanups run in reverse so the outermost (title) restores last,
        // though order doesn't actually matter here each tag is independent.
        return () => { cleanups.forEach((fn) => fn()); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, path, image, type, noindex, robots]);
}

export { SITE_URL, SITE_NAME };
