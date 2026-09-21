// src/app/robots.ts
// Generates /robots.txt automatically. Blocks auth pages from being indexed,
// points crawlers to the sitemap.

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /results carries a named business and its governance score, and
      // /portal and /admin are client work. None of it belongs in a search
      // index. The pages also send noindex headers of their own, so a
      // crawler that ignores this file still gets told.
      disallow: ['/login', '/signup', '/results', '/portal', '/admin'],
    },
    sitemap: 'https://www.getzytrion.com/sitemap.xml',
  };
}
