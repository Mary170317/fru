import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string || '—';
    const address = formData.get('address') as string || '—';
    const orderText = formData.get('orderText') as string || '';
    const total = formData.get('total') as string || '0';
    const screenshot = formData.get('screenshot') as File | null;

    const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
    const CHAT_IDS = ["7766881831", "8565038561"];

    const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${name}\n📍 ${address}\n\n${orderText}\n\n💰 ИТОГО: ${total} ₽`;

    for (const chatId of CHAT_IDS) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });

      if (screenshot && screenshot.size > 0) {
        const photoForm = new FormData();
        photoForm.append('chat_id', chatId);
        photoForm.append('photo', screenshot, screenshot.name);
        photoForm.append('caption', '📎 Чек об оплате');

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: photoForm,
        });
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}