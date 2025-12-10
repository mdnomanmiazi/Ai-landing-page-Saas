import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content:
              "You generate simple landing page prompt ideas. Return ONLY: 'landing page for [topic]'. Very short (3–6 words)."
          },
          {
            role: "user",
            content: "Give me one landing page idea in format: landing page for [topic]"
          },
        ],
        temperature: 1.1,
        max_tokens: 25,
      }),
    });

    const data = await response.json();

    // HANDLE ERRORS PROPERLY
    if (data.error) {
      console.log("OpenAI Error:", data.error);
      return NextResponse.json(
        { idea: "landing page for smart home devices" },
        { status: 200 }
      );
    }

    // PROPER extraction
    const raw = data.choices?.[0]?.message?.content?.trim();
    const idea =
      raw && raw.toLowerCase().startsWith("landing page")
        ? raw.toLowerCase()
        : `landing page for ${raw?.toLowerCase() || "eco-friendly gadgets"}`;

    return NextResponse.json(
      {
        idea,
        ts: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { idea: "landing page for smart home devices" },
      { status: 200 }
    );
  }
}
