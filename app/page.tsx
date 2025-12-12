"use client";
import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Copy, Check, Terminal, ExternalLink, ArrowUp, Shuffle, SlidersHorizontal, Plus, RefreshCw } from 'lucide-react';
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
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');

  const models = ["gpt-5.1", "gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o", "gpt-4o-mini"];
  const router = useRouter();
  const codeEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });
  }, []);

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (data) setBalance(data.balance);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const handleGenerate = async () => {
    if (!user) return handleLogin();
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
          userId: user.id 
        }),
      });

      if (!response.ok) throw new Error("API error");

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

      // Save to History
      const { data } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt: prompt,
        html_code: cleanHtml,
      }).select().single();

      if (data) setGeneratedId(data.id);

      // Refresh balance after 3 seconds so n8n has time to update it
      setTimeout(() => fetchBalance(user.id), 3000);

    } catch (error) {
      alert("Generation failed.");
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  // ... (Rest of your UI/JSX remains the same as before)
  return (
     <div className="min-h-screen bg-[#f8f9fa]">
       <Navbar />
       <main className="max-w-7xl mx-auto px-4 pt-24">
         {/* Render Input Box, Suggestions, and Iframe results here as in previous steps */}
         {/* Ensure Balance is shown in USD: ${balance.toFixed(4)} */}
       </main>
     </div>
  );
}
