import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { ComingSoon } from "@/components/coming-soon";
import { TourView, type TourDTO } from "@/components/tour-view";

export default async function TourPage() {
  const { workspace } = await requireWorkspace();

  const tour = await db.tour.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { startDate: "asc" },
    include: { stops: { include: { booking: true }, orderBy: { seq: "asc" } } },
  });

  if (!tour) {
    return <ComingSoon title="Tour" phase="PHASE 2 — ROAD KIT" description="Create a tour from your bookings to see routing and day sheets here." />;
  }

  const dto: TourDTO = {
    name: tour.name,
    startDate: tour.startDate.toISOString(),
    endDate: tour.endDate.toISOString(),
    stops: tour.stops.map((s) => ({
      id: s.id,
      venue: s.booking?.venue ?? "TBD",
      city: s.booking?.city ?? "",
      date: (s.booking?.date ?? tour.startDate).toISOString(),
      fee: s.booking?.fee ?? 0,
      driveMiles: s.driveMiles,
      hotel: s.hotel,
      merchNote: s.merchNote,
      schedule: JSON.parse(s.schedule),
    })),
  };

  return <TourView tour={dto} />;
}
