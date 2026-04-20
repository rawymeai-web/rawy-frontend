import React, { useState } from 'react';
import { Button } from './Button';
import type { ShippingDetails, Language, StoryData } from '../types';
import { getProductSizeById } from '../services/adminService';
import { convertPrice, type Currency } from '../services/currencyService';

interface CheckoutScreenProps {
  onProceedToPayment: (details: ShippingDetails, planType: 'one_time' | 'monthly' | 'yearly', total: number) => void;
  onBack: () => void;
  language: Language;
  storyData: StoryData;
  currency: Currency;
}

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const CrossIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

type PlanType = 'one_time' | 'monthly' | 'yearly';

interface Plan {
  id: PlanType;
  badge?: string | { ar: string; en: string };
  emoji: string;
  name: { ar: string; en: string };
  tagline: { ar: string; en: string };
  priceMultiplier: number;
  shipping: { ar: string; en: string };
  perks: { label: { ar: string; en: string }; available: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: 'one_time',
    emoji: '📖',
    name: { ar: 'شراء لمرة واحدة', en: 'One-Time Purchase' },
    tagline: { ar: 'كتاب واحد مخصص (قصة واحدة)', en: 'Single Book (One-Time)' },
    priceMultiplier: 18 / 17, // Anchor is 18 KD
    shipping: { ar: '+ رسوم الشحن', en: '+ shipping (country dependent)' },
    perks: [
      { label: { ar: 'كتاب قصصي مخصص واحد', en: '1 personalized storybook' }, available: true },
      { label: { ar: 'توليد ذكاء اصطناعي كامل', en: 'Full AI generation (story + illustrations)' }, available: true },
      { label: { ar: 'نسخة رقمية (حمل PDF)', en: 'Soft copy (PDF download)' }, available: true },
      { label: { ar: 'نسخة مطبوعة (عند الاختيار)', en: 'Printed copy (if selected)' }, available: true },
    ]
  },
  {
    id: 'monthly',
    emoji: '🌙',
    name: { ar: 'اشتراك شهري', en: 'Monthly Subscription' },
    tagline: { ar: 'كتاب واحد كل شهر آلياً', en: '1 book per month (auto-generated)' },
    priceMultiplier: 16 / 17, // 16 KD
    shipping: { ar: 'شحن مجاني', en: 'Free Shipping' },
    perks: [
      { label: { ar: 'كتاب شهري (توليد آلي)', en: '1 book per month (auto-generated)' }, available: true },
      { label: { ar: 'تجربة قصصية مستمرة', en: 'Continuous storytelling (evolving themes)' }, available: true },
      { label: { ar: 'نسخة رقمية كل دورة', en: 'Soft copy every cycle' }, available: true },
      { label: { ar: 'إمكانية طباعة اختيارية', en: 'Optional print add-on' }, available: true },
      { label: { ar: 'تجربة مؤتمتة (بدون مجهود)', en: 'Automated experience (no effort)' }, available: true },
      { label: { ar: 'تدوير المواضيع (بدون تكرار)', en: 'Theme rotation (no repeats)' }, available: true },
      { label: { ar: 'أولوية في التنفيذ', en: 'Priority processing' }, available: true },
      { label: { ar: 'تفضيلات ثابتة (شخصية وأسلوب)', en: 'Locked preferences (consistent style)' }, available: true },
      { label: { ar: 'سعر أقل للكتاب', en: 'Lower cost per book' }, available: true },
      { label: { ar: 'شحن مجاني', en: 'Free shipping' }, available: true },
      { label: { ar: 'توليد بطلين مجاناً', en: 'Free 2 hero generation + special events' }, available: true },
    ]
  },
  {
    id: 'yearly',
    emoji: '🌟',
    badge: { ar: 'أفضل قيمة', en: 'BEST VALUE' },
    name: { ar: 'اشتراك سنوي', en: 'Yearly Subscription' },
    tagline: { ar: '12 كتاب مخصص موزعة', en: '12 books (monthly or scheduled)' },
    priceMultiplier: 12.5 / 17,
    shipping: { ar: 'شحن مجاني لكل كتاب', en: 'Free shipping per book' },
    perks: [
      { label: { ar: '12 كتاب مخصص', en: '12 books (monthly or scheduled)' }, available: true },
      { label: { ar: 'معاينة قبل الطباعة', en: 'Preview before printing (Biggest Value)' }, available: true },
      { label: { ar: 'نسخة رقمية ومطبوعة', en: 'Soft + printed versions' }, available: true },
      { label: { ar: 'إعادة توليد مجانية واحدة', en: '1 regeneration per cycle' }, available: true },
      { label: { ar: 'أعلى أولوية في التنفيذ', en: 'Highest status priority' }, available: true },
      { label: { ar: 'أفضل سعر للكتاب (12.5 دينار)', en: 'Best pricing per book' }, available: true },
      { label: { ar: 'تحكم كامل بالمخرجات', en: 'Full control over final output' }, available: true },
      { label: { ar: 'تطور قصصي مستمر', en: 'Consistent story progression' }, available: true },
      { label: { ar: 'وصول مبكر للمواضيع الجديدة', en: 'Early access to new themes' }, available: true },
      { label: { ar: 'كل ميزات الباقة الشهرية', en: 'All Monthly perks included' }, available: true },
    ]
  }
];


