"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Phone, MapPin, Search, User, ExternalLink, Info, Check, AlertCircle, Upload, LogOut } from "lucide-react";
import productsData from "@/data/products.json";
import { registerUser, loginUser, logoutUser, onAuthChange, resetPassword } from "@/lib/firebase";

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

interface CartItem extends Product {
  quantity: number;
}

const categories = [
  { id: "all", name: "Всё" },
  { id: "fruits", name: "Фрукты" },
  { id: "vegetables", name: "Овощи" },
  { id: "nuts", name: "Орехи и сухофрукты" },
  { id: "sweets", name: "Сладости" },
  { id: "dried", name: "Сухофрукты и чипсы" },
  { id: "canned", name: "Консервация" },
  { id: "dairy", name: "Молочное" },
  { id: "grocery", name: "Бакалея и чай" },
  { id: "drinks", name: "Напитки" },
];

const deliveryZones = [
  { id: 1, name: "Ленинский район", price: 0 },
  { id: 2, name: "Другие районы", price: 0, note: "договорная" },
];

const banks = [
  { name: "СБП / Карта", phone: "+79134781012" },
  { name: "Т-Банк / Альфа-Банк", phone: "+79235324403" },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginForm, setLoginForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [addedItems, setAddedItems] = useState<number[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: any) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoggedIn(true);
        setUserEmail(user.email || "");
        const savedData = localStorage.getItem("user_" + user.uid);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setUserName(data.name || "");
            setUserAddress(data.address || "");
            setAddressConfirmed(data.addressConfirmed || false);
            setUserPhone(data.phone || "");
          } catch (e) {}
        }
      } else {
        setFirebaseUser(null);
        setIsLoggedIn(false);
        setUserName("");
        setUserEmail("");
        setUserAddress("");
        setAddressConfirmed(false);
        setUserPhone("");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { setProducts(productsData); }, []);

  useEffect(() => {
    if (firebaseUser) {
      localStorage.setItem("user_" + firebaseUser.uid, JSON.stringify({ name: userName, address: userAddress, addressConfirmed, phone: userPhone }));
    }
  }, [userName, userAddress, addressConfirmed, userPhone, firebaseUser]);

  const handleLogout = async () => { try { await logoutUser(); } catch (e) {} };

  const confirmAddress = () => {
    setAddressError("");
    if (!userAddress.trim()) setAddressError("Введите адрес доставки");
    else if (userAddress.trim().length < 10) setAddressError("Адрес слишком короткий");
    else if (!/\d/.test(userAddress)) setAddressError("Добавьте номер дома");
    else { setAddressConfirmed(true); setAddressError(""); }
  };

  const getProductImage = (p: Product) => p.image?.startsWith("http") ? p.image : "https://placehold.co/400x400/4a7c59/white?text=" + encodeURIComponent(p.name);
  const validatePhone = (phone: string) => /^\+7\d{10}$/.test(phone.replace(/\s/g, ''));
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = async () => {
    setLoginError("");
    if (isRegistering) {
      if (!loginForm.name.trim()) return setLoginError("Введите имя");
      if (!validateEmail(loginForm.email)) return setLoginError("Некорректный email");
      if (!validatePhone(loginForm.phone)) return setLoginError("Некорректный телефон");
      if (loginForm.password.length < 6) return setLoginError("Пароль минимум 6 символов");
      try {
        await registerUser(loginForm.email, loginForm.password);
        setUserName(loginForm.name);
        setUserPhone(loginForm.phone);
        setShowLogin(false);
        setLoginForm({ name: "", email: "", phone: "", password: "" });
      } catch (e: any) { setLoginError("Ошибка регистрации"); }
    } else {
      try { await loginUser(loginForm.email, loginForm.password); setShowLogin(false); }
      catch (e: any) { setLoginError("Неверный email или пароль"); }
    }
  };

  const handleResetPassword = async () => {
    try { await resetPassword(resetEmail); setResetSent(true); }
    catch (e: any) { alert("Ошибка"); }
  };

  const filtered = products.filter(p => (selectedCategory === "all" || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const addToCart = (p: Product) => setCart(prev => {
    setAddedItems(prev => { if (prev.includes(p.id)) return prev; return [...prev, p.id]; });
    const ex = prev.find(i => i.id === p.id);
    if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { ...p, quantity: 1 }];
  });

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));
  const updQty = (id: number, d: number) => setCart(prev => {
    const updated = prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + d) } : i);
    return updated.filter(i => i.quantity > 0);
  });

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const items = cart.reduce((s, i) => s + i.quantity, 0);

  const handleOrder = async () => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (!userAddress.trim() || !addressConfirmed) { alert("Подтвердите адрес"); return; }
    if (!cart.length) { alert("Корзина пуста"); return; }
    if (!paymentScreenshot) { alert("Прикрепите скриншот оплаты"); return; }

    const list = cart.map(i => i.name + " " + i.quantity + i.unit + " = " + (i.quantity * i.price) + "₽").join("\n");
    const zone = selectedZone === 1 ? "Бесплатная доставка" : "Доставка договорная";
    const message = "НОВЫЙ ЗАКАЗ!\n" + userName + "\n" + userEmail + "\n" + userPhone + "\n" + userAddress + "\n" + zone + "\n\n" + list + "\nИТОГО: " + total + "₽";

    const formData = new FormData();
    formData.append('message', message);
    formData.append('photo', paymentScreenshot);
    setCart([]); setPaymentScreenshot(null); setShowPayment(false); setIsCartOpen(false);
    alert("Заказ отправлен!");
    fetch('/api/send-order', { method: 'POST', body: formData }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#f0ebe0] flex flex-col font-sans">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-orange-100 shadow-sm">
        <div className="px-3 md:px-4 py-2.5 md:py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-1.5 md:p-2 rounded-xl shrink-0"><span className="text-xl md:text-3xl">🍎</span></div>
            <div><h1 className="text-lg md:text-2xl font-bold text-[#4a7c59]">Облачная 51</h1><p className="text-xs md:text-sm text-gray-500">Свежие продукты каждый день</p></div>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && <span className="text-xs bg-orange-50 px-2 py-1 rounded-full hidden sm:block">👋 {userName}</span>}
            <button onClick={() => isLoggedIn ? handleLogout() : setShowLogin(true)} className="p-2 hover:bg-orange-50 rounded-full">
              {isLoggedIn ? <LogOut className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-orange-50 rounded-full">
              <ShoppingCart className="w-5 h-5" />
              {items > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#e87722] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{items}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className="w-full h-28 md:h-40 overflow-hidden">
        <img src="https://avatars.mds.yandex.net/i?id=1464f4f5e31f574205e1066475e11c4c37253dac-4955124-images-thumbs&n=13" alt="Продукты" className="w-full h-full object-cover" />
      </div>

      <div className="bg-white/80 border-b">
        <div className="px-3 md:px-4 py-2 flex flex-wrap items-center gap-2 max-w-6xl mx-auto">
          <span className="text-xs md:text-sm text-gray-600 bg-orange-50/80 px-2 py-1.5 rounded-lg"><MapPin className="w-4 h-4 text-[#e87722] inline" /> ул. Облачная, 51</span>
          <span className="text-xs md:text-sm text-gray-600 bg-orange-50/80 px-2 py-1.5 rounded-lg"><Phone className="w-4 h-4 text-[#e87722] inline" /> +7 913 004 1112</span>
          <button onClick={() => setIsMapVisible(true)} className="text-xs bg-green-50/80 text-[#4a7c59] px-3 py-1.5 rounded-lg font-medium"><MapPin className="w-4 h-4 inline" /> Наш магазин</button>
          <a href="https://t.me/fruktiovoshiOblachnaya51" target="_blank" className="text-xs bg-blue-50/80 text-[#1565c0] px-3 py-1.5 rounded-lg font-medium"><ExternalLink className="w-4 h-4 inline" /> Telegram</a>
        </div>
      </div>

      {isLoggedIn && (
        <div className="bg-yellow-50/80 border-b border-orange-100">
          <div className="px-3 md:px-4 py-2 flex gap-2 items-center max-w-6xl mx-auto">
            <MapPin className="w-4 h-4 text-[#e87722] shrink-0" />
            <input type="text" placeholder="Адрес доставки" value={userAddress} onChange={e => { setUserAddress(e.target.value); setAddressConfirmed(false); }} className="bg-white border border-orange-200 rounded-lg px-3 py-2 outline-none flex-1 text-sm" />
            <button onClick={confirmAddress} className={addressConfirmed ? "bg-green-500 text-white px-3 py-2 rounded-lg text-xs" : "bg-[#e87722] text-white px-3 py-2 rounded-lg text-xs"}>{addressConfirmed ? "✅ Подтверждён" : "Подтвердить"}</button>
          </div>
          {addressError && <div className="px-3 pb-2 text-red-500 text-xs"><AlertCircle className="w-3 h-3 inline" /> {addressError}</div>}
        </div>
      )}

      <div className="px-3 md:px-4 py-3 md:py-6 flex gap-3 md:gap-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="hidden md:flex flex-col gap-1.5 w-48 shrink-0">
          {categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={"text-left px-3 py-2.5 rounded-xl font-medium text-sm transition-all " + (selectedCategory === c.id ? "bg-[#e87722] text-white" : "bg-white/70 text-gray-700 hover:bg-orange-50")}>{c.name}</button>))}
          <div className="mt-4 bg-white/70 rounded-2xl p-3">
            <h3 className="font-bold text-[#4a7c59] text-sm mb-2">Доставка</h3>
            {deliveryZones.map(z => (<button key={z.id} onClick={() => setSelectedZone(z.id)} className={"w-full text-left px-2 py-1.5 rounded-lg text-xs mb-1 " + (selectedZone === z.id ? "bg-[#e87722] text-white" : "bg-gray-50 text-gray-600")}>{z.name}: {z.note || "Бесплатно"}</button>))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 mb-3">
            {categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={"whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium " + (selectedCategory === c.id ? "bg-[#e87722] text-white" : "bg-white/70 text-gray-600")}>{c.name}</button>))}
          </div>
          <div className="flex items-center gap-2 bg-white/70 border rounded-xl px-3 py-2.5 mb-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Поиск товаров..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent outline-none flex-1 text-sm" />
          </div>
          <div className="md:hidden mb-3 bg-white/70 rounded-xl p-2">
            {deliveryZones.map(z => (<button key={z.id} onClick={() => setSelectedZone(z.id)} className={"px-2 py-1 rounded-lg text-xs mr-1 " + (selectedZone === z.id ? "bg-[#e87722] text-white" : "bg-gray-50 text-gray-600")}>{z.name}: {z.note || "0₽"}</button>))}
          </div>

          {filtered.length === 0 ? <div className="text-center py-12 text-gray-400"><span className="text-3xl block mb-3">🍃</span><p>Ничего не найдено</p></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white/70 rounded-xl md:rounded-3xl shadow-sm border overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-square bg-gradient-to-br from-green-50/50 to-orange-50/50 relative overflow-hidden">
                    <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-semibold text-gray-800 text-xs md:text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-400">за {p.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base md:text-xl font-bold text-[#c0392b]">{p.price > 0 ? p.price + " ₽" : "—"}</span>
                      <button onClick={() => addToCart(p)} className={(addedItems.includes(p.id) || cart.some(i => i.id === p.id) ? 'bg-red-500' : 'bg-[#e87722]') + " text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:opacity-90 transition-all shrink-0"}><Plus className="w-4 h-4 md:w-5 md:h-5" /></button>
                    </div>
                    <button onClick={() => setSelectedProduct(p)} className="mt-2 w-full text-xs text-[#4a7c59] font-medium py-1.5 rounded-lg bg-green-50/80 hover:bg-green-100"><Info className="w-3 h-3 inline" /> Характеристики</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="bg-white/80 border-t mt-auto">
        <div className="px-4 py-6 max-w-6xl mx-auto text-center text-sm text-gray-400">
          <p>© 2026 Облачная 51. Все права защищены.</p>
        </div>
      </footer>

      {isMapVisible && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setIsMapVisible(false)}>
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4"><h2 className="font-bold text-lg text-[#4a7c59]">ул. Облачная, 51</h2><button onClick={() => setIsMapVisible(false)} className="p-1"><X className="w-5 h-5" /></button></div>
            <div className="h-64 bg-gray-200"><iframe src="https://yandex.ru/map-widget/v1/?ll=82.804277%2C54.977501&z=16&pt=82.804277,54.977501,pm2rdl" width="100%" height="100%" frameBorder="0" allowFullScreen></iframe></div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-bold text-lg text-[#4a7c59]">{selectedProduct.name}</h2><button onClick={() => setSelectedProduct(null)} className="p-1"><X className="w-5 h-5" /></button></div>
            <div className="p-4"><img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-xl mb-4" /><p className="text-gray-700 text-sm mb-3">{selectedProduct.description || "Описание скоро появится."}</p>{selectedProduct.benefits && <div className="bg-green-50 rounded-xl p-3 mt-3"><p className="text-sm font-semibold text-[#4a7c59]">Польза:</p><p className="text-sm text-gray-700">{selectedProduct.benefits}</p></div>}</div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-center text-[#4a7c59]">{isRegistering ? "Регистрация" : "Вход"}</h2>
            {loginError && <p className="text-red-500 text-sm mb-3 text-center">{loginError}</p>}
            {isRegistering && <input type="text" placeholder="Имя" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} className="w-full border rounded-xl px-4 py-3 mb-3 outline-none" />}
            <input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full border rounded-xl px-4 py-3 mb-3 outline-none" />
            {isRegistering && <input type="tel" placeholder="Телефон +7..." value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} className="w-full border rounded-xl px-4 py-3 mb-3 outline-none" />}
            <input type="password" placeholder="Пароль" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full border rounded-xl px-4 py-3 mb-4 outline-none" />
            <button onClick={handleLogin} className="w-full bg-[#e87722] text-white py-3.5 rounded-xl font-medium">{isRegistering ? "Зарегистрироваться" : "Войти"}</button>
            <p className="text-center text-sm text-gray-500 mt-3">{isRegistering ? "Уже есть аккаунт?" : "Нет аккаунта?"} <button onClick={() => setIsRegistering(!isRegistering)} className="text-[#4a7c59] font-medium underline">{isRegistering ? "Войти" : "Зарегистрироваться"}</button></p>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-center text-[#4a7c59]">Оплата</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center"><p className="text-sm text-gray-500">Сумма:</p><p className="text-3xl font-bold text-[#c0392b]">{total} ₽</p></div>
            <div className="bg-green-50 rounded-xl p-4 mb-4">{banks.map((bank, idx) => (<p key={idx} className="text-sm"><strong>{bank.name}:</strong> {bank.phone}</p>))}</div>
            <label className="flex items-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-4 mb-4 text-sm cursor-pointer text-center justify-center"><Upload className="w-4 h-4" />{paymentScreenshot ? paymentScreenshot.name : "Прикрепить чек"}<input type="file" accept="image/*" onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} className="hidden" /></label>
            <button onClick={handleOrder} disabled={!paymentScreenshot} className="w-full bg-[#e87722] text-white py-3.5 rounded-xl font-medium disabled:opacity-50">Подтвердить оплату</button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 bg-[#4a7c59] text-white"><h2 className="text-xl font-bold">Корзина</h2><button onClick={() => setIsCartOpen(false)} className="p-1"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4">{cart.length === 0 ? <p className="text-gray-500 text-center py-16">Корзина пуста</p> : cart.map(i => (
              <div key={i.id} className="flex items-center gap-3 border-b pb-3">
                <img src={getProductImage(i)} alt={i.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                <div className="flex-1"><h4 className="font-medium text-sm">{i.name}</h4><p className="text-[#c0392b] font-bold text-sm">{i.price} ₽ / {i.unit}</p><p className="text-xs text-gray-500">{i.quantity} × {i.price} ₽ = {i.quantity * i.price} ₽</p></div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updQty(i.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                  <span className="w-5 text-center font-medium">{i.quantity}</span>
                  <button onClick={() => updQty(i.id, 1)} className="w-7 h-7 rounded-full bg-[#e87722] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                  <button onClick={() => removeFromCart(i.id)} className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center"><X className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            ))}</div>
            <div className="border-t p-4 bg-green-50">
              <div className="flex items-center justify-between mb-4"><span className="text-lg font-medium">Итого:</span><span className="text-2xl font-bold text-[#c0392b]">{total} ₽</span></div>
              <button onClick={() => { setShowPayment(true); setIsCartOpen(false); }} disabled={cart.length === 0 || !addressConfirmed} className="w-full bg-[#e87722] text-white py-4 text-lg rounded-xl font-medium disabled:opacity-50">Оплатить и заказать</button>
              <p className="text-xs text-gray-500 text-center mt-3">📍 {userAddress || "Адрес не указан"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
