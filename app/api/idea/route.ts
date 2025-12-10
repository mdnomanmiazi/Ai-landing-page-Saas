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
        model: "gpt-5-nano", // or gpt-4 if you prefer
        messages: [
          {
            role: "system",
            content: "You generate simple landing page prompt ideas. Return ONLY one idea in this exact format: 'landing page for [topic]'. Keep it very short - 3-6 words max. Make it diverse: products, services, apps, subscriptions, etc."
          },
          {
            role: "user",
            content: "Give me one landing page prompt idea. Return ONLY: 'landing page for [topic]'"
          },
        ],
        temperature: 1.2, // Higher for more creativity
        max_tokens: 20, // Very short response
      }),
    });

    const data = await response.json();

    // Extract and clean the response
    let idea = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Fallback if OpenAI returns empty or wrong format
    if (!idea || idea === "") {
      idea = "landing page for eco-friendly water bottles";
    }
    
    // Ensure it's in the right format (clean up any extra text)
    idea = idea.toLowerCase();
    if (!idea.startsWith("landing page for ")) {
      idea = "landing page for " + idea.replace(/^landing page for\s*/i, "").replace(/\.$/, "");
    }

    return NextResponse.json(
      {
        idea,
        ts: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Idea Error:", error);
    // Fallback simple prompt
    return NextResponse.json(
      {
        idea: "landing page for smart home devices",
      },
      { status: 200 }
    );
  }
}
