import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { NewTourForm } from "@/components/new-tour-form";
import { TourView, type TourDTO } from "@/components/tour-view";

export default async function TourPage() {
  const { workspace } = await requireWorkspace();

  const tour = await db.tour.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { startDate: "asc" },
    include: { stops: { include: { booking: true }, orderBy: { seq: "asc" } } },
  });

  if (!tour) {
    return <NewTourForm />;
  }

  const eligibleBookings = await db.booking.findMany({
    where: { workspaceId: workspace.id, stage: { in: ["Confirmed", "Paid"] }, tourStop: null },
    orderBy: { date: "asc" },
  });

  const dto: TourDTO = {
    id: tour.id,
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
      hotelConfNo: s.hotelConfNo,
      merchNote: s.merchNote,
      perDiemCents: s.perDiemCents,
      schedule: JSON.parse(s.schedule),
    })),
  };

  const eligibleDTOs = eligibleBookings.map((b) => ({ id: b.id, venue: b.venue, city: b.city, date: b.date.toISOString() }));

  return <TourView tour={dto} eligibleBookings={eligibleDTOs} />;
}
