"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Phone, MapPin, Search, User, ExternalLink, Info, Check, AlertCircle, Upload, LogOut } from "lucide-react";
import productsData from "@/data/products.json";
import { auth, registerUser, loginUser, logoutUser, onAuthChange, resetPassword } from "@/lib/firebase";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  description?: string;
  benefits?: string;
  weight?: string;
  composition?: string;
  packaging?: string;
  shelfLife?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const categories = [
  { id: "all", name: "🛍️ Всё" },
  { id: "fruits", name: "🍎 Фрукты" },
  { id: "vegetables", name: "🥕 Овощи" },
  { id: "nuts", name: "🥜 Орехи и сухофрукты" },
  { id: "sweets", name: "🍬 Сладости" },
  { id: "dried", name: "🥭 Сухофрукты и чипсы" },
  { id: "grocery", name: "🍵 Бакалея и чай" },
  { id: "drinks", name: "🥤 Напитки" },
];

const deliveryZones = [
  { id: 1, name: "Ленинский район", price: 0, color: "#4CAF50" },
  { id: 2, name: "Другие районы", price: 0, color: "#9E9E9E", note: "договорная" },
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
        const savedData = localStorage.getItem(`user_${user.uid}`);
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
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({ name: userName, address: userAddress, addressConfirmed, phone: userPhone }));
    }
  }, [userName, userAddress, addressConfirmed, userPhone, firebaseUser]);

  const handleLogout = async () => { try { await logoutUser(); } catch (e) {} };

  const confirmAddress = () => {
    setAddressError("");
    if (!userAddress.trim()) setAddressError("Введите адрес доставки");
    else if (userAddress.trim().length < 10) setAddressError("Адрес слишком короткий");
    else if (!/\d/.test(userAddress)) setAddressError("Добавьте номер дома");
    else {
      setAddressConfirmed(true);
      setAddressError("");
    }
  };

  const getProductImage = (p: Product) => p.image?.startsWith("http") ? p.image : "https://placehold.co/400x400/4a7c59/white?text=" + encodeURIComponent(p.name);
  
  const validatePhone = (phone: string) => /^\+7\d{10}$/.test(phone.replace(/\s/g, ''));
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = async () => {
    setLoginError("");
    if (isRegistering) {
      if (!loginForm.name.trim()) return setLoginError("Введите имя");
      if (!validateEmail(loginForm.email)) return setLoginError("Некорректный email (пример: user@domain.zone)");
      if (!validatePhone(loginForm.phone)) return setLoginError("Некорректный телефон (формат: +7XXXXXXXXXX)");
      if (loginForm.password.length < 6) return setLoginError("Пароль минимум 6 символов");
      try {
        await registerUser(loginForm.email, loginForm.password);
        setUserName(loginForm.name);
        setUserPhone(loginForm.phone);
        setShowLogin(false);
        setLoginForm({ name: "", email: "", phone: "", password: "" });
      } catch (e: any) { setLoginError(e.code === "auth/email-already-in-use" ? "Email уже зарегистрирован" : "Ошибка регистрации"); }
    } else {
      try { await loginUser(loginForm.email, loginForm.password); setShowLogin(false); }
      catch (e: any) { setLoginError("Неверный email или пароль"); }
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) return;
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      setTimeout(() => { setResetSent(false); setForgotPassword(false); setResetEmail(""); }, 3000);
    } catch (e: any) { alert("Ошибка отправки письма. Проверьте email."); }
  };

  const filtered = products.filter(p => (selectedCategory === "all" || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const addToCart = (p: Product) => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    setAddedItems(prev => {
      if (prev.includes(p.id)) return prev;
      return [...prev, p.id];
    });
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

    const list = cart.map(i => `${i.name} — ${i.quantity} ${i.unit} × ${i.price} ₽ = ${i.quantity * i.price} ₽`).join("\n");
    const zone = selectedZone === 1 ? "🚚 Бесплатная доставка" : "🚚 Доставка — договорная";
    const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${userName}\n📧 ${userEmail}\n📞 ${userPhone}\n📍 ${userAddress}\n${zone}\n\n${list}\n💰 ИТОГО: ${total} ₽\n\n📎 Чек об оплате прикреплён`;

    const formData = new FormData();
    formData.append('message', message);
    formData.append('photo', paymentScreenshot);

    setCart([]);
    setPaymentScreenshot(null);
    setShowPayment(false);
    setIsCartOpen(false);
    alert("✅ Заказ отправлен! Мы свяжемся с вами.");

    fetch('/api/send-order', {
      method: 'POST',
      body: formData,
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#f0ebe0] flex flex-col max-w-full overflow-x-hidden font-sans">
      {/* ШАПКА */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-orange-100 shadow-sm">
        <div className="px-3 md:px-4 py-2.5 md:py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-orange-100 p-1.5 md:p-2 rounded-xl md:rounded-2xl shrink-0"><span className="text-xl md:text-3xl">🍎</span></div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-[#4a7c59] truncate">Облачная 51</h1>
              <p className="text-xs md:text-sm text-gray-500">Свежие продукты каждый день</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {isLoggedIn && <span className="text-xs md:text-sm bg-orange-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full hidden sm:block truncate max-w-[100px]">👋 {userName}</span>}
            <button onClick={() => isLoggedIn ? handleLogout() : setShowLogin(true)} className="p-2 md:p-2.5 hover:bg-orange-50 rounded-full" title={isLoggedIn ? "Выйти" : "Войти"}>
              {isLoggedIn ? <LogOut className="w-4 h-4 md:w-5 md:h-5" /> : <User className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 md:p-2.5 hover:bg-orange-50 rounded-full">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              {items > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#e87722] text-white text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center font-bold">{items}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ФОТО */}
      <div className="w-full h-28 md:h-40 overflow-hidden">
        <img src="https://avatars.mds.yandex.net/i?id=1464f4f5e31f574205e1066475e11c4c37253dac-4955124-images-thumbs&n=13" alt="Свежие продукты" className="w-full h-full object-cover" />
      </div>

      {/* КОНТАКТЫ */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="px-3 md:px-4 py-2 md:py-3 flex flex-wrap items-center gap-1.5 max-w-6xl mx-auto w-full">
          <span className="inline-flex items-center gap-1 text-xs md:text-sm text-gray-600 bg-orange-50/80 px-2 md:px-3 py-1.5 rounded-lg backdrop-blur-sm"><MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#e87722] shrink-0" /> <span className="truncate max-w-[120px] md:max-w-none">ул. Облачная, 51</span></span>
          <span className="inline-flex items-center gap-1 text-xs md:text-sm text-gray-600 bg-orange-50/80 px-2 md:px-3 py-1.5 rounded-lg backdrop-blur-sm"><Phone className="w-3 h-3 md:w-4 md:h-4 text-[#e87722] shrink-0" /> +7 913 004 1112</span>
          <button onClick={() => setIsMapVisible(true)} className="text-xs md:text-sm bg-green-50/80 text-[#4a7c59] px-2 md:px-4 py-1.5 rounded-lg font-medium hover:bg-green-100/80 inline-flex items-center gap-1 backdrop-blur-sm"><MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> Наш магазин</button>
          <a href="https://t.me/fruktiovoshiOblachnaya51" target="_blank" className="text-xs md:text-sm bg-blue-50/80 text-[#1565c0] px-2 md:px-4 py-1.5 rounded-lg font-medium hover:bg-blue-100/80 inline-flex items-center gap-1 backdrop-blur-sm"><ExternalLink className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> Telegram</a>
        </div>
      </div>

      {/* АДРЕС ДОСТАВКИ */}
      {isLoggedIn && (
        <div className="bg-yellow-50/80 backdrop-blur-sm border-b border-orange-100">
          <div className="px-3 md:px-4 py-2 flex gap-2 items-center max-w-6xl mx-auto w-full flex-wrap">
            <MapPin className="w-4 h-4 text-[#e87722] shrink-0" />
            <input type="text" placeholder="📍 Адрес доставки" value={userAddress} onChange={e => { setUserAddress(e.target.value); setAddressConfirmed(false); }} className="bg-white/90 border border-orange-200 rounded-lg px-3 py-2 outline-none flex-1 text-xs md:text-sm min-w-[120px] backdrop-blur-sm" />
            <button onClick={confirmAddress} className={`font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1 shrink-0 backdrop-blur-sm ${addressConfirmed ? "bg-green-500 text-white" : "bg-[#e87722] text-white"}`}>
              {addressConfirmed ? "✅ Подтверждён" : "Подтвердить"}
            </button>
          </div>
          {addressError && <div className="px-3 pb-2 text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" /> {addressError}</div>}
        </div>
      )}

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="px-3 md:px-4 py-3 md:py-6 flex gap-3 md:gap-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="hidden md:flex flex-col gap-1.5 w-48 md:w-56 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1 px-2">Каталог</p>
          {categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`text-left px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-medium text-xs md:text-sm transition-all backdrop-blur-sm ${selectedCategory === c.id ? "bg-[#e87722] text-white shadow-lg" : "bg-white/70 text-gray-700 hover:bg-orange-50/80 border border-white/50"}`}>{c.name}</button>))}
          <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/50">
            <h3 className="font-bold text-[#4a7c59] text-xs md:text-sm mb-2">🚚 Доставка</h3>
            {deliveryZones.map(z => (<button key={z.id} onClick={() => setSelectedZone(z.id)} className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs font-medium mb-1 transition-all ${selectedZone === z.id ? "bg-[#e87722] text-white" : "bg-gray-50/80 text-gray-600 hover:bg-orange-50/80"}`}>{z.name}: {z.price === 0 ? (z.note || "Бесплатно") : `${z.price} ₽`}</button>))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-hide">
            {categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 backdrop-blur-sm ${selectedCategory === c.id ? "bg-[#e87722] text-white shadow" : "bg-white/70 text-gray-600 border border-white/50"}`}>{c.name}</button>))}
          </div>
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2.5 mb-3">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="text" placeholder="🔍 Поиск товаров..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent outline-none flex-1 text-sm min-w-0" />
          </div>
          <div className="md:hidden mb-3 bg-white/70 backdrop-blur-sm rounded-xl p-2 border border-white/50">
            <p className="text-xs font-semibold text-[#4a7c59] mb-1 px-1">🚚 Доставка:</p>
            <div className="flex gap-1.5 flex-wrap">
              {deliveryZones.map(z => (<button key={z.id} onClick={() => setSelectedZone(z.id)} className={`px-2 py-1 rounded-lg text-xs transition-all shrink-0 backdrop-blur-sm ${selectedZone === z.id ? "bg-[#e87722] text-white" : "bg-gray-50/80 text-gray-600"}`}>{z.name}: {z.price === 0 ? (z.note || "0₽") : `${z.price}₽`}</button>))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white/70 backdrop-blur-sm rounded-2xl"><span className="text-3xl block mb-3">🍃</span><p className="text-sm">Ничего не найдено</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white/70 backdrop-blur-sm rounded-xl md:rounded-3xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-all group">
                  <div className="aspect-square bg-gradient-to-br from-green-50/50 to-orange-50/50 relative overflow-hidden">
                    <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-semibold text-gray-800 text-xs md:text-sm line-clamp-2">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">за {p.unit}</p>
                    {p.weight && <p className="text-xs text-gray-400">Вес: {p.weight}</p>}
                    {p.composition && <p className="text-xs text-gray-400">Состав: {p.composition}</p>}
                    {p.packaging && <p className="text-xs text-gray-400">Упаковка: {p.packaging}</p>}
                    {p.shelfLife && <p className="text-xs text-gray-400">Срок годности: {p.shelfLife}</p>}
                    <div className="flex items-center justify-between mt-2 md:mt-3">
                      <span className="text-base md:text-xl font-bold text-[#c0392b]">{p.price > 0 ? `${p.price} ₽` : "—"}</span>
                      <button 
                        onClick={() => addToCart(p)} 
                        className={`${
                          addedItems.includes(p.id) || cart.some(i => i.id === p.id) 
                            ? 'bg-red-500' 
                            : 'bg-[#e87722]'
                        } text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:opacity-90 transition-all shrink-0`}
                      >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                    <button onClick={() => setSelectedProduct(p)} className="mt-2 md:mt-3 w-full text-xs text-[#4a7c59] font-medium flex items-center justify-center gap-1 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-green-50/80 hover:bg-green-100/80 transition-all backdrop-blur-sm"><Info className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" /> Характеристики</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ПОДВАЛ */}
      <footer className="bg-white/80 backdrop-blur-sm border-t mt-auto">
        <div className="px-4 py-6 md:py-10 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div><h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2"><span className="text-xl md:text-2xl">🍎</span> Облачная 51</h3><p className="text-gray-500 text-xs md:text-sm">Свежие продукты с доставкой по Новосибирску.</p></div>
            <div><h4 className="font-semibold mb-2 md:mb-3 text-[#4a7c59] text-sm">Контакты</h4><ul className="space-y-1.5 text-xs md:text-sm text-gray-500"><li className="flex items-center gap-2"><MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> ул. Облачная, 51</li><li className="flex items-center gap-2"><Phone className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> +7 913 004 1112</li><li>🕒 Ежедневно с 9:00 до 21:00</li></ul></div>
            <div><h4 className="font-semibold mb-2 md:mb-3 text-[#4a7c59] text-sm">Telegram</h4><a href="https://t.me/fruktiovoshiOblachnaya51" target="_blank" className="inline-flex items-center gap-2 bg-blue-50/80 text-[#1565c0] px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-blue-100/80 transition-all backdrop-blur-sm"><ExternalLink className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> Подписаться</a></div>
          </div>
          <div className="border-t border-gray-200 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-xs md:text-sm text-gray-400"><p>© 2026 Облачная 51. Все права защищены.</p></div>
        </div>
      </footer>

      {/* МОДАЛКА КАРТЫ */}
      {isMapVisible && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setIsMapVisible(false)}>
          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-5"><h2 className="font-bold text-base md:text-lg text-[#4a7c59]">📍 ул. Облачная, 51 — магазин</h2><button onClick={() => setIsMapVisible(false)} className="p-1"><X className="w-5 h-5" /></button></div>
            <div className="h-64 md:h-72 bg-gray-200"><iframe src="https://yandex.ru/map-widget/v1/?ll=82.804277%2C54.977501&z=16&pt=82.804277,54.977501,pm2rdl" width="100%" height="100%" frameBorder="0" allowFullScreen></iframe></div>
            <div className="p-4 md:p-5 text-sm text-gray-600"><p>📍 <strong>ул. Облачная, 51</strong>, Новосибирск</p><div className="mt-2 space-y-1"><p className="font-medium text-[#4a7c59]">Зоны доставки:</p>{deliveryZones.map(z => <div key={z.id} className="flex items-center gap-2 text-xs md:text-sm"><div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: z.color}}></div><span>{z.name}: {z.price === 0 ? (z.note || "Бесплатно") : `${z.price} ₽`}</span></div>)}</div></div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ХАРАКТЕРИСТИК */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-5 border-b"><h2 className="font-bold text-base md:text-lg text-[#4a7c59] truncate">{selectedProduct.name}</h2><button onClick={() => setSelectedProduct(null)} className="p-1 shrink-0"><X className="w-5 h-5" /></button></div>
            <div className="p-4 md:p-5"><img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="w-full h-44 md:h-48 object-cover rounded-xl md:rounded-2xl mb-4" />
              <p className="text-gray-700 text-sm mb-3">{selectedProduct.description || "Описание скоро появится."}</p>
              {selectedProduct.weight && <p className="text-sm text-gray-600"><strong>Вес:</strong> {selectedProduct.weight}</p>}
              {selectedProduct.composition && <p className="text-sm text-gray-600"><strong>Состав:</strong> {selectedProduct.composition}</p>}
              {selectedProduct.packaging && <p className="text-sm text-gray-600"><strong>Упаковка:</strong> {selectedProduct.packaging}</p>}
              {selectedProduct.shelfLife && <p className="text-sm text-gray-600"><strong>Срок годности:</strong> {selectedProduct.shelfLife}</p>}
              {selectedProduct.benefits && <div className="bg-green-50 rounded-xl md:rounded-2xl p-3 md:p-4 mt-3"><p className="text-sm font-semibold text-[#4a7c59] mb-1">💚 Польза:</p><p className="text-sm text-gray-700">{selectedProduct.benefits}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ВХОДА */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3" onClick={() => { setShowLogin(false); setForgotPassword(false); }}>
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            {forgotPassword ? (
              <>
                <h2 className="text-lg md:text-xl font-bold mb-4 text-center text-[#4a7c59]">🔑 Восстановление пароля</h2>
                {resetSent ? <div className="text-center py-8"><span className="text-4xl md:text-5xl block mb-3">📧</span><p className="text-green-600 font-medium">Письмо отправлено!</p></div> : (
                  <>
                    <p className="text-sm text-gray-500 mb-4 text-center">Введите email, и мы пришлём ссылку для сброса пароля.</p>
                    <input type="email" placeholder="Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-[#4a7c59] text-sm" />
                    <button onClick={handleResetPassword} className="w-full bg-[#4a7c59] text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-all">Отправить ссылку</button>
                  </>
                )}
                <p className="text-center text-sm text-gray-500 mt-4"><button onClick={() => { setForgotPassword(false); setResetSent(false); }} className="text-[#4a7c59] font-medium underline">← Вернуться ко входу</button></p>
              </>
            ) : (
              <>
                <h2 className="text-lg md:text-xl font-bold mb-4 text-center text-[#4a7c59]">{isRegistering ? "📋 Регистрация" : "🔐 Вход"}</h2>
                {loginError && <p className="text-red-500 text-sm mb-3 text-center bg-red-50 py-2 rounded-xl">{loginError}</p>}
                {isRegistering && <input type="text" placeholder="Ваше имя" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59] text-sm" />}
                <input type="email" placeholder="Email (user@domain.zone)" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59] text-sm" />
                {isRegistering && <input type="tel" placeholder="Телефон (+7XXXXXXXXXX)" value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59] text-sm" />}
                <input type="password" placeholder="Пароль" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-[#4a7c59] text-sm" />
                <button onClick={handleLogin} className="w-full bg-[#e87722] hover:bg-orange-600 text-white py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-200">{isRegistering ? "Зарегистрироваться" : "Войти"}</button>
                {!isRegistering && <p className="text-center text-sm text-gray-500 mt-3"><button onClick={() => setForgotPassword(true)} className="text-[#4a7c59] font-medium underline">Забыли пароль?</button></p>}
                <p className="text-center text-sm text-gray-500 mt-3">{isRegistering ? "Уже есть аккаунт?" : "Нет аккаунта?"} <button onClick={() => setIsRegistering(!isRegistering)} className="text-[#4a7c59] font-medium underline">{isRegistering ? "Войти" : "Зарегистрироваться"}</button></p>
              </>
            )}
          </div>
        </div>
      )}

      {/* МОДАЛКА ОПЛАТЫ */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg md:text-xl font-bold mb-4 text-center text-[#4a7c59]">💳 Оплата переводом</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center"><p className="text-sm text-gray-500 mb-1">Сумма к оплате:</p><p className="text-3xl font-bold text-[#c0392b]">{total} ₽</p></div>
            <div className="bg-green-50 rounded-xl p-4 mb-4"><p className="text-sm font-semibold text-[#4a7c59] mb-2">Реквизиты для перевода:</p>{banks.map((bank, idx) => (<p key={idx} className="text-sm"><strong>{bank.name}:</strong> {bank.phone}</p>))}</div>
            <p className="text-xs text-gray-500 mb-3">После оплаты, прикрепите скриншот чека и нажмите «Подтвердить оплату».</p>
            <label className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 mb-4 text-sm text-gray-500 cursor-pointer hover:border-[#4a7c59] transition-all text-center justify-center">
              <Upload className="w-4 h-4" />
              {paymentScreenshot ? paymentScreenshot.name : "Нажмите, чтобы прикрепить чек"}
              <input type="file" accept="image/*" onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} className="hidden" />
            </label>
            <button onClick={handleOrder} disabled={!paymentScreenshot} className="w-full bg-[#e87722] text-white py-3.5 rounded-xl font-medium hover:bg-orange-600 transition-all disabled:opacity-50">✅ Подтвердить оплату и заказать</button>
            <p className="text-center text-sm text-gray-500 mt-3"><button onClick={() => setShowPayment(false)} className="text-[#4a7c59] font-medium underline">← Вернуться в корзину</button></p>
          </div>
        </div>
      )}

      {/* КОРЗИНА */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-5 bg-[#4a7c59] text-white"><h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Корзина</h2><button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 md:p-5">{cart.length === 0 ? <p className="text-gray-500 text-center py-12 md:py-16">Корзина пуста</p> : cart.map(i => (
              <div key={i.id} className="flex items-center gap-3 border-b pb-3">
                <img src={getProductImage(i)} alt={i.name} className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg md:rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{i.name}</h4>
                  <p className="text-[#c0392b] font-bold text-sm">{i.price} ₽ / {i.unit}</p>
                  <p className="text-xs text-gray-500">{i.quantity} × {i.price} ₽ = {i.quantity * i.price} ₽</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updQty(i.id, -1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                  <span className="w-5 md:w-6 text-center font-medium text-sm">{i.quantity}</span>
                  <button onClick={() => updQty(i.id, 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#e87722] text-white flex items-center justify-center hover:bg-orange-600"><Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                  <button onClick={() => removeFromCart(i.id)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 ml-1"><X className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" /></button>
                </div>
              </div>
            ))}</div>
            <div className="border-t p-4 md:p-5 bg-green-50">
              <div className="flex items-center justify-between mb-4"><span className="text-base md:text-lg font-medium">Итого:</span><span className="text-xl md:text-2xl font-bold text-[#c0392b]">{total} ₽</span></div>
              <button onClick={() => { setShowPayment(true); setIsCartOpen(false); }} disabled={cart.length === 0 || !addressConfirmed} className="w-full bg-[#e87722] text-white py-3.5 md:py-4 text-base md:text-lg rounded-xl md:rounded-2xl font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50">💳 Оплатить и заказать</button>
              <p className="text-xs text-gray-500 text-center mt-3 truncate">📍 {userAddress || "Адрес не указан"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}