# Zytrion Platform Changelog

All notable builds to the GRID Diagnostic platform, tracked here going forward.

## Build 8, August 11, 2026
- Added plain-language explanation for whichever pillar scores lowest
- Added institution-ready caveat when total score qualifies for Tier 1 but a single pillar falls below the Certification Rubric's 10/16 floor
- Started this changelog for ongoing project tracking

## Build 7, August 11, 2026
- Fixed payment status race condition by verifying directly with Stripe on return from checkout, not relying on webhook timing alone

## Build 6, August 11, 2026
- Added Stripe checkout and webhook for Full Report paywall ($497)
- Made Stripe client lazy-load to prevent build failures on missing keys

## Build 5, August 11, 2026
- Added logo and full brand lockup to landing page
- Fixed scroll-to-top bug when advancing through assessment sections
- Increased results page header and score circle sizing

## Build 4, August 11, 2026
- Replaced placeholder mailto CTA with database-backed Full Report request capture
- Fixed real Zytrion orb logo asset (extracted transparent PNG from source brand file)
- Fixed Public/public folder casing bug that broke asset loading on Vercel

## Build 3, August 11, 2026
- Added logo, contact footer, and print/download button to results page

## Build 2, August 10, 2026
- Built and deployed the live GRID Diagnostic engine: landing page, 40-statement assessment, scoring, results page with pillar breakdown

## Build 1, August 10, 2026
- Supabase schema migrated, code pushed to GitHub, app deployed to Vercel
