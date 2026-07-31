import { db } from "@/lib/db";

export type FieldType = "string" | "text" | "int" | "float" | "boolean" | "datetime" | "enum";

export type FieldDef = {
  name: string;
  type: FieldType;
  enumValues?: readonly string[];
  readonly?: boolean;
  required?: boolean;
};

export type ModelDef = {
  key: string;
  label: string;
  // Prisma delegates are individually typed per model; this registry is
  // intentionally generic across all of them, which TypeScript can't express
  // without an escape hatch here. Call sites still work with plain objects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: any;
  fields: FieldDef[];
  orderBy: Record<string, "asc" | "desc">;
};

const PLAN = ["free", "pro", "touring", "team", "beta"] as const;
const ROLE = ["artist", "manager", "agent", "tour_manager", "merch", "accountant", "assistant"] as const;
const BOOKING_STAGE = ["Lead", "Contacted", "Negotiating", "Offer_Sent", "Confirmed", "Paid"] as const;
const CONTACT_CATEGORY = ["Venues", "Promoters", "Festivals", "Media", "Sponsors", "Hosts"] as const;
const TRANSACTION_KIND = ["income", "expense"] as const;
const CONTRACT_STATUS = ["DRAFT", "AWAITING_SIGN", "SIGNED", "ACTIVE"] as const;
const FAN_TIER = ["VIP", "Patron", "Donor", "Fan"] as const;
const CAMPAIGN_STATUS = ["Draft", "Sending", "Sent", "Failed"] as const;

const id: FieldDef = { name: "id", type: "string", readonly: true };
const createdAt: FieldDef = { name: "createdAt", type: "datetime", readonly: true };
const updatedAt: FieldDef = { name: "updatedAt", type: "datetime", readonly: true };

