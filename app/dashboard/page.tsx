"use client";
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../../lib/supabase';
import { Download, ExternalLink, Copy, Check, Trash2, Clock } from 'lucide-react';

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyCode = (html: string, id: string) => {
    navigator.clipboard.writeText(html);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Your Projects</h1>
          <span className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            {history.length} Sites Generated
          </span>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No history found. Start generating!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                
                {/* PREVIEW THUMBNAIL */}
                <div className="relative h-56 bg-slate-100 border-b border-slate-100 overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none transform scale-[0.4] origin-top-left w-[250%] h-[250%]">
                    <iframe 
                      srcDoc={item.html_code} 
                      className="w-full h-full border-none bg-white"
                      title="thumb"
                      tabIndex={-1}
                    />
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  <a 
                    href={`/view/${item.id}`} 
                    target="_blank"
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-700 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 shadow-sm"
                    title="Open Fullscreen"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 text-lg capitalize">
                    {item.prompt}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 font-medium">
                    {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  
                  {/* ACTION BUTTONS */}
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    {/* 1. View Live */}
                    <a 
                      href={`/view/${item.id}`} 
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      <ExternalLink size={14} /> Live
                    </a>

                    {/* 2. Copy Code */}
                    <button 
                      onClick={() => copyCode(item.html_code, item.id)}
                      className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>

                    {/* 3. Download Code */}
                    <button 
                      onClick={() => downloadCode(item.html_code, item.prompt)}
                      className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
                    >
                      <Download size={14} /> Code
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
