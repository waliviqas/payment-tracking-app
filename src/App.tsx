import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Expense, DEFAULT_CATEGORIES } from "./types";
import { uid } from "./storage";
import Expenses from "./views/Expenses";
import Categories from "./views/Categories";
import Summary from "./views/Summary";

type Tab = "expenses" | "categories" | "summary";

const API = "/api/data";

function App() {
  const [tab, setTab] = useState<Tab>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  // --- Load from the cloud on mount, migrating old localStorage data once ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("api");
        const data = await res.json();
        let exp: Expense[] = data.expenses || [];
        let cats: string[] = data.categories || DEFAULT_CATEGORIES;

        // First time on the cloud and it's empty? Carry over local data.
        if (exp.length === 0) {
          const localExp: Expense[] = JSON.parse(localStorage.getItem("expenses") || "[]");
          const localCats = JSON.parse(localStorage.getItem("categories") || "null");
          if (localExp.length) {
            exp = localExp;
            cats = localCats || cats;
            fetch(API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expenses: exp, categories: cats }),
            }).catch(() => {});
          }
        }
        setExpenses(exp);
        setCategories(cats);
      } catch {
        // Offline / no DB yet: fall back to localStorage so the app still works.
        setExpenses(JSON.parse(localStorage.getItem("expenses") || "[]"));
        setCategories(JSON.parse(localStorage.getItem("categories") || "null") || DEFAULT_CATEGORIES);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // --- Save to cloud (and a local backup) on every change ---
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("categories", JSON.stringify(categories));
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expenses, categories }),
    }).catch(() => {});
  }, [expenses, categories, loaded]);

  // --- Pull fresh data when the app regains focus (picks up voice entries) ---
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.categories)) setCategories(data.categories);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const renameCategory = (oldName: string, newName: string) => {
    const next = newName.trim();
    if (!next || next === oldName || categories.includes(next)) return;
    setCategories(categories.map((c) => (c === oldName ? next : c)));
    setExpenses(expenses.map((x) => (x.category === oldName ? { ...x, category: next } : x)));
  };

  const importExpenses = (
    rows: { amount: number; category: string; date: string; notes?: string }[]
  ) => {
    const missing = Array.from(new Set(rows.map((r) => r.category))).filter(
      (c) => c && !categories.includes(c)
    );
    if (missing.length) setCategories([...categories, ...missing]);
    const added: Expense[] = rows.map((r) => ({
      id: uid(),
      amount: Number(r.amount),
      category: r.category,
      date: r.date,
      notes: r.notes || "",
    }));
    setExpenses([...added, ...expenses]);
  };

  if (!loaded) {
    return (
      <div className="app">
        <header className="topbar">SpendTracker</header>
        <p className="empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">SpendTracker</header>

      <nav className="tabs">
        {(["expenses", "categories", "summary"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === "expenses" && (
          <Expenses
            expenses={expenses}
            setExpenses={setExpenses}
            categories={categories}
            onImport={importExpenses}
          />
        )}
        {tab === "categories" && (
          <Categories
            categories={categories}
            setCategories={setCategories}
            renameCategory={renameCategory}
          />
        )}
        {tab === "summary" && (
          <Summary expenses={expenses} setExpenses={setExpenses} categories={categories} />
        )}
      </main>
    </div>
  );
}

export default App;
