import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const systemPrompt = `
      You are an expert Frontend Developer. 
      Create a modern, responsive, single-file landing page using HTML and Tailwind CSS (via CDN).
      - Include <script src="https://cdn.tailwindcss.com"></script>
      - Use placeholder images from 'https://placehold.co/600x400' if needed.
      - Do NOT wrap code in markdown (no \`\`\`html). Return ONLY the raw HTML string.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const html = data.choices[0].message.content;

    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
