import Link from "next/link";

export function PastDueBanner() {
  return (
    <div className="flex flex-none items-center justify-center gap-3 bg-orange px-4 py-2 text-[12.5px] font-medium text-ink">
      <span>Your last payment failed. Update your card to keep your plan active.</span>
      <Link href="/app/billing" className="cursor-pointer rounded-md bg-ink/15 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-ink/25">
        Update billing
      </Link>
    </div>
  );
}
