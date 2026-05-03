import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get('message') as string;
    const photo = formData.get('photo') as File | null;

    const token = process.env.TELEGRAM_BOT_TOKEN || "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
    const chatIds = process.env.TELEGRAM_CHAT_IDS?.split(',') || ["5369731336", "8250142341"];

    const sendRequests = chatIds.map(async (chatId) => {
      const method = photo ? 'sendPhoto' : 'sendMessage';
      const url = `https://api.telegram.org/bot${token}/${method}`;
      
      const telegramForm = new FormData();
      telegramForm.append('chat_id', chatId.trim());
      
      if (photo) {
        telegramForm.append('photo', photo);
        telegramForm.append('caption', message);
      } else {
        telegramForm.append('text', message);
      }

      const response = await fetch(url, {
        method: 'POST',
        body: telegramForm,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Telegram API Error (${chatId}):`, errorData);
      }
      return response.ok;
    });

    await Promise.all(sendRequests);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Order API Route Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}