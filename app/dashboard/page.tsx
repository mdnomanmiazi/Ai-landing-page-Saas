"use client";
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../../lib/supabase';
import { Download, Layout, ExternalLink, Trash2 } from 'lucide-react';

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                
                {/* PREVIEW WINDOW - Fixed Scaling Issue */}
                <div className="relative h-64 bg-slate-100 border-b border-slate-100 overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none transform scale-[0.4] origin-top-left w-[250%] h-[250%]">
                    <iframe 
                      srcDoc={item.html_code} 
                      className="w-full h-full border-none bg-white"
                      title="thumb"
                      tabIndex={-1}
                    />
                  </div>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 text-lg">{item.prompt}</h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium bg-slate-100 w-fit px-2 py-1 rounded">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    {/* VIEW LIVE BUTTON */}
                    <a 
                      href={`/view/${item.id}`} 
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg"
                    >
                      <ExternalLink size={16} /> View Live
                    </a>

                    {/* DOWNLOAD BUTTON */}
                    <button 
                      onClick={() => downloadCode(item.html_code, item.prompt)}
                      className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                      <Download size={16} /> Code
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
