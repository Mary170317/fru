import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
    const CHAT_ID = "7766881831";

    const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${body.name || '—'}\n📍 ${body.address || '—'}\n\n${body.orderText || ''}\n\n💰 ИТОГО: ${body.total || 0} ₽`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send order' }, { status: 500 });
  }
}