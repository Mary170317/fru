"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Search, LogOut, RefreshCw, Eye } from "lucide-react";

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

const categories = [
  "fruits", "vegetables", "nuts", "sweets", "dried", "grocery", "drinks",
];

const categoryNames: Record<string, string> = {
  fruits: "Фрукты", vegetables: "Овощи", nuts: "Орехи",
  sweets: "Сладости", dried: "Сухофрукты", grocery: "Бакалея и чай", drinks: "Напитки",
};

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const newProductTemplate: Product = {
    id: 0, name: "", category: "fruits", price: 0, unit: "кг", image: "", description: "", benefits: "",
  };
  const [newProduct, setNewProduct] = useState<Product>({ ...newProductTemplate });

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.email && data.expires > Date.now()) {
          setIsLoggedIn(true);
          loadProducts();
          return;
        }
      } catch (e) {}
    }
    localStorage.removeItem("admin_session");
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch("/data/products.json?_=" + Date.now());
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!email || !password) {
      setLoginError("Введите почту и пароль");
      return;
    }
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("admin_session", JSON.stringify({ email, expires: Date.now() + 86400000 }));
      setIsLoggedIn(true);
      loadProducts();
    } else {
      setLoginError(data.message || "Неверная почта или пароль");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    setIsLoggedIn(false);
  };

  const saveToGitHub = async (updatedProducts: Product[], message: string) => {
    setIsSaving(true);
    setSaveStatus("Сохраняю...");
    try {
      const res = await fetch("/api/admin/save-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts, message }),
      });
      const result = await res.json();
      if (result.success) {
        setSaveStatus("Сохранено! Сайт обновится через 1-2 минуты.");
        setProducts(updatedProducts);
      } else {
        setSaveStatus("Ошибка: " + (result.error || "неизвестно"));
      }
    } catch (e) {
      setSaveStatus("Ошибка соединения");
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(""), 5000);
  };

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.image || newProduct.price <= 0) {
      setSaveStatus("Заполните название, цену и ссылку");
      return;
    }
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const updated = [...products, { ...newProduct, id: newId }];
    await saveToGitHub(updated, "Добавлен товар: " + newProduct.name);
    setIsAdding(false);
    setNewProduct({ ...newProductTemplate });
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditingProduct({ ...p });
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    await saveToGitHub(updated, "Изменён товар: " + editingProduct.name);
    setEditingId(null);
    setEditingProduct(null);
  };

  const handleDelete = async (id: number) => {
    const p = products.find(x => x.id === id);
    if (!confirm("Удалить " + (p?.name || "товар") + "?")) return;
    const updated = products.filter(p => p.id !== id);
    await saveToGitHub(updated, "Удалён товар: " + (p?.name || id));
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(#faf8f5, #f0ebe0)", padding: "16px" }}>
        <div style={{ background: "white", borderRadius: "24px", padding: "32px", maxWidth: "400px", width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "48px" }}>🍎</span>
            <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#4a7c59", marginTop: "8px" }}>Облачная 51</h1>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>Вход в админ-панель</p>
          </div>
          <input type="text" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "12px", marginBottom: "12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          <input type="password" placeholder="Пароль" value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "12px", marginBottom: "16px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          {loginError && <p style={{ color: "red", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>{loginError}</p>}
          <button onClick={handleLogin}
            style={{ width: "100%", padding: "14px", background: "#e87722", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  const filtered = products
    .filter(p => selectedCategory === "all" || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "Arial, sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "white", borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🍎</span>
          <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#4a7c59" }}>Админ-панель</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", background: "#f0f0f0", padding: "4px 10px", borderRadius: "20px" }}>{products.length} товаров</span>
          <button onClick={loadProducts} style={{ border: "none", background: "none", cursor: "pointer", padding: "6px" }}><RefreshCw size={16} /></button>
          <a href="/" target="_blank" style={{ border: "none", background: "none", cursor: "pointer", padding: "6px", color: "inherit" }}><Eye size={16} /></a>
          <button onClick={handleLogout} style={{ border: "none", background: "#ffe0e0", color: "#d00", cursor: "pointer", padding: "6px 12px", borderRadius: "10px", fontSize: "13px" }}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "12px", marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <Search size={16} style={{ color: "#999" }} />
          <input placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: "120px", padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px", outline: "none" }} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }}>
            <option value="all">Все</option>
            {categories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}
          </select>
          <button onClick={() => setIsAdding(true)}
            style={{ padding: "8px 14px", background: "#4a7c59", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Plus size={16} /> Добавить
          </button>
        </div>

        {saveStatus && (
          <div style={{ padding: "10px 14px", borderRadius: "12px", marginBottom: "12px", fontSize: "13px", background: saveStatus.includes("Ошибка") ? "#ffe0e0" : saveStatus.includes("Сохранено") ? "#e0ffe0" : "#e0e8ff", color: saveStatus.includes("Ошибка") ? "#d00" : saveStatus.includes("Сохранено") ? "#060" : "#006" }}>
            {saveStatus}
          </div>
        )}

        {isAdding && (
          <div style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "16px", border: "2px solid #4a7c59" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#4a7c59" }}>Новый товар</h2>
              <button onClick={() => setIsAdding(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
              <input placeholder="Название *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }} />
              <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }}>
                {categories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}
              </select>
              <input type="number" placeholder="Цена *" value={newProduct.price||""} onChange={e => setNewProduct({...newProduct, price: +e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }} />
              <input placeholder="Ед. изм." value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }} />
              <input placeholder="Ссылка на картинку *" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px", gridColumn: "span 2" }} />
              <input placeholder="Описание" value={newProduct.description||""} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }} />
              <input placeholder="Польза" value={newProduct.benefits||""} onChange={e => setNewProduct({...newProduct, benefits: e.target.value})} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "13px" }} />
            </div>
            <button onClick={handleAdd} disabled={isSaving} style={{ marginTop: "12px", padding: "10px 20px", background: "#4a7c59", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
              {isSaving ? "Сохраняю..." : "Добавить"}
            </button>
          </div>
        )}

        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f9f9f9", borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Фото</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Название</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Кат.</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Цена</th>
                <th style={{ padding: "10px", textAlign: "left" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  {editingId === p.id && editingProduct ? (
                    <>
                      <td style={{ padding: "8px" }}>{p.id}</td>
                      <td style={{ padding: "8px" }}><input value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} style={{ width: "100px", padding: "4px", fontSize: "11px", border: "1px solid #ddd", borderRadius: "6px" }} /></td>
                      <td style={{ padding: "8px" }}><input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: "100%", padding: "4px", fontSize: "11px", border: "1px solid #ddd", borderRadius: "6px" }} /></td>
                      <td style={{ padding: "8px" }}><select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} style={{ padding: "4px", fontSize: "11px", border: "1px solid #ddd", borderRadius: "6px" }}>{categories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}</select></td>
                      <td style={{ padding: "8px" }}><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: +e.target.value})} style={{ width: "60px", padding: "4px", fontSize: "11px", border: "1px solid #ddd", borderRadius: "6px" }} /></td>
                      <td style={{ padding: "8px", display: "flex", gap: "4px" }}>
                        <button onClick={handleUpdate} style={{ padding: "4px 8px", background: "#e0ffe0", color: "#060", border: "none", borderRadius: "6px", cursor: "pointer" }}><Save size={14} /></button>
                        <button onClick={() => {setEditingId(null); setEditingProduct(null);}} style={{ padding: "4px 8px", background: "#ffe0e0", color: "#d00", border: "none", borderRadius: "6px", cursor: "pointer" }}><X size={14} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "8px", color: "#999" }}>{p.id}</td>
                      <td style={{ padding: "8px" }}><img src={p.image} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px" }} onError={e => (e.target as any).src="https://placehold.co/100/4a7c59/white?text=-"} /></td>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>{p.name}</td>
                      <td style={{ padding: "8px", fontSize: "11px" }}>{categoryNames[p.category]}</td>
                      <td style={{ padding: "8px", fontWeight: "bold", color: "#c0392b" }}>{p.price}₽</td>
                      <td style={{ padding: "8px", display: "flex", gap: "4px" }}>
                        <button onClick={() => startEdit(p)} style={{ padding: "4px 8px", background: "#e0e8ff", color: "#006", border: "none", borderRadius: "6px", cursor: "pointer" }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} style={{ padding: "4px 8px", background: "#ffe0e0", color: "#d00", border: "none", borderRadius: "6px", cursor: "pointer" }}><Trash2 size={14} /></button>
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
