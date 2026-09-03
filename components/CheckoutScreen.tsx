import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './Button';
import type { ShippingDetails, Language, StoryData } from '../types';
import { convertPrice, type Currency } from '../services/currencyService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  COUNTRIES, 
  KUWAIT_GOVERNORATES, 
  SAUDI_REGIONS, 
  UAE_EMIRATES, 
  US_STATES, 
  formatFullAddress 
} from '../services/countryAddressConfig';

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
  const isPhysicalInitial = !!storyData.isPhysicalPrint;
  const [isPhysicalAddon, setIsPhysicalAddon] = useState(isPhysicalInitial);

  const [details, setDetails] = useState<ShippingDetails>({ 
    name: storyData.parentName || '', 
    address: '', 
    city: '', 
    phone: '', 
    email: storyData.parentEmail || '',
    country: 'KW',
    countryName: 'Kuwait',
    region: 'kuwait',
    governorate: 'العاصمة',
    area: '',
    block: '',
    street: '',
    building: '',
    floorApt: '',
    postalCode: '',
    deliveryNotes: '',
    isPhysicalDelivery: isPhysicalInitial
  });
  
  const [planType, setPlanType] = useState<'one_time' | 'monthly' | 'yearly'>('monthly');

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  React.useEffect(() => {
    // Track InitiateCheckout event on mount
    import('../utils/analytics').then(({ trackPixelEvent }) => {
      trackPixelEvent('InitiateCheckout', {
        content_name: storyData?.title || 'Storybook',
        content_category: storyData?.themeId || 'checkout',
        content_ids: [storyData?.themeId || ''],
        content_type: 'product'
      });
    });
  }, [storyData]);

  const pricing = useMemo(() => {
    // Single Storybook is an all-inclusive flat rate (no unexpected add-on surcharges for hero/theme)
    const singleDigitalTotal = 5.000;
    
    let subTotal = 0;
    if (planType === 'monthly') subTotal = 4.500;
    else if (planType === 'yearly') subTotal = 39.000;
    else subTotal = singleDigitalTotal;

    const finalDigital = storyData.isPrintUpsell ? 0 : subTotal;
    const physicalPrice = isPhysicalAddon ? 18.500 : 0;
    const shipping = isPhysicalAddon ? SHIPPING_RATES[details.region as keyof typeof SHIPPING_RATES || 'kuwait'] : 0;
    
    return {
      aLaCarteDigitalTotal: singleDigitalTotal,
      currentDigital: finalDigital,
      physical: physicalPrice,
      shipping,
      total: finalDigital + physicalPrice + shipping
    };
  }, [planType, isPhysicalAddon, details.region, storyData.isPrintUpsell, currency]);

  React.useEffect(() => {
    if (storyData.isPhysicalPrint) {
      setIsPhysicalAddon(true);
    }
  }, [storyData.isPhysicalPrint]);

  // Handle Country Change
  const handleCountryChange = (countryCode: string) => {
    const selected = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    const newRegion = selected.region;
    
    let defaultGov = '';
    if (countryCode === 'KW') defaultGov = language === 'ar' ? 'العاصمة' : 'Capital (Al Asimah)';
    if (countryCode === 'SA') defaultGov = language === 'ar' ? 'منطقة الرياض' : 'Riyadh';
    if (countryCode === 'AE') defaultGov = language === 'ar' ? 'دبي' : 'Dubai';
    if (countryCode === 'US') defaultGov = 'CA';

    const updated = {
      ...details,
      country: countryCode,
      countryName: selected.name[language],
      region: newRegion,
      governorate: defaultGov,
      province: defaultGov,
      emirate: defaultGov,
      state: defaultGov,
      city: countryCode === 'KW' ? (language === 'ar' ? 'الكويت' : 'Kuwait City') : details.city
    };

    updated.address = formatFullAddress({ ...updated, language });
    setDetails(updated);
  };

  const updateField = (field: keyof ShippingDetails, val: any) => {
    const updated = { ...details, [field]: val };
    updated.address = formatFullAddress({ ...updated, language });
    setDetails(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalDetails = {
      ...details,
      isPhysicalDelivery: isPhysicalAddon,
      address: isPhysicalAddon 
        ? formatFullAddress({ ...details, language }) 
        : (language === 'ar' ? 'طلب رقمي (لا يتطلب شحن فعلي)' : 'Digital Softcopy (No physical delivery required)')
    };

    onProceedToPayment(finalDetails, planType, pricing.total);
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
                  { id: 'one_time', name: t('قصة واحدة لمرة واحدة', 'Single Storybook'), price: pricing.aLaCarteDigitalTotal, sub: t('شراء لمرة واحدة (بدون اشتراك)', 'One-time purchase') },
                  { id: 'monthly', name: t('الباقة الشهرية', 'Monthly Club'), price: 4.500, sub: t('قصتان شهرياً (وفر 55%)', '2 Books/mo (Save 55%)'), badge: t('الأكثر شعبية', 'POPULAR') },
                  { id: 'yearly', name: t('الباقة السنوية', 'Yearly Club'), price: 39.000, sub: t('24 قصة بالسنة (أفضل قيمة)', '24 Books/yr (Best Value)'), badge: t('أفضل توفير', 'BEST VALUE') }
                ].map((p) => {
                  const isSelected = planType === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanType(p.id as any)}
                      className={`relative p-6 rounded-3xl text-left rtl:text-right transition-all border-2 flex flex-col gap-2 cursor-pointer ${
                        isSelected 
                        ? 'border-brand-coral bg-white shadow-2xl ring-4 ring-brand-coral/20 scale-[1.03] z-10' 
                        : 'border-gray-200/80 bg-white/60 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 bg-brand-coral text-white rounded-full p-1 shadow-md flex items-center justify-center animate-pop">
                          <span className="material-symbols-outlined text-sm font-black">check</span>
                        </div>
                      )}

                      {p.badge && (
                        <span className={`absolute -top-3 left-4 rtl:left-auto rtl:right-4 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${
                          isSelected ? 'bg-brand-coral text-white' : 'bg-brand-navy text-white'
                        }`}>
                          {p.badge}
                        </span>
                      )}

                      <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-brand-coral' : 'text-gray-500'}`}>
                        {p.name}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-brand-navy">{convertPrice(p.price, currency)}</span>
                        {p.id !== 'one_time' && <span className="text-[10px] font-bold text-gray-400">/{p.id === 'monthly' ? t('شهر', 'mo') : t('سنة', 'yr')}</span>}
                      </div>
                      <span className={`text-[10px] font-bold leading-tight ${isSelected ? 'text-brand-navy/80' : 'text-gray-400'}`}>{p.sub}</span>
                    </button>
                  );
                })}
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

          {/* Contact & Shipping Form */}
          <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl space-y-8">
            <h3 className="text-xl font-black text-brand-navy flex items-center gap-3">
              <span className="material-symbols-outlined text-brand-coral">
                {isPhysicalAddon ? 'local_shipping' : 'contact_mail'}
              </span>
              {isPhysicalAddon ? t('بيانات الشحن والتوصيل', 'Shipping & Delivery Details') : t('بيانات التواصل واستلام النسخة الرقمية', 'Contact & Digital Delivery Details')}
            </h3>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information (Required for All Orders) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الاسم الكامل', 'Full Name')} *</label>
                  <input 
                    required
                    type="text"
                    value={details.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('اسم المستلم', 'Full Name')}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('البريد الإلكتروني', 'Email Address')} *</label>
                  <input 
                    required
                    type="email"
                    value={details.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('رقم الهاتف (واتساب)', 'Phone / WhatsApp')} *</label>
                  <input 
                    required
                    type="tel"
                    value={details.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+965 xxxxxxxx"
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy text-sm"
                  />
                </div>
              </div>

              {/* Physical Delivery Address (Rendered ONLY when physical hardcover is selected) */}
              <AnimatePresence>
                {isPhysicalAddon ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 pt-6 border-t border-gray-100 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-brand-navy uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-teal text-lg">home_pin</span>
                        {t('عنوان التوصيل للمطبوعة الفاخرة', 'Hardcover Delivery Address')}
                      </h4>
                      <span className="text-[10px] bg-brand-teal/10 text-brand-teal font-black px-3 py-1 rounded-full uppercase">
                        {t(REGION_NAMES[details.region as keyof typeof REGION_NAMES || 'kuwait'].ar, REGION_NAMES[details.region as keyof typeof REGION_NAMES || 'kuwait'].en)}
                      </span>
                    </div>

                    {/* Country Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الدولة', 'Country')} *</label>
                      <select
                        value={details.country || 'KW'}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none transition-colors font-bold text-brand-navy text-sm cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name[language]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* KUWAIT Dynamic Address */}
                    {details.country === 'KW' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المحافظة', 'Governorate')} *</label>
                          <select
                            required
                            value={details.governorate || KUWAIT_GOVERNORATES[0].ar}
                            onChange={(e) => updateField('governorate', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          >
                            {KUWAIT_GOVERNORATES.map((g) => (
                              <option key={g.ar} value={language === 'ar' ? g.ar : g.en}>
                                {language === 'ar' ? g.ar : g.en}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المنطقة', 'Area')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.area || ''}
                            onChange={(e) => updateField('area', e.target.value)}
                            placeholder={t('مثال: مشرف، السرة، الروضة', 'e.g. Mishref, Surra')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('القطعة', 'Block')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.block || ''}
                            onChange={(e) => updateField('block', e.target.value)}
                            placeholder={t('مثال: 4', 'e.g. 4')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الشارع', 'Street')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.street || ''}
                            onChange={(e) => updateField('street', e.target.value)}
                            placeholder={t('اسم أو رقم الشارع', 'Street name/number')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المبنى / المنزل', 'Building / House')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.building || ''}
                            onChange={(e) => updateField('building', e.target.value)}
                            placeholder={t('رقم المنزل / العمارة', 'House/Bldg number')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الدور / الشقة (اختياري)', 'Floor / Apt (Optional)')}</label>
                          <input 
                            type="text"
                            value={details.floorApt || ''}
                            onChange={(e) => updateField('floorApt', e.target.value)}
                            placeholder={t('مثال: دور 2، شقة 5', 'e.g. Floor 2, Apt 5')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* SAUDI ARABIA Dynamic Address */}
                    {details.country === 'SA' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المنطقة', 'Province/Region')} *</label>
                          <select
                            required
                            value={details.province || SAUDI_REGIONS[0].ar}
                            onChange={(e) => updateField('province', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          >
                            {SAUDI_REGIONS.map((r) => (
                              <option key={r.ar} value={language === 'ar' ? r.ar : r.en}>
                                {language === 'ar' ? r.ar : r.en}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المدينة', 'City')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.city || ''}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder={t('الرياض، جدة، الدمام...', 'Riyadh, Jeddah, Dammam...')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الحي', 'District')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.area || ''}
                            onChange={(e) => updateField('area', e.target.value)}
                            placeholder={t('اسم الحي', 'District name')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الشارع', 'Street')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.street || ''}
                            onChange={(e) => updateField('street', e.target.value)}
                            placeholder={t('اسم الشارع', 'Street name')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('رقم المبنى / العنوان الوطني', 'Building / National Address')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.building || ''}
                            onChange={(e) => updateField('building', e.target.value)}
                            placeholder={t('رقم المبنى أو الرمز القصير', 'Building # or Short Address')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الرمز البريدي (اختياري)', 'Postal Code (Optional)')}</label>
                          <input 
                            type="text"
                            value={details.postalCode || ''}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            placeholder="12345"
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* UAE Dynamic Address */}
                    {details.country === 'AE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الإمارة', 'Emirate')} *</label>
                          <select
                            required
                            value={details.emirate || UAE_EMIRATES[0].ar}
                            onChange={(e) => updateField('emirate', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          >
                            {UAE_EMIRATES.map((em) => (
                              <option key={em.ar} value={language === 'ar' ? em.ar : em.en}>
                                {language === 'ar' ? em.ar : em.en}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المنطقة / المجتمع', 'Area / Community')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.area || ''}
                            onChange={(e) => updateField('area', e.target.value)}
                            placeholder={t('مثال: مارينا، البرشاء', 'e.g. Marina, Al Barsha')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الشارع', 'Street')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.street || ''}
                            onChange={(e) => updateField('street', e.target.value)}
                            placeholder={t('اسم أو رقم الشارع', 'Street name/number')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الفيلا / المبنى والشقة', 'Villa / Building & Apt')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.building || ''}
                            onChange={(e) => updateField('building', e.target.value)}
                            placeholder={t('رقم الفيلا أو اسم البرج ورقم الشقة', 'Villa # or Tower Name & Apt #')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* USA Dynamic Address */}
                    {details.country === 'US' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Street Address (Line 1) *</label>
                          <input 
                            required
                            type="text"
                            value={details.street || ''}
                            onChange={(e) => updateField('street', e.target.value)}
                            placeholder="123 Main St, Apt 4B"
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Apt / Suite / Unit (Optional)</label>
                          <input 
                            type="text"
                            value={details.floorApt || ''}
                            onChange={(e) => updateField('floorApt', e.target.value)}
                            placeholder="Unit 102"
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">City *</label>
                          <input 
                            required
                            type="text"
                            value={details.city || ''}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder="San Francisco"
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">State *</label>
                          <select
                            required
                            value={details.state || 'CA'}
                            onChange={(e) => updateField('state', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          >
                            {US_STATES.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ZIP Code *</label>
                          <input 
                            required
                            type="text"
                            value={details.postalCode || ''}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            placeholder="94103"
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* OTHER COUNTRIES Generic Address */}
                    {!['KW', 'SA', 'AE', 'US'].includes(details.country || 'KW') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المدينة', 'City')} *</label>
                          <input 
                            required
                            type="text"
                            value={details.city || ''}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder={t('اسم المدينة', 'City')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('المقاطعة / الولاية', 'State / Province')}</label>
                          <input 
                            type="text"
                            value={details.province || ''}
                            onChange={(e) => updateField('province', e.target.value)}
                            placeholder={t('الولاية أو المحافظة', 'State / Province')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الرمز البريدي', 'Postal / ZIP Code')}</label>
                          <input 
                            type="text"
                            value={details.postalCode || ''}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            placeholder="Postal Code"
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('العنوان التفصيلي', 'Street Address & Building')} *</label>
                          <textarea 
                            required
                            rows={2}
                            value={details.street || ''}
                            onChange={(e) => updateField('street', e.target.value)}
                            placeholder={t('الشارع، رقم المبنى، الشقة...', 'Street, Building #, Apartment, Unit...')}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Delivery Notes */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('ملاحظات خاصة بالتوصيل (اختياري)', 'Delivery Notes (Optional)')}</label>
                      <input 
                        type="text"
                        value={details.deliveryNotes || ''}
                        onChange={(e) => updateField('deliveryNotes', e.target.value)}
                        placeholder={t('مثال: الاتصال قبل الوصول، ترك الطرد عند الباب', 'e.g. Call before delivery')}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 focus:border-brand-teal outline-none font-bold text-brand-navy text-sm"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 rounded-2xl bg-brand-coral/5 border border-brand-coral/15 flex items-center gap-3 text-xs text-brand-navy font-bold">
                    <span className="material-symbols-outlined text-brand-coral text-xl">cloud_download</span>
                    <p>
                      {t(
                        'تم اختيار النسخة الرقمية (PDF) فقط — سيتم إرسال رابط التصفح والتحميل مباشرة إلى بريدك الإلكتروني وهاتفك دون الحاجة لعنوان شحن.',
                        'Digital Softcopy selected — Your preview and high-res PDF will be delivered directly to your email and phone without requiring a shipping address.'
                      )}
                    </p>
                  </div>
                )}
              </AnimatePresence>
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