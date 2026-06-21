export interface Expense {
  id: string;
  amount: number;
  category: string;
  notes: string;
  date: string; // YYYY-MM-DD
}

export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
];
