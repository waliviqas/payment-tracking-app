import React, { useState } from "react";
import { Expense } from "../types";
import { todayStr, uid } from "../storage";

interface Props {
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  categories: string[];
  onImport: (rows: { amount: number; category: string; date: string; notes?: string }[]) => void;
}

export default function Expenses({ expenses, setExpenses, categories, onImport }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const doImport = () => {
    try {
      const rows = JSON.parse(importText);
      if (!Array.isArray(rows)) throw new Error("not a list");
      onImport(rows);
      setImportMsg(`Imported ${rows.length} expenses.`);
      setImportText("");
      setShowImport(false);
    } catch {
      setImportMsg("Couldn't read that — paste the full text exactly as given.");
    }
  };

  const doExport = () => {
    const data = JSON.stringify(
      expenses.map((e) => ({ amount: e.amount, category: e.category, date: e.date, notes: e.notes })),
      null,
      2
    );
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "spendtracker-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setAmount("");
    setNotes("");
    setDate(todayStr());
    setCategory(categories[0] ?? "");
    setEditingId(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    if (editingId) {
      setExpenses(
        expenses.map((x) =>
          x.id === editingId ? { ...x, amount: amt, category, notes: notes.trim(), date } : x
        )
      );
    } else {
      setExpenses([
        { id: uid(), amount: amt, category: category || "Other", notes: notes.trim(), date },
        ...expenses,
      ]);
    }
    reset();
  };

  const startEdit = (x: Expense) => {
    setEditingId(x.id);
    setAmount(String(x.amount));
    setCategory(x.category);
    setNotes(x.notes);
    setDate(x.date);
  };

  const remove = (id: string) => {
    setExpenses(expenses.filter((x) => x.id !== id));
    if (editingId === id) reset();
  };

  const shown = expenses.filter((x) => filter === "All" || x.category === filter);

  return (
    <>
      <div className="io-bar">
        <button type="button" className="io-btn" onClick={() => setShowImport((s) => !s)}>
          Import
        </button>
        <button type="button" className="io-btn" onClick={doExport} disabled={!expenses.length}>
          Export backup
        </button>
      </div>
      {showImport && (
        <div className="card">
          <h2>Import expenses</h2>
          <textarea
            className="io-text"
            placeholder="Paste the data here"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="row">
            <button type="button" className="primary" onClick={doImport}>Load</button>
            <button
              type="button"
              className="link"
              onClick={() => {
                setShowImport(false);
                setImportText("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {importMsg && <p className="io-msg">{importMsg}</p>}

      <form className="card" onSubmit={submit}>
        <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>

        <label className="lbl">Amount ($)</label>
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label className="lbl">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="lbl">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="lbl">Notes</label>
        <input
          type="text"
          placeholder="What was this for?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button type="submit" className="primary block">{editingId ? "Save" : "Add"}</button>
        {editingId && (
          <button type="button" className="link" onClick={reset}>Cancel</button>
        )}
      </form>

      <div className="filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="empty">No expenses yet. Add one above.</p>
      ) : (
        <div className="list">
          {shown.map((x) => (
            <div className="expense" key={x.id}>
              <div className="expense-main">
                <div className="expense-top">
                  <span className="amt">${x.amount.toFixed(2)}</span>
                  <span className="when">{toLabel(x.date)}</span>
                </div>
                <div className="cat">{x.category}</div>
                {x.notes && <div className="notes">{x.notes}</div>}
              </div>
              <div className="expense-actions">
                <button className="icon" onClick={() => startEdit(x)} aria-label="Edit">✎</button>
                <button className="icon danger" onClick={() => remove(x.id)} aria-label="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function toLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
