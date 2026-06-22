import React, { useState } from "react";
import { Expense } from "../types";

interface Props {
  expense: Expense;
  categories: string[];
  onSave: (e: Expense) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// A small modal for editing (or deleting) one expense.
export default function ExpenseEditor({ expense, categories, onSave, onDelete, onClose }: Props) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(expense.date);
  const [notes, setNotes] = useState(expense.notes);

  // Make sure the expense's own category is selectable even if it was removed.
  const options = categories.includes(category) ? categories : [category, ...categories];

  const save = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    onSave({ ...expense, amount: amt, category, date, notes: notes.trim() });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Expense</h2>

        <label className="lbl">Amount ($)</label>
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label className="lbl">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {options.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="lbl">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="lbl">Notes</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <button className="primary block" onClick={save}>Save</button>
        <div className="modal-actions">
          <button className="del-text" onClick={() => onDelete(expense.id)}>Delete</button>
          <button className="link" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
