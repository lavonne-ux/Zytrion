# Deploy: password reset fix + Authority Matrix blank PDF fix

Two real bugs fixed, both verified with a full local build (`npm run build`
completed cleanly, zero errors) before being handed to you.

## Bug 1: Change/reset password never submits

Root cause: the "Choose a new password" page was waiting for a specific
Supabase event (`PASSWORD_RECOVERY`) that never fires under the app's
current auth setup, because the reset link skips the code-exchange step
your `/auth/callback` route already handles correctly for other links.
The page was stuck forever on "Verifying your reset link..." with the
button disabled — never actually broken by user error, always broken by
this timing gap.

Fix: the reset email link now routes through `/auth/callback` first (same
place your signup/login links already go), and the reset-password page
checks for a live session directly on load instead of waiting on an event
that was never going to arrive. If a link truly is expired or already
used, the page now says so plainly and points back to the request-a-new-link
page, instead of hanging silently.

Files changed:
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`

## Bug 2: Authority Matrix download renders a blank PDF

This one only started failing on the client profile that has a real
uploaded logo. The three tools you tested earlier this week (Organizational
Resolution, Compensation and Distribution Resolution, Financial Approval
Thresholds) were all tested before the logo feature existed — Authority
Matrix, going through the fallback template, was the first document ever
generated against a real client logo, and it's the logo that broke it.

The old code handed react-pdf a raw web address for the logo and made it
fetch and decode the image itself, mid-render, inside the server function.
That is a fragile step — any slowness, format quirk, or fetch failure there
takes the entire document down with it, silently, with no error surfaced
anywhere. The fix does the fetching ourselves, up front, with a well-tested
method, then re-encodes the image into a plain format every PDF viewer and
decoder can read before it ever reaches react-pdf. If a logo genuinely
can't be processed for any reason, the document now still generates —
just without the logo — rather than coming out blank. And if a real render
failure ever does happen for some other reason, you'll now get a clear
error message instead of a mystery blank file.

New dependency: `sharp` (industry-standard image library, already
supported natively on Vercel).

Files changed:
- `src/app/api/tools/generate-pdf/route.ts`
- `src/app/api/tools/generate-pdf-preview/route.ts`
- `src/lib/pdf/ToolDocumentPdf.tsx`
- `src/lib/pdf/ResolutionDocument.tsx`
- `src/lib/pdf/ThresholdsDocument.tsx`
- `package.json` / `package-lock.json` (added `sharp`)

New file:
- `src/lib/pdf/normalizeLogo.ts`

## PowerShell steps

Run these from your project folder
(`C:\Users\llnor\OneDrive\Zytrion Documents\Vercel Build\zytrion-platform-scaffold\zytrion-platform`).

1. Pull or copy over the changed files listed above from this session's
   output into their matching paths (same folder structure as always).

2. Install the new dependency:
   ```
   npm install sharp
   ```

3. Build locally to confirm before pushing:
   ```
   npm run build
   ```
   This should complete with no errors. If OneDrive throws an EPERM/unlink
   error on `.next` again, delete the `.next` folder and rebuild once, same
   as last time.

4. Commit and push:
   ```
   git add src/app/forgot-password/page.tsx src/app/reset-password/page.tsx src/app/api/tools/generate-pdf/route.ts src/app/api/tools/generate-pdf-preview/route.ts src/lib/pdf/ToolDocumentPdf.tsx src/lib/pdf/ResolutionDocument.tsx src/lib/pdf/ThresholdsDocument.tsx src/lib/pdf/normalizeLogo.ts package.json package-lock.json
   git commit -m "Fix password reset stuck state and blank PDF on logo-bearing documents"
   git push
   ```

5. After Vercel finishes deploying, verify:
   - Request a password reset for a real account, click the email link,
     confirm the button is enabled immediately (no more stuck "Verifying"
     message) and the password actually updates.
   - On the Norrils Signature Consulting Inc. profile (the one with the
     logo already uploaded), download the Authority Matrix PDF again and
     confirm it now shows real content with the logo in the letterhead.
   - Spot check one of the three already-working documents (Organizational
     Resolution is the fastest) still downloads correctly, to confirm the
     logo-handling change didn't disturb anything already working.
