import React, { useState } from "react";
import { Expense } from "../types";
import { Period, periodRange, shiftPeriod, periodLabel, inRange } from "../dates";

interface Props {
  expenses: Expense[];
}

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function Summary({ expenses }: Props) {
  const [period, setPeriod] = useState<Period>("month");
  const [ref, setRef] = useState<Date>(new Date());
  const [expanded, setExpanded] = useState<string | null>(null);

  const { start, end } = periodRange(period, ref);
  const inPeriod = expenses.filter((x) => inRange(x.date, start, end));
  const total = inPeriod.reduce((s, x) => s + x.amount, 0);

  // Per-category totals (descending), only categories with spend this period.
  const byCat = new Map<string, { total: number; count: number }>();
  for (const x of inPeriod) {
    const cur = byCat.get(x.category) || { total: 0, count: 0 };
    cur.total += x.amount;
    cur.count += 1;
    byCat.set(x.category, cur);
  }
  const rows = Array.from(byCat.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total);
  const max = rows.length ? rows[0].total : 0;

  const setPeriodAndReset = (p: Period) => {
    setPeriod(p);
    setExpanded(null);
  };
  const moveAndReset = (dir: number) => {
    setRef(shiftPeriod(period, ref, dir));
    setExpanded(null);
  };

  return (
    <>
      <div className="segmented">
        {(["day", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            className={period === p ? "seg active" : "seg"}
            onClick={() => setPeriodAndReset(p)}
          >
            {p === "day" ? "Daily" : p === "week" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      <div className="period-nav">
        <button className="icon" onClick={() => moveAndReset(-1)} aria-label="Previous">‹</button>
        <span className="period-label">{periodLabel(period, ref)}</span>
        <button className="icon" onClick={() => moveAndReset(1)} aria-label="Next">›</button>
      </div>

      <div className="total-card">
        <span>Total</span>
        <strong>${total.toFixed(2)}</strong>
      </div>

      {rows.length === 0 ? (
        <p className="empty">No spending in this period.</p>
      ) : (
        <div className="list">
          {rows.map((r) => {
            const isOpen = expanded === r.category;
            const items = isOpen
              ? inPeriod.filter((x) => x.category === r.category)
              : [];
            return (
              <div className="summary-row" key={r.category}>
                <button
                  className="summary-toggle"
                  onClick={() => setExpanded(isOpen ? null : r.category)}
                  aria-expanded={isOpen}
                >
                  <div className="summary-head">
                    <div>
                      <div className="summary-cat">
                        {r.category} <span className="chevron">{isOpen ? "▾" : "▸"}</span>
                      </div>
                      <div className="summary-sub">
                        {r.count} expense{r.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="summary-amt">${r.total.toFixed(2)}</div>
                  </div>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: `${max ? (r.total / max) * 100 : 0}%` }} />
                  </div>
                </button>

                {isOpen && (
                  <div className="summary-items">
                    {items.map((x) => (
                      <div className="summary-item" key={x.id}>
                        <div className="si-left">
                          <span className="si-amt">${x.amount.toFixed(2)}</span>
                          <span className="si-date">{fmtDate(x.date)}</span>
                        </div>
                        {x.notes && <span className="si-notes">{x.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
