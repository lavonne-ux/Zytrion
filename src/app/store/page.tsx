import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuyKitButton from "@/components/BuyKitButton";

export default async function StorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kits } = await supabase
    .from("kits")
    .select("id, title, price_standard, price_extended, duration_days, purpose_statement")
    .order("tier_id");

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="gradient-text text-sm font-medium tracking-wide uppercase mb-3">
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

        <h2 className="text-xl font-semibold text-white mb-6">Implementation Kits</h2>
        <div className="space-y-4">
          {kits?.map((kit) => (
            <div key={kit.id} className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
              <h3 className="text-white font-semibold mb-1">{kit.title}</h3>
              {kit.purpose_statement && (
                <p className="text-sm text-zy-chrome mb-4">{kit.purpose_statement}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {user ? (
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
