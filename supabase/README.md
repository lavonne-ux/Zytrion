# Database, how it is kept

## The rule

`schema.sql` in this folder is the single source of truth for the database
structure. It was read back out of the live production database on
21 September 2026, so it describes what is actually running.

When you change the schema:

1. Apply the change as a numbered migration in `supabase/migrations/`.
2. Regenerate `schema.sql` from the live database afterwards.

Both steps, every time. The migration records why the change happened, the
schema file records where things ended up. Skipping the second step is what
created the problem described below.

## Why this exists

Before this, the database could not be rebuilt from the repository.

Two sets of migrations existed side by side:

- `supabase/migrations/` — `001_initial_schema`, `002_seed_reference_data`,
  `003_anonymous_assessment_support`
- the project root — `migration_003` through `migration_010`

Neither set was complete, and both numbered from 003, so there was no way to
tell what order anything ran in. Several things the application depends on
existed only in production, applied by hand and never written down anywhere:

| Object | What it does | Where it was recorded |
| --- | --- | --- |
| `assessments.full_report_paid_at` | Decides whether a paying customer can see the Full Report | Nowhere |
| `assessments.stripe_checkout_session_id` | Links an assessment to its payment | Nowhere |
| `assessments.full_report_requested_at` | Written by an unused route | Nowhere |
| `tools.field_schema` | What every interactive tool in the portal renders from | Nowhere |

A clean rebuild from version control would have produced a platform where
the portal rendered nothing and nobody could open what they had paid for.

## The old migration files

They are kept, not deleted. They are the history of how the schema got here
and some of them carry seed data that a rebuild still needs.

What they are **not** is a way to rebuild the database. Use `schema.sql` for
structure and the seed migrations for reference content.

When there is time, the root-level `migration_00*.sql` files should be moved
into `supabase/migrations/` and renumbered in the order they were actually
applied, so there is one sequence rather than two. That is tidying, not
urgent, because `schema.sql` now covers the rebuild case.

## Rebuilding from nothing

1. Create an empty Supabase project.
2. Run `schema.sql`.
3. Run the seed migrations for reference content: tiers, pillars, flows,
   kits, kit phases, tools, maintenance items, retake bridges, knowledge
   base. These live in `002_seed_reference_data.sql`, `migration_003.sql`
   and `migration_004.sql`.
4. Create the three storage buckets listed at the end of `schema.sql`.
5. Set the environment variables the application expects. The full list is
   in `.env.example`, which was missing `STRIPE_PRICE_ID` and
   `STATS_REFRESH_SECRET` as of this writing.

## Things worth knowing

**`is_platform_admin()` must keep EXECUTE granted to `public`, `anon` and
`authenticated`.** Nearly every policy calls it. Revoking those grants does
not harden anything, it makes the policies fail and takes the portal down.
This has happened before. The function is `security definer` and reads only
the caller's own profile row, so the broad grant exposes nothing.

**Some tables deliberately have no insert or update policy.** Payments,
print orders and phase review decisions are written by the Stripe webhook
and server routes through the service role, which bypasses RLS. A client
must never be able to write their own payment record or approve their own
phase.

**Supabase installs an `ensure_rls` event trigger** that switches RLS on
automatically for any new table in the `public` schema. A table created
without a policy is therefore unreadable rather than exposed. If a new table
seems to return nothing, this is usually why: it needs a policy.

**`handle_new_user()` claims anonymous assessments.** When an account is
created, any GRID assessment taken earlier under the same email and not yet
linked to anyone is attached to the new account. The portal also performs
this check on each visit, which covers the case where someone takes the
diagnostic again after their account already exists.
