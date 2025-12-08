// Allow the function to run for up to 5 minutes
export const maxDuration = 300;

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are an expert Senior Frontend Engineer.
Goal: Generate a breathtaking, production-ready landing page.

TECH STACK:
- Single HTML file
- Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
- Google Fonts: Inter or Plus Jakarta Sans

DESIGN REQUIREMENTS:
- Glassmorphism, soft gradients, subtle borders
- Bento grids and sticky headers
- Buttons with hover interactions
- Massive glowing hero section

IMPORTANT:
- RETURN ONLY RAW HTML
- DO NOT use any markdown or \`\`\`
- Initialize icons: <script>lucide.createIcons();</script>
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate a visually stunning landing page for: ${prompt}`,
          },
        ],
      }),
    });

    const json = await response.json();

    if (json.error) {
      return NextResponse.json({ error: json.error }, { status: 500 });
    }

    let html = json.choices?.[0]?.message?.content ?? "";
    html = html.replace(/```html|```/g, "").trim();

    return NextResponse.json({ html });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
