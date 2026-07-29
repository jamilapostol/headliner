import { db } from "@/lib/db";
import { unsubscribeFan } from "@/lib/actions/unsubscribe";
import { verifyFanToken } from "@/lib/unsubscribe-token";

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ fanId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { fanId } = await params;
  const { t: token } = await searchParams;
  const fan = await db.fan.findUnique({ where: { id: fanId } });

  if (!fan || !verifyFanToken(fanId, token)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-text" data-theme="dark">
        <div className="text-[18px] font-semibold">Link not found</div>
        <div className="mt-1.5 text-[13.5px] text-white/55">This unsubscribe link isn&rsquo;t valid.</div>
      </div>
    );
  }

  if (fan.unsubscribed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-text" data-theme="dark">
        <div className="text-[18px] font-semibold">You&rsquo;re unsubscribed</div>
        <div className="mt-1.5 text-[13.5px] text-white/55">{fan.email} won&rsquo;t receive further campaign emails.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-text" data-theme="dark">
      <div className="w-full max-w-[380px]">
        <div className="mb-1.5 text-[18px] font-semibold">Unsubscribe {fan.email}?</div>
        <div className="mb-6 text-[13.5px] text-white/55">You&rsquo;ll stop receiving campaign emails from this artist. This doesn&rsquo;t affect anything else.</div>
        <form
          action={async () => {
            "use server";
            await unsubscribeFan(fanId, token ?? "");
          }}
        >
          <button type="submit" className="w-full cursor-pointer rounded-[10px] bg-accent px-6 py-3 text-[14px] font-semibold text-ink">
            Unsubscribe me
          </button>
        </form>
      </div>
    </div>
  );
}
