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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'manual'>('manual');
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
          `خطأ في الاتصال ببوابة الدفع: ${err.message || 'يرجى المحاولة مرة أخرى أو اختيار الدفع عبر الرابط.'}`,
          `Payment Gateway Connection Error: ${err.message || 'Please try again or use Payment Link.'}`
        ));
        setIsProcessing(false);
      }
    } else {
      // Manual Link selected: Complete order setup with pending state immediately
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess(true); // Pass true to notify parent this is a manual link payment
      }, 1200);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-gray-100 animate-fade-in-up"
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Summary Box */}
          <div className="bg-[#FFF9F0] border border-[#F78F50]/15 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-gray-500 block uppercase tracking-wider">{t('المبلغ الإجمالي:', 'Total Amount:')}</span>
              <span className="text-xs font-semibold text-brand-navy/60">{t('رقم الطلب:', 'Order ID:')} {orderId}</span>
            </div>
            <span className="text-2xl font-black text-brand-coral">{totalAmount}</span>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            {/* Primary Recommended: Official Link (KNET / Apple Pay) */}
            <label className={`relative flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              paymentMethod === 'manual' 
                ? 'border-brand-teal bg-[#006B5D]/5 shadow-lg ring-2 ring-brand-teal/20' 
                : 'border-gray-200 hover:border-gray-300 bg-white'
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
              <div className={`${language === 'ar' ? 'mr-3' : 'ml-3'} flex-1`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-brand-navy text-base flex items-center gap-1.5">
                    <span>⚡ {t('رابط دفع بنكي مباشر (كي نت / أبل باي)', 'Direct Payment Link (KNET / Apple Pay)')}</span>
                  </span>
                  <span className="bg-brand-teal text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {t('الموصى به 🇰🇼', 'RECOMMENDED')}
                  </span>
                </div>
                <p className="text-xs text-brand-navy/70 mt-1.5 leading-relaxed font-medium">
                  {t(
                    'سنرسل لك رابط دفع رسمي عبر الواتساب والرسائل فوراً للدفع عبر كي نت (KNET) أو أبل باي (Apple Pay) بأمان.',
                    'We will send an instant official payment link via WhatsApp/SMS to pay securely with KNET or Apple Pay.'
                  )}
                </p>
              </div>
            </label>

            {/* Secondary Option: Direct Card (Coming Soon / Developer Testing) */}
            <label className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              paymentMethod === 'stripe' 
                ? 'border-gray-400 bg-gray-100/70 shadow-sm opacity-90' 
                : 'border-dashed border-gray-300/80 bg-gray-50/40 hover:bg-gray-50/80 opacity-60 hover:opacity-90'
            }`}>
              <input 
                type="radio" 
                name="payment_method" 
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
                className="mt-1 accent-gray-600"
                disabled={isProcessing}
              />
              <div className={`${language === 'ar' ? 'mr-3' : 'ml-3'} flex-1`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-gray-700 text-sm">
                    💳 {t('دفع مباشر بالبطاقة', 'Direct Card Payment')}
                  </span>
                  <span className="bg-gray-200 text-gray-600 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {t('قريباً ✨', 'COMING SOON ✨')}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed font-medium">
                  {t(
                    'سيتم تفعيل الدفع الفوري بالبطاقة قريباً. حالياً يرجى اختيار رابط الدفع السريع أعلاه للدفع عبر كي نت أو أبل باي.',
                    'Direct in-app card checkout is coming soon. Please select the Direct Payment Link above for instant KNET & Apple Pay.'
                  )}
                </p>
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
