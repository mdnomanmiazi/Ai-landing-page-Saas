// Allow the function to run for up to 5 minutes (max for most serverless plans)
export const maxDuration = 300; 

import { NextResponse } from 'next/server';
// ... rest of your code


import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    // --- PRO SYSTEM PROMPT ---
    const systemPrompt = `
      You are an expert Senior Frontend Engineer.
      Goal: Generate a breathtaking, production-ready landing page.

      ### TECH STACK:
      - HTML5 (Single file)
      - Tailwind CSS (Load via CDN: <script src="https://cdn.tailwindcss.com"></script>)
      - Lucide Icons (Load via CDN: <script src="https://unpkg.com/lucide@latest"></script>)
      - Google Fonts (Inter or Plus Jakarta Sans)

      ### DESIGN REQUIREMENTS:
      - Use "Glassmorphism", subtle borders, and rich gradients.
      - Use "Bento Grid" layouts and sticky headers.
      - Buttons must have hover effects.
      - Hero section must be massive with a "glow" effect.

      ### IMPORTANT:
      - RETURN ONLY THE RAW HTML CODE.
      - DO NOT wrap the code in markdown blocks.
      - Initialize icons: <script>lucide.createIcons();</script>
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        // --- USING YOUR NEW MODEL ---
        model: "gpt-5-mini", 
        // ----------------------------
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a high-end landing page for: ${prompt}. Make it visually stunning.` }
        ],
        // --- CRITICAL FIXES FOR NEW MODELS ---
        // 1. Temperature removed (Reasoning models usually force this to 1)
        // 2. Used max_completion_tokens instead of max_tokens
        max_completion_tokens: 5000 
      })
    });

    const data = await response.json();
    
    // Log any API errors directly to console so we can see them
    if (data.error) {
      console.error("OpenAI Error:", data.error);
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
