import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, category, style } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    // Advanced System Prompt for "Lovable.dev" quality
    const systemPrompt = `
      You are an elite AI Frontend Architect specializing in creating stunning, high-conversion websites like Lovable.dev, Vercel, and Linear.
      
      ## MISSION:
      Generate a complete, production-ready HTML website that can be hosted anywhere for FREE.

      ## TECHNICAL SPECIFICATIONS:
      - Single HTML file (no external dependencies except CDNs)
      - HTML5 with proper semantic structure
      - Tailwind CSS via CDN (v3.4.1)
      - Lucide Icons via CDN (latest)
      - Google Fonts: Inter (primary), Poppins (optional for accents)
      - All images from Unsplash with relevant, high-quality URLs
      - Mobile-first responsive design
      - SEO-optimized with proper meta tags
      - Accessibility (ARIA labels, proper contrasts)
      
      ## DESIGN PRINCIPLES (Lovable.dev Style):
      1. **Visual Hierarchy**
         - Hero: Bold headline (text-6xl on desktop), compelling subheading, clear CTA
         - Sections: Use gradient backgrounds, subtle animations, glassmorphism effects
         - Spacing: Generous padding (py-20), consistent margins
      
      2. **Color Palettes** (Choose based on category):
         - Tech/SaaS: Indigo (primary), Emerald (accent), Slate (neutral)
         - Creative/Portfolio: Violet (primary), Pink (accent), Zinc (neutral)
         - Business/Corporate: Blue (primary), Cyan (accent), Gray (neutral)
         - Health/Wellness: Emerald (primary), Teal (accent), Stone (neutral)
      
      3. **Interactive Elements:**
         - Hover effects: transitions, scale transforms, shadow changes
         - Active states for buttons and links
         - Smooth scrolling for anchor links
         - Sticky navigation with backdrop blur
      
      4. **Advanced Layouts:**
         - Bento grid for features/benefits
         - Testimonial carousel (pure CSS if possible)
         - Pricing cards with highlighted "Popular" plan
         - Gradient backgrounds with subtle animations
      
      5. **Professional Touches:**
         - Gradient text for headings
         - Animated hover cards
         - Glassmorphism effects
         - Custom scrollbar
         - Loading animations for images
      
      ## SECTION STRUCTURE (MUST INCLUDE):
      1. HEADER (Sticky, transparent on hero, solid after scroll)
      2. HERO (Full-width, compelling headline + CTA + hero image)
      3. BENEFITS/FEATURES (Grid/Cards with icons + descriptions)
      4. HOW IT WORKS (Timeline/Steps with visuals)
      5. TESTIMONIALS (Customer quotes with avatars)
      6. PRICING (3-tier with clear comparison)
      7. FAQ (Accordion style)
      8. FINAL CTA (Strong conversion-focused section)
      9. FOOTER (Links, social, copyright)
      
      ## SPECIAL EFFECTS TO INCLUDE:
      - CSS-only animations (@keyframes for subtle movements)
      - Gradient borders
      - Shape dividers between sections
      - Parallax scrolling effects
      - Image hover zoom effects
      - Typewriter effect for hero text (optional)
      
      ## IMAGE REQUIREMENTS:
      - All images from Unsplash (use specific, high-quality URLs)
      - Add loading="lazy" for all images
      - Use srcset for responsive images where possible
      - Include descriptive alt text
      
      ## SEO & ACCESSIBILITY:
      - Complete meta tags (title, description, keywords, viewport)
      - Schema.org markup (if applicable)
      - Proper heading hierarchy (h1 → h2 → h3)
      - ARIA labels for interactive elements
      - Skip to main content link
      
      ## CODE QUALITY:
      - Clean, formatted HTML with comments for sections
      - Efficient CSS (minimize custom classes)
      - Vanilla JavaScript for interactivity (no frameworks)
      - Error handling for image loading
      
      ## OUTPUT FORMAT:
      Return ONLY the complete HTML code.
      NO markdown, NO explanations, NO placeholders.
      The code must work immediately when saved as .html and opened in a browser.
      
      ## CONTEXT:
      User wants a website for: ${prompt}
      Category: ${category || 'tech'}
      Style: ${style || 'modern-minimal'}
    `;

    // Dynamic user prompt based on inputs
    const userPrompt = `
      Create a stunning, production-ready website for: "${prompt}"
      
      Additional Requirements:
      - Category: ${category || 'tech'}
      - Design Style: ${style || 'modern-minimal'}
      - Must be visually impressive like Lovable.dev
      - Include at least 3 unique visual effects
      - Make it feel premium and high-value
      - Optimize for conversions
      - Ensure fast loading
      
      Generate the complete HTML now.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview", // Even better for design
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          { 
            role: "user", 
            content: userPrompt 
          }
        ],
        temperature: 0.8, // More creative
        max_tokens: 12000, // More tokens for complex designs
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.1
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    let html = data.choices[0].message.content;
    
    // Advanced cleaning
    html = html
      .replace(/```[\w]*\n?/g, '') // Remove all markdown code blocks
      .replace(/^[\s]*html[\s]*$/gmi, '') // Remove "html" text
      .trim();

    // Add performance optimization wrapper if needed
    if (!html.includes('<!DOCTYPE html>')) {
      html = `<!DOCTYPE html>\n${html}`;
    }

    return NextResponse.json({ 
      html,
      metadata: {
        tokens_used: data.usage?.total_tokens,
        model: data.model,
        created: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate website",
      fallback: generateFallbackHTML(prompt) 
    }, { status: 500 });
  }
}

// Fallback generator in case OpenAI fails
function generateFallbackHTML(prompt: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${prompt} - Professional Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
        .hover-lift:hover { transform: translateY(-5px); }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Your stunning website for: ${prompt} -->
    <!-- This is a fallback template -->
</body>
</html>`;
}