const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onProceedToPayment, onBack, language, storyData, currency }) => {
  const [details, setDetails] = useState<ShippingDetails>({ 
    name: storyData.parentName || '', 
    address: '', 
    city: '', 
    phone: '', 
    email: storyData.parentEmail || '' 
  });
  const [planType, setPlanType] = useState<PlanType>('monthly');
  const [basePrice, setBasePrice] = useState<number>(18.000); // New default base

  const selectedPlan = PLANS.find(p => p.id === planType)!;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const tObj = (obj: { ar: string; en: string }) => language === 'ar' ? obj.ar : obj.en;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  React.useEffect(() => {
    // Keep consistency if sizes exist, but now 18 is the baseline
    getProductSizeById(storyData.size).then(productConfig => {
      if (productConfig) setBasePrice(productConfig.price);
      else setBasePrice(18.000);
    });
  }, [storyData.size]);

  const premiumFeaturePrice = storyData.useSecondCharacter ? 5.000 : 0;
  
  let currentCyclePrice: number;
  let chargeMultiplier: number = 1;

  if (planType === 'monthly') {
    currentCyclePrice = 16.000; // Fixed 16 KD, dual hero already included (free)
    chargeMultiplier = 1;
  } else if (planType === 'yearly') {
    currentCyclePrice = 12.500; // 12.5 KD per book
    chargeMultiplier = 12;      // Total billed for the year
  } else {
    currentCyclePrice = 18.000 + premiumFeaturePrice; // Original logic: 18 + dual hero
    chargeMultiplier = 1;
  }

  const shippingPrice = (planType === 'one_time') ? 1.500 : 0;
  const totalPrice = (currentCyclePrice * chargeMultiplier) + shippingPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToPayment(details, planType, totalPrice);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="mb-2">
        <Button onClick={onBack} variant="outline" className="px-4 py-1 text-sm bg-white/50 border-white hover:bg-white rounded-xl">
          &larr; {t('العودة للمعاينة', 'Back to Preview')}
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة الأخيرة: اختر باقتك', 'Final Step: Choose Your Plan')}</h2>
        <p className="text-lg text-brand-navy/70">{t('اختر الباقة الأنسب لطفلك', 'Pick the plan that works best for your child')}</p>
      </div>

      {/* ── Plan Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto gap-8">
        {PLANS.map((plan) => {
          const isSelected = planType === plan.id;
          
          let displayPriceValue: number;
          if (plan.id === 'monthly') {
            displayPriceValue = (basePrice + premiumFeaturePrice) * (14 / 17); // ~14 KD
          } else if (plan.id === 'yearly') {
            displayPriceValue = (basePrice + premiumFeaturePrice) * (10.8 / 17); // ~10.8 KD
          } else {
            displayPriceValue = (basePrice + premiumFeaturePrice); // 17 KD
          }

          return (
            <button
              key={plan.id}
              onClick={() => setPlanType(plan.id)}
              className={`relative rounded-3xl p-6 text-left transition-all duration-300 flex flex-col gap-4
                ${isSelected
                  ? 'bg-brand-coral text-white shadow-xl ring-4 ring-brand-coral ring-offset-2 scale-[1.03]'
                  : 'bg-white/80 border border-gray-100 hover:shadow-lg hover:scale-[1.01]'
                }`}
            >

              {/* Best value badge */}
              {plan.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md
                  ${isSelected ? 'bg-white text-brand-coral border-2 border-brand-coral' : 'bg-brand-navy text-white'}`}>
                  {typeof plan.badge === 'string' ? plan.badge : tObj(plan.badge)}
                </span>
              )}

              {/* Header */}
              <div>
                <div className="text-3xl mb-2">{plan.emoji}</div>
                <div className={`font-bold text-xl ${isSelected ? 'text-white' : 'text-brand-navy'}`}>
                  {tObj(plan.name)}
                </div>
                <div className={`text-sm mt-1 ${isSelected ? 'text-white/75' : 'text-gray-500'}`}>
                  {tObj(plan.tagline)}
                </div>
              </div>

              {/* Price */}
              <div className={`rounded-2xl p-4 ${isSelected ? 'bg-white/15' : 'bg-gray-50'}`}>
                <>
                  <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-brand-navy'}`}>
                    {convertPrice(displayPriceValue, currency)}
                  </span>
                  <span className={`text-sm ml-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                    {plan.id === 'one_time' ? t('مرة واحدة', 'one-time') : '/mo'}
                  </span>
                </>
                <div className={`text-xs mt-2 font-medium ${isSelected ? 'text-white/80' : 'text-brand-coral'}`}>
                  {tObj(plan.shipping)}
                </div>
              </div>

              {/* Perks list */}
              <ul className="space-y-2.5 flex-1">
                {plan.perks.map((perk, i) => (
                  <li key={i} className={`flex items-center gap-2.5 text-sm
                    ${perk.available
                      ? isSelected ? 'text-white' : 'text-gray-700'
                      : isSelected ? 'text-white/35' : 'text-gray-300'
                    }`}>
                    <span className={perk.available ? (isSelected ? 'text-white' : 'text-green-500') : ''}>
                      {perk.available ? <CheckIcon /> : <CrossIcon />}
                    </span>
                    {tObj(perk.label)}
                  </li>
                ))}
              </ul>

              {/* Select indicator */}
              <div className={`text-center text-sm font-bold py-2 rounded-xl transition-all
                ${isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
                }`}>
                {isSelected ? t('✓ مختار', '✓ Selected') : t('اختر', 'Select')}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Bottom section: Shipping form + Summary ── */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} id="shipping-form" className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 space-y-6">
            <h3 className="text-2xl font-bold text-brand-coral flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {t('تفاصيل الشحن', 'Shipping Details')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">{t('الاسم الكامل', 'Full Name')}</label>
                <input type="text" name="name" id="name" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
                <input type="email" name="email" id="email" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-bold text-gray-700 mb-1">{t('المدينة/المنطقة', 'City/Area')}</label>
                <input type="text" name="city" id="city" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">{t('رقم الهاتف', 'Phone Number')}</label>
                <input type="tel" name="phone" id="phone" required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent" />
              </div>
              <div className="col-span-full">
                <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-1">{t('العنوان', 'Address')}</label>
                <textarea name="address" id="address" rows={3} required onChange={handleChange} className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent"></textarea>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className="p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 space-y-6 sticky top-24">
            <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {t('ملخص الطلب', 'Order Summary')}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-600">{tObj(selectedPlan.name)}</span>
                <span className="font-semibold text-brand-navy">{convertPrice(currentCyclePrice, currency)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-600">{t('الشحن', 'Shipping')}</span>
                <span className={`font-semibold ${shippingPrice === 0 ? 'text-green-600' : 'text-brand-navy'}`}>
                  {shippingPrice === 0 ? t('مجاني 🎉', 'Free 🎉') : convertPrice(shippingPrice, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-xl text-brand-coral">
                <span>{t('المجموع', 'Total')}</span>
                <span>{convertPrice(totalPrice, currency)}</span>
              </div>
            </div>

            <Button type="submit" form="shipping-form" className="w-full text-lg py-4 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
              {t('الانتقال إلى الدفع', 'Proceed to Payment')}
            </Button>

            <div className="text-xs text-center text-gray-400 flex items-center justify-center gap-2">
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