
import React, { useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import type { Language } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  totalAmount: string;
  language: Language;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPaymentSuccess, totalAmount, language }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call to payment gateway
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 2500);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-brand-navy">{t('الدفع الآمن', 'Secure Payment')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isProcessing}>&times;</button>
        </div>
        
        <form onSubmit={handlePayment} className="space-y-4">
          <p className="text-sm text-center text-gray-600 bg-gray-100 p-3 rounded-lg">
            {t('هذه واجهة دفع تجريبية. لا تقم بإدخال معلومات بطاقة ائتمان حقيقية.', 'This is a demo payment interface. Do not enter real credit card information.')}
          </p>
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">{t('رقم البطاقة', 'Card Number')}</label>
            <input type="text" id="cardNumber" placeholder="**** **** **** 1234" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">{t('تاريخ الانتهاء', 'Expiry Date')}</label>
              <input type="text" id="expiryDate" placeholder="MM/YY" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
            </div>
            <div className="flex-1">
              <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">{t('CVC', 'CVC')}</label>
              <input type="text" id="cvc" placeholder="123" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
            </div>
          </div>
           <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">{t('الاسم على البطاقة', 'Name on Card')}</label>
            <input type="text" id="cardName" placeholder={t('الاسم الكامل', 'Full Name')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
          </div>

          <div className="pt-4 space-y-2">
            <Button type="submit" className="w-full text-lg flex items-center justify-center" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('جاري المعالجة...', 'Processing...')}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  {t(`ادفع ${totalAmount}`, `Pay ${totalAmount}`)}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="w-full text-sm" onClick={onPaymentSuccess} disabled={isProcessing}>
              {t('تجاوز الدفع (للاختبار فقط)', 'Bypass Payment (Test Only)')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
