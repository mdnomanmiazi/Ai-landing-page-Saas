"use client";
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Lock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null); // State for preview
  const [errorLog, setErrorLog] = useState<string | null>(null);
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

  const handleGenerate = async () => {
    if (!user) return alert("Please sign in first.");
    if (balance < 10) {
      if(confirm("Insufficient balance. Go to Top Up?")) router.push('/topup');
      return;
    }

    setLoading(true);
    setGeneratedHtml(null);
    setErrorLog(null);

    try {
      console.log("Sending request to API...");
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server Error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      console.log("Data received:", data); // Check browser console for this!
      
      if (data.html) {
        setGeneratedHtml(data.html); // SHOW PREVIEW IMMEDIATELY

        // Deduct & Save in Background
        await supabase.from('profiles').update({ balance: balance - 10 }).eq('id', user.id);
        setBalance(prev => prev - 10);
        
        await supabase.from('generations').insert({
          user_id: user.id,
          prompt: prompt,
          html_code: data.html
        });
      } else {
        throw new Error("API returned success but no HTML code.");
      }
    } catch (error: any) {
      console.error("Generation Failed:", error);
      setErrorLog(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
          Describe it. <span className="text-blue-600">Build it.</span>
        </h1>
        
        {/* Error Display for Debugging */}
        {errorLog && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2 text-left">
            <AlertCircle size={20} />
            <div>
              <p className="font-bold">Generation Failed</p>
              <p className="text-xs font-mono mt-1">{errorLog}</p>
            </div>
          </div>
        )}

        <div className="relative group max-w-3xl mx-auto mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
          <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2 border border-slate-100">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={user ? "Describe your dream website..." : "Sign in to start..."}
              disabled={!user}
              className="w-full p-5 outline-none text-xl text-slate-700 placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !prompt || !user}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? 'Building...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* --- LIVE PREVIEW SECTION --- */}
        {generatedHtml && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900 text-white p-4 rounded-t-xl flex justify-between items-center shadow-2xl">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm font-mono text-slate-400">Live Preview</div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors"
              >
                Save & View in Dashboard
              </button>
            </div>
            <iframe 
              srcDoc={generatedHtml} 
              className="w-full h-[80vh] border-x border-b border-slate-200 rounded-b-xl bg-white shadow-2xl"
              title="Preview"
            />
          </div>
        )}

      </main>
    </div>
  );
}
