import type { ModelDef } from "@/lib/admin-models";

function toInputValue(type: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (type === "datetime") {
    const d = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  }
  return String(value);
}

export function AdminRecordForm({
  model,
  record,
  action,
  submitLabel,
}: {
  model: ModelDef;
  record: Record<string, unknown> | null;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3.5">
      {model.fields.map((field) => {
        const value = record ? record[field.name] : undefined;

        if (field.readonly) {
          if (!record) return null;
          return (
            <div key={field.name} className="flex flex-col gap-1">
              <span className="font-mono text-[10.5px] tracking-[.08em] text-text/40">{field.name.toUpperCase()}</span>
              <span className="text-[12.5px] text-text/55">{toInputValue(field.type, value) || "—"}</span>
            </div>
          );
        }

        if (field.type === "boolean") {
          return (
            <label key={field.name} className="flex items-center gap-2.5">
              <input type="checkbox" name={field.name} defaultChecked={Boolean(value)} className="h-4 w-4 accent-accent" />
              <span className="text-[13px] font-medium">{field.name}</span>
            </label>
          );
        }

        if (field.type === "enum") {
          return (
            <label key={field.name} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text/50">{field.name}</span>
              <select
                name={field.name}
                defaultValue={String(value ?? field.enumValues?.[0])}
                className="rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
              >
                {field.enumValues?.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.type === "text") {
          return (
            <label key={field.name} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text/50">
                {field.name}
                {field.required && <span className="text-orange"> *</span>}
              </span>
              <textarea
                name={field.name}
                defaultValue={toInputValue(field.type, value)}
                required={field.required}
                rows={4}
                className="resize-y rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
              />
            </label>
          );
        }

        const inputType = field.type === "int" || field.type === "float" ? "number" : field.type === "datetime" ? "datetime-local" : "text";
        return (
          <label key={field.name} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">
              {field.name}
              {field.required && <span className="text-orange"> *</span>}
            </span>
            <input
              type={inputType}
              name={field.name}
              step={field.type === "float" ? "any" : undefined}
              required={field.required}
              defaultValue={toInputValue(field.type, value)}
              className="rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
            />
          </label>
        );
      })}

      <div className="mt-2">
        <button type="submit" className="cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-semibold text-ink">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
