"use client";
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../../lib/supabase';
import { Loader2, Sparkles, Lock } from 'lucide-react';
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
    if (!user) {
      // Trigger login via Navbar button conceptually, or alert
      alert("Please sign in with Google (top right) to generate sites.");
      return;
    }
    
    if (balance < 10) {
      if(confirm("Insufficient balance. Generation costs 10 BDT. Go to Top Up?")) {
        router.push('/topup');
      }
      return;
    }

    setLoading(true);
    try {
      // 1. Generate via AI
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (data.html) {
        // 2. Deduct 10 BDT
        const newBalance = balance - 10;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
        setBalance(newBalance);

        // 3. Save to History
        await supabase.from('generations').insert({
          user_id: user.id,
          prompt: prompt,
          html_code: data.html
        });

        // 4. Redirect to Dashboard to view/download
        router.push('/dashboard');
      }
    } catch (error) {
      alert("Error generating website. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
          <Sparkles size={14} />
          <span>Pay-as-you-go AI Generator</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Describe it. <span className="text-blue-600">Build it.</span>
        </h1>
        
        <p className="text-lg text-slate-600 mb-10">
          Cost: <span className="font-bold text-slate-900">10 BDT</span> per website. 
          <br/>Sign in, top up your wallet, and generate instantly.
        </p>

        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
          <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-2 border border-slate-100">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={user ? "E.g. A portfolio for a photographer..." : "Sign in to generate..."}
              disabled={!user}
              className="w-full p-4 outline-none text-lg text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !prompt || !user}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : !user ? <Lock size={18} /> : <Sparkles size={18} />}
              {loading ? 'Generating' : !user ? 'Login First' : 'Generate'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
