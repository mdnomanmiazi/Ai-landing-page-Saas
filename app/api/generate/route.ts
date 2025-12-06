import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    // This is the "Secret Sauce" - A highly opinionated design system prompt
    const systemPrompt = `
      You are an award-winning UI/UX Developer. Your goal is to generate a PRODUCTION-READY Landing page.

      ### OUTPUT FORMAT:
      - Return ONLY the raw HTML string.
      - Do NOT wrap in markdown code blocks (\`\`\`).
      - Ensure the code is responsive (mobile-first).
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // SWITCHING TO FULL GPT-4o FOR DESIGN INTELLIGENCE
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a landing page for: ${prompt}. Make it look expensive and premium.` }
        ],
        temperature: 0.7, // Slightly creative
        max_tokens: 4000 // Allow long code output
      })
    });

    const data = await response.json();
    
    // Safety check in case OpenAI wraps in markdown
    let html = data.choices[0].message.content;
    html = html.replace(/```html/g, '').replace(/```/g, '');

    return NextResponse.json({ html });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
