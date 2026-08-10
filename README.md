# Zytrion Platform

Next.js 14 · Supabase · Stripe · Resend · Anthropic API · Vercel

This is the real scaffold. As of July 16, 2026, the `lavonne-ux/Zytrion`
repository on GitHub contains only the default README from its initial
commit on May 26. Nothing else was ever pushed. This replaces that empty
state with Steps 1 and 2 of the Platform Build Specification's build
sequence: a migrated database and a deployable application shell. The
assessment engine, auth, portal, and payments (Step 3) build out on top
of this.

## Step 1 — Push this to GitHub, replacing the empty repo

From this folder:

```
git add .
git commit -m "Platform scaffold: schema, deploy shell, brand tokens"
git branch -M main
git remote add origin https://github.com/lavonne-ux/Zytrion.git
git push -u origin main --force
```

The `--force` is intentional and safe here. The existing repo holds
nothing but a placeholder README, so there is nothing to lose.

## Step 2 — Run the database migration

1. Go to supabase.com/dashboard and open (or create) the Zytrion project.
2. Go to **SQL Editor > New Query**.
3. Open `supabase/migrations/001_initial_schema.sql` in this folder, copy
   the entire file, paste it into the query editor, and run it.
4. Go to **Table Editor** and confirm all twenty tables appear: tiers,
   flows, pillars, tools, kits, kit_phases, maintenance_items,
   retake_bridges, certification_evidence_package, profiles, assessments,
   responses, pillar_scores, client_kit_enrollments,
   client_phase_progress, client_retakes,
   client_certification_submissions, public_proof_stats, payments.
5. Go to **Settings > API** and copy the Project URL, the `anon public`
   key, and the `service_role` key. Keep this tab open for Step 3.

## Step 3 — Deploy to Vercel

1. Go to vercel.com, **New Project**, and import `lavonne-ux/Zytrion`
   from GitHub.
2. Before the first deploy, open **Environment Variables** and add every
   value listed in `.env.example`: the three Supabase values from Step 2,
   the Stripe keys (test mode to start), the Resend key, and the
   Anthropic key.
3. Deploy. The build should succeed and show the Zytrion scaffold page,
   confirming the pipeline is live end to end.
4. Go to **Settings > Domains** and add `getzytrion.com`. Vercel shows
   the DNS records to add. Those records go into GoDaddy, where the
   domain currently lives, replacing the records that point to GoHighLevel.

Once this is live, the current getzytrion.com (the GHL-built interim
site) is no longer the production site. Do not delete the GHL site until
DNS has fully propagated and the new site is confirmed working.

## What this scaffold includes

- `supabase/migrations/001_initial_schema.sql` — the full schema from the
  Platform Build Specification and Portal Content Architecture, in
  dependency order, with row level security on every client-facing table.
- `src/lib/supabase/client.ts` and `server.ts` — the browser and server
  Supabase clients, keeping the service role key server-only as required.
- `src/app/` — the App Router shell with Zytrion brand tokens
  (`tailwind.config.ts`) wired in, so the deploy is provably live before
  any real UI is built on top of it.

## What this scaffold does not include yet

The assessment engine, authentication flow, portal UI, Stripe checkout,
and Resend email templates are Step 3 of the build sequence, built next,
in parallel, on top of this foundation.
