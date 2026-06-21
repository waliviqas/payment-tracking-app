import React, { useState } from "react";
import "./App.css";
import { Expense, DEFAULT_CATEGORIES } from "./types";
import { useLocalStorage } from "./storage";
import Expenses from "./views/Expenses";
import Categories from "./views/Categories";
import Summary from "./views/Summary";

type Tab = "expenses" | "categories" | "summary";

function App() {
  const [tab, setTab] = useState<Tab>("expenses");
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", []);
  const [categories, setCategories] = useLocalStorage<string[]>("categories", DEFAULT_CATEGORIES);

  // Rename a category everywhere: the category list AND every expense using it.
  const renameCategory = (oldName: string, newName: string) => {
    const next = newName.trim();
    if (!next || next === oldName || categories.includes(next)) return;
    setCategories(categories.map((c) => (c === oldName ? next : c)));
    setExpenses(expenses.map((x) => (x.category === oldName ? { ...x, category: next } : x)));
  };

  return (
    <div className="app">
      <header className="topbar">SpendTracker</header>

      <nav className="tabs">
        {(["expenses", "categories", "summary"] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? "tab active" : "tab"}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === "expenses" && (
          <Expenses expenses={expenses} setExpenses={setExpenses} categories={categories} />
        )}
        {tab === "categories" && (
          <Categories
            categories={categories}
            setCategories={setCategories}
            renameCategory={renameCategory}
          />
        )}
        {tab === "summary" && <Summary expenses={expenses} />}
      </main>
    </div>
  );
}

export default App;
