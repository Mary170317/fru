export default async function handler(req, res) {
  // Разрешаем CORS (на всякий случай)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { name, address, orderText, total } = req.body;
    const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
    const CHAT_ID = "7766881831";
    const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${name}\n📍 ${address}\n\n${orderText}\n\n💰 ИТОГО: ${total} ₽`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      });
      return res.status(200).json({ status: "success" });
    } catch (e) {
      return res.status(500).json({ status: "error", message: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}