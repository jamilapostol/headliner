import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { BookingsBoard, type BookingDTO } from "@/components/bookings-board";

export default async function BookingsPage() {
  const { user, workspace } = await requireWorkspace();
  const bookings = await db.booking.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { date: "asc" },
  });

  const dtos: BookingDTO[] = bookings.map((b) => ({
    id: b.id,
    venue: b.venue,
    city: b.city,
    date: b.date.toISOString(),
    endDate: b.endDate ? b.endDate.toISOString() : null,
    fee: b.fee,
    contactName: b.contactName,
    contactPhone: b.contactPhone,
    stage: b.stage,
  }));

  return <BookingsBoard bookings={dtos} plan={workspace.plan} artistName={user.name} />;
}
