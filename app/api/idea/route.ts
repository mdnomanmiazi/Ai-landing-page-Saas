import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key is missing" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a creative muse. Generate a single, short, interesting prompt for a website generator. Examples: 'A cyberpunk portfolio for a glitched artist', 'A minimal landing page for a coffee subscription'. Return ONLY the prompt text, nothing else.",
          },
          { role: "user", content: "Give me one creative website idea." },
        ],

        // Minimal, safe token cap
        max_completion_tokens: 60,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Idea Gen Error:", data.error);
      return NextResponse.json({
        idea: "A minimalist portfolio for a photographer",
      });
    }

    const idea =
      data.choices?.[0]?.message?.content?.trim() ||
      "A modern landing page for a startup";

    return NextResponse.json({ idea });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { idea: "A futuristic landing page for an AI startup" },
      { status: 200 }
    );
  }
}
