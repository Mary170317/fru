"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Search, LogOut, Eye } from "lucide-react";

const ADMIN_EMAIL = "admin@oblachnaya51.ru";
const ADMIN_PASSWORD = "Oblachnaya51Admin2026!";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  description?: string;
  benefits?: string;
}

const catList = ["fruits", "vegetables", "nuts", "sweets", "dried", "grocery", "drinks"];
const catNames: Record<string, string> = { fruits: "Фрукты", vegetables: "Овощи", nuts: "Орехи", sweets: "Сладости", dried: "Сухофрукты", grocery: "Бакалея и чай", drinks: "Напитки" };

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [newProduct, setNewProduct] = useState<Product>({ id: 0, name: "", category: "fruits", price: 0, unit: "кг", image: "", description: "", benefits: "" });

  useEffect(() => {
    const s = localStorage.getItem("admin_session");
    if (s) {
      try {
        const d = JSON.parse(s);
        if (d.email === ADMIN_EMAIL && d.expires > Date.now()) {
          setIsLoggedIn(true);
          return;
        }
      } catch (e) {}
    }
    localStorage.removeItem("admin_session");
  }, []);

  useEffect(() => { if (isLoggedIn) loadProducts(); }, [isLoggedIn]);

  const loadProducts = async () => {
    try {
      const res = await fetch("/data/products.json");
      const data = await res.json();
      setProducts(data);
    } catch (e) {}
  };

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_session", JSON.stringify({ email, expires: Date.now() + 86400000 }));
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Неверный логин или пароль");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    setIsLoggedIn(false);
  };

  const saveToGitHub = async (updated: Product[], msg: string) => {
    setSaveStatus("Сохраняю...");
    try {
      const res = await fetch("/api/admin/save-products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: updated, message: msg }) });
      const result = await res.json();
      if (result.success) { setSaveStatus("Сохранено!"); setProducts(updated); }
      else setSaveStatus("Ошибка: " + (result.error || "неизвестно"));
    } catch (e) { setSaveStatus("Ошибка соединения"); }
    setTimeout(() => setSaveStatus(""), 4000);
  };

  const handleAdd = async () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const updated = [...products, { ...newProduct, id: newId }];
    await saveToGitHub(updated, "Добавлен: " + newProduct.name);
    setIsAdding(false);
    setNewProduct({ id: 0, name: "", category: "fruits", price: 0, unit: "кг", image: "", description: "", benefits: "" });
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    await saveToGitHub(updated, "Изменён: " + editingProduct.name);
    setEditingId(null); setEditingProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить товар?")) return;
    const updated = products.filter(p => p.id !== id);
    await saveToGitHub(updated, "Удалён товар #" + id);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ef" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "30px", width: "320px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "40px" }}>🍎</span>
            <h2 style={{ color: "#4a7c59", marginTop: "8px" }}>Админ-панель</h2>
          </div>
          <input type="text" placeholder="Логин" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "10px", marginBottom: "10px", outline: "none", boxSizing: "border-box" }} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "10px", marginBottom: "15px", outline: "none", boxSizing: "border-box" }} />
          {error && <p style={{ color: "red", fontSize: "13px", textAlign: "center", marginBottom: "10px" }}>{error}</p>}
          <button onClick={handleLogin} style={{ width: "100%", padding: "12px", background: "#4a7c59", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", cursor: "pointer" }}>Войти</button>
        </div>
      </div>
    );
  }

  const filtered = products.filter(p => (selectedCategory === "all" || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "Arial" }}>
      <header style={{ background: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🍎</span>
          <span style={{ fontWeight: "bold", color: "#4a7c59" }}>Админ-панель</span>
          <span style={{ fontSize: "12px", background: "#f0f0f0", padding: "2px 10px", borderRadius: "10px" }}>{products.length} товаров</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a href="/" target="_blank" style={{ textDecoration: "none", color: "#666", fontSize: "13px", padding: "6px 10px" }}>Сайт</a>
          <button onClick={handleLogout} style={{ border: "none", background: "#fdd", color: "#d00", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Выйти</button>
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
        {saveStatus && <div style={{ padding: "10px", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", background: saveStatus.includes("Ошибка") ? "#fdd" : "#dfd", color: saveStatus.includes("Ошибка") ? "#d00" : "#060" }}>{saveStatus}</div>}

        <div style={{ background: "white", borderRadius: "16px", padding: "12px", marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: "120px", padding: "8px", border: "1px solid #ddd", borderRadius: "10px", outline: "none" }} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px" }}>
            <option value="all">Все</option>
            {catList.map(c => <option key={c} value={c}>{catNames[c]}</option>)}
          </select>
          <button onClick={() => setIsAdding(true)} style={{ padding: "8px 14px", background: "#4a7c59", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Plus size={16} /> Добавить</button>
        </div>

        {isAdding && (
          <div style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "16px", border: "2px solid #4a7c59" }}>
            <h3 style={{ margin: "0 0 12px", color: "#4a7c59" }}>Новый товар</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input placeholder="Название" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "8px" }} />
              <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "8px" }}>{catList.map(c => <option key={c} value={c}>{catNames[c]}</option>)}</select>
              <input type="number" placeholder="Цена" value={newProduct.price||""} onChange={e => setNewProduct({...newProduct, price: +e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "8px" }} />
              <input placeholder="Ед. изм." value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "8px" }} />
              <input placeholder="Ссылка на картинку" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} style={{ gridColumn: "span 2", padding: "8px", border: "1px solid #ddd", borderRadius: "8px" }} />
            </div>
            <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <button onClick={handleAdd} style={{ padding: "8px 20px", background: "#4a7c59", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Добавить</button>
              <button onClick={() => setIsAdding(false)} style={{ padding: "8px 20px", background: "#ddd", border: "none", borderRadius: "8px", cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        )}

        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ background: "#f9f9f9", borderBottom: "2px solid #eee" }}><th style={{ padding: "10px", textAlign: "left" }}>ID</th><th style={{ padding: "10px", textAlign: "left" }}>Фото</th><th style={{ padding: "10px", textAlign: "left" }}>Название</th><th style={{ padding: "10px", textAlign: "left" }}>Цена</th><th style={{ padding: "10px", textAlign: "left" }}></th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  {editingId === p.id && editingProduct ? (
                    <>
                      <td style={{ padding: "8px" }}>{p.id}</td>
                      <td style={{ padding: "8px" }}><input value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} style={{ width: "80px", fontSize: "11px", padding: "4px" }} /></td>
                      <td style={{ padding: "8px" }}><input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: "100%", fontSize: "11px", padding: "4px" }} /></td>
                      <td style={{ padding: "8px" }}><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: +e.target.value})} style={{ width: "60px", fontSize: "11px", padding: "4px" }} /></td>
                      <td style={{ padding: "8px", display: "flex", gap: "4px" }}>
                        <button onClick={handleUpdate} style={{ background: "#dfd", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>💾</button>
                        <button onClick={() => {setEditingId(null); setEditingProduct(null);}} style={{ background: "#fdd", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>✖</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "8px", color: "#999" }}>{p.id}</td>
                      <td style={{ padding: "8px" }}><img src={p.image} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px" }} /></td>
                      <td style={{ padding: "8px" }}>{p.name}</td>
                      <td style={{ padding: "8px", fontWeight: "bold", color: "#c0392b" }}>{p.price}₽</td>
                      <td style={{ padding: "8px", display: "flex", gap: "4px" }}>
                        <button onClick={() => {setEditingId(p.id); setEditingProduct({...p});}} style={{ background: "#eef", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>✏️</button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: "#fdd", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>🗑</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
