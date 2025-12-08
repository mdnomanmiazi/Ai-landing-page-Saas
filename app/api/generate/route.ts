import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    // High-End System Prompt
    const systemPrompt = `
      You are an expert Frontend Architect.
      Goal: Generate a high-conversion, modern landing page code based on the user's request.

      ### TECH STACK:
      - HTML5 (Single file)
      - Tailwind CSS (Load via CDN: <script src="https://cdn.tailwindcss.com"></script>)
      - Lucide Icons (Load via CDN: <script src="https://unpkg.com/lucide@latest"></script>)
      - Google Fonts (Inter or Poppins)

      ### DESIGN REQUIREMENTS (Shadcn/Linear Style):
      1. **Theme:** Modern, Clean, Professional. Use Zinc-900 for dark text, Slate-50 for backgrounds.
      2. **Layout:**
         - Sticky Glassmorphism Header (backdrop-blur-md).
         - Hero Section: Large H1 (text-5xl+), Subtext, Primary CTA Button.
         - Features Grid: Use a "Bento Grid" layout (grid-cols-3) with nice padding.
         - Testimonials: Simple cards.
         - Pricing: 3 cards, highlight the middle one.
         - Footer: Clean links.
      3. **Icons:** Use <i data-lucide="icon-name"></i> tags. Add <script>lucide.createIcons();</script> at the end of the body.
      4. **Images:** Use https://images.unsplash.com/photo-... URLs relevant to the topic.

      ### IMPORTANT:
      - RETURN ONLY THE RAW HTML CODE.
      - DO NOT wrap the code in markdown (no \`\`\`html ... \`\`\`).
      - No explanations, just code.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        // --- CHANGED TO gpt-5 HERE ---
        model: "gpt-5", 
        // -----------------------------
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a landing page for: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    
    // Error handling if GPT-5 is not available on your key
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      throw new Error(data.error.message || "Model not available or API key invalid");
    }

    let html = data.choices[0].message.content;
    html = html.replace(/```html/g, '').replace(/```/g, '');

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate website" }, { status: 500 });
  }
}
