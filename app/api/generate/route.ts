import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API Key is missing" }, { status: 500 });
    }

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // Use 'gemini-1.5-flash' for speed, or 'gemini-1.5-pro' for complex reasoning
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
         - Features Grid: Use a "Bento Grid" layout (grid-cols-3).
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

    // Combine system prompt and user prompt
    const finalPrompt = `${systemPrompt}\n\nUSER REQUEST: ${prompt}`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    let html = response.text();

    // Cleanup: Gemini loves adding markdown code blocks, let's strip them just in case
    html = html.replace(/```html/g, '').replace(/```/g, '');

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Failed to generate website" }, { status: 500 });
  }
}
