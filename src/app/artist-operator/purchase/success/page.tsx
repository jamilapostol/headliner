import type { Metadata } from "next";
import Link from "next/link";
import { BUNDLES, bySlug } from "@content/products";
import { stripe } from "@/lib/stripe";
import { signProductFiles } from "@/lib/store/supabase";
import { Eyebrow } from "@/components/store/store-ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your download", robots: { index: false, follow: false } };

// The session id in the URL is a claim, not proof. It is verified against
// Stripe server-side and the payment status checked before a single signed
// link is generated — otherwise anyone who guessed or reused an id would be
// handed the paid files.

async function resolve(sessionId: string | undefined) {
  if (!sessionId || !stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return null;

    const slug = session.metadata?.slug ?? "";
    const type = session.metadata?.type ?? "pack";
    const product = type === "bundle" ? BUNDLES.find((b) => b.slug === slug) : bySlug(slug);
    if (!product) return null;

    const files = await signProductFiles(product.files);
    return { title: product.title, email: session.customer_details?.email ?? null, files };
  } catch {
    return null;
  }
}

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const result = await resolve(session_id);

  if (!result) {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-24 text-center sm:px-8">
        <h1 data-no-rule className="mb-3 text-[26px] tracking-[-.01em]">We couldn&rsquo;t verify that purchase</h1>
        <p className="mb-8 text-[15px] leading-relaxed text-text/65">
          If you&rsquo;ve just paid, your download links are in your email. If nothing arrives in a few minutes, reply to
          the receipt and a human will sort it out.
        </p>
        <Link href="/artist-operator/packs" className="text-accent hover:underline">
          Back to the packs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 py-16 text-center sm:px-8 sm:py-24">
      <Eyebrow className="mb-4">Purchase complete</Eyebrow>
      <h1 data-no-rule className="mb-4 font-label text-[26px] leading-[1.3] font-light tracking-[.015em] text-accent sm:text-[30px]">
        {result.title} is yours.
      </h1>
      <p className="mx-auto mb-9 max-w-[460px] text-[15px] leading-[1.6] text-text/65">
        We&rsquo;ve emailed these to you as well{result.email ? `, at ${result.email}` : ""}. The links work for 7 days —
        save the files somewhere real.
      </p>

      <div className="mx-auto flex max-w-[440px] flex-col gap-2.5 text-left">
        {result.files.map((f) =>
          f.url ? (
            <a
              key={f.path}
              href={f.url}
              className="min-h-[44px] rounded-[6px] bg-accent px-5 py-3.5 text-center text-[15px] font-bold text-ink transition-[filter] hover:brightness-105"
            >
              Download {f.path.split("/").pop()}
            </a>
          ) : (
            <div key={f.path} className="rounded-[6px] border border-orange/30 bg-orange/[.06] px-5 py-3.5 text-[13.5px] text-text/70">
              {f.path.split("/").pop()} couldn&rsquo;t be prepared — it&rsquo;s in your email, or reply and we&rsquo;ll send it.
            </div>
          )
        )}
      </div>
    </div>
  );
}
