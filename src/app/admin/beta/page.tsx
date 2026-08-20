import { requireAdmin } from "@/lib/admin";
import { fmtDateUTC } from "@/lib/format";
import { getCohort, daysSince } from "@/lib/cohort";

// Beta cohort view. The overview page answers "how many signed up"; this one
// answers the question that actually matters during a beta — did they do
// anything after signing up, and who should you call first.
//
// The cohort itself is computed in lib/cohort.ts, which the YANTRA
// bridge also reads, so this screen and the agent briefings never disagree.

export const dynamic = "force-dynamic";

export default async function AdminBetaPage() {
  await requireAdmin();

  const { rows, activated, confirmedOnly, neverConfirmed } = await getCohort("beta");

  const stats = [
    { label: "BETA WORKSPACES", value: String(rows.length) },
    { label: "ACTIVATED", value: String(activated.length), hint: "created a booking" },
    { label: "SIGNED UP, IDLE", value: String(confirmedOnly.length), hint: "confirmed, no booking" },
    { label: "NEVER CONFIRMED", value: String(neverConfirmed.length), hint: "email link unclicked" },
  ];

  return (
    <div className="max-w-[1100px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Beta cohort</h1>
      <div className="mb-6 text-[13px] text-text/50">
        Who claimed an invite and what they&rsquo;ve actually done since. Talk to the activated ones about what to build next; talk
        to the idle ones about what stopped them.
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface px-[18px] py-4">
            <div className="mb-2 font-label text-[10.5px] tracking-[.1em] text-text/45">{s.label}</div>
            <div className="text-[24px] font-bold tracking-[-.02em]">{s.value}</div>
            {s.hint && <div className="mt-1 text-[11.5px] text-text/40">{s.hint}</div>}
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-border bg-surface px-5 py-8 text-center text-[13.5px] text-text/50">
          No beta workspaces yet. Codes you&rsquo;ve handed out show up here once they&rsquo;re claimed.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left font-label text-[10.5px] tracking-[.1em] text-text/45">
                <th className="px-4 py-3 font-normal">WORKSPACE</th>
                <th className="px-4 py-3 font-normal">JOINED</th>
                <th className="px-4 py-3 font-normal">BOOKINGS</th>
                <th className="px-4 py-3 font-normal">CONTACTS</th>
                <th className="px-4 py-3 font-normal">MONEY</th>
                <th className="px-4 py-3 font-normal">FANS</th>
                <th className="px-4 py-3 font-normal">LAST ACTIVITY</th>
                <th className="px-4 py-3 font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = !r.confirmed
                  ? { label: "Unconfirmed", cls: "text-orange" }
                  : r.bookings > 0
                    ? { label: "Activated", cls: "text-accent" }
                    : { label: "Idle", cls: "text-yellow" };
                return (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11.5px] text-text/45">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-text/60">
                      {fmtDateUTC(r.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                      <div className="text-[11.5px] text-text/40">{daysSince(r.createdAt)}d ago</div>
                    </td>
                    <td className="px-4 py-3 text-text/70">{r.bookings}</td>
                    <td className="px-4 py-3 text-text/70">{r.contacts}</td>
                    <td className="px-4 py-3 text-text/70">{r.transactions}</td>
                    <td className="px-4 py-3 text-text/70">{r.fans}</td>
                    <td className="px-4 py-3 text-text/60">
                      {r.lastActivity ? `${daysSince(r.lastActivity)}d ago` : "—"}
                    </td>
                    <td className={`px-4 py-3 font-medium ${status.cls}`}>{status.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
