import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import type { ShippingDetails, Language, StoryData } from '../types';
import { convertPrice, type Currency } from '../services/currencyService';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckoutScreenProps {
  onProceedToPayment: (details: ShippingDetails, planType: 'one_time' | 'monthly' | 'yearly', total: number) => void;
  onBack: () => void;
  language: Language;
  storyData: StoryData;
  currency: Currency;
}

const CheckIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 text-brand-teal" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const SHIPPING_RATES = {
  kuwait: 2.000,
  gcc: 5.000,
  row: 7.000
};

const REGION_NAMES = {
  kuwait: { ar: 'الكويت', en: 'Kuwait' },
  gcc: { ar: 'دول الخليج', en: 'GCC Countries' },
  row: { ar: 'بقية العالم', en: 'Rest of World' }
};

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onProceedToPayment, onBack, language, storyData, currency }) => {
  const [details, setDetails] = useState<ShippingDetails>({ 
    name: storyData.parentName || '', 
    address: '', 
    city: '', 
    phone: '', 
    email: storyData.parentEmail || '',
    region: 'kuwait'
  });
  
  const [planType, setPlanType] = useState<'one_time' | 'monthly' | 'yearly'>('monthly');
  const [isPhysicalAddon, setIsPhysicalAddon] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const pricing = useMemo(() => {
    const digitalBase = 5.000;
    const heroAddon = storyData.useSecondCharacter ? 2.000 : 0;
    const themeAddon = storyData.isCustomTheme ? 1.000 : 0;
    
    const aLaCarteDigitalTotal = digitalBase + heroAddon + themeAddon;
    
    let subTotal = 0;
    if (planType === 'monthly') subTotal = 4.500;
    else if (planType === 'yearly') subTotal = 39.000;
    else subTotal = aLaCarteDigitalTotal;

    const finalDigital = storyData.isPrintUpsell ? 0 : subTotal;
    const physicalPrice = isPhysicalAddon ? 21.000 : 0;
    const shipping = isPhysicalAddon ? SHIPPING_RATES[details.region || 'kuwait'] : 0;
    
    return {
      aLaCarteDigitalTotal,
      currentDigital: finalDigital,
      physical: physicalPrice,
      shipping,
      total: finalDigital + physicalPrice + shipping
    };
  }, [planType, isPhysicalAddon, details.region, storyData.useSecondCharacter, storyData.isCustomTheme, storyData.isPrintUpsell, currency]);

  React.useEffect(() => {
    if (storyData.isPhysicalPrint) {
      setIsPhysicalAddon(true);
    }
  }, [storyData.isPhysicalPrint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToPayment(details, planType, pricing.total);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="rounded-2xl px-6">
          &larr; {t('العودة', 'Back')}
        </Button>
        <div className="text-right">
          <h2 className="text-3xl font-black text-brand-navy">{t('إتمام الطلب', 'Checkout')}</h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{t('خطوة واحدة لبدء السحر', 'One step from magic')}</p>
        </div>
      </div>

      {/* Decoy Intercept Banner */}
      {planType === 'one_time' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-orange to-brand-coral p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer"
          onClick={() => setPlanType('monthly')}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-8xl">auto_awesome</span>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black">{t('انتظر! وفّر أكثر من 40%', 'Wait! Save over 40%')}</h3>
              <p className="text-white/90 font-medium">
                {t(
                  `احصل على هذا الكتاب + كتاب إضافي كل شهر مقابل ${convertPrice(4.500, currency)} فقط!`,
                  `Get this exact book + a SECOND book every month for only ${convertPrice(4.500, currency)}!`
                )}
              </p>
            </div>
            <button className="bg-white text-brand-coral px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-lg">
              {t('اشترك ووفر الآن', 'Subscribe & Save Now')}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: Plan Selection & Add-ons */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Plan Selector - Hidden if Print Upsell */}
          {!storyData.isPrintUpsell && (
            <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl space-y-6">
              <h3 className="text-xl font-black text-brand-navy flex items-center gap-3">
                <span className="material-symbols-outlined text-brand-coral">style</span>
                {t('اختر باقتك الرقمية', 'Choose Your Digital Plan')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'one_time', name: t('شراء لمرة واحدة', 'A La Carte'), price: pricing.aLaCarteDigitalTotal, sub: t('كتاب واحد', 'Single Book') },
                  { id: 'monthly', name: t('الباقة الشهرية', 'Monthly'), price: 4.500, sub: t('كتابين/شهر', '2 Books/mo'), badge: t('الأكثر شعبية', 'POPULAR') },
                  { id: 'yearly', name: t('الباقة السنوية', 'Yearly'), price: 39.000, sub: t('24 كتاب/سنة', '24 Books/yr'), badge: t('أفضل قيمة', 'BEST VALUE') }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlanType(p.id as any)}
                    className={`relative p-6 rounded-3xl text-left transition-all border-2 flex flex-col gap-2 ${
                      planType === p.id 
                      ? 'border-brand-coral bg-white shadow-xl shadow-brand-coral/5 scale-[1.02]' 
                      : 'border-gray-100 bg-white/50 hover:border-gray-200'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-3 left-4 bg-brand-navy text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {p.badge}
                      </span>
                    )}
                    <span className={`text-xs font-black uppercase tracking-widest ${planType === p.id ? 'text-brand-coral' : 'text-gray-400'}`}>
                      {p.name}
                    </span>
                    <span className="text-2xl font-black text-brand-navy">{convertPrice(p.price, currency)}</span>
                    <span className="text-[10px] font-bold text-gray-400">{p.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Print Upsell Title for re-orders */}
          {storyData.isPrintUpsell && (
            <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl">
               <h3 className="text-xl font-black text-brand-navy flex items-center gap-3">
                <span className="material-symbols-outlined text-brand-coral">print</span>
                {t('طلب نسخة مطبوعة لـ', 'Order Print for')} "{storyData.title}"
              </h3>
            </div>
          )}

          {/* Physical Upsell */}
          <div className={`p-8 rounded-[3rem] border-2 transition-all space-y-6 ${
            isPhysicalAddon ? 'border-brand-teal bg-brand-teal/5' : 'border-dashed border-gray-200 bg-white/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isPhysicalAddon ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-3xl">auto_stories</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy">{t('أضف نسخة مطبوعة فاخرة', 'Add Premium HD Hardcover')}</h3>
                  <p className="text-sm text-gray-500 font-medium">{t('طباعة احترافية بـ 12 لوناً HD', 'Professional 12-Color HD Print')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-brand-teal">+{convertPrice(21.000, currency)}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('+ الشحن', '+ Shipping')}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-white/60">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isPhysicalAddon}
                  onChange={(e) => setIsPhysicalAddon(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal"></div>
              </label>
              <span className="text-sm font-black text-brand-navy uppercase tracking-widest">
                {isPhysicalAddon ? t('تمت الإضافة 🎉', 'Added to Order 🎉') : t('أضف للطلب', 'Add to Order')}
              </span>
            </div>

            <AnimatePresence>
              {isPhysicalAddon && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 border-t border-brand-teal/10 space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{t('اختر منطقة الشحن', 'Select Shipping Region')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['kuwait', 'gcc', 'row'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setDetails({ ...details, region: r })}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${
                            details.region === r 
                            ? 'border-brand-teal bg-white text-brand-teal shadow-lg' 
                            : 'border-gray-100 bg-white/50 text-gray-400'
                          }`}
                        >
                          <div className="font-black text-sm uppercase tracking-tighter">{t(REGION_NAMES[r].ar, REGION_NAMES[r].en)}</div>
                          <div className="text-[10px] font-bold">+{convertPrice(SHIPPING_RATES[r], currency)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shipping Form */}
          <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl space-y-8">
            <h3 className="text-xl font-black text-brand-navy flex items-center gap-3">
              <span className="material-symbols-outlined text-brand-coral">location_on</span>
              {t('بيانات التوصيل والاتصال', 'Delivery & Contact Details')}
            </h3>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الاسم الكامل', 'Full Name')}</label>
                <input 
                  required
                  type="text"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('البريد الإلكتروني', 'Email Address')}</label>
                <input 
                  required
                  type="email"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('رقم الهاتف', 'Phone Number')}</label>
                <input 
                  required
                  type="tel"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المدينة', 'City')}</label>
                <input 
                  required
                  type="text"
                  value={details.city}
                  onChange={(e) => setDetails({ ...details, city: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('العنوان بالتفصيل', 'Full Address')}</label>
                <textarea 
                  required
                  rows={3}
                  value={details.address}
                  onChange={(e) => setDetails({ ...details, address: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy resize-none"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-brand-navy p-10 rounded-[3.5rem] text-white shadow-2xl sticky top-8 space-y-8 relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
             
             <h3 className="text-2xl font-black uppercase tracking-tighter relative z-10">{t('ملخص الطلب', 'Order Summary')}</h3>
             
             <div className="space-y-4 relative z-10">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-white/60 font-bold uppercase tracking-widest text-[10px]">{t('المنتج الرقمي', 'Digital Product')}</span>
                 <span className="font-black">{convertPrice(pricing.currentDigital, currency)}</span>
               </div>

               {planType === 'one_time' && (
                 <div className="pl-4 space-y-2 border-l border-white/10 ml-2 py-1">
                   {storyData.useSecondCharacter && (
                     <div className="flex justify-between items-center text-[9px] text-white/40">
                       <span className="font-bold uppercase tracking-widest">{t('شخصية إضافية', 'Extra Character')}</span>
                       <span>+{convertPrice(2.000, currency)}</span>
                     </div>
                   )}
                   {storyData.isCustomTheme && (
                     <div className="flex justify-between items-center text-[9px] text-white/40">
                       <span className="font-bold uppercase tracking-widest">{t('سمة مخصصة', 'Custom Theme')}</span>
                       <span>+{convertPrice(1.000, currency)}</span>
                     </div>
                   )}
                 </div>
               )}
               
               {isPhysicalAddon && (
                 <>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-white/60 font-bold uppercase tracking-widest text-[10px]">{t('نسخة مطبوعة HD', 'HD Physical Print')}</span>
                     <span className="font-black">{convertPrice(pricing.physical, currency)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-white/60 font-bold uppercase tracking-widest text-[10px]">{t('الشحن الدولي', 'Shipping')}</span>
                     <span className="font-black">{convertPrice(pricing.shipping, currency)}</span>
                   </div>
                 </>
               )}

               <div className="pt-6 border-t border-white/10 mt-6">
                 <div className="flex justify-between items-end">
                   <div>
                     <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{t('المجموع النهائي', 'Grand Total')}</div>
                     <div className="text-4xl font-black text-brand-coral">{convertPrice(pricing.total, currency)}</div>
                   </div>
                   <div className="text-[9px] font-black text-white/30 uppercase text-right leading-tight">
                     {t('جميع الضرائب', 'All taxes')}<br/>{t('مشمولة', 'included')}
                   </div>
                 </div>
               </div>
             </div>

             <div className="space-y-4 relative z-10 pt-4">
                <Button 
                  type="submit" 
                  form="checkout-form"
                  className="w-full bg-brand-coral text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-lg hover:bg-white hover:text-brand-coral transition-all shadow-xl shadow-brand-coral/20"
                >
                  {t('ادفع الآن', 'Pay Now')}
                </Button>
                
                <div className="flex items-center justify-center gap-4 text-white/30">
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">{t('دفع آمن 100%', '100% Secure Payment')}</span>
                </div>
             </div>

             {/* Plan Benefits */}
             <div className="pt-8 space-y-3 relative z-10">
               {[
                 t('تسليم رقمي فوري', 'Instant Digital Delivery'),
                 t('تنسيق PDF عالي الجودة', 'High-Res PDF Format'),
                 t('لوحة تحكم تفاعلية', 'Interactive Dashboard'),
                 planType !== 'one_time' ? t('أولوية في التنفيذ', 'Priority Processing') : null
               ].filter(Boolean).map((benefit, i) => (
                 <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                   <span className="w-1.5 h-1.5 rounded-full bg-brand-coral" />
                   {benefit}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutScreen;