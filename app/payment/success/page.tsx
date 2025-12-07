"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('Verifying Transaction...');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const creditBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const amountStr = localStorage.getItem('pending_topup');
      
      if (user && amountStr) {
        const amount = Number(amountStr);
        
        // 1. Get current balance
        const { data } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        const currentBalance = data?.balance || 0;
        
        // 2. Add amount
        const { error } = await supabase
          .from('profiles')
          .update({ balance: currentBalance + amount })
          .eq('id', user.id);

        if (!error) {
          setStatus(`Successfully added ${amount} BDT to your wallet.`);
          setAdded(true);
          localStorage.removeItem('pending_topup'); // Clear it so it doesn't run again on refresh
        } else {
          setStatus("Error updating balance. Please contact support.");
        }
      } else {
        setStatus("Session expired or invalid transaction.");
      }
    };

    creditBalance();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful</h1>
        <p className="text-slate-600 mb-8">{status}</p>
        
        <Link href="/" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">
          Start Generating
        </Link>
      </div>
    </div>
  );
}
