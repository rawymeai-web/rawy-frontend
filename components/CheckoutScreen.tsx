import React, { useState } from 'react';
import { Button } from './Button';
import type { ShippingDetails, Language, StoryData } from '../types';
import { getProductSizeById } from '../services/adminService';
import { convertPrice, type Currency } from '../services/currencyService';

interface CheckoutScreenProps {
  onProceedToPayment: (details: ShippingDetails) => void;
  onBack: () => void;
  language: Language;
  storyData: StoryData;
  currency: Currency;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onProceedToPayment, onBack, language, storyData, currency }) => {
  const [details, setDetails] = useState<ShippingDetails>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToPayment(details);
  };

  const productConfig = getProductSizeById(storyData.size);
  const basePrice = productConfig ? productConfig.price : 29.900;
  const shippingPrice = 1.500; // Updated shipping price
  const totalPrice = basePrice + shippingPrice;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      <div className="mb-4">
        <Button onClick={onBack} variant="outline" className="px-4 py-1 text-sm bg-white/50 border-white hover:bg-white rounded-xl">
          &larr; {t('العودة للمعاينة', 'Back to Preview')}
        </Button>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة الأخيرة: الطلب والدفع', 'Final Step: Order & Payment')}</h2>
        <p className="text-lg text-brand-navy/80">{t('أدخل بيانات التوصيل لإتمام طلبك.', 'Enter shipping details to complete your order.')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Shipping Form - Glassmorphism */}
        <form onSubmit={handleSubmit} id="shipping-form" className="md:col-span-2 p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 space-y-6">
          <h3 className="text-2xl font-bold text-brand-coral flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             {t('تفاصيل الشحن', 'Shipping Details')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">{t('الاسم الكامل', 'Full Name')}</label>
                <input type="text" name="name" id="name" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
            </div>
            <div className="col-span-1">
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
                <input type="email" name="email" id="email" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
            </div>
            <div className="col-span-1">
                <label htmlFor="city" className="block text-sm font-bold text-gray-700 mb-1">{t('المدينة/المنطقة', 'City/Area')}</label>
                <input type="text" name="city" id="city" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
            </div>
            <div className="col-span-1">
                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">{t('رقم الهاتف', 'Phone Number')}</label>
                <input type="tel" name="phone" id="phone" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
            </div>
            <div className="col-span-full">
                <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-1">{t('العنوان', 'Address')}</label>
                <textarea name="address" id="address" rows={3} required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent"></textarea>
            </div>
          </div>
        </form>
        
        {/* Order Summary - Glassmorphism */}
        <div className="md:col-span-1">
            <div className="p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 space-y-6 sticky top-24">
                <h3 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    {t('ملخص الطلب', 'Order Summary')}
                </h3>
                
                <div className="space-y-4 text-brand-navy/90 text-sm md:text-base">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span>{t('كتاب أطفال مخصص', "Custom Children's Book")}</span>
                        <span className="font-semibold">{convertPrice(basePrice, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span>{t('الشحن', 'Shipping')}</span>
                        <span className="font-semibold">{convertPrice(shippingPrice, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-bold text-xl text-brand-coral">
                        <span>{t('المجموع', 'Total')}</span>
                        <span>{convertPrice(totalPrice, currency)}</span>
                    </div>
                </div>
                
                <Button type="submit" form="shipping-form" className="w-full text-lg py-4 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                    {t('الانتقال إلى الدفع', 'Proceed to Payment')}
                </Button>
                
                <div className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {t('دفع آمن ومشفّر', 'Secure Encrypted Payment')}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutScreen;