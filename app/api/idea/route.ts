import { NextResponse } from 'next/server';

// 1. FORCE DYNAMIC (Fixes the "Same Response" bug)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        // 2. Use Standard Model for Creativity (Supports temperature)
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: "You are a creative muse. Generate a single, unique, short website prompt (max 10 words). Examples: 'A neon-punk portfolio for a hacker', 'A minimalist coffee shop landing page'. Return ONLY the text." },
          { role: "user", content: "Give me a random website idea." }
        ],
        // 3. High Temperature = Different result every time
        temperature: 1.2, 
        max_tokens: 50,
      }),
      // 4. Ensure fetch itself is not cached
      cache: 'no-store'
    });

    const data = await response.json();
    
    // Fallback if AI fails
    const idea = data.choices?.[0]?.message?.content?.trim() || "A modern landing page for a startup";

    // Add a random timestamp to ensure the frontend sees it as new data
    return NextResponse.json({ 
      idea, 
      ts: Date.now() 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("Idea Error:", error);
    return NextResponse.json({ idea: "A creative portfolio for a digital artist" }, { status: 200 }); 
  }
}
