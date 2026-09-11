

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '..', 'public', 'sitemap.xml');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://rentreview.in').replace(/\/+$/, '');


const API_BASE_URL = (process.env.SITEMAP_API_URL || process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const today = () => new Date().toISOString().slice(0, 10);


const STATIC_PAGES = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/write-review', changefreq: 'daily', priority: '0.9' },
    { loc: '/map', changefreq: 'daily', priority: '0.7' },
    { loc: '/about', changefreq: 'monthly', priority: '0.6' },
    { loc: '/guidelines', changefreq: 'monthly', priority: '0.5' },
    { loc: '/help', changefreq: 'monthly', priority: '0.5' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { loc: '/cookies', changefreq: 'yearly', priority: '0.3' },
    { loc: '/security', changefreq: 'yearly', priority: '0.3' },
    // Higher than the other legal pages on purpose: someone searching for how
    // to complain about a review written about them needs to find this, and
    // publishing it is a regulatory obligation rather than a nicety.
    { loc: '/grievance', changefreq: 'yearly', priority: '0.5' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
];

const xmlEscape = (s) =>
    String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

async function fetchAllProperties() {
    if (!API_BASE_URL) {
        console.warn('[sitemap] No SITEMAP_API_URL / VITE_API_BASE_URL set - writing static pages only.');
        return [];
    }
    if (/localhost|127\.0\.0\.1/.test(API_BASE_URL)) {
        console.warn(`[sitemap] API_BASE_URL (${API_BASE_URL}) looks like a local dev server - writing static pages only. Set SITEMAP_API_URL to the production API in the build environment to include property pages.`);
        return [];
    }

    const all = [];
    let page = 1;
    let totalPages = 1;
    try {
        do {
            const res = await fetch(`${API_BASE_URL}/properties?limit=500&page=${page}`);
            if (!res.ok) throw new Error(`GET /properties?page=${page} -> ${res.status}`);
            const data = await res.json();
            all.push(...(Array.isArray(data.properties) ? data.properties : []));
            totalPages = data.totalPages || 1;
            page += 1;
        } while (page <= totalPages);
        return all;
    } catch (err) {
        console.warn(`[sitemap] Failed to fetch properties (${err.message}) - writing static pages only.`);
        return [];
    }
}

function buildXml(properties) {
    const urls = [
        ...STATIC_PAGES.map(
            (p) => `  <url>
    <loc>${xmlEscape(SITE_URL + p.loc)}</loc>
    <lastmod>${today()}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
        ),
        ...properties.map((prop) => {
            const lastmod = prop.updatedAt ? new Date(prop.updatedAt).toISOString().slice(0, 10) : today();
            return `  <url>
    <loc>${xmlEscape(`${SITE_URL}/property/${prop._id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

const properties = await fetchAllProperties();
const xml = buildXml(properties);
writeFileSync(OUT_FILE, xml, 'utf8');
console.log(`[sitemap] Wrote ${STATIC_PAGES.length} static + ${properties.length} property URLs to ${path.relative(process.cwd(), OUT_FILE)}`);
