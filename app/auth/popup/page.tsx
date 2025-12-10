"use client";
import { useEffect } from 'react';
// FIX: Use relative path instead of @/lib/supabase
import { supabase } from '../../../lib/supabase';

export default function PopupCallback() {
  useEffect(() => {
    // 1. Supabase automatically parses the URL hash/query here
    // 2. Once the session is established, we close the popup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // Short timeout to ensure storage is synced
        setTimeout(() => {
          window.close();
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Authenticating...</p>
      </div>
    </div>
  );
}
