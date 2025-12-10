// Allow the function to run for up to 5 minutes
export const maxDuration = 300;

import { NextResponse } from "next/server";
// FIX: Use relative path
import { calculateCost } from "../../../lib/pricing";

// ... (Rest of the file remains exactly the same, just fix the import at the top)
// But for safety, I will provide the full file content below to avoid any copy-paste errors.

async function getUnsplashImages(query: string): Promise<string[]> {
  try {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) return [];
    const searchTerm = query.split(' ').slice(0, 5).join(' '); 
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=6&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${apiKey}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((img: any) => img.urls.regular);
  } catch (e) {
    console.error("Unsplash Error:", e);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const images = await getUnsplashImages(prompt);
    let imageInstruction = "";
    if (images.length > 0) {
      imageInstruction = `
      ### IMAGE ASSETS (CRITICAL):
      You MUST use the following real image URLs for backgrounds, hero sections, and cards. 
      Do NOT use placeholders. Rotate through these specific URLs:
      ${JSON.stringify(images)}
      `;
    }

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "gpt-5", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        stream: true,
        stream_options: { include_usage: true } 
      }),
    });

    if (!response.ok) throw new Error(response.statusText);

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                
                const content = json.choices?.[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }

                if (json.usage) {
                  const totalCost = calculateCost(
                    model || "gpt-5", 
                    json.usage.prompt_tokens, 
                    json.usage.completion_tokens
                  );
                  const costTag = `\n`;
                  controller.enqueue(new TextEncoder().encode(costTag));
                }
              } catch (e) {}
            }
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, { headers: { "Content-Type": "text/plain" } });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server Error" }, { status: 500 });
  }
}
