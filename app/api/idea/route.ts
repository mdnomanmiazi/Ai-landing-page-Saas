import { NextResponse } from "next/server";

// Force dynamic — prevents same response caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      cache: "no-store",
      body: JSON.stringify({
        // Ensure this model name is valid for your account (e.g., gpt-4o-mini or gpt-3.5-turbo)
        model: "gpt-5-mini", 
        messages: [
          {
            role: "system",
            // UPDATED PROMPT: Enforces simple structure, forbids visual descriptions
            content:
              "Return ONLY a short website idea. Strict format: 'Landing page for [unique topic]'. Do not describe the design or look. Examples: 'Landing page for cat food', 'Landing page for a law firm'. Keep it under 6 words.",
          },
          {
            role: "user",
            content: "Give me one unique, random website idea.",
          },
        ],
        // Lower temperature slightly to ensure it sticks to formatting
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    const idea =
      data.choices?.[0]?.message?.content?.trim() ||
      "Landing page for a coffee shop"; // Updated fallback

    return NextResponse.json(
      {
        idea,
        ts: Date.now(),
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Idea Error:", error);
    // Updated error fallback to match the new style
    return NextResponse.json(
      {
        idea: "Landing page for a digital agency",
      },
      { status: 200 }
    );
  }
}
