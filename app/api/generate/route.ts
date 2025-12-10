// Allow 5 minutes execution
export const maxDuration = 300;

import { NextResponse } from "next/server";

// Your n8n Webhook URL
const WEBHOOK_URL = "https://n8n.ieltsai.net/webhook-test/1aaa265e-8861-4bb7-b2d7-62019de6b0e4";

async function getUnsplashImages(query: string): Promise<string[]> {
  try {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) return [];
    const searchTerm = query.split(" ").slice(0, 5).join(" ");

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchTerm
      )}&per_page=6&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${apiKey}` } }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((img: any) => img.urls.regular);
  } catch (e) {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, model, userId } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    // 1. Get Images
    const images = await getUnsplashImages(prompt);
    const imageInstruction =
      images.length > 0
        ? `### IMAGE ASSETS: Use these: ${JSON.stringify(images)}`
        : "";

    // 2. System Prompt
    const systemPrompt = `
      You are a world-class Frontend Engineer.
      Generate a complete, production-ready landing page as a single HTML file.
      REQUIREMENTS:
      - Use Tailwind CSS via CDN.
      - Use Lucide Icons via CDN.
      - Use Google Fonts.
      - RETURN ONLY RAW HTML.
      ${imageInstruction}
    `;

    // 3. Call OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || "gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          stream: true,
          stream_options: { include_usage: true },
        }),
      }
    );

    if (!response.ok) throw new Error(response.statusText);

    // 4. Stream Response & Capture Usage for n8n
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let finalUsage: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "data: [DONE]") continue;
            if (!line.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(line.slice(6));

              // Stream Content to Frontend
              const content = json.choices?.[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }

              // Capture Usage Object
              if (json.usage) {
                finalUsage = json.usage;
              }
            } catch {}
          }
        }

        // 5. Send Usage to n8n (Async - Fire and Forget)
        // n8n will handle the logic: Calculate Cost -> Deduct from Supabase
        if (userId && finalUsage) {
            fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    model: model || "gpt-5",
                    usage: finalUsage,
                    prompt: prompt.slice(0, 500),
                    timestamp: new Date().toISOString(),
                }),
            }).catch(e => console.error("n8n Webhook Error:", e));
        }

        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server Error" },
      { status: 500 }
    );
  }
}
