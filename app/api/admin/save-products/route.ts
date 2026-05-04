import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "username/fru-kappa";
const FILE_PATH = "data/products.json";

export async function POST(request: NextRequest) {
  try {
    const { products, message } = await request.json();

    if (!GITHUB_TOKEN) {
      return NextResponse.json({ success: false, error: "Нет GITHUB_TOKEN в переменных окружения" }, { status: 500 });
    }

    // 1. Получить текущий SHA файла
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    const getData = await getRes.json();
    const sha = getData.sha;

    // 2. Обновить файл
    const content = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");
    const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message || "Обновление товаров через админку",
        content,
        sha,
      }),
    });

    if (updateRes.ok) {
      return NextResponse.json({ success: true });
    } else {
      const err = await updateRes.json();
      return NextResponse.json({ success: false, error: err.message || "Ошибка GitHub" }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}