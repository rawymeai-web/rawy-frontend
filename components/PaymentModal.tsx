import React, { useState } from 'react';
import { Button } from './Button';
import type { Language } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (isManualLink?: boolean) => void;
  totalAmount: string;
  orderId: string;
  language: Language;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPaymentSuccess, totalAmount, orderId, language }) => {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'manual'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (paymentMethod === 'stripe') {
      try {
        console.log(`[PaymentModal] Initializing Stripe checkout for order: ${orderId}...`);
        
        // Call backend to create checkout session
        // Note: Backend URL defaults to the relative pathname or full API route
        const res = await fetch(`/api/orders/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.url) {
          throw new Error(data.error || 'Failed to generate Stripe checkout session');
        }

        // Redirect to Stripe checkout
        window.location.href = data.url;
      } catch (err: any) {
        console.error("Stripe Redirect Error:", err);
        alert(t(
          `خطأ في الاتصال ببوابة الدفع: ${err.message || 'يرجى المحاولة مرة أخرى.'}`,
          `Payment Gateway Connection Error: ${err.message || 'Please try again.'}`
        ));
        setIsProcessing(false);
      }
    } else {
      // Manual Link selected: Complete order setup with pending state immediately
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess(true); // Pass true to notify parent this is a manual link payment
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-gray-100 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-brand-navy">
            {t('اختر طريقة الدفع', 'Choose Payment Method')}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-brand-navy transition-colors text-2xl font-bold p-1"
            disabled={isProcessing}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Summary Box */}
          <div className="bg-[#FFF9F0] border border-[#F78F50]/10 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">{t('المبلغ الإجمالي:', 'Total Amount:')}</span>
            <span className="text-xl font-bold text-brand-coral">{totalAmount}</span>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            {/* Stripe Option */}
            <label className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              paymentMethod === 'stripe' 
                ? 'border-brand-coral bg-[#F78F50]/5 shadow-[0px_4px_12px_rgba(247,143,80,0.05)]' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input 
                type="radio" 
                name="payment_method" 
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
                className="mt-1 accent-brand-coral"
                disabled={isProcessing}
              />
              <div className={`${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                <span className="block font-bold text-brand-navy text-base">
                  {t('الدفع بالبطاقة (كي نت / فيزا / ماستر)', 'Pay by Card (KNET / Visa / Master)')}
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  {t('دفع آمن وفوري عبر بوابة Stripe.', 'Secure and instant payment via Stripe.')}
                </span>
              </div>
            </label>

            {/* Manual Link Option */}
            <label className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              paymentMethod === 'manual' 
                ? 'border-brand-teal bg-[#006B5D]/5 shadow-[0px_4px_12px_rgba(0,107,93,0.05)]' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input 
                type="radio" 
                name="payment_method" 
                value="manual"
                checked={paymentMethod === 'manual'}
                onChange={() => setPaymentMethod('manual')}
                className="mt-1 accent-brand-teal"
                disabled={isProcessing}
              />
              <div className={`${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                <span className="block font-bold text-brand-navy text-base">
                  {t('طلب رابط دفع يدوي (واتساب / إيميل)', 'Request Manual Payment Link (WhatsApp/Email)')}
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  {t('سنرسل لك رابط دفع من حسابنا البنكي يدويًا لاحقًا.', 'We will manually send you a payment link from our bank later.')}
                </span>
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button 
              type="submit" 
              className={`w-full py-4 text-base font-bold rounded-2xl flex items-center justify-center gap-2 ${
                paymentMethod === 'manual' ? 'bg-brand-teal hover:bg-brand-teal/90' : 'bg-brand-coral hover:bg-[#e07b40]'
              }`} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('جاري التوجيه...', 'Processing...')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    {paymentMethod === 'stripe' ? 'credit_card' : 'link'}
                  </span>
                  <span>
                    {paymentMethod === 'stripe' 
                      ? t('الانتقال للدفع الآمن', 'Proceed to Secure Payment') 
                      : t('تأكيد الطلب والحصول على الرابط', 'Confirm Order & Request Link')
                    }
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
