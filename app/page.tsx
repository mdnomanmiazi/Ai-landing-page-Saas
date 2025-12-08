"use client";
import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Copy, Check, Terminal, ExternalLink, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null); // To store the ID for "Open in New Tab"
  
  const codeEndRef = useRef<HTMLDivElement>(null);

  const styles = [
    { name: "✨ Modern SaaS", prompt: " with a clean, modern SaaS aesthetic, blue and white palette, bento grid" },
    { name: "🌑 Dark Mode", prompt: " in dark mode with neon accents and glassmorphism cards" },
    { name: "🌿 Minimalist", prompt: " with a minimalist, black and white swiss style typography" },
    { name: "🎨 Retro", prompt: " with a playful 90s retro vaporwave aesthetic" },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (isStreaming) {
      codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [generatedHtml, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!user) return alert("Please sign in first");
    
    setLoading(true);
    setIsStreaming(true);
    setGeneratedHtml("");
    setGeneratedId(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let done = false;
      let fullCode = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        fullCode += chunkValue;
        setGeneratedHtml((prev) => prev + chunkValue);
      }

      const cleanHtml = fullCode.replace(/```html|```/g, "").trim();
      setGeneratedHtml(cleanHtml);

      // --- CRITICAL FIX: SAVE TO DATABASE ---
      // This ensures it appears in the Dashboard
      const { data, error } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt: prompt,
        html_code: cleanHtml
      }).select().single();

      if (data) {
        setGeneratedId(data.id); // Save ID so we can link to it
        // Optional: Deduct balance here if not done elsewhere
        // await supabase.from('profiles').update({ balance: balance - 10 }).eq('id', user.id);
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong generating.");
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const progress = Math.min((generatedHtml.length / 15000) * 100, 98);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
            Build your <span className="text-blue-600">Dream Site</span>
          </h1>
          
          <div className="relative group shadow-2xl rounded-2xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative flex items-center bg-white rounded-2xl p-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your website..."
                className="w-full p-4 outline-none text-lg text-slate-700 bg-transparent"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Generate
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {styles.map((style) => (
              <button
                key={style.name}
                onClick={() => setPrompt((prev) => prev + style.prompt)}
                className="px-4 py-1.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>GENERATING...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {generatedHtml && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-slate-800">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal size={16} />
                  <span className="text-xs font-mono">index.html</span>
                </div>
                <button onClick={handleCopy} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs">
                  {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
              <div className="p-4 font-mono text-xs text-green-400 overflow-y-auto flex-1 custom-scrollbar">
                <pre className="whitespace-pre-wrap break-words">{generatedHtml}{isStreaming && <span className="animate-pulse">|</span>}</pre>
                <div ref={codeEndRef} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-slate-200 relative">
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                
                {/* --- NEW PREVIEW CONTROLS --- */}
                <div className="flex items-center gap-2">
                  {generatedId && (
                    <a 
                      href={`/view/${generatedId}`} 
                      target="_blank" 
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink size={14} /> Full Screen
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex-1 relative bg-white w-full h-full">
                 <iframe srcDoc={generatedHtml} className="w-full h-full border-none" title="Preview" />
                 {loading && progress < 10 && (
                   <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-400">
                     <Loader2 className="animate-spin" />
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
