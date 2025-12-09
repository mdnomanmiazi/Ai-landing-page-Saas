"use client";
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { usePaymentGateway } from '../components/PaymentGateway';
import { supabase } from '@/lib/supabase';
import { Wallet, ShieldCheck, Zap } from 'lucide-react';

export default function TopUpPage() {
  const { processPayment, isLoading } = usePaymentGateway();
  // --- UPDATE 1: Default to 10 ---
  const [amount, setAmount] = useState(10); 
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });
  }, []);

  const handleTopUp = async () => {
    if (!user) return alert("Please sign in first");
    
    // --- UPDATE 2: Minimum check ---
    if (amount < 10) return alert("Minimum top up is 10 BDT");

    localStorage.setItem('pending_topup', amount.toString());
    
    await processPayment(
      [{
        name: "Wallet Balance",
        price: amount,
        quantity: 1,
        description: `TOPUP_USER_${user.id}`
      }],
      {
        name: user.user_metadata.full_name || "User",
        email: user.email,
        phone: "01700000000",
        address: "Digital Wallet",
        city: "Dhaka"
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add Funds</h1>
            <p className="text-sm text-slate-500">Minimum 10 BDT</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* --- UPDATE 3: Added 10 to the list --- */}
          {[10, 50, 100, 500].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`py-3 rounded-lg border font-bold transition-all ${amount === val ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
            >
              ৳{val}
            </button>
          ))}
        </div>

        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Amount</label>
          <div className="relative mt-2">
             <span className="absolute left-4 top-3.5 text-slate-400 font-bold">৳</span>
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(Number(e.target.value))}
               className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
             />
          </div>
        </div>

        <button 
          onClick={handleTopUp}
          disabled={isLoading || !user || amount < 10}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isLoading ? "Redirecting..." : `Pay ${amount} BDT`}
          <ShieldCheck size={18} className="text-green-400" />
        </button>
      </div>
    </div>
  );
}
