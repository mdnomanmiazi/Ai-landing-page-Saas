"use client";
import { useState, useEffect } from 'react';
import { usePaymentGateway } from '../components/PaymentGateway';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft, ShieldCheck, Code, Zap } from 'lucide-react';

export default function CheckoutPage() {
  const { processPayment, isLoading } = usePaymentGateway();
  const router = useRouter();
  
  const [code, setCode] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    const storedCode = localStorage.getItem('landing_page_code');
    if (!storedCode) {
      router.push('/');
    } else {
      setCode(storedCode);
    }
  }, [router]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    await processPayment(
      [{
        name: "AI Landing Page Code",
        price: 10,
        quantity: 1,
        description: code 
      }],
      {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: "Digital Delivery",
        city: "Dhaka"
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Left Side: Order Summary (Dark) */}
        <div className="md:col-span-5 bg-slate-900 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
           {/* Abstract Background Shapes */}
           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-violet-600 rounded-full blur-3xl opacity-20"></div>

          <div>
            <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-medium">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Generator
            </button>
            
            <h2 className="text-3xl font-bold mb-2">Order Summary</h2>
            <p className="text-slate-400 mb-8">Unlock your custom code instantly.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                  <Code size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">AI Generated Landing Page</h3>
                  <p className="text-sm text-slate-400">HTML5 + Tailwind CSS Source Code</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Instant Delivery</h3>
                  <p className="text-sm text-slate-400">Sent to email immediately</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">Subtotal</span>
              <span>10.00 BDT</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-white">
              <span>Total</span>
              <span>10.00 BDT</span>
            </div>
          </div>
        </div>

        {/* Right Side: Checkout Form (Light) */}
        <div className="md:col-span-7 p-8 md:p-12 bg-white">
          <div className="flex items-center gap-2 text-green-600 font-medium mb-8 bg-green-50 w-fit px-3 py-1 rounded-full text-xs">
            <ShieldCheck size={14} />
            <span>Secure SSL Payment</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">Customer Details</h2>

          <form onSubmit={handlePay} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input required type="text" placeholder="e.g. John Doe" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input required type="email" placeholder="john@example.com" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input required type="tel" placeholder="017..." 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Download size={20} />
                    Pay & Download Code
                  </>
                )}
              </button>
              <p className="text-center text-slate-400 text-sm mt-4">
                Powered by SSLCommerz. 100% Secure Transaction.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
