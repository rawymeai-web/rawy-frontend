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
  EGYPT_GOVERNORATES,
  US_STATES, 
  formatFullAddress,
  getCountryShippingRate
} from '../services/countryAddressConfig';

interface CheckoutScreenProps {
  onProceedToPayment: (details: ShippingDetails, planType: 'one_time' | 'monthly' | 'yearly', total: number) => void;
  onBack: () => void;
  language: Language;
  storyData: StoryData;
  currency: Currency;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onProceedToPayment, onBack, language, storyData, currency }) => {
  const isPhysicalInitial = !!storyData.isPhysicalPrint;
  const [isPhysicalAddon, setIsPhysicalAddon] = useState(isPhysicalInitial);
  const [physicalBookCount, setPhysicalBookCount] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [isGiftWrapping, setIsGiftWrapping] = useState(false);
  const [isGiftCard, setIsGiftCard] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

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
    isPhysicalDelivery: isPhysicalInitial,
    shippingMethod: 'standard'
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
    // Base Single Digital Storybook is flat 5.000 KD
    const singleDigitalBase = 5.000;
    const heroAddon = storyData.useSecondCharacter ? 1.500 : 0;
    const themeAddon = storyData.isCustomTheme ? 0.500 : 0;
    const singleDigitalTotal = singleDigitalBase + heroAddon + themeAddon;
    
    // Monthly: 1 book per month @ 4.000 KD
    const monthlyPrice = 4.000;
    // Yearly: 12 books per year @ 30.000 KD upfront (clean 2.500 KD / book)
    const yearlyTotal = 30.000;
    const yearlyPerBook = 2.500;
    
    let subTotal = 0;
    if (planType === 'monthly') subTotal = monthlyPrice;
    else if (planType === 'yearly') subTotal = yearlyTotal;
    else subTotal = singleDigitalTotal;

    const finalDigital = storyData.isPrintUpsell ? 0 : subTotal;
    
    // Base Hardcover Print price: 21.000 KD. Discount (15%) is ONLY for the Yearly Plan!
    const basePhysicalUnitPrice = 21.000;
    const isYearlySubscriber = planType === 'yearly';
    const physicalUnitPrice = isYearlySubscriber ? basePhysicalUnitPrice * 0.85 : basePhysicalUnitPrice; // 17.850 KD for yearly
    const physicalPrice = isPhysicalAddon ? physicalUnitPrice * physicalBookCount : 0;
    
    // Dynamic Shipping Rate per country (Standard), free for 2+ books
    const standardShipping = isPhysicalAddon ? getCountryShippingRate(details.country || 'KW', physicalBookCount) : 0;
    // Express delivery is a fixed +2.000 KD surcharge above standard rate
    const expressShippingAddon = isPhysicalAddon && shippingMethod === 'express' ? 2.000 : 0;
    const shipping = standardShipping + expressShippingAddon;
    
    // Gift Add-ons (Only applicable if Physical Hardcover Print is selected)
    const giftWrappingPrice = isPhysicalAddon && isGiftWrapping ? 2.000 : 0;
    const giftCardPrice = isPhysicalAddon && isGiftCard ? 0.500 : 0;
    const giftTotal = giftWrappingPrice + giftCardPrice;

    // Discounts relative to base single book
    const monthlyDiscountPercent = Math.max(10, Math.round(((singleDigitalBase - monthlyPrice) / singleDigitalBase) * 100)); // 20%
    const yearlyDiscountPercent = Math.max(20, Math.round(((singleDigitalBase - yearlyPerBook) / singleDigitalBase) * 100)); // 50%

    return {
      singleDigitalBase,
      singleDigitalTotal,
      currentDigital: finalDigital,
      physical: physicalPrice,
      physicalUnitPrice,
      basePhysicalUnitPrice,
      isYearlySubscriber,
      standardShipping,
      expressShippingAddon,
      shippingMethod,
      shipping,
      giftWrapping: giftWrappingPrice,
      giftCard: giftCardPrice,
      giftTotal,
      total: finalDigital + physicalPrice + shipping + giftTotal,
      monthlyPrice,
      yearlyTotal,
      monthlyPerBook: monthlyPrice,
      yearlyPerBook,
      monthlyDiscountPercent,
      yearlyDiscountPercent
    };
  }, [planType, isPhysicalAddon, physicalBookCount, shippingMethod, details.country, storyData.useSecondCharacter, storyData.isCustomTheme, storyData.isPrintUpsell, isGiftWrapping, isGiftCard, currency]);

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
    if (countryCode === 'EG') defaultGov = language === 'ar' ? 'القاهرة' : 'Cairo';
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
      city: countryCode === 'KW' ? (language === 'ar' ? 'الكويت' : 'Kuwait City') : (countryCode === 'EG' ? (language === 'ar' ? 'القاهرة' : 'Cairo') : details.city)
    };

    updated.address = formatFullAddress({ ...updated, language });
    setDetails(updated);
  };

  const updateField = (field: keyof ShippingDetails, val: any) => {
    const updated = { ...details, [field]: val };
    updated.address = formatFullAddress({ ...updated, language });
    setDetails(updated);
  };

  const proceedDirectly = (selectedPlan: 'one_time' | 'monthly' | 'yearly' = planType) => {
    const finalDetails: ShippingDetails = {
      ...details,
      isPhysicalDelivery: isPhysicalAddon,
      shippingMethod: isPhysicalAddon ? shippingMethod : 'standard',
      shippingCost: isPhysicalAddon ? pricing.shipping : 0,
      isGiftWrapping: isPhysicalAddon ? isGiftWrapping : false,
      isGiftCard: isPhysicalAddon ? isGiftCard : false,
      giftMessage: (isPhysicalAddon && isGiftCard) ? giftMessage : '',
      address: isPhysicalAddon 
        ? formatFullAddress({ ...details, language }) 
        : (language === 'ar' ? 'طلب رقمي (لا يتطلب شحن فعلي)' : 'Digital Softcopy (No physical delivery required)')
    };

    let calculatedTotal = pricing.total;
    if (selectedPlan === 'monthly' && planType !== 'monthly') {
      calculatedTotal = pricing.monthlyPrice + pricing.physical + pricing.shipping + pricing.giftTotal;
    } else if (selectedPlan === 'yearly' && planType !== 'yearly') {
      calculatedTotal = pricing.yearlyTotal + pricing.physical + pricing.shipping + pricing.giftTotal;
    }

    onProceedToPayment(finalDetails, selectedPlan, calculatedTotal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Intercept single storybook orders to present the club discount modal
    if (planType === 'one_time' && !storyData.isPrintUpsell) {
      setShowUpsellModal(true);
      return;
    }

    proceedDirectly(planType);
  };

  const currentCountry = COUNTRIES.find(c => c.code === details.country) || COUNTRIES[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="rounded-2xl px-6">
          &larr; {t('العودة', 'Back')}
        </Button>
        <div className="text-right rtl:text-left">
          <h2 className="text-3xl font-black text-brand-navy">{t('إتمام الطلب', 'Checkout')}</h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{t('خطوة واحدة لبدء السحر', 'One step from magic')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: Plan Selection & Add-ons */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Plan Selector - Hidden if Print Upsell */}
          {!storyData.isPrintUpsell && (
            <div className="bg-white/50 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] border border-white shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-brand-navy flex items-center gap-3">
                  <span className="material-symbols-outlined text-brand-coral">style</span>
                  {t('اختر باقتك الرقمية', 'Choose Your Digital Plan')}
                </h3>
                <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
                  {t('جميع الإضافات مجانية مع النادي ✨', 'All Add-ons Free in Club ✨')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    id: 'one_time', 
                    name: t('قصة واحدة', 'Single Storybook'), 
                    pricePerBook: convertPrice(pricing.singleDigitalBase, currency),
                    strikethroughPrice: null,
                    discountBadge: null,
                    billingSummary: t('دفعة لمرة واحدة (بدون تجديد)', 'One-time payment (No sub)'),
                    includesLabel: null,
                    perks: [
                      { text: t('قصة رقمية مخصصة كاملة', 'Full custom digital storybook') },
                      { text: t('قارئ تفاعلي ونسخة PDF', 'Interactive reader & PDF copy') },
                      { text: t('قراءة عبر أي جهاز', 'Read on any device') },
                    ]
                  },
                  { 
                    id: 'monthly', 
                    name: t('الباقة الشهرية', 'Monthly Club'), 
                    pricePerBook: convertPrice(pricing.monthlyPerBook, currency),
                    strikethroughPrice: convertPrice(pricing.singleDigitalBase, currency),
                    discountBadge: t('وفر ' + pricing.monthlyDiscountPercent + '%', 'Save ' + pricing.monthlyDiscountPercent + '%'),
                    billingSummary: t('فاتورة ' + convertPrice(pricing.monthlyPrice, currency) + ' شهرياً (كتاب كل شهر)', 'Billed ' + convertPrice(pricing.monthlyPrice, currency) + '/mo (1 book/mo)'), 
                    badge: t('الأكثر شعبية', 'POPULAR'),
                    includesLabel: t('كل مزايا القصة الفردية، بالإضافة إلى:', 'Everything in Single Book, plus:'),
                    perks: [
                      { text: t('قصة مخصصة جديدة شهرياً', '1 New custom book every month') },
                      { text: t('بطل ثانٍ مجاناً بكل قصة', 'FREE 2nd hero on all books'), badge: t('مجاناً', 'FREE') },
                      { text: t('تخصيص مناسبات مجاناً', 'FREE special events'), badge: t('مجاناً', 'FREE') },
                    ]
                  },
                  { 
                    id: 'yearly', 
                    name: t('الباقة السنوية', 'Yearly Club'), 
                    pricePerBook: convertPrice(pricing.yearlyPerBook, currency),
                    strikethroughPrice: convertPrice(pricing.singleDigitalBase, currency),
                    discountBadge: t('وفر ' + pricing.yearlyDiscountPercent + '%', 'Save ' + pricing.yearlyDiscountPercent + '%'),
                    billingSummary: t('تُدفع ' + convertPrice(pricing.yearlyTotal, currency) + ' سنوياً لـ 12 كتاباً', 'Billed ' + convertPrice(pricing.yearlyTotal, currency) + '/yr for 12 books'), 
                    badge: t('أفضل توفير', 'BEST VALUE'),
                    includesLabel: t('كل مزايا النادي الشهري، بالإضافة إلى:', 'Everything in Monthly Club, plus:'),
                    perks: [
                      { text: t('12 قصة مخصصة (كتاب كل شهر)', '12 Custom books (1/month)') },
                      { text: t('خصم 15% على الكتب المطبوعة', '15% OFF printed hardcovers'), badge: t('15% خصم', '15% OFF') },
                      { text: t('وصول VIP لجميع الأنماط', 'VIP access to all styles') },
                    ]
                  }
                ].map((p) => {
                  const isSelected = planType === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanType(p.id as any)}
                      className={'relative p-5 sm:p-6 rounded-3xl text-left rtl:text-right transition-all border-2 flex flex-col justify-between gap-3 cursor-pointer ' + (
                        isSelected 
                        ? 'border-brand-coral bg-white shadow-2xl ring-4 ring-brand-coral/20 scale-[1.03] z-10' 
                        : 'border-gray-200/80 bg-white/60 hover:bg-white hover:border-gray-300'
                      )}
                    >
                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 bg-brand-coral text-white rounded-full p-1 shadow-md flex items-center justify-center animate-pop">
                          <span className="material-symbols-outlined text-sm font-black">check</span>
                        </div>
                      )}

                      {/* Top Floating Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.badge && (
                          <span className={'text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm ' + (
                            isSelected ? 'bg-brand-coral text-white' : 'bg-brand-navy text-white'
                          )}>
                            {p.badge}
                          </span>
                        )}
                        {p.discountBadge && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-emerald-100 text-emerald-800">
                            {p.discountBadge}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className={'text-xs font-black uppercase tracking-wider block mb-1 ' + (isSelected ? 'text-brand-coral' : 'text-gray-500')}>
                          {p.name}
                        </span>

                        {/* Price Display with Strikethrough */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {p.strikethroughPrice && (
                            <span className="text-sm font-bold text-gray-400 line-through">
                              {p.strikethroughPrice}
                            </span>
                          )}
                          <span className="text-2xl sm:text-3xl font-black text-brand-navy">
                            {p.pricePerBook}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            /{t('كتاب', 'book')}
                          </span>
                        </div>

                        {/* Billing fine print */}
                        <p className={'text-[10px] font-bold leading-tight mt-1 ' + (isSelected ? 'text-brand-navy/90' : 'text-gray-400')}>
                          {p.billingSummary}
                        </p>
                      </div>

                      {/* Plan Perks Checklist */}
                      <div className="pt-3 border-t border-gray-100 space-y-2 text-left rtl:text-right w-full">
                        {p.includesLabel && (
                          <div className={`text-[11px] font-black tracking-tight flex items-center gap-1.5 pb-1 ${
                            isSelected ? 'text-brand-coral' : 'text-brand-teal'
                          }`}>
                            <span className="material-symbols-outlined text-xs">auto_awesome</span>
                            <span>{p.includesLabel}</span>
                          </div>
                        )}
                        {p.perks.map((perk, pIdx) => (
                          <div key={pIdx} className="text-xs font-bold text-brand-navy/85 flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-brand-coral/20 text-brand-coral' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              <span className="material-symbols-outlined text-[13px] font-black">check</span>
                            </div>
                            <span className="flex-1 leading-tight">{perk.text}</span>
                            {perk.badge && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase flex-shrink-0 tracking-wider">
                                {perk.badge}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Physical Printing Disclaimer Notice - ONLY rendered when Yearly subscription is chosen */}
              {planType === 'yearly' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50/80 border border-amber-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed font-medium"
                >
                  <span className="text-base flex-shrink-0">ℹ️</span>
                  <p>
                    {t(
                      'تنبيه: تشمل الباقة السنوية إصدار 12 كتاباً رقمياً تفاعلياً عالي الدقة. طباعة وتوصيل النسخ الورقية الفاخرة (Hardcover) هي خدمة اختيارية تُطلب بشكل منفصل (مع خصم 15% حصري لأعضاء الباقة السنوية).',
                      'Note: The Yearly subscription covers 12 HD interactive digital storybooks. Premium hardcover printing and delivery are optional add-ons charged separately (with an exclusive 15% discount for yearly members).'
                    )}
                  </p>
                </motion.div>
              )}
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

          {/* Physical Hardcover Upsell */}
          <div className={'p-6 sm:p-8 rounded-[3rem] border-2 transition-all space-y-5 ' + (
            isPhysicalAddon ? 'border-brand-teal bg-brand-teal/5 shadow-md' : 'border-dashed border-gray-200 bg-white/30'
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ' + (isPhysicalAddon ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-400')}>
                  <span className="material-symbols-outlined text-3xl">auto_stories</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy">{t('أضف نسخة مطبوعة فاخرة', 'Add Premium HD Hardcover')}</h3>
                  <p className="text-xs text-gray-500 font-medium">{t('طباعة احترافية بـ 12 لوناً وتجليد مقوى فندقي دائم', 'Professional 12-Color HD Print & Archival Binding')}</p>
                </div>
              </div>
              <div className="text-left rtl:text-right sm:text-right rtl:sm:text-left">
                <div className="flex items-center gap-2 justify-end">
                  {pricing.isYearlySubscriber && (
                    <span className="text-xs text-gray-400 line-through font-bold">
                      {convertPrice(pricing.basePhysicalUnitPrice, currency)}
                    </span>
                  )}
                  <div className="text-xl font-black text-brand-teal">
                    +{convertPrice(pricing.physicalUnitPrice, currency)}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {pricing.isYearlySubscriber ? t('شامل خصم 15% للباقة السنوية 🎉', 'Includes 15% Yearly Discount 🎉') : t('لكل نسخة مطبوعة', 'per printed book')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white/60 p-4 rounded-2xl border border-white/80">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPhysicalAddon}
                    onChange={(e) => setIsPhysicalAddon(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal"></div>
                </label>
                <span className="text-sm font-black text-brand-navy">
                  {isPhysicalAddon ? t('تمت الإضافة للطلب 🎉', 'Added to Order 🎉') : t('أضف النسخة المطبوعة', 'Add Hardcover Book')}
                </span>
              </div>

              {/* Quantity Selector if added */}
              {isPhysicalAddon && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">{t('العدد:', 'Qty:')}</span>
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                    <button 
                      type="button" 
                      onClick={() => setPhysicalBookCount(Math.max(1, physicalBookCount - 1))}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 font-black text-sm text-brand-navy">{physicalBookCount}</span>
                    <button 
                      type="button" 
                      onClick={() => setPhysicalBookCount(physicalBookCount + 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Shipping & Speed Options (Standard vs Express) */}
            {isPhysicalAddon && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-navy">
                    <span className="text-base">🚚</span>
                    <span>{t('طريقة وسرعة التوصيل إلى', 'Delivery Speed & Method to')} {currentCountry.name[language]} {currentCountry.flag}:</span>
                  </div>
                  {physicalBookCount >= 2 ? (
                    <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[10px]">
                      {t('🎉 شحن قياسي مجاني', '🎉 Free Standard Delivery')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">
                      {t('💡 2+ كتب = شحن قياسي مجاني', '💡 2+ copies = Free Standard')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Standard Delivery */}
                  <div 
                    onClick={() => setShippingMethod('standard')}
                    className={'p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ' + (
                      shippingMethod === 'standard' 
                        ? 'border-brand-teal bg-brand-teal/5 shadow-sm ring-2 ring-brand-teal/20' 
                        : 'border-gray-200 bg-white/70 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl flex-shrink-0">📦</span>
                        <div>
                          <span className="font-black text-brand-navy text-xs block">{t('توصيل قياسي', 'Standard Delivery')}</span>
                          <span className="text-[10px] text-gray-500 font-medium block">{t('خلال ٣ - ٥ أيام عمل', '3 - 5 business days')}</span>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="shippingMethod"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 accent-brand-teal w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-left rtl:text-right pt-1 border-t border-gray-100/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">{t('تكلفة الشحن:', 'Shipping rate:')}</span>
                      <span className="text-xs font-black text-brand-teal">
                        {pricing.standardShipping === 0 ? t('مجاناً 🎉', 'FREE 🎉') : '+' + convertPrice(pricing.standardShipping, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Express Delivery */}
                  <div 
                    onClick={() => setShippingMethod('express')}
                    className={'p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ' + (
                      shippingMethod === 'express' 
                        ? 'border-brand-coral bg-brand-coral/5 shadow-sm ring-2 ring-brand-coral/20' 
                        : 'border-gray-200 bg-white/70 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl flex-shrink-0">⚡</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-brand-navy text-xs">{t('توصيل سريع (إكسبرس)', 'Express Delivery ⚡')}</span>
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                              +{convertPrice(2.000, currency)}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium block">{t('خلال ١ - ٢ يوم عمل • أولوية التجهيز', '1 - 2 business days • Priority')}</span>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="shippingMethod"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 accent-brand-coral w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-left rtl:text-right pt-1 border-t border-gray-100/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">{t('تكلفة الشحن السريع:', 'Express rate:')}</span>
                      <span className="text-xs font-black text-brand-coral">
                        +{convertPrice(pricing.standardShipping + 2.000, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gift Options: Gift Wrapping (2 KD) & Greeting Gift Card (0.5 KD) - Physical delivery only */}
          {isPhysicalAddon && (
            <div className="p-6 sm:p-8 rounded-[3rem] border-2 border-dashed border-gray-200 bg-white/40 backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-bold flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">card_giftcard</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy">{t('خيارات وباقة الإهداء 🎁', 'Gift Packaging & Card Options 🎁')}</h3>
                  <p className="text-xs text-gray-500 font-medium">{t('اجعلها هدية لا تُنسى مع لمسات إهداء وتغليف راقية', 'Make it an unforgettable present with luxury wrapping and personalized card.')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gift Wrapping (2 KD) */}
                <div 
                  className={'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ' + (
                    isGiftWrapping ? 'border-brand-coral bg-brand-coral/5 shadow-sm ring-2 ring-brand-coral/20' : 'border-gray-200 bg-white/60 hover:border-gray-300'
                  )} 
                  onClick={() => setIsGiftWrapping(!isGiftWrapping)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl flex-shrink-0">🎁</span>
                      <div>
                        <span className="font-black text-brand-navy text-sm block">{t('تغليف هدايا فاخر', 'Premium Gift Wrapping')}</span>
                        <span className="text-[11px] text-gray-500 font-medium block leading-tight">{t('شريط حريري وبوكس فاخر جاهز للإهداء', 'Luxury gift wrap with satin ribbon')}</span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isGiftWrapping} 
                      onChange={(e) => setIsGiftWrapping(e.target.checked)} 
                      onClick={(e) => e.stopPropagation()} 
                      className="mt-1 accent-brand-coral w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                  <div className="text-left rtl:text-right">
                    <span className="text-xs font-black text-brand-coral">+{convertPrice(2.000, currency)}</span>
                  </div>
                </div>

                {/* Greeting Gift Card (0.5 KD) */}
                <div 
                  className={'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ' + (
                    isGiftCard ? 'border-brand-teal bg-brand-teal/5 shadow-sm ring-2 ring-brand-teal/20' : 'border-gray-200 bg-white/60 hover:border-gray-300'
                  )} 
                  onClick={() => setIsGiftCard(!isGiftCard)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl flex-shrink-0">💌</span>
                      <div>
                        <span className="font-black text-brand-navy text-sm block">{t('بطاقة إهداء مخصصة', 'Personalized Gift Card')}</span>
                        <span className="text-[11px] text-gray-500 font-medium block leading-tight">{t('كرت إهداء مطبوع بكلماتك ورسالتك', 'Printed card with your custom message')}</span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isGiftCard} 
                      onChange={(e) => setIsGiftCard(e.target.checked)} 
                      onClick={(e) => e.stopPropagation()} 
                      className="mt-1 accent-brand-teal w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                  <div className="text-left rtl:text-right">
                    <span className="text-xs font-black text-brand-teal">+{convertPrice(0.500, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Gift Message Textbox (Only if Gift Card is selected) */}
              <AnimatePresence>
                {isGiftCard && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-1 overflow-hidden"
                  >
                    <label className="text-xs font-black text-brand-navy flex items-center justify-between">
                      <span>💌 {t('رسالة بطاقة الإهداء:', 'Your Gift Card Message:')}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{giftMessage.length}/150 {t('حرف', 'chars')}</span>
                    </label>
                    <textarea 
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value.slice(0, 150))}
                      placeholder={t('اكتب رسالتك الجميلة هنا (مثال: إلى بطلنا الغالي، نتمنى لك عيد ميلاد سعيد ومستقبلاً باهراً! مع كل الحب...)', 'Write your personalized message here (e.g. Happy Birthday to our little champion! Wishing you a world of wonder and joy...)')}
                      rows={2}
                      className="w-full p-3.5 bg-white rounded-2xl border border-brand-teal/30 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 text-xs font-medium text-brand-navy outline-none resize-none shadow-inner"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Contact & Shipping Form */}
          <div className="bg-white/50 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] border border-white shadow-xl space-y-6">
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
                    placeholder={details.country === 'EG' ? '+20 1xxxxxxxxx' : (details.country === 'KW' ? '+965 xxxxxxxx' : '+...')}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy text-sm"
                  />
                </div>
              </div>

              {/* Physical Delivery Address (Rendered ONLY when physical hardcover is selected) */}
              <AnimatePresence>
                {isPhysicalAddon && (
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
                    </div>

                    {/* Country Selector Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('الدولة', 'Country / Region')} *</label>
                      <select 
                        value={details.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:border-brand-coral outline-none transition-colors font-bold text-brand-navy text-sm cursor-pointer"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name[language]} ({c.phoneCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic Address Fields Based on Selected Country */}
                    {details.country === 'KW' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المحافظة', 'Governorate')}</label>
                          <select 
                            value={details.governorate}
                            onChange={(e) => updateField('governorate', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy"
                          >
                            {KUWAIT_GOVERNORATES.map(g => (
                              <option key={g.en} value={g[language]}>{g[language]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المنطقة', 'Area')} *</label>
                          <input required type="text" value={details.area || ''} onChange={(e) => updateField('area', e.target.value)} placeholder={t('مثال: كيفان', 'e.g. Kaifan')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('القطعة', 'Block')} *</label>
                          <input required type="text" value={details.block || ''} onChange={(e) => updateField('block', e.target.value)} placeholder={t('مثال: 3', 'e.g. 3')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الشارع', 'Street')} *</label>
                          <input required type="text" value={details.street || ''} onChange={(e) => updateField('street', e.target.value)} placeholder={t('مثال: شارع 12', 'e.g. Street 12')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المبنى / المنزل', 'Building / House')} *</label>
                          <input required type="text" value={details.building || ''} onChange={(e) => updateField('building', e.target.value)} placeholder={t('مثال: منزل 15', 'e.g. House 15')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الدور / الشقة (اختياري)', 'Floor / Apt')}</label>
                          <input type="text" value={details.floorApt || ''} onChange={(e) => updateField('floorApt', e.target.value)} placeholder={t('مثال: الدور 2', 'e.g. Floor 2')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                      </div>
                    )}

                    {details.country === 'EG' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المحافظة', 'Governorate')}</label>
                          <select 
                            value={details.governorate}
                            onChange={(e) => updateField('governorate', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy"
                          >
                            {EGYPT_GOVERNORATES.map(g => (
                              <option key={g.en} value={g[language]}>{g[language]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المدينة / الحي', 'City / District')} *</label>
                          <input required type="text" value={details.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder={t('مثال: المعادي / الشيخ زايد', 'e.g. Maadi / Zayed')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('اسم الشارع', 'Street Name')} *</label>
                          <input required type="text" value={details.street || ''} onChange={(e) => updateField('street', e.target.value)} placeholder={t('مثال: شارع 9', 'e.g. Street 9')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('رقم العمارة / المبنى', 'Building Number')} *</label>
                          <input required type="text" value={details.building || ''} onChange={(e) => updateField('building', e.target.value)} placeholder={t('مثال: عمارة 45', 'e.g. Bldg 45')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الدور / رقم الشقة', 'Floor / Apartment')}</label>
                          <input type="text" value={details.floorApt || ''} onChange={(e) => updateField('floorApt', e.target.value)} placeholder={t('مثال: شقة 12', 'e.g. Apt 12')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                      </div>
                    )}

                    {details.country === 'SA' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المنطقة', 'Region')}</label>
                          <select 
                            value={details.province}
                            onChange={(e) => updateField('province', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy"
                          >
                            {SAUDI_REGIONS.map(r => (
                              <option key={r.en} value={r[language]}>{r[language]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المدينة', 'City')} *</label>
                          <input required type="text" value={details.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder={t('مثال: الرياض / جدة', 'e.g. Riyadh')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الحي', 'District')} *</label>
                          <input required type="text" value={details.area || ''} onChange={(e) => updateField('area', e.target.value)} placeholder={t('مثال: حي النرجس', 'e.g. Al Narjis')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الشارع', 'Street')} *</label>
                          <input required type="text" value={details.street || ''} onChange={(e) => updateField('street', e.target.value)} placeholder={t('اسم الشارع', 'Street')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('رقم المبنى', 'Building No.')}</label>
                          <input type="text" value={details.building || ''} onChange={(e) => updateField('building', e.target.value)} placeholder="1234" className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                      </div>
                    )}

                    {details.country === 'AE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الإمارة', 'Emirate')}</label>
                          <select 
                            value={details.emirate}
                            onChange={(e) => updateField('emirate', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy"
                          >
                            {UAE_EMIRATES.map(em => (
                              <option key={em.en} value={em[language]}>{em[language]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المنطقة', 'Area')} *</label>
                          <input required type="text" value={details.area || ''} onChange={(e) => updateField('area', e.target.value)} placeholder={t('مثال: مارينا', 'e.g. Marina')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('الشارع والمبنى', 'Street & Building')} *</label>
                          <input required type="text" value={details.street || ''} onChange={(e) => updateField('street', e.target.value)} placeholder={t('اسم الشارع ورقم البرج', 'Street & Tower')} className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                      </div>
                    )}

                    {['US', 'GB', 'CA', 'AU', 'OTHER', 'QA', 'BH', 'OM'].includes(details.country) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('المدينة', 'City')} *</label>
                          <input required type="text" value={details.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder="City" className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">{t('العنوان التفصيلي', 'Street Address')} *</label>
                          <input required type="text" value={details.street || ''} onChange={(e) => updateField('street', e.target.value)} placeholder="Street address, building, apt" className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold text-brand-navy" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] border border-white shadow-2xl space-y-6 sticky top-24">
            <h3 className="text-xl font-black text-brand-navy border-b border-gray-100 pb-4 flex items-center justify-between">
              <span>{t('ملخص الطلب', 'Order Summary')}</span>
              <span className="text-xs font-black text-brand-orange uppercase tracking-wider">{details.countryName}</span>
            </h3>

            {/* Story Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500">{t('بطل القصة', 'Story Hero')}</span>
                <span className="font-black text-brand-navy">{storyData.childName || 'Little Hero'}</span>
              </div>

              {storyData.useSecondCharacter && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-teal">👥 {t('بطل ثانٍ مضاف', 'Second Hero Added')}</span>
                  <span className="font-bold text-brand-teal">
                    {planType === 'one_time' ? '+' + convertPrice(1.500, currency) : t('مجاناً ✨', 'FREE ✨')}
                  </span>
                </div>
              )}

              {storyData.isCustomTheme && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-coral">🎉 {t('تخصيص مناسبة خاصة', 'Special Event Customization')}</span>
                  <span className="font-bold text-brand-coral">
                    {planType === 'one_time' ? '+' + convertPrice(0.500, currency) : t('مجاناً 🎁', 'FREE 🎁')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500">{t('الباقة المختارة', 'Plan')}</span>
                <span className="font-black text-brand-navy">
                  {planType === 'one_time' ? t('قصة واحدة', 'Single Book') : (planType === 'monthly' ? t('الباقة الشهرية', 'Monthly Club') : t('الباقة السنوية', 'Yearly Club'))}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500">{t('النسخة الرقمية', 'Digital Softcopy')}</span>
                <span className="font-black text-brand-navy">{convertPrice(pricing.currentDigital, currency)}</span>
              </div>

              {isPhysicalAddon && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-500">
                      {t('المطبوعة الفاخرة', 'HD Hardcover Print')} ({physicalBookCount}x)
                      {pricing.isYearlySubscriber && <span className="text-brand-teal text-xs block">{t('(خصم 15% للباقة السنوية)', '(15% Yearly Discount)')}</span>}
                    </span>
                    <span className="font-black text-brand-teal">+{convertPrice(pricing.physical, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-500">
                      {shippingMethod === 'express' 
                        ? t('الشحن والتوصيل (سريع ⚡)', 'Shipping (Express ⚡)') 
                        : t('الشحن والتوصيل (قياسي)', 'Shipping (Standard)')}
                    </span>
                    <span className="font-black text-brand-teal">
                      {pricing.shipping === 0 ? t('مجاناً 🎉', 'FREE 🎉') : '+' + convertPrice(pricing.shipping, currency)}
                    </span>
                  </div>
                </>
              )}

              {/* Gift Options in Summary */}
              {isPhysicalAddon && isGiftWrapping && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100">
                  <span className="font-bold text-brand-coral">🎁 {t('تغليف هدايا فاخر', 'Gift Wrapping')}</span>
                  <span className="font-black text-brand-coral">+{convertPrice(2.000, currency)}</span>
                </div>
              )}
              {isPhysicalAddon && isGiftCard && (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-bold text-brand-teal">💌 {t('بطاقة إهداء مخصصة', 'Gift Card')}</span>
                  <span className="font-black text-brand-teal">+{convertPrice(0.500, currency)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-baseline">
              <div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">{t('الإجمالي النهائي', 'Total Price')}</span>
                <span className="text-[10px] text-gray-400 font-bold">
                  {planType === 'monthly' ? t('يتجدد شهرياً - إلغاء بأي وقت', 'Renews monthly - Cancel anytime') : (planType === 'yearly' ? t('دفعة سنوية لـ 12 كتاباً', 'Annual payment for 12 books') : t('دفعة لمرة واحدة', 'One-time payment'))}
                </span>
              </div>
              <span className="text-3xl font-black text-brand-coral">{convertPrice(pricing.total, currency)}</span>
            </div>

            <Button 
              type="submit" 
              form="checkout-form"
              className="w-full py-4 text-base font-black rounded-2xl shadow-xl shadow-brand-coral/20 bg-brand-coral hover:bg-[#e07b40] text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('متابعة إلى الدفع ➔', 'Proceed to Payment ➔')}</span>
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400 text-center">
              <span className="material-symbols-outlined text-sm text-green-600">lock</span>
              <span>{t('دفع آمن 100% عبر كي نت وبطاقات الدفع', '100% Secure Checkout via KNET & Cards')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Club Discount Intercept Modal (Opens when user submits Single Book order - Pushes to Yearly Club) */}
      <AnimatePresence>
        {showUpsellModal && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setShowUpsellModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-gray-100 text-center space-y-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-brand-orange to-brand-coral text-white rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-brand-orange/30 animate-bounce">
                👑
              </div>

              {(() => {
                const currentOrderTotal = pricing.total;

                return (
                  <>
                    <div className="space-y-2">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        {t('وفر 50% لكل كتاب 👑', 'Save 50% Per Book 👑')}
                      </span>
                      <h3 className="text-2xl font-black text-brand-navy">
                        {t('عرض خاص: افتح الباقة السنوية ووفّر 50%!', 'Special Offer: Unlock Yearly Club & Save 50%!')}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                        {t(
                          'بدلاً من دفع ' + convertPrice(currentOrderTotal, currency) + ' لقصة واحدة فقط، احصل على 12 قصة مخصصة طوال العام بسعر ' + convertPrice(pricing.yearlyPerBook, currency) + ' فقط للكتاب (إجمالي ' + convertPrice(pricing.yearlyTotal, currency) + ' سنوياً) مع بطل ثانٍ ومناسبات مجاناً وخصم 15% على المطبوعة الفاخرة!',
                          'Instead of paying ' + convertPrice(currentOrderTotal, currency) + ' for just 1 story, get 12 custom storybooks for only ' + convertPrice(pricing.yearlyPerBook, currency) + '/book (' + convertPrice(pricing.yearlyTotal, currency) + '/yr) with FREE 2nd hero & events + 15% OFF print!'
                        )}
                      </p>
                    </div>

                    {/* Comparison Box */}
                    <div className="grid grid-cols-2 gap-3 text-left rtl:text-right">
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 block">{t('طلبك الحالي', 'Your Order')}</span>
                        <span className="text-xs font-black text-brand-navy block">{t('قصة واحدة فقط', 'Single Story (1 Book)')}</span>
                        <span className="text-lg font-black text-gray-600 block">{convertPrice(currentOrderTotal, currency)}</span>
                        <span className="text-[9px] text-gray-400 block">{t('شراء لمرة واحدة', 'One-time payment')}</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-brand-coral space-y-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-brand-coral block">{t('الباقة السنوية 👑', 'Yearly Club 👑')}</span>
                          <span className="bg-brand-coral text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{t('وفر 50%', 'SAVE 50%')}</span>
                        </div>
                        <span className="text-xs font-black text-brand-navy block">{t('12 قصة (كتاب كل شهر)', '12 Books (1/Month)')}</span>
                        <span className="text-lg font-black text-brand-coral block">{convertPrice(pricing.yearlyPerBook, currency)} <span className="text-xs text-gray-400 font-bold">{t('/للكتاب', '/book')}</span></span>
                        <span className="text-[9px] font-bold text-emerald-700 block">{t('تدفع ' + convertPrice(pricing.yearlyTotal, currency) + ' سنوياً + مزايا مجانية', 'Billed ' + convertPrice(pricing.yearlyTotal, currency) + '/yr + Free Perks')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                      <Button 
                        onClick={() => {
                          setShowUpsellModal(false);
                          setPlanType('yearly');
                          proceedDirectly('yearly');
                        }}
                        className="w-full py-4 text-sm font-black rounded-2xl shadow-xl bg-brand-coral hover:bg-[#e07b40] text-white cursor-pointer"
                      >
                        {t('👑 الترقية للباقة السنوية وتوفير 50% (موصى به)', '👑 Upgrade to Yearly Club & Save 50% (Recommended)')}
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUpsellModal(false);
                          proceedDirectly('one_time');
                        }}
                        className="w-full py-2 text-xs font-bold text-gray-400 hover:text-brand-navy transition-colors cursor-pointer"
                      >
                        {t('لا شكراً، المتابعة بالطلب الحالي (' + convertPrice(currentOrderTotal, currency) + ')', 'No thanks, continue with current order (' + convertPrice(currentOrderTotal, currency) + ')')}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutScreen;
