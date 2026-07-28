import { db } from "@/lib/db";
import { SITE_CONTENT_FIELDS } from "@/lib/site-content";
import { SiteContentField } from "@/components/site-content-field";

export default async function AdminContentPage() {
  const rows = await db.siteContent.findMany();
  const overrides = new Map(rows.map((r) => [r.key, r.value]));

  const sections = Array.from(new Set(SITE_CONTENT_FIELDS.map((f) => f.section)));

  return (
    <div className="max-w-[720px]">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[22px] tracking-[-.02em]">Landing page content</h1>
        <a href="/" target="_blank" rel="noreferrer" className="text-[12.5px] text-accent">
          View live page ↗
        </a>
      </div>
      <div className="mb-6 text-[13px] text-text/50">Edits go live immediately — no code change, no redeploy.</div>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section} className="rounded-card border border-border bg-surface px-5 py-1">
            <div className="border-b border-white/[.06] py-3 text-[13px] font-semibold text-text/70">{section}</div>
            {SITE_CONTENT_FIELDS.filter((f) => f.section === section).map((f) => (
              <SiteContentField
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                value={overrides.get(f.key) ?? f.default}
                isOverridden={overrides.has(f.key)}
                multiline={f.multiline}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
