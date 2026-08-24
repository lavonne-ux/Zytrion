export type ToolField = {
  name: string;
  label?: string;
  type: string;
  options?: string[];
  default?: string;
  required?: boolean;
  columns?: string[];
  min_rows?: number;
  fields?: ToolField[];
  shown_when?: string;
};

// Local browser date, not UTC. Using getFullYear/getMonth/getDate (local
// methods) rather than toISOString (UTC) avoids the exact bug found
// tonight: past a certain hour Eastern, UTC has already rolled into
// tomorrow, so a "default: today" date field showed the wrong day.
export function localToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function initialValuesFor(fieldSchema: ToolField[]): Record<string, any> {
  const initial: Record<string, any> = {};
  const today = localToday();
  for (const f of fieldSchema) {
    if (f.type === "date" && f.default === "today") initial[f.name] = today;
    else if (f.type === "repeatable_row") initial[f.name] = [];
    else if (f.type === "boolean") initial[f.name] = false;
    else initial[f.name] = "";
  }
  return initial;
}
