import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = process.env.TELEGRAM_CHAT_IDS?.split(',') || [];

  try {
    const requests = chatIds.map(chatId =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId.trim(), text: message }),
      })
    );

    await Promise.all(requests);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to send' }, { status: 500 });
  }
}