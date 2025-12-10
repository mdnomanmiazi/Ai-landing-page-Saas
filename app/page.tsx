"use client";
import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Copy, Check, Terminal, ExternalLink, RefreshCw, Plus, ArrowUp, Shuffle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  
  const router = useRouter();
  const codeEndRef = useRef<HTMLDivElement>(null);

  const styles = [
    { name: "✨ Modern SaaS", prompt: " with a clean, modern SaaS aesthetic, blue and white palette, bento grid" },
    { name: "🌑 Dark Mode", prompt: " in dark mode with neon accents and glassmorphism cards" },
    { name: "🌿 Minimalist", prompt: " with a minimalist, black and white swiss style typography" },
    { name: "🎨 Retro", prompt: " with a playful 90s retro vaporwave aesthetic" },
  ];

  // --- AUTH LISTENER ---
  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkBalance(session.user.id);
    });

    // 2. Listen for "Popup" logins (LocalStorage sync)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkBalance(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkBalance = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (data) setBalance(data.balance);
  };

  useEffect(() => {
    if (isStreaming) {
      codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [generatedHtml, isStreaming]);

  // --- NEW: POPUP LOGIN HANDLER ---
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true, // Crucial: Gives us the URL instead of redirecting
        redirectTo: `${window.location.origin}/auth/popup`, // Redirect popup to our closer page
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account', // Forces Account Chooser
        },
      },
    });

    if (data?.url) {
      // Calculate center position for the popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        data.url, 
        "Google Login", 
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes,resizable=yes`
      );
    }
    
    if (error) {
      alert("Login failed. Please try again.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGetIdea = async () => {
    setIdeaLoading(true);
    try {
      const res = await fetch('/api/idea');
      const data = await res.json();
      if (data.idea) setPrompt(data.idea);
    } catch (e) {
      setPrompt("A futuristic landing page for an AI startup");
    } finally {
      setIdeaLoading(false);
    }
  };

  const handleNew = () => {
    setGeneratedHtml("");
    setPrompt("");
    setGeneratedId(null);
  };

  const handleGenerate = async () => {
    // Auto trigger popup login
    if (!user) {
      return handleLogin();
    }

    if (balance < 10) {
      if(confirm("Insufficient balance (Cost: 10 BDT). Go to Top Up?")) router.push('/topup');
      return;
    }
    
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

      const newBalance = balance - 10;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
      setBalance(newBalance);

      const { data } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt: prompt,
        html_code: cleanHtml
      }).select().single();

      if (data) setGeneratedId(data.id);

    } catch (error) {
      console.error(error);
      alert("Error generating.");
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const progress = Math.min((generatedHtml.length / 15000) * 100, 98);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        
        {/* --- 1. INPUT SECTION --- */}
        {!generatedHtml && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] transition-all duration-500">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-2 text-center tracking-tight">
              Your AI Cofounder. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">At your service.</span>
            </h1>
            <p className="text-slate-500 mb-10 text-lg">Generate production-ready websites in seconds.</p>

            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 p-4 relative transition-shadow hover:shadow-2xl">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me to build a product landing page..."
                className="w-full h-32 p-4 text-xl outline-none resize-none text-slate-700 placeholder:text-slate-300 bg-transparent"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
              />
              
              <div className="flex justify-between items-end mt-2 px-2">
                <button 
                  onClick={handleGetIdea}
                  disabled={ideaLoading}
                  className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-100 transition-colors"
                >
                  <Shuffle size={16} className={ideaLoading ? "animate-spin" : ""} />
                  {ideaLoading ? "Thinking..." : "Give me an idea"}
                </button>

                <button 
                  onClick={handleGenerate}
                  disabled={!prompt || loading}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-sm text-slate-400">
              10 BDT per generation. {user ? `Balance: ${balance} ৳` : 
                <span className="text-blue-500 cursor-pointer hover:underline font-medium" onClick={handleLogin}>
                  Sign in to start
                </span>
              }
            </p>

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
        )}

        {/* --- 2. ACTION BAR --- */}
        {generatedHtml && !loading && (
          <div className="flex justify-between items-center mb-6 animate-in fade-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
                <button 
                  onClick={handleNew}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Plus size={16} /> Generate New
                </button>
                <button 
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <RefreshCw size={16} /> Regenerate
                </button>
             </div>
             <div className="text-sm font-medium text-slate-500">
               Balance: <span className="text-slate-900 font-bold">{balance} ৳</span>
             </div>
          </div>
        )}

        {/* --- 3. SPLIT VIEW --- */}
        {(generatedHtml || loading) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 h-[80vh]">
            <div className="bg-slate-950 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal size={16} />
                  <span className="text-xs font-mono text-blue-400">index.html</span>
                </div>
                <button onClick={handleCopy} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/10 transition-all">
                  {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
              <div className="p-4 font-mono text-xs text-emerald-400 overflow-y-auto flex-1 custom-scrollbar leading-relaxed">
                <pre className="whitespace-pre-wrap break-words">{generatedHtml}{isStreaming && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse align-middle ml-1"></span>}</pre>
                <div ref={codeEndRef} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 relative">
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">
                    {isStreaming ? "DESIGNING..." : "PREVIEW READY"}
                  </span>
                  {generatedId && !isStreaming && (
                    <a href={`/view/${generatedId}`} target="_blank" className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                      <ExternalLink size={14} /> Full Screen
                    </a>
                  )}
                </div>
              </div>
              <div className="flex-1 relative bg-white w-full h-full group">
                 {isStreaming ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                     <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles size={20} className="text-blue-600 animate-pulse" />
                        </div>
                     </div>
                     <p className="mt-6 text-sm font-semibold text-slate-500 animate-pulse">AI is writing code...</p>
                   </div>
                 ) : (
                   <iframe srcDoc={generatedHtml} className="w-full h-full border-none" title="Preview" />
                 )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
