"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Layout } from 'lucide-react';

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setHistory(data || []);
      }
    };
    loadHistory();
  }, []);

  const downloadCode = (html: string, prompt: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.slice(0, 10).replace(/\s/g, '_')}_landing.html`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Generation History</h1>
        
        {history.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Layout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No websites generated yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                  <iframe 
                    srcDoc={item.html_code} 
                    className="w-[200%] h-[200%] transform scale-50 origin-top-left pointer-events-none" 
                    title="thumb"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-800 truncate mb-2">{item.prompt}</h3>
                  <p className="text-xs text-slate-400 mb-4">{new Date(item.created_at).toLocaleDateString()}</p>
                  <button 
                    onClick={() => downloadCode(item.html_code, item.prompt)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-100 border border-slate-200"
                  >
                    <Download size={16} /> Download Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
