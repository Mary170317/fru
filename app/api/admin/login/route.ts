import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@oblachnaya51.ru";
const ADMIN_PASSWORD = "Oblachnaya51Admin2026!";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, message: "Неверная почта или пароль" },
    { status: 401 }
  );
}