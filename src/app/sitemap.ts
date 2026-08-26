// src/app/sitemap.ts
// Generates /sitemap.xml automatically from this list. Add new public pages
// here as they go live; login/signup are intentionally excluded.

import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.getzytrion.com';
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/assessment`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/store`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
