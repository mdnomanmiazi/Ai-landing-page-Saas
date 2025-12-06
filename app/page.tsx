"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Code2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGeneratedHtml(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (data.html) {
        setGeneratedHtml(data.html);
        localStorage.setItem('landing_page_code', data.html); 
      }
    } catch (error) {
      alert("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-hero-pattern opacity-100 pointer-events-none"></div>
      
      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-slate-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Code2 size={20} />
            </div>
            <span>Landy<span className="text-blue-600">AI</span></span>
          </div>
          <div className="text-sm font-medium text-slate-500">v1.0.0</div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-20 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
            <Sparkles size={14} />
            <span>Powered by GPT-4o</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
            Build your dream site <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              in seconds.
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Describe your business, portfolio, or idea, and our AI will code a complete, responsive landing page for you instantly.
          </p>

          {/* Input Box */}
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-2 border border-slate-100">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your site (e.g. A dark modern portfolio for a photographer...)"
                className="w-full p-4 outline-none text-lg text-slate-700 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {loading ? 'Generating' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {generatedHtml && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Window Header */}
            <div className="bg-slate-900 text-white p-4 rounded-t-xl flex justify-between items-center shadow-2xl">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="flex gap-4 items-center">
                 <span className="text-xs font-mono text-slate-400">preview.html</span>
              </div>
              <button 
                onClick={() => router.push('/checkout')}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md text-sm font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                Download Code <ArrowRight size={14} />
              </button>
            </div>
            
            {/* Iframe */}
            <iframe 
              srcDoc={generatedHtml} 
              className="w-full h-[75vh] border-x border-b border-slate-200 rounded-b-xl bg-white shadow-2xl"
              title="Website Preview"
            />
            
            {/* Features below preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              {[
                "Responsive Mobile Design",
                "Clean Tailwind CSS Code",
                "Conversion Optimized"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-600 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
