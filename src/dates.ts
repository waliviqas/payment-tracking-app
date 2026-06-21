export type Period = "day" | "week" | "month";

export function toDate(s: string): Date {
  return new Date(s + "T00:00:00");
}

// [start, end) range covering the period that `ref` falls in.
export function periodRange(period: Period, ref: Date): { start: Date; end: Date } {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (period === "day") {
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    return { start: d, end };
  }
  if (period === "week") {
    const dow = d.getDay(); // 0 Sun … 6 Sat
    const daysSinceMon = (dow + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - daysSinceMon);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  // month
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
  };
}

export function shiftPeriod(period: Period, ref: Date, dir: number): Date {
  const d = new Date(ref);
  if (period === "day") d.setDate(d.getDate() + dir);
  else if (period === "week") d.setDate(d.getDate() + dir * 7);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

export function periodLabel(period: Period, ref: Date): string {
  const { start, end } = periodRange(period, ref);
  if (period === "day") {
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  if (period === "month") {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  const last = new Date(end);
  last.setDate(end.getDate() - 1);
  return (
    start.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " – " +
    last.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  );
}

export function inRange(dateStr: string, start: Date, end: Date): boolean {
  const t = toDate(dateStr).getTime();
  return t >= start.getTime() && t < end.getTime();
}
