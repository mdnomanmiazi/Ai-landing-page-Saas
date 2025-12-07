"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Code2, LogOut, Wallet, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (data) setBalance(data.balance);
  };

  const handleLogin = async () => {
    // Requires Google Auth enabled in Supabase Dashboard
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-slate-900">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Code2 size={20} />
          </div>
          <span>Landy<span className="text-blue-600">AI</span></span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700">
                <Wallet size={16} className="text-blue-600" />
                <span>{balance} BDT</span>
                <Link href="/topup" className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">+ Add</Link>
              </div>
              <Link href="/dashboard" className="hidden md:block text-sm font-medium hover:text-blue-600">Dashboard</Link>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <User size={16} /> Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
