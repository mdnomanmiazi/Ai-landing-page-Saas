// Allow long generation times
export const maxDuration = 300;

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const systemPrompt = `
      You are an expert Senior Frontend Engineer.
      Goal: Generate a breathtaking, production-ready landing page.
      
      TECH STACK:
      - Single HTML file 
      - Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
      - Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
      - Google Fonts

      DESIGN REQUIREMENTS:
      - Glassmorphism, soft gradients, subtle borders
      - Bento grids and sticky headers
      - Buttons with hover interactions
      - Massive glowing hero section
      
      REQUIREMENTS:
      - Use Tailwind CSS via CDN.
      - Use Lucide Icons via CDN.
      - Use Google Fonts.
      - RETURN ONLY RAW HTML (No markdown blocks, no \`\`\`).
      - Initialize icons using <script>lucide.createIcons();</script> at the end.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini", // Your preferred model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a visually stunning landing page for: ${prompt}` }
        ],
        stream: true, // <--- ENABLE STREAMING
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // Create a streaming response
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

          // Process OpenAI data structure (data: {...})
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line

          for (const line of lines) {
            if (line.trim() === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || "";
                if (content) {
                  // Send raw HTML chunk to client
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
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
