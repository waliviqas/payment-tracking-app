import React, { useState } from "react";

interface Props {
  categories: string[];
  setCategories: (c: string[]) => void;
}

export default function Categories({ categories, setCategories }: Props) {
  const [name, setName] = useState("");

  const add = () => {
    const c = name.trim();
    if (c && !categories.includes(c)) setCategories([...categories, c]);
    setName("");
  };

  const remove = (c: string) => setCategories(categories.filter((x) => x !== c));

  return (
    <>
      <div className="card">
        <h2>Add Category</h2>
        <div className="row">
          <input
            type="text"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button className="primary" onClick={add}>Add</button>
        </div>
      </div>

      <div className="list">
        {categories.map((c) => (
          <div className="cat-row" key={c}>
            <span>{c}</span>
            <button className="icon danger" onClick={() => remove(c)} aria-label={`Remove ${c}`}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
