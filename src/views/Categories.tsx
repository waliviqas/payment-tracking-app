import React, { useState } from "react";

interface Props {
  categories: string[];
  setCategories: (c: string[]) => void;
  renameCategory: (oldName: string, newName: string) => void;
}

export default function Categories({ categories, setCategories, renameCategory }: Props) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const add = () => {
    const c = name.trim();
    if (c && !categories.includes(c)) setCategories([...categories, c]);
    setName("");
  };

  const remove = (c: string) => setCategories(categories.filter((x) => x !== c));

  const startEdit = (c: string) => {
    setEditing(c);
    setDraft(c);
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };
  const saveEdit = (oldName: string) => {
    renameCategory(oldName, draft);
    cancelEdit();
  };

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
            {editing === c ? (
              <>
                <input
                  className="cat-edit"
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveEdit(c);
                    }
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <div className="cat-actions">
                  <button className="primary small" onClick={() => saveEdit(c)}>Save</button>
                  <button className="icon" onClick={cancelEdit} aria-label="Cancel">✕</button>
                </div>
              </>
            ) : (
              <>
                <span>{c}</span>
                <div className="cat-actions">
                  <button className="icon" onClick={() => startEdit(c)} aria-label={`Rename ${c}`}>✎</button>
                  <button className="icon danger" onClick={() => remove(c)} aria-label={`Remove ${c}`}>✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
