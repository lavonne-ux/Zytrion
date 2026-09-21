// A single place to say what just happened.
//
// Checkout and auth both redirect back carrying a query parameter that says
// how it went: ?purchase=cancelled, ?enrolled=1, ?error=auth and so on.
// Nothing read any of them, so a customer who abandoned a checkout, or
// whose sign-in link failed, landed on an ordinary page with no
// acknowledgement of either. Silence after a payment step is the moment a
// customer emails to ask whether they have been charged twice.

export type BannerTone = "success" | "notice" | "error";

const TONES: Record<BannerTone, { border: string; bg: string; label: string; body: string }> = {
  success: {
    border: "border-zy-electric/40",
    bg: "bg-zy-electric/5",
    label: "text-zy-electric",
    body: "text-zy-chrome",
  },
  notice: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    label: "text-amber-400",
    body: "text-amber-100/90",
  },
  error: {
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    label: "text-red-400",
    body: "text-red-100/90",
  },
};

export default function StatusBanner({
  tone,
  title,
  message,
}: {
  tone: BannerTone;
  title: string;
  message: string;
}) {
  const t = TONES[tone];
  return (
    <div className={`mb-8 border ${t.border} ${t.bg} rounded-lg px-6 py-4`}>
      <p className={`text-xs uppercase tracking-wide mb-1 ${t.label}`}>{title}</p>
      <p className={`text-sm leading-relaxed ${t.body}`}>{message}</p>
    </div>
  );
}

// The messages, kept together so the same event never reads two different
// ways on two different pages.
export const BANNERS: Record<string, { tone: BannerTone; title: string; message: string }> = {
  purchase_cancelled: {
    tone: "notice",
    title: "Checkout cancelled",
    message:
      "Nothing was charged and nothing was purchased. You can start the checkout again whenever you are ready.",
  },
  manual_purchased: {
    tone: "success",
    title: "Manual purchased",
    message:
      "Your payment went through. The download is in the Your Manual section below, watermarked to your name.",
  },
  manual_print_ordered: {
    tone: "success",
    title: "Printed Edition ordered",
    message:
      "Your payment went through and your shipping address is on file. Your order status is in the Your Manual section below, and a receipt is on its way to your email.",
  },
  enrolled: {
    tone: "success",
    title: "Enrolment confirmed",
    message: "Your kit is active. It is listed under Your Kits below, starting at phase one.",
  },
  enrolled_login: {
    tone: "success",
    title: "Purchase confirmed",
    message: "Sign in to reach your kit. It is waiting in your portal.",
  },
  auth_error: {
    tone: "error",
    title: "That sign-in link did not work",
    message:
      "The link may have expired or already been used. Request a new one, or sign in with your password below.",
  },
  report_cancelled: {
    tone: "notice",
    title: "Checkout cancelled",
    message:
      "Nothing was charged. Your score and pillar breakdown are still here, and the Full Report is still available whenever you want it.",
  },
};
