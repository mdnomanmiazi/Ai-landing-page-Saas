export const maxDuration = 300;

import { NextResponse } from "next/server";
import { calculateCost } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const systemPrompt = `
      You are a world-class Frontend Engineer.
      Generate a complete, production-ready landing page as a single HTML file.
      REQUIREMENTS:
      - Use Tailwind CSS via CDN.
      - Use Lucide Icons via CDN.
      - Use Google Fonts.
      - RETURN ONLY RAW HTML.
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
        // CRITICAL: Request usage data at the end of the stream
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
                
                // 1. Content Chunk
                const content = json.choices?.[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }

                // 2. Usage Chunk (Always comes last)
                if (json.usage) {
                  const totalCost = calculateCost(
                    model || "gpt-5", 
                    json.usage.prompt_tokens, 
                    json.usage.completion_tokens
                  );
                  // Send cost as a special HTML comment at the end
                  // Example: const costTag = `\n`;
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
