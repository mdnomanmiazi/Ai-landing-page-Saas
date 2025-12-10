"use client";
import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Copy, Check, Terminal, ExternalLink, ArrowUp, Shuffle, SlidersHorizontal } from 'lucide-react'; // Added SlidersHorizontal
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  
  // --- NEW: MODEL SELECTION STATE ---
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5');

  const models = [
    "gpt-5.1",
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5-pro",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-3.5-turbo",
  ];

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkBalance(session.user.id);
    });
  }, []);

  const checkBalance = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (data) setBalance(data.balance);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
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

  const handleGenerate = async () => {
    if (!user) return handleLogin();
    if (balance < 10) {
      if(confirm("Insufficient balance (Cost: 10 BDT). Go to Top Up?")) router.push('/topup');
      return;
    }
    
    setLoading(true);
    setGeneratedHtml("");
    setGeneratedId(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          model: selectedModel // --- SEND SELECTED MODEL ---
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message || data.error);
      if (!data.html) throw new Error("No HTML returned");

      setGeneratedHtml(data.html);

      // Deduct Balance
      const newBalance = balance - 10;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
      setBalance(newBalance);

      // Save History
      const { data: inserted } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt: prompt,
        html_code: data.html
      }).select().single();

      if (inserted) setGeneratedId(inserted.id);

    } catch (error) {
      console.error(error);
      alert("Error generating website. Try a different model or prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-yellow-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        
        {/* --- INPUT SECTION --- */}
        {!generatedHtml && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] transition-all duration-500">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-3 text-center tracking-tight">
              Your AI Cofounder. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">At your service.</span>
            </h1>
            <p className="text-slate-500 mb-10 text-lg font-medium">Generate production-ready websites in seconds.</p>

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
                  <button 
                    onClick={handleGetIdea}
                    disabled={ideaLoading}
                    className="flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-100 transition-colors"
                  >
                    <Shuffle size={16} className={ideaLoading ? "animate-spin" : ""} />
                    {ideaLoading ? "Thinking..." : "Give me an idea"}
                  </button>

                  {/* --- NEW: MODEL SELECTOR BUTTON --- */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowModelMenu(!showModelMenu)}
                      className="flex items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors"
                      title="Select AI Model"
                    >
                      <SlidersHorizontal size={16} />
                      <span className="hidden sm:inline text-xs uppercase tracking-wide">{selectedModel}</span>
                    </button>

                    {/* MODEL DROPDOWN MENU */}
                    {showModelMenu && (
                      <div className="absolute bottom-12 left-0 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                        <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Select Model</div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          {models.map((m) => (
                            <button
                              key={m}
                              onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedModel === m ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* GENERATE BUTTON */}
                <button 
                  onClick={handleGenerate}
                  disabled={!prompt || loading}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <ArrowUp size={28} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            <p className="mt-6 text-sm font-medium text-slate-400">
              10 BDT per generation. {user ? <span className="text-slate-600">Balance: {balance} ৳</span> : <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleLogin}>Sign in to start</span>}
            </p>
          </div>
        )}

        {/* --- LOADING STATE --- */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={32} className="text-blue-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating with {selectedModel}...</h2>
            <p className="text-slate-500 animate-pulse">This might take up to 30 seconds.</p>
          </div>
        )}

        {/* --- RESULTS PREVIEW --- */}
        {generatedHtml && !loading && (
          <div className="h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-mono text-slate-500">
                  <Terminal size={12} />
                  <span>index.html</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg transition-all">
                  {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                {generatedId && (
                  <a href={`/view/${generatedId}`} target="_blank" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-lg transition-all">
                    <ExternalLink size={14} /> Full Screen
                  </a>
                )}
                <button onClick={() => setGeneratedHtml('')} className="flex items-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-all shadow-sm">
                  <Sparkles size={14} /> New
                </button>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-slate-100 relative w-full h-full">
               <iframe 
                 srcDoc={generatedHtml} 
                 className="w-full h-full border-none" 
                 title="Preview" 
               />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
