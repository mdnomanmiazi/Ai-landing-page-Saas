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
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "Return ONLY a short website idea.",
          },
          {
            role: "user",
            content: "Give me one unique website idea following the required format.",
          },
        ],
      }),
    });

    const data = await response.json();

    const idea =
      data.choices?.[0]?.message?.content?.trim() ||
      "Landing page for give example rendomly";

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
    return NextResponse.json(
      {
        idea: "Landing page for a digital creator — looks bright and futuristic",
      },
      { status: 200 }
    );
  }
}
