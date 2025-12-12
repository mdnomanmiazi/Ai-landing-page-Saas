"use client";
import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { 
  Loader2, Sparkles, Copy, Check, Terminal, ExternalLink, 
  ArrowUp, Shuffle, SlidersHorizontal, Plus, RefreshCw, Zap 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  // --- STATE ---
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0); // Balance in USD
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');

  const models = [
    "gpt-5.2", "gpt-5.1", "gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-pro",
    "gpt-4.1", "gpt-4o", "gpt-4o-mini"
  ];

  const router = useRouter();
  const codeEndRef = useRef<HTMLDivElement>(null);

  // --- INITIAL LOAD & AUTH LISTENERS ---
  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });

    // 2. Listen for login changes (handles popup success)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (data) setBalance(data.balance);
  };

  // --- HANDLERS ---

  // Google OAuth Popup Flow
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true, 
        redirectTo: `${window.location.origin}/auth/popup`,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (data?.url) {
      const width = 500, height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(data.url, "Google Login", `width=${width},height=${height},top=${top},left=${left}`);
    }
  };

  const handleGetIdea = async () => {
    setIdeaLoading(true);
    try {
      const res = await fetch('/api/idea');
      const data = await res.json();
      if (data.idea) {
        setPrompt("");
        let i = 0;
        const typeInterval = setInterval(() => {
          setPrompt(data.idea.slice(0, i));
          i++;
          if (i > data.idea.length) clearInterval(typeInterval);
        }, 20);
      }
    } catch (e) {
      setPrompt("A minimalist landing page for a creative agency.");
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
    if (!user) return handleLogin();
    
    // Simple check: stop if balance is strictly 0 or less
    if (balance <= 0) {
      if(confirm("Insufficient balance. Top Up?")) router.push('/topup');
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
        body: JSON.stringify({ 
          prompt, 
          model: selectedModel,
          userId: user.id // Sent to backend -> n8n for billing
        }),
      });

      if (!response.ok) throw new Error("API failed");

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullCode += chunk;
        setGeneratedHtml(prev => prev + chunk);
        codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      const cleanHtml = fullCode.replace(/```html|```/g, "").trim();
      setGeneratedHtml(cleanHtml);

      // Save History locally in Supabase
      const { data } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt: prompt,
        html_code: cleanHtml,
      }).select().single();

      if (data) setGeneratedId(data.id);

      // Refresh balance after 4 seconds (allowing n8n time to process deduction)
      setTimeout(() => fetchBalance(user.id), 4000);

    } catch (error) {
      alert("Generation failed. Please try again.");
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-yellow-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        
        {/* 1. INITIAL HERO / INPUT SECTION */}
        {!generatedHtml && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-3 text-center tracking-tight">
              Your AI Cofounder. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">At your service.</span>
            </h1>
            <p className="text-slate-500 mb-10 text-lg font-medium">Generate production-ready websites in seconds.</p>

            {/* PROMPT BOX (Matching AI Cofounder Style) */}
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200/60 p-4 relative transition-all hover:shadow-2xl hover:border-slate-300">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me to build a product landing page..."
                className="w-full h-32 p-4 text-xl outline-none resize-none text-slate-700 placeholder:text-slate-300 bg-transparent font-medium"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
              />
              
              <div className="flex justify-between items-end mt-2 px-2 relative">
                <div className="flex items-center gap-2">
                  {/* IDEA BUTTON */}
                  <button onClick={handleGetIdea} disabled={ideaLoading} className="flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-100 transition-colors">
                    <Shuffle size={16} className={ideaLoading ? "animate-spin" : ""} />
                    {ideaLoading ? "Thinking..." : "Give me an idea"}
                  </button>

                  {/* MODEL TOOLS BUTTON */}
                  <div className="relative">
                    <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors">
                      <SlidersHorizontal size={16} />
                      <span className="hidden sm:inline text-xs uppercase tracking-wide">{selectedModel}</span>
                    </button>
                    {showModelMenu && (
                      <div className="absolute bottom-12 left-0 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left max-h-60 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider mb-1">Select Engine</div>
                        {models.map((m) => (
                          <button key={m} onClick={() => { setSelectedModel(m); setShowModelMenu(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedModel === m ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{m}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handleGenerate} disabled={!prompt || loading} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50">
                  <ArrowUp size={28} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            <p className="mt-6 text-sm font-medium text-slate-400">
              Pay per usage. {user ? <span className="text-slate-600">Balance: <span className="font-mono text-slate-900">${balance.toFixed(4)}</span></span> : <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleLogin}>Sign in to start</span>}
            </p>
          </div>
        )}

        {/* 2. LOADING SCREEN */}
        {loading && !isStreaming && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={32} className="text-blue-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Engines starting...</h2>
            <p className="text-slate-500 animate-pulse">Designing your landing page with {selectedModel}</p>
          </div>
        )}

        {/* 3. GENERATED RESULT VIEW */}
        {generatedHtml && !loading && (
          <div className="h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"><Plus size={14} /> New</button>
                <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"><RefreshCw size={14} /> Regenerate</button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-all">{copied ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
                {generatedId && (
                  <a href={`/view/${generatedId}`} target="_blank" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-lg transition-all"><ExternalLink size={14} /> Full Screen</a>
                )}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 relative w-full h-full">
               <div className="bg-slate-950 p-4 overflow-auto custom-scrollbar border-r border-slate-800"><pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">{generatedHtml}</pre></div>
               <div className="bg-white relative"><iframe srcDoc={generatedHtml} className="w-full h-full border-none" title="Preview" /></div>
            </div>
          </div>
        )}

        {/* 4. LIVE STREAMING VIEW */}
        {isStreaming && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 h-[80vh]">
            <div className="bg-slate-950 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2 text-slate-400"><Terminal size={16} /><span className="text-xs font-mono text-blue-400">coding...</span></div>
              </div>
              <div className="p-4 font-mono text-xs text-emerald-400 overflow-y-auto flex-1 custom-scrollbar leading-relaxed">
                <pre className="whitespace-pre-wrap break-words">{generatedHtml}<span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse align-middle ml-1"></span></pre>
                <div ref={codeEndRef} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 relative">
              <div className="flex-1 relative bg-white w-full h-full flex flex-col items-center justify-center">
                 <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                 <p className="text-sm font-semibold text-slate-500 animate-pulse">Designing live...</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
