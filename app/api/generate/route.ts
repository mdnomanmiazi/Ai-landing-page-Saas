// Allow 5 minutes for generation
export const maxDuration = 300;

import { NextResponse } from "next/server";

// Helper to fetch images from Unsplash
async function getUnsplashImages(query: string): Promise<string[]> {
  try {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) return [];

    // Clean prompt to get better search keywords (simple truncation)
    // In a pro app, you might ask AI to extract a keyword, but this is faster.
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
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // 1. FETCH REAL IMAGES FIRST
    const images = await getUnsplashImages(prompt);
    
    // Prepare image instructions for the AI
    let imageInstruction = "";
    if (images.length > 0) {
      imageInstruction = `
      ### IMAGE ASSETS (CRITICAL):
      You MUST use the following real image URLs for backgrounds, hero sections, and cards. 
      Do NOT use placeholders. Rotate through these specific URLs:
      ${JSON.stringify(images)}
      `;
    } else {
      imageInstruction = "Use high-quality Unsplash source URLs (e.g., https://source.unsplash.com/random/1200x800/?tech).";
    }

    // 2. CONSTRUCT SYSTEM PROMPT
    const systemPrompt = `
      You are a world-class Frontend Engineer and UI/UX Designer.
      Generate a complete, production-ready landing page as a single HTML file.
      
      REQUIREMENTS:
      - Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
      - Use Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
      - Use Google Fonts (Inter, Plus Jakarta Sans, or Playfair Display).
      - RETURN ONLY raw HTML (no markdown, no backticks).
      - Initialize icons using <script>lucide.createIcons();</script> at the end.

      ${imageInstruction}

      DESIGN DIRECTION:
      - Use Glassmorphism, deep gradients, and "Bento Grid" layouts.
      - The Hero Section must use the first image from the provided list as a background or side image.
      - Make it look like an award-winning site on Awwwards.
    `;

    // 3. CALL OPENAI WITH STREAMING
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini", // Your working model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a visually stunning landing page for: ${prompt}` }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // 4. STREAM RESPONSE TO CLIENT
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

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
                const content = json.choices[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server Error" },
      { status: 500 }
    );
  }
}
