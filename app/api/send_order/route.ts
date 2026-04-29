import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body) throw new Error("Request body is empty");

    const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
    const CHAT_IDS = ["7766881831", "8565038561"];

    const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${body.name || '—'}\n📍 ${body.address || '—'}\n\n${body.orderText || ''}\n\n💰 ИТОГО: ${body.total || 0} ₽`;

    const results = await Promise.all(
      CHAT_IDS.map(async (chatId) => {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message }),
        });
        return res.ok;
      })
    );

    if (results.every(r => r)) {
      return NextResponse.json({ status: "success" });
    } else {
      console.error("Some messages failed to send");
      return NextResponse.json({ status: "partial_success" }, { status: 207 });
    }

  } catch (error: any) {
    console.error("Vercel API Error:", error.message);
    return NextResponse.json({ status: "error", detail: error.message }, { status: 500 });
  }
}