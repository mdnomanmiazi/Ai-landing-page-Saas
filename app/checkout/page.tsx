"use client";
import { useState, useEffect } from 'react';
import { usePaymentGateway } from '../components/PaymentGateway';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft } from 'lucide-react';

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
        description: code // PASSING HTML CODE TO N8N VIA DESCRIPTION
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Summary */}
        <div className="bg-slate-900 p-8 text-white md:w-5/12 flex flex-col justify-between">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft size={16} /> Back to Edit
            </button>
            <h2 className="text-3xl font-bold mb-2">Checkout</h2>
            <p className="text-gray-400 mb-8">Get your code instantly.</p>
            
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <div className="flex justify-between">
                <span>Landing Page Generation</span>
                <span className="font-mono">10.00 BDT</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-gray-700">
                <span>Total</span>
                <span>10.00 BDT</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-xs text-gray-500">
            Secure payment via SSLCommerz. The download link will be sent to your email immediately.
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-8 md:w-7/12">
          <form onSubmit={handlePay} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input required type="email" placeholder="code@example.com" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setForm({...form, email: e.target.value})} />
              <p className="text-xs text-blue-600 mt-1">We will send the file here.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input required type="tel" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setForm({...form, phone: e.target.value})} />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <span>Redirecting...</span>
              ) : (
                <>
                  <Download size={20} />
                  Pay & Download
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