export const ADMIN_MODELS: ModelDef[] = [
  {
    key: "workspace",
    label: "Workspaces",
    delegate: db.workspace,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "name", type: "string", required: true },
      { name: "plan", type: "enum", enumValues: PLAN },
      { name: "billingCycle", type: "string" },
      { name: "stripeCustomerId", type: "string" },
      { name: "stripeSubId", type: "string" },
      { name: "paymentPastDue", type: "boolean" },
      { name: "cancelAtPeriodEnd", type: "boolean" },
      { name: "currentPeriodEnd", type: "datetime" },
      { name: "trialEndsAt", type: "datetime" },
      { name: "addressLine1", type: "string" },
      { name: "addressLine2", type: "string" },
      { name: "city", type: "string" },
      { name: "state", type: "string" },
      { name: "postalCode", type: "string" },
      { name: "country", type: "string" },
      createdAt,
    ],
  },
  {
    key: "membership",
    label: "Memberships",
    delegate: db.membership,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "userId", type: "string", required: true },
      { name: "role", type: "enum", enumValues: ROLE },
      { name: "invitedBy", type: "string" },
      { name: "acceptedAt", type: "datetime" },
      createdAt,
    ],
  },
  {
    key: "contact",
    label: "Contacts",
    delegate: db.contact,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "org", type: "string" },
      { name: "role", type: "string" },
      { name: "category", type: "enum", enumValues: CONTACT_CATEGORY },
      { name: "city", type: "string" },
      { name: "email", type: "string" },
      { name: "phone", type: "string" },
      { name: "strength", type: "int" },
      { name: "lastContactedAt", type: "datetime" },
      { name: "notes", type: "text" },
      createdAt,
    ],
  },
  {
    key: "booking",
    label: "Bookings",
    delegate: db.booking,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "contactId", type: "string" },
      { name: "venue", type: "string", required: true },
      { name: "city", type: "string", required: true },
      { name: "date", type: "datetime", required: true },
      { name: "endDate", type: "datetime" },
      { name: "stage", type: "enum", enumValues: BOOKING_STAGE },
      { name: "fee", type: "int" },
      { name: "deposit", type: "int" },
      { name: "contactName", type: "string" },
      { name: "contactPhone", type: "string" },
      { name: "notes", type: "text" },
      { name: "offerConfirmed", type: "boolean" },
      { name: "contractSigned", type: "boolean" },
      { name: "depositReceived", type: "boolean" },
      { name: "riderSent", type: "boolean" },
      createdAt,
      updatedAt,
    ],
  },
  {
    key: "tour",
    label: "Tours",
    delegate: db.tour,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "startDate", type: "datetime", required: true },
      { name: "endDate", type: "datetime", required: true },
      createdAt,
    ],
  },
  {
    key: "tourStop",
    label: "Tour stops",
    delegate: db.tourStop,
    orderBy: { seq: "asc" },
    fields: [
      id,
      { name: "tourId", type: "string", required: true },
      { name: "bookingId", type: "string" },
      { name: "seq", type: "int", required: true },
      { name: "driveMiles", type: "int" },
      { name: "hotel", type: "string" },
      { name: "hotelConfNo", type: "string" },
      { name: "merchNote", type: "string" },
      { name: "perDiemCents", type: "int" },
      { name: "schedule", type: "text", required: true },
    ],
  },
  {
    key: "merchItem",
    label: "Merch items",
    delegate: db.merchItem,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "variant", type: "string" },
      { name: "price", type: "int", required: true },
      { name: "cogs", type: "int", required: true },
      { name: "stock", type: "int" },
      { name: "maxStock", type: "int" },
      { name: "glyph", type: "string" },
      { name: "color", type: "string" },
      { name: "imageUrl", type: "string" },
      createdAt,
    ],
  },
  {
    key: "contract",
    label: "Contracts",
    delegate: db.contract,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "kind", type: "string", required: true },
      { name: "counterparty", type: "string", required: true },
      { name: "value", type: "string", required: true },
      { name: "status", type: "enum", enumValues: CONTRACT_STATUS },
      { name: "signedDate", type: "datetime" },
      { name: "renewsAt", type: "datetime" },
      { name: "filePath", type: "string" },
      { name: "fileName", type: "string" },
      createdAt,
    ],
  },
  {
    key: "task",
    label: "Tasks",
    delegate: db.task,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "title", type: "string", required: true },
      { name: "dueLabel", type: "string", required: true },
      { name: "done", type: "boolean" },
      createdAt,
    ],
  },
  {
    key: "transaction",
    label: "Transactions",
    delegate: db.transaction,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "kind", type: "enum", enumValues: TRANSACTION_KIND },
      { name: "category", type: "string", required: true },
      { name: "amount", type: "int", required: true },
      { name: "source", type: "string" },
      { name: "occurredAt", type: "datetime" },
      createdAt,
    ],
  },
  {
    key: "fan",
    label: "Fans",
    delegate: db.fan,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "email", type: "string" },
      { name: "tier", type: "enum", enumValues: FAN_TIER },
      { name: "tierNote", type: "string" },
      { name: "lifetimeSpend", type: "int" },
      { name: "showsAttended", type: "int" },
      { name: "lastSeenLabel", type: "string" },
      { name: "notes", type: "text" },
      { name: "unsubscribed", type: "boolean" },
      createdAt,
    ],
  },
  {
    key: "campaign",
    label: "Campaigns",
    delegate: db.campaign,
    orderBy: { createdAt: "desc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "subject", type: "string" },
      { name: "body", type: "text" },
      { name: "audienceTier", type: "enum", enumValues: FAN_TIER },
      { name: "status", type: "enum", enumValues: CAMPAIGN_STATUS },
      { name: "recipientCount", type: "int" },
      { name: "sentAt", type: "datetime" },
      { name: "openRate", type: "float" },
      { name: "clickRate", type: "float" },
      { name: "revenue", type: "int" },
      createdAt,
    ],
  },
  {
    key: "automation",
    label: "Automations",
    delegate: db.automation,
    orderBy: { name: "asc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "key", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "trigger", type: "string", required: true },
      { name: "enabled", type: "boolean" },
    ],
  },
  {
    key: "integration",
    label: "Integrations",
    delegate: db.integration,
    orderBy: { key: "asc" },
    fields: [
      id,
      { name: "workspaceId", type: "string", required: true },
      { name: "key", type: "string", required: true },
      { name: "connected", type: "boolean" },
      { name: "connectedAt", type: "datetime" },
    ],
  },
];

export function getModelDef(key: string): ModelDef | undefined {
  return ADMIN_MODELS.find((m) => m.key === key);
}
