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
  fruits: "🍎 Фрукты", vegetables: "🥕 Овощи", nuts: "🥜 Орехи и сухофрукты",
  sweets: "🍬 Сладости", dried: "🥭 Сухофрукты", grocery: "🍵 Бакалея и чай", drinks: "🥤 Напитки",
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
    // Здесь можно сверить с Firebase или с переменными окружения
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
    setSaveStatus("⏳ Сохраняю и обновляю сайт...");
    try {
      const res = await fetch("/api/admin/save-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts, message }),
      });
      const result = await res.json();
      if (result.success) {
        setSaveStatus("✅ Сохранено! Сайт обновится через 1-2 минуты.");
        setProducts(updatedProducts);
      } else {
        setSaveStatus("❌ Ошибка: " + (result.error || "неизвестно"));
      }
    } catch (e) {
      setSaveStatus("❌ Ошибка соединения");
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(""), 5000);
  };

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.image || newProduct.price <= 0) {
      setSaveStatus("❌ Заполните название, цену и ссылку");
      return;
    }
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const updated = [...products, { ...newProduct, id: newId }];
    await saveToGitHub(updated, `Добавлен товар: ${newProduct.name}`);
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
    await saveToGitHub(updated, `Изменён товар: ${editingProduct.name}`);
    setEditingId(null);
    setEditingProduct(null);
  };

  const handleDelete = async (id: number) => {
    const p = products.find(x => x.id === id);
    if (!confirm(`Удалить «${p?.name}»?`)) return;
    const updated = products.filter(p => p.id !== id);
    await saveToGitHub(updated, `Удалён товар: ${p?.name}`);
  };

  // === РЕНДЕР: ЛОГИН ===
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#f0ebe0] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <span className="text-5xl block mb-3">🍎</span>
            <h1 className="text-2xl font-bold text-[#4a7c59]">Облачная 51</h1>
            <p className="text-sm text-gray-500 mt-1">Вход в админ-панель</p>
          </div>
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59]" />
          <input type="password" placeholder="Пароль" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 mb-4 outline-none focus:border-[#4a7c59]" />
          {loginError && <p className="text-red-500 text-sm mb-4 text-center">{loginError}</p>}
          <button onClick={handleLogin}
            className="w-full bg-[#e87722] text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-all">
            Войти
          </button>
        </div>
      </div>
    );
  }

  // === РЕНДЕР: АДМИНКА ===
  const filtered = products
    .filter(p => selectedCategory === "all" || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f5f3ef] font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍎</span>
            <h1 className="text-lg font-bold text-[#4a7c59]">Админ-панель</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{products.length} товаров</span>
            <button onClick={loadProducts} className="p-2 hover:bg-gray-100 rounded-xl"><RefreshCw className="w-4 h-4" /></button>
            <a href="/" target="_blank" className="p-2 hover:bg-gray-100 rounded-xl"><Eye className="w-4 h-4" /></a>
            <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Поиск и фильтры */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
          <Search className="w-4 h-4 text-gray-400" />
          <input placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[150px] bg-gray-50 border rounded-xl px-3 py-2 outline-none text-sm" />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="bg-gray-50 border rounded-xl px-3 py-2 text-sm">
            <option value="all">Все</option>
            {categories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}
          </select>
          <button onClick={() => setIsAdding(true)}
            className="bg-[#4a7c59] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>

        {saveStatus && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${
            saveStatus.includes("✅") ? "bg-green-50 text-green-700" :
            saveStatus.includes("❌") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
          }`}>{saveStatus}</div>
        )}

        {/* Форма добавления */}
        {isAdding && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border-2 border-green-200">
            <div className="flex justify-between mb-3">
              <h2 className="font-bold text-[#4a7c59]">Новый товар</h2>
              <button onClick={() => setIsAdding(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input placeholder="Название *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="border rounded-xl px-3 py-2 text-sm">
                {categories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}
              </select>
              <input type="number" placeholder="Цена *" value={newProduct.price||""} onChange={e => setNewProduct({...newProduct, price: +e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Ед. изм." value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Ссылка на картинку *" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2" />
              <input placeholder="Описание" value={newProduct.description||""} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Польза" value={newProduct.benefits||""} onChange={e => setNewProduct({...newProduct, benefits: e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
            </div>
            <button onClick={handleAdd} disabled={isSaving} className="mt-3 bg-[#4a7c59] text-white px-5 py-2 rounded-xl text-sm">Добавить</button>
          </div>
        )}

        {/* Таблица */}
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead><tr className="bg-gray-50 border-b text-left">
              <th className="p-2 w-10">ID</th><th className="p-2 w-14">Фото</th><th className="p-2">Название</th><th className="p-2">Кат.</th><th className="p-2">Цена</th><th className="p-2 w-20"></th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  {editingId === p.id && editingProduct ? (
                    <>
                      <td className="p-2">{p.id}</td>
                      <td className="p-2"><input value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="border rounded px-1 py-0.5 w-28 text-xs" /></td>
                      <td className="p-2"><input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="border rounded px-1 py-0.5 w-full text-xs" /></td>
                      <td className="p-2"><select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="border rounded px-1 py-0.5 text-xs">{categories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}</select></td>
                      <td className="p-2"><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: +e.target.value})} className="border rounded px-1 py-0.5 w-16 text-xs" /></td>
                      <td className="p-2 flex gap-1">
                        <button onClick={handleUpdate} className="p-1 bg-green-50 text-green-600 rounded"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={() => {setEditingId(null); setEditingProduct(null);}} className="p-1 bg-red-50 text-red-600 rounded"><X className="w-3.5 h-3.5" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 text-gray-500">{p.id}</td>
                      <td className="p-2"><img src={p.image} className="w-8 h-8 object-cover rounded" onError={e => (e.target as any).src="https://placehold.co/100/4a7c59/white?text=—"} /></td>
                      <td className="p-2 font-medium truncate max-w-[180px]">{p.name}</td>
                      <td className="p-2 text-xs">{categoryNames[p.category]?.split(" ")[0]}</td>
                      <td className="p-2 font-bold text-[#c0392b]">{p.price}₽</td>
                      <td className="p-2 flex gap-1">
                        <button onClick={() => startEdit(p)} className="p-1 bg-blue-50 text-blue-600 rounded"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
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