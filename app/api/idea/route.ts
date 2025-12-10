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
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content:
              "Return ONLY a short website idea. Strict Format: 'Landing page for [noun]'. Focus on these topics: SaaS, Finance, Portfolios, Digital Products, Gyms, Resumes, or Business Tools. Do not describe the design. Examples: 'Landing page for a finance tracker', 'Landing page for a SaaS dashboard', 'Landing page for a digital resume'. Keep it under 8 words.",
          },
          {
            role: "user",
            content: "Give me one unique website idea from the requested topics.",
          },
        ],
      }),
    });

    const data = await response.json();

    const idea =
      data.choices?.[0]?.message?.content?.trim() ||
      "Landing page for a SaaS platform";

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
        idea: "Landing page for a finance app",
      },
      { status: 200 }
    );
  }
}
