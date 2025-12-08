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

    // AI is fully free — only structure rules remain
    const systemPrompt = `
You are a world-class Frontend Engineer and Designer.
Generate a complete, production-ready landing page as a single HTML file.

REQUIREMENTS:
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
- Use Google Fonts (any style that fits the design)
- RETURN ONLY raw HTML (no markdown, no backticks)
- Initialize icons using <script>lucide.createIcons();</script>

CREATIVE FREEDOM:
- You decide the style, layout, theme, animations, and design direction.
- Choose whatever aesthetic best fits the user's prompt.
- You may use any modern layout (hero, sections, bento grid, cards, etc.)
- The design must feel premium, modern, and visually impressive.
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
          { role: "user", content: prompt }
        ]
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
