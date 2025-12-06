import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    // This is the "Secret Sauce" - A highly opinionated design system prompt
    const systemPrompt = `
      You are an award-winning UI/UX Developer. Your goal is to generate a PRODUCTION-READY, single-file HTML landing page that looks like it was built by a top-tier San Francisco startup (like Vercel, Linear, or Stripe).

      ### TECHNICAL CONSTRAINTS:
      1. Use ONLY HTML and Tailwind CSS (via CDN).
      2. Import 'Inter' font from Google Fonts and apply it to the body.
      3. Use <script src="https://unpkg.com/lucide@latest"></script> for icons. Render icons using <i data-lucide="icon-name"></i>. Add <script>lucide.createIcons();</script> at the end of the body.
      4. Images: Use high-quality placeholder images from 'https://images.unsplash.com/' with specific keywords related to the prompt (e.g., office, tech, abstract).
      
      ### DESIGN SYSTEM (Strictly Follow):
      - **Vibe:** Clean, Minimal, Glassmorphism, "Bento Grid" layouts.
      - **Colors:** Use Slate/Zinc-900 for dark text, Slate-50 for backgrounds, and a primary color (Indigo/Blue/Violet) for accents.
      - **Shadows:** Use large, soft shadows (shadow-2xl, shadow-blue-500/20).
      - **Borders:** Subtle borders (border-slate-200).
      - **Spacing:** Massive amounts of whitespace (py-24, py-32).

      ### REQUIRED SECTIONS:
      1. **Sticky Navbar:** Glass effect (backdrop-blur-md), Logo, and CTA button.
      2. **Hero Section:** Massive H1 (text-6xl+), Subheadline, "Get Started" CTA, and a "Hero Image" or Abstract Graphic on the right/center.
      3. **Social Proof:** "Trusted by" section with logos (use text or placeholders).
      4. **Features (Bento Grid):** A grid layout showing key benefits using icons.
      5. **Testimonials:** 3 cards with user avatars.
      6. **Pricing:** 3 Tiers (Basic, Pro, Enterprise). Highlight "Pro".
      7. **Footer:** Simple links and copyright.

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
