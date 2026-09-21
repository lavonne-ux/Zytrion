import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuyKitButton from "@/components/BuyKitButton";
import BuyManualButton from "@/components/BuyManualButton";
import BuyManualPrintButton from "@/components/BuyManualPrintButton";
import StatusBanner, { BANNERS } from "@/components/StatusBanner";

export default async function StorePage(props: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const sp = await props.searchParams;
  const cancelled = sp.purchase === "cancelled";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kits } = await supabase
    .from("kits")
    .select("id, title, kit_type, price_standard, price_extended, duration_days, purpose_statement")
    .order("tier_id");

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {cancelled && (
          <StatusBanner
            tone={BANNERS.purchase_cancelled.tone}
            title={BANNERS.purchase_cancelled.title}
            message={BANNERS.purchase_cancelled.message}
          />
        )}

        <p className="text-zy-light-blue text-lg font-bold tracking-wide uppercase mb-3">
          The Zytrion Store
        </p>
        <h1 className="text-3xl font-semibold mb-4">
          Not sure where to start? Take the free GRID Diagnostic first.
        </h1>
        <p className="text-zy-chrome mb-6 leading-relaxed">
          GRID tells you your tier in about fifteen minutes, free. Everything
          below is built to fix what it finds. Browse now, decide later.
        </p>
        <Link
          href="/assessment"
          className="inline-block mb-12 text-sm text-zy-light-blue underline hover:text-white"
        >
          Take the free GRID Diagnostic &rarr;
        </Link>

        <h2 className="text-xl font-semibold text-white mb-6">The Manual</h2>
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] mb-12">
          <h3 className="text-white font-semibold mb-1">Zytrion Enterprise in Motion</h3>
          <p className="text-sm text-zy-chrome mb-4">
            The complete governance operating system behind GRID, in one manual. The Three Flows, the Five Pillars, the Governance Equation, and the Zytrion Standard, explained in full, the same framework every Implementation Kit is built on.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <BuyManualButton label="Get the Digital Manual, $197" />
                <BuyManualPrintButton label="Get the Printed Edition, $397" />
              </>
            ) : (
              // Signed out, the price is still shown. Every kit on this page
              // displays its price to a visitor who has not logged in, and
              // the Manual was the one product that did not, which read as
              // unfinished next to six priced items. A prospect should never
              // have to create an account to find out what something costs.
              <>
                <Link
                  href="/login"
                  className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-3 rounded-md text-sm"
                >
                  Get the Digital Manual, $197
                </Link>
                <Link
                  href="/login"
                  className="border border-white/20 hover:border-white/40 transition-colors text-white font-medium px-6 py-3 rounded-md text-sm"
                >
                  Get the Printed Edition, $397
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-zy-chrome/70 mt-3">
            Printed Edition ships to US addresses only for now, shipping included in the price.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-white mb-6">Implementation Kits</h2>
        <div className="space-y-4">
          {kits?.map((kit) => (
            <div key={kit.id} className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
              <h3 className="text-white font-semibold mb-1">{kit.title}</h3>
              {kit.purpose_statement && (
                <p className="text-sm text-zy-chrome mb-4">{kit.purpose_statement}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {user || kit.kit_type === "sprint" ? (
                  <>
                    {kit.price_standard && (
                      <BuyKitButton
                        kitId={kit.id}
                        priceType="standard"
                        label={`Enroll, $${(kit.price_standard / 100).toLocaleString()}`}
                      />
                    )}
                    {kit.price_extended && (
                      <BuyKitButton
                        kitId={kit.id}
                        priceType="extended"
                        label={`Extended, $${(kit.price_extended / 100).toLocaleString()}`}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {kit.price_standard && (
                      <Link
                        href="/login"
                        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-3 rounded-md text-sm"
                      >
                        Enroll, ${(kit.price_standard / 100).toLocaleString()}
                      </Link>
                    )}
                    {kit.price_extended && (
                      <Link
                        href="/login"
                        className="bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-6 py-3 rounded-md text-sm"
                      >
                        Extended, ${(kit.price_extended / 100).toLocaleString()}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
