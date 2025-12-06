"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Code2 } from 'lucide-react';

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
        localStorage.setItem('landing_page_code', data.html); // Save for checkout
      }
    } catch (error) {
      alert("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <nav className="border-b p-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Code2 className="text-blue-600" />
          <span>Landy<span className="text-blue-600">AI</span></span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-12 flex flex-col items-center">
        
        {/* Hero Input */}
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Generate your dream website <br />
            <span className="text-blue-600">in seconds.</span>
          </h1>
          <div className="relative flex items-center w-full shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A portfolio for a photographer with a dark theme..."
              className="w-full p-5 outline-none text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? 'Thinking...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {generatedHtml && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-gray-900 text-white p-4 rounded-t-xl flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Live Preview</span>
              <button 
                onClick={() => router.push('/checkout')}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105"
              >
                Download Code ($10)
              </button>
            </div>
            <iframe 
              srcDoc={generatedHtml} 
              className="w-full h-[65vh] border-2 border-gray-900 border-t-0 rounded-b-xl bg-white"
              title="Website Preview"
            />
          </div>
        )}
      </main>
    </div>
  );
}
