"use client";

import { useState } from "react";

export interface OrderProduct {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
}

export const usePaymentGateway = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (
    products: OrderProduct[],
    customer: CustomerInfo
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const tranId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const subtotal = products.reduce((sum, product) => sum + product.price * (product.quantity || 1), 0);
      
      const payload = {
        total_amount: subtotal,
        cus_name: customer.name,
        cus_email: customer.email,
        cus_phone: customer.phone,
        cus_add1: customer.address || "Dhaka",
        cus_city: customer.city || "Dhaka",
        cus_country: "Bangladesh",
        tran_id: tranId,
        // Redirect URLs (Assuming your gateway handles these defaults or you set them here)
        success_url: "https://your-site.com/payment/success", 
        fail_url: "https://your-site.com/payment/fail",
        cancel_url: "https://your-site.com/payment/cancel",
        order_details: {
          products: products.map(product => ({
            name: product.name,
            price: product.price,
            quantity: product.quantity || 1,
            description: product.description || "" // The HTML code goes here
          })),
          subtotal,
          total: subtotal
        }
      };

      // Sending to your specific API endpoint
      const response = await fetch("https://ssl.tunelai.com/api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === 'SUCCESS' && data.GatewayPageURL) {
        window.location.href = data.GatewayPageURL;
        return true;
      } else if (data.GatewayPageURL) {
        window.location.href = data.GatewayPageURL;
        return true;
      } else {
        throw new Error(data.message || "Payment initiation failed");
      }
    } catch (err: any) {
      setError(err.message || "Connection Error");
      alert(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { processPayment, isLoading, error };
};
