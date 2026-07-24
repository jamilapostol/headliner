import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { MerchTable, type MerchItemDTO } from "@/components/merch-table";

export default async function MerchPage() {
  const { workspace } = await requireWorkspace();

  const [items, tour] = await Promise.all([
    db.merchItem.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
    db.tour.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { startDate: "asc" },
      include: { stops: { include: { booking: true }, orderBy: { seq: "asc" }, take: 4 } },
    }),
  ]);

  const dtos: MerchItemDTO[] = items.map((m) => ({
    id: m.id,
    name: m.name,
    variant: m.variant,
    price: m.price,
    cogs: m.cogs,
    stock: m.stock,
    maxStock: m.maxStock,
    glyph: m.glyph,
    color: m.color,
  }));

  return (
    <div className="max-w-[1150px] px-4 py-5 sm:px-8 sm:py-7">
      <MerchTable items={dtos} />

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-3.5 text-[14.5px] font-semibold">Merch in van, by upcoming show</div>
          <div className="flex flex-col gap-2.5">
            {tour?.stops.length ? (
              tour.stops.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-[12.5px]">
                  <span>{s.booking?.city ?? "TBD"}</span>
                  <span className="font-mono text-white/60">{s.merchNote ?? "—"}</span>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-white/40">No tour scheduled yet — see the Tour page.</div>
            )}
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-2.5 text-[14.5px] font-semibold">Tonight&apos;s table</div>
          <div className="text-[12.5px] leading-relaxed text-white/60">
            QR checkout ready · pair a Square reader when you get to the venue
            <br />
            Suggested float: <span className="font-mono text-text">$120 small bills</span>
          </div>
          <div className="mt-3 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-center text-[12.5px] font-semibold text-canvas">Open point of sale</div>
        </div>
      </div>
    </div>
  );
}
