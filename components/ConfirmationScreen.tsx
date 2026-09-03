import React, { useState } from 'react';
import { Button } from './Button';
import type { Language, ShippingDetails, StoryData } from '../types';
import { convertPrice, type Currency } from '../services/currencyService';

interface ConfirmationScreenProps {
  orderNumber: string;
  onRestart: () => void;
  language: Language;
  shippingDetails: ShippingDetails | null;
  storyData: StoryData;
  currency: Currency;
  totalPrice: number;
  isManualPayment?: boolean;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ orderNumber, onRestart, language, shippingDetails, storyData, currency, totalPrice, isManualPayment = false }) => {
  const [copied, setCopied] = useState(false);
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const storyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?story=${encodeURIComponent(orderNumber)}`;

  React.useEffect(() => {
    // Track Purchase event on mount
    import('../utils/analytics').then(({ trackPixelEvent }) => {
      trackPixelEvent('Purchase', {
        value: totalPrice,
        currency: currency,
        content_name: storyData?.title || 'Storybook',
        content_ids: [orderNumber],
        content_type: 'product'
      });
    });
  }, [orderNumber, totalPrice, currency, storyData]);

  const planLabel = {
    one_time: t('قصة واحدة لمرة واحدة', 'Single Storybook'),
    monthly: t('الباقة الشهرية', 'Monthly Subscription'),
    yearly: t('الباقة السنوية', 'Yearly Subscription')
  }[storyData.planType || 'one_time'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full p-4" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Glassmorphism Card */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-8 sm:p-10 shadow-2xl max-w-2xl w-full text-center space-y-6 animate-enter-forward">

        {isManualPayment ? (
          /* Manual Payment: Amber Link Icon */
          <div className="w-24 h-24 bg-[#FFF9F0] border-2 border-[#F78F50]/20 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <span className="material-symbols-outlined text-4xl text-brand-orange">link</span>
          </div>
        ) : (
          /* Paid Confirmation: Green Checkmark */
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-brand-navy">
            {isManualPayment ? t('تم تسجيل طلبك بنجاح! 🎉', 'Order Registered Successfully! 🎉') : t('شكراً لك! تم استلام طلبك بنجاح 🎉', 'Thank You! Order Received 🎉')}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {isManualPayment 
              ? t('سنرسل لك رابط دفع بنكي مخصص عبر الواتساب لتأكيد طلبك وبدء الإنتاج.', 'We will send a direct bank payment link to your WhatsApp/SMS to activate your order and begin production.')
              : t('طلبك قيد الإنتاج والتنفيذ وسنوافيك بالتفاصيل أولاً بأول.', 'Your custom storybook is being crafted and you will receive regular updates.')
            }
          </p>
        </div>

        {/* Order Summary Box */}
        <div className="bg-[#FFF9F0] border border-[#F78F50]/15 rounded-2xl p-6 text-left rtl:text-right space-y-3 shadow-inner">
          <div className="flex justify-between items-center pb-2 border-b border-[#F78F50]/10">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('رقم الطلب', 'Order Number')}</span>
            <span className="text-lg font-black text-brand-navy font-mono">{orderNumber}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-600">{t('الباقة المختارة', 'Selected Plan')}</span>
            <span className="font-black text-brand-navy">{planLabel}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-600">{t('المبلغ الإجمالي', 'Total Amount')}</span>
            <span className="font-black text-brand-coral">{convertPrice(totalPrice, currency)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-600">{t('حالة الطلب', 'Order Status')}</span>
            <span className={`font-bold px-3 py-1 rounded-full text-xs ${
              isManualPayment ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
            }`}>
              {isManualPayment ? t('بانتظار إرسال رابط الدفع', 'Awaiting Payment Link') : t('مدفوع وقيد التنفيذ', 'Paid & Processing')}
            </span>
          </div>
        </div>

        {/* Magical Craftsmanship Notice */}
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl space-y-2 max-w-md mx-auto text-center shadow-sm">
          <div className="text-2xl animate-bounce">🎨✨</div>
          <h4 className="text-sm font-black text-brand-navy">
            {t(`نحن نصنع قصة فريدة خصيصاً لبطلكم ${storyData.childName || ''}!`, `We are crafting a custom adventure specially for ${storyData.childName || 'your hero'}!`)}
          </h4>
          <p className="text-xs text-brand-navy/70 leading-relaxed font-medium">
            {t(
              'كل رسمة وصفحة يتم إنشاؤها وتلوينها بعناية فائقة. الإتقان والإبداع يحتاج بضع لحظات ليخرج بالصورة الأجمل.',
              'Every spread and illustration is being customized with care. Magical craftsmanship takes a few moments to make it truly unforgettable.'
            )}
          </p>
        </div>

        {/* Public Share Story Card */}
        <div className="p-5 bg-white/80 border border-brand-orange/20 rounded-3xl space-y-3 max-w-md mx-auto text-center shadow-md">
          <p className="text-xs font-black text-brand-orange uppercase tracking-wider">
            {t('✨ شارك القصة مع العائلة والأصدقاء', '✨ Share Story with Family & Friends')}
          </p>
          <p className="text-xs text-brand-navy/70 leading-relaxed">
            {t('يمكن لأي شخص قراءة القصة وتصفح صفحاتها مجاناً بدون تسجيل الدخول 📖', 'Anyone with the link can flip through and read the story for free without logging in 📖')}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const text = encodeURIComponent(
                  t(
                    `✨ اقرأ قصة "${storyData?.title || 'طفلي'}" المخصصة على راوي 📖:\n${storyUrl}`,
                    `✨ Read my child's custom storybook "${storyData?.title || 'Personalized'}" on Rawy 📖:\n${storyUrl}`
                  )
                );
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.75 13.96c.27.42.36.94.11 1.46l-.11.23c-.27.53-.76 1.03-1.24 1.22-.49.19-1.22.38-1.7.19-.48-.19-1.34-.67-2.3-1.14-.95-.48-2.02-1.34-2.82-2.3-1.05-1.24-1.52-2.67-1.43-3.72.09-1.05.67-1.81 1.24-2.19.58-.38 1.22-.58 1.7-.58.26 0 .51.1.75.29l.11.09c.49.48.58 1.22.58 1.46 0 .23-.09.48-.28.72l-.11.13c-.23.28-.47.52-.47.62 0 .09.1.18.28.37.19.19.38.37.67.66.28.28.47.47.76.76.28.28.47.47.56.47.09 0 .28-.19.56-.47.28-.28.47-.47.47-.47.23-.28.47-.47.75-.47.28 0 .57.09.76.19zM12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(storyUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                } catch (e) {
                  prompt(t('انسخ الرابط:', 'Copy link:'), storyUrl);
                }
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                copied ? 'bg-emerald-600 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? t('تم النسخ!', 'Copied!') : t('نسخ الرابط', 'Copy Link')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          {!isManualPayment && (
            <Button onClick={async () => {
              try {
                // @ts-ignore
                const fileService = await import('../services/fileService');
                const blob = await fileService.generatePrintPackage(storyData, shippingDetails || {} as any, language, orderNumber);
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Order_${orderNumber}_Package.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (e) { alert('Download failed: ' + e); }
            }} className="text-base px-8 py-3.5 bg-brand-orange hover:bg-brand-coral rounded-2xl shadow-lg w-full sm:w-auto">
              {t('⬇ تنزيل الملفات', '⬇ Download Files')}
            </Button>
          )}
          
          <Button onClick={onRestart} className="text-base px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl w-full sm:w-auto bg-brand-navy hover:bg-brand-navy/90 text-white">
            {t('صنع قصة جديدة', 'Create a New Story')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;
