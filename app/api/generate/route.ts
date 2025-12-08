import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const systemPrompt = `
      You are an expert Frontend Architect.
      Goal: Generate a high-conversion, modern landing page code based on the user's request.
      
      ### TECH STACK:
      - HTML5 (Single file)
      - Tailwind CSS (Load via CDN: <script src="https://cdn.tailwindcss.com"></script>)
      - Lucide Icons (Load via CDN: <script src="https://unpkg.com/lucide@latest"></script>)
      - Google Fonts (Inter or Poppins)

      ### IMPORTANT:
      - RETURN ONLY THE RAW HTML CODE.
      - DO NOT wrap the code in markdown (no \`\`\`html ... \`\`\`).
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini", // I strongly recommend using this or 'gpt-4o' if 'gpt-5-mini' fails
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a landing page for: ${prompt}` }
        ],
        // --- CHANGED HERE: Removed 'temperature' completely ---
        max_completion_tokens: 4000 
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      throw new Error(data.error.message);
    }

    let html = data.choices[0].message.content;
    html = html.replace(/```html/g, '').replace(/```/g, '');

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate website" }, { status: 500 });
  }
}
