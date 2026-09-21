"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile, on the one route anyone can reach without an
// account. A single Diagnostic submission writes roughly fifty rows and
// sends two emails, so an unattended script pointed at it is expensive in
// storage, in Resend volume, and in the founder's inbox.
//
// The site key is public by design. It is visible in the page source of
// every site that uses Turnstile, which is why it sits here rather than in
// a secret. The environment variable is honoured first so the key can be
// changed without a code change, with the live key as the fallback so a
// missing variable never silently removes the widget.
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAE-iEAU8mefU8oB9";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// How long to wait for Cloudflare's script before giving up on it. A
// founder on hotel wifi should not sit in front of a spinner because a
// third party is slow.
const LOAD_TIMEOUT_MS = 8000;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export default function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // The callback is held in a ref so this effect runs exactly once. A
  // parent passing an inline arrow function would otherwise re-run it on
  // every render and stack up widgets.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let cancelled = false;

    function giveUp() {
      if (cancelled) return;
      setUnavailable(true);
      onTokenRef.current(null);
    }

    function render() {
      if (cancelled) return;
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          callback: (token: string) => {
            if (!cancelled) onTokenRef.current(token);
          },
          "error-callback": () => {
            giveUp();
          },
          "expired-callback": () => {
            if (cancelled) return;
            onTokenRef.current(null);
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
        });
      } catch {
        giveUp();
      }
    }

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`
      );
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", giveUp);
    }

    // The script is served by a third party. If it is blocked by a
    // corporate proxy, an extension, or is simply slow, the person still
    // finishes their Diagnostic. The server decides what to do with a
    // submission that carries no token.
    const timer = setTimeout(() => {
      if (!cancelled && !window.turnstile) giveUp();
    }, LOAD_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Already gone. Nothing to do and nothing worth reporting.
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (unavailable) {
    // Deliberately quiet. This is not the person's fault and there is
    // nothing for them to do about it, so it does not get an error colour
    // or a retry button that would only fail the same way.
    return (
      <p className="mt-6 text-xs text-zy-chrome/60">
        The security check could not load. You can continue.
      </p>
    );
  }

  return <div ref={containerRef} className="mt-6" />;
}
