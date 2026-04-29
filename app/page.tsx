"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Phone, MapPin, Search, User, ExternalLink, Info, Check, AlertCircle } from "lucide-react";
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
}

interface CartItem extends Product {
  quantity: number;
}

const categories = [
  { id: "all", name: "🛍️ Всё" },
  { id: "fruits", name: "🍎 Фрукты" },
  { id: "vegetables", name: "🥕 Овощи" },
  { id: "nuts", name: "🥜 Орехи" },
  { id: "grocery", name: "🍵 Чай" },
  { id: "drinks", name: "🥤 Напитки" },
];

const deliveryZones = [
  { id: 1, name: "Октябрьский", price: 0, color: "#4CAF50" },
  { id: 2, name: "Ленинский", price: 200, color: "#FF9800" },
  { id: 3, name: "Центральный", price: 150, color: "#2196F3" },
  { id: 4, name: "Другие", price: 0, color: "#9E9E9E", note: "договорная" },
];

// Реквизиты для оплаты
const banks = [
  { name: "Сбербанк", phone: "+79134781012" },
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
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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
          } catch (e) {}
        }
      } else {
        setFirebaseUser(null);
        setIsLoggedIn(false);
        setUserName("");
        setUserEmail("");
        setUserAddress("");
        setAddressConfirmed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { setProducts(productsData); }, []);

  useEffect(() => {
    if (firebaseUser) {
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({ name: userName, address: userAddress, addressConfirmed }));
    }
  }, [userName, userAddress, addressConfirmed, firebaseUser]);

  const handleLogout = async () => { try { await logoutUser(); } catch (e) {} };

  const validateAddress = (address: string): boolean => {
    const addr = address.trim();
    if (addr.length < 10) return false;
    if (!/\d/.test(addr)) return false;
    return true;
  };

  const confirmAddress = () => {
    setAddressError("");
    if (!userAddress.trim()) return setAddressError("Введите адрес доставки");
    if (!validateAddress(userAddress)) return setAddressError("Введите настоящий адрес");
    setAddressConfirmed(true);
  };

  const getProductImage = (p: Product) => p.image?.startsWith("http") ? p.image : "https://placehold.co/400x400/4a7c59/white?text=" + encodeURIComponent(p.name);
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = async () => {
    setLoginError("");
    if (isRegistering) {
      if (!loginForm.name.trim()) return setLoginError("Введите имя");
      if (!validEmail(loginForm.email)) return setLoginError("Некорректный email");
      if (!loginForm.phone.trim()) return setLoginError("Введите телефон");
      if (loginForm.password.length < 6) return setLoginError("Пароль минимум 6 символов");
      try {
        await registerUser(loginForm.email, loginForm.password);
        setUserName(loginForm.name);
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
  const addToCart = (p: Product) => setCart(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...p, quantity: 1 }]; });
  const updQty = (id: number, d: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + d) } : i).filter(i => i.quantity > 0));
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const items = cart.reduce((s, i) => s + i.quantity, 0);

  const handleOrder = async () => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (!userAddress.trim() || !addressConfirmed) { alert("Подтвердите адрес"); return; }
    if (!cart.length) { alert("Корзина пуста"); return; }

    const list = cart.map(i => `${i.name} — ${i.quantity} ${i.unit} × ${i.price} ₽ = ${i.quantity * i.price} ₽`).join("\n");
    const zone = selectedZone ? `\n🚚 ${deliveryZones.find(z => z.id === selectedZone)?.name}` : "";
    const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${userName}\n📧 ${userEmail}\n📍 ${userAddress}${zone}\n\n${list}\n💰 ИТОГО: ${total} ₽`;

    const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
    const CHAT_IDS = ["7766881831", "8565038561"];

    try {
      const results = await Promise.all(
        CHAT_IDS.map(chatId =>
          fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message }),
          })
        )
      );

      const allOk = results.every(r => r.ok);
      if (allOk) {
        alert("✅ Заказ отправлен!");
        setCart([]);
        setShowPayment(false);
        setIsCartOpen(false);
      } else {
        alert("Ошибка отправки.");
      }
    } catch (e) {
      alert("Ошибка отправки.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col max-w-full overflow-x-hidden">
      {/* Шапка */}
      <header className="sticky top-0 z-20 bg-[#FFF8F0] border-b border-orange-100 shadow-sm">
        <div className="px-3 md:px-4 py-2.5 md:py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-orange-100 p-1.5 md:p-2 rounded-xl md:rounded-2xl shrink-0"><span className="text-xl md:text-3xl">🍎</span></div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-[#4a7c59] truncate">Облачная 51</h1>
              <p className="text-xs md:text-sm text-gray-500">Свежие продукты каждый день</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {isLoggedIn && <span className="text-xs md:text-sm bg-orange-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full hidden sm:block truncate max-w-[100px]">👋 {userName || userEmail}</span>}
            <button onClick={() => isLoggedIn ? handleLogout() : setShowLogin(true)} className="p-2 md:p-2.5 hover:bg-orange-50 rounded-full"><User className="w-4 h-4 md:w-5 md:h-5" /></button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 md:p-2.5 hover:bg-orange-50 rounded-full">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              {items > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#e87722] text-white text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center font-bold">{items}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Фото */}
      <div className="w-full h-28 md:h-40 overflow-hidden">
        <img src="https://avatars.mds.yandex.net/i?id=1464f4f5e31f574205e1066475e11c4c37253dac-4955124-images-thumbs&n=13" alt="Свежие продукты" className="w-full h-full object-cover" />
      </div>

      {/* Контакты */}
      <div className="bg-white border-b">
        <div className="px-3 md:px-4 py-2 md:py-3 flex flex-wrap items-center gap-1.5 max-w-6xl mx-auto w-full">
          <span className="inline-flex items-center gap-1 text-xs md:text-sm text-gray-600 bg-orange-50 px-2 md:px-3 py-1.5 rounded-lg"><MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#e87722] shrink-0" /> <span className="truncate max-w-[120px] md:max-w-none">ул. Облачная, 51</span></span>
          <span className="inline-flex items-center gap-1 text-xs md:text-sm text-gray-600 bg-orange-50 px-2 md:px-3 py-1.5 rounded-lg"><Phone className="w-3 h-3 md:w-4 md:h-4 text-[#e87722] shrink-0" /> +7 913 004 1112</span>
          <button onClick={() => setIsMapVisible(true)} className="text-xs md:text-sm bg-[#e8f5e9] text-[#4a7c59] px-2 md:px-4 py-1.5 rounded-lg font-medium hover:bg-[#c8e6c9] inline-flex items-center gap-1"><MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> Наш магазин</button>
          <a href="https://t.me/fruktiovoshiOblachnaya51" target="_blank" className="text-xs md:text-sm bg-[#e3f2fd] text-[#1565c0] px-2 md:px-4 py-1.5 rounded-lg font-medium hover:bg-[#bbdefb] inline-flex items-center gap-1"><ExternalLink className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> Telegram</a>
        </div>
      </div>

      {/* Адрес доставки */}
      {isLoggedIn && (
        <div className="bg-[#FFF8E1] border-b border-orange-100">
          <div className="px-3 md:px-4 py-2 flex gap-2 items-center max-w-6xl mx-auto w-full flex-wrap">
            <MapPin className="w-4 h-4 text-[#e87722] shrink-0" />
            <input type="text" placeholder="📍 Адрес доставки" value={userAddress} onChange={e => { setUserAddress(e.target.value); setAddressConfirmed(false); }} className="bg-white border border-orange-200 rounded-lg px-3 py-2 outline-none flex-1 text-xs md:text-sm min-w-[120px]" />
            <button onClick={confirmAddress} className={`font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1 shrink-0 ${addressConfirmed ? "bg-green-500 text-white" : "bg-[#e87722] text-white"}`}>{addressConfirmed ? <><Check className="w-3 h-3" /> ✓</> : "Подтвердить"}</button>
          </div>
          {addressError && <div className="px-3 pb-2 text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" /> {addressError}</div>}
        </div>
      )}

      {/* Каталог + товары — всё как раньше, без изменений */}
      {/* Все модалки (карта, характеристики, вход) — как раньше */}
      {/* Корзина с кнопкой "Оплатить и заказать" */}

      {/* Модалка оплаты */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg md:text-xl font-bold mb-4 text-center text-[#4a7c59]">💳 Оплата переводом</h2>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Сумма к оплате:</p>
              <p className="text-3xl font-bold text-[#c0392b]">{total} ₽</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-[#4a7c59] mb-2">Реквизиты для перевода:</p>
              {banks.map((bank, idx) => (
                <p key={idx} className="text-sm"><strong>{bank.name}:</strong> {bank.phone}</p>
              ))}
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Переведите сумму на один из номеров выше и нажмите «Оформить заказ».
            </p>

            <button
              onClick={handleOrder}
              className="w-full bg-[#e87722] text-white py-3.5 rounded-xl font-medium hover:bg-orange-600 transition-all"
            >
              ✅ Я оплатил, оформить заказ
            </button>

            <p className="text-center text-sm text-gray-500 mt-3">
              <button onClick={() => setShowPayment(false)} className="text-[#4a7c59] font-medium underline">
                ← Вернуться в корзину
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}