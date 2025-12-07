"use client";
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
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
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (data.html) {
        // Deduct & Save
        await supabase.from('profiles').update({ balance: balance - 10 }).eq('id', user.id);
        const { data: inserted } = await supabase.from('generations').insert({
          user_id: user.id,
          prompt: prompt,
          html_code: data.html
        }).select().single();

        // Redirect to View page immediately if desired, or Dashboard
        if (inserted) {
           router.push(`/dashboard`); 
        }
      }
    } catch (error) {
      alert("Error generating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 pt-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
          Describe it. <span className="text-blue-600">Build it.</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
          Instant AI website generation. <span className="font-bold text-slate-900">10 BDT</span> per site.
        </p>

        <div className="relative group max-w-3xl mx-auto mb-20">
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
              {loading ? <Loader2 className="animate-spin" /> : !user ? <Lock size={20} /> : <Sparkles size={20} />}
              {loading ? 'Building...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* FEATURE PREVIEW / HERO IMAGE */}
        <div className="relative w-full aspect-video bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden group">
           <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-90"
                alt="Preview"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent flex items-end justify-center pb-12">
                 <div className="text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Production Ready Code</h3>
                    <p className="text-slate-200">HTML • Tailwind • Lucide Icons</p>
                 </div>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}
