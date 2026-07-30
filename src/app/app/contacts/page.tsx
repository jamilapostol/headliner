import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { ContactsTable, type ContactDTO } from "@/components/contacts-table";

export default async function ContactsPage() {
  const { workspace } = await requireWorkspace();
  const contacts = await db.contact.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } });

  const dtos: ContactDTO[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    org: c.org,
    role: c.role,
    category: c.category,
    city: c.city,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    strength: c.strength,
    lastContactedAt: c.lastContactedAt ? c.lastContactedAt.toISOString() : null,
  }));

  return <ContactsTable contacts={dtos} plan={workspace.plan} />;
}
