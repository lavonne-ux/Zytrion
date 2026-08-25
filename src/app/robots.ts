// src/app/robots.ts
// Generates /robots.txt automatically. Blocks auth pages from being indexed,
// points crawlers to the sitemap.

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/signup'],
    },
    sitemap: 'https://www.getzytrion.com/sitemap.xml',
  };
}
