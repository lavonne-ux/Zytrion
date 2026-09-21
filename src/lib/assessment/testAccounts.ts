// Addresses used as the internal test environment, not real diagnostics.
//
// lavonne@norrilssignature.com is the founder's own test account, used to
// walk the whole platform end to end whenever something changes. Those
// runs are real rows in the assessments table and should stay there, they
// are the record of what was tested and when. What they must never do is
// count as public proof, inflate the founder notification counter, or
// consume any of the 1,000 founding-free diagnostics.
//
// Defined once, here, so a new surface that reports a count cannot quietly
// disagree with the others. Matching is case-insensitive, since the address
// typed into the assessment form is not always capitalized the same way.
export const TEST_ACCOUNT_EMAILS = ["lavonne@norrilssignature.com"];

// Applies the exclusion to any Supabase query builder over a table with a
// contact_email column. Chained "not ilike" filters combine as AND, which
// is exactly "none of these addresses", and it avoids the quoting rules of
// a PostgREST "in" list entirely.
export function excludeTestAccounts<T>(query: T): T {
  let q = query as any;
  for (const email of TEST_ACCOUNT_EMAILS) {
    q = q.not("contact_email", "ilike", email);
  }
  return q as T;
}
