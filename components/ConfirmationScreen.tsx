import React from 'react';
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

  const handleSendEmail = async () => {
    if (!shippingDetails || !storyData) return;

    const planLabel = {
      one_time: t('شراء لمرة واحدة', 'A La Carte'),
      monthly: t('الباقة الشهرية', 'Monthly Subscription'),
      yearly: t('الباقة السنوية', 'Yearly Subscription')
    }[storyData.planType || 'one_time'];

    const subject = isManualPayment
      ? t(`تأكيد حجز طلب Rawy رقم ${orderNumber} - بانتظار رابط الدفع`, `Reservation Confirmation for Rawy Order #${orderNumber} - Awaiting Payment Link`)
      : t(`فاتورة وتأكيد طلب Rawy رقم ${orderNumber}`, `Invoice & Confirmation for Rawy Order #${orderNumber}`);

    const body = `
${t('شكراً لطلبك من Rawy!', 'Thank you for your order from Rawy!')}

${isManualPayment 
  ? t('تم تسجيل طلبك بنجاح! سنرسل لك رابط دفع بنكي مخصص قريباً لتفعيل طلبك وبدء الإنتاج.', 'Your order has been registered successfully! We will send you a custom bank payment link shortly to activate your order and begin production.')
  : t('هذا ملخص لطلبك وفاتورك.', 'Here is a summary of your order and invoice.')}

----------------------------------------
${t('تفاصيل الطلب', 'ORDER DETAILS')}
----------------------------------------
${t('رقم الطلب:', 'Order Number:')} ${orderNumber}
${t('الخطة:', 'Plan:')} ${planLabel}
${t('الحالة:', 'Status:')} ${isManualPayment ? t('بانتظار رابط الدفع', 'Awaiting Payment Link') : t('مؤكد ومدفوع', 'Confirmed & Paid')}
${t('تاريخ الطلب:', 'Order Date:')} ${new Date().toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US')}

${storyData.isPhysicalPrint ? `
----------------------------------------
${t('بيانات الشحن', 'SHIPPING TO')}
----------------------------------------
${shippingDetails.name}
${shippingDetails.address}, ${shippingDetails.city}
${shippingDetails.phone}
` : ''}

----------------------------------------
${t('الفاتورة', 'INVOICE')}
----------------------------------------
- ${planLabel}: ${convertPrice(totalPrice, currency)}
----------------------------------------

${t('فريق Rawy', 'The Rawy Team')}
`;

    window.location.href = `mailto:${shippingDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full p-4" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Glassmorphism Card */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-10 shadow-2xl max-w-2xl w-full text-center space-y-8 animate-enter-forward">

        {isManualPayment ? (
          /* Manual Payment: Amber Link Icon */
          <div className="w-28 h-28 bg-[#FFF9F0] border-2 border-[#F78F50]/20 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <span className="material-symbols-outlined text-5xl text-brand-orange">link</span>
          </div>
        ) : (
          /* Paid Confirmation: Green Checkmark */
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">
            {isManualPayment ? t('تم تسجيل طلبك!', 'Order Registered!') : t('شكرًا لك!', 'Thank you!')}
          </h2>
          <p className="text-lg text-brand-navy/80 max-w-md mx-auto leading-relaxed">
            {isManualPayment 
              ? t(
                  'تم حفظ تفاصيل قصتك بنجاح! سنقوم بمراجعة الطلب وإرسال رابط دفع مخصص إليك عبر الواتساب أو الإيميل قريباً لبدء عملية التصميم والطباعة.',
                  'Your story details are saved! We will review the order and manually send you a payment link via WhatsApp or email shortly to begin creation and printing.'
                )
              : t(
                  'تم استلام طلبك ودفعك بنجاح! جاري تحضير ملفات الطباعة السحرية وتوليد رسومات طفلك.',
                  'Your payment and order have been received successfully! We are preparing your magical print layout and generating your child\'s custom drawings.'
                )
            }
          </p>
        </div>

        <div className="p-6 bg-white/70 rounded-2xl border border-white/80 shadow-inner max-w-sm mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">{t('رقم الطلب', 'Order Number')}</p>
          <p className="text-3xl font-black text-brand-coral font-mono tracking-widest">{orderNumber}</p>
        </div>

        {isManualPayment && (
          <div className="bg-[#006B5D]/5 border border-[#006B5D]/10 rounded-2xl p-4 text-sm text-[#006B5D] max-w-md mx-auto text-center font-medium leading-relaxed">
            {t(
              'ℹ️ بمجرد استلام الرابط وإتمام الدفع، سيتم تفعيل خط الإنتاج تلقائيًا وتلقي إشعارات أولاً بأول.',
              'ℹ️ Once you pay via the sent link, your order will automatically advance to production, and you will receive regular updates.'
            )}
          </div>
        )}

        {/* Public Share Story Card */}
        <div className="p-6 bg-white/80 border border-brand-orange/20 rounded-3xl space-y-3 max-w-md mx-auto text-center shadow-md">
          <p className="text-xs font-black text-brand-orange uppercase tracking-wider">
            {t('✨ شارك القصة مع العائلة والأصدقاء', '✨ Share Story with Family & Friends')}
          </p>
          <p className="text-xs text-brand-navy/70 leading-relaxed">
            {t('يمكن لأي شخص قراءة القصة وتصفح صفحاتها مجاناً بدون تسجيل الدخول 📖', 'Anyone with the link can flip through and read the story for free without logging in 📖')}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  t(
                    `✨ اقرأ قصة "${storyData?.title || 'طفلي'}" المخصصة على راوي 📖:\n${storyUrl}`,
                    `✨ Read my child's custom storybook "${storyData?.title || 'Personalized'}" on Rawy 📖:\n${storyUrl}`
                  )
                );
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.75 13.96c.27.42.36.94.11 1.46l-.11.23c-.27.53-.76 1.03-1.24 1.22-.49.19-1.22.38-1.7.19-.48-.19-1.34-.67-2.3-1.14-.95-.48-2.02-1.34-2.82-2.3-1.05-1.24-1.52-2.67-1.43-3.72.09-1.05.67-1.81 1.24-2.19.58-.38 1.22-.58 1.7-.58.26 0 .51.1.75.29l.11.09c.49.48.58 1.22.58 1.46 0 .23-.09.48-.28.72l-.11.13c-.23.28-.47.52-.47.62 0 .09.1.18.28.37.19.19.38.37.67.66.28.28.47.47.76.76.28.28.47.47.56.47.09 0 .28-.19.56-.47.28-.28.47-.47.47-.47.23-.28.47-.47.75-.47.28 0 .57.09.76.19zM12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(storyUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                } catch (e) {
                  prompt(t('انسخ الرابط:', 'Copy link:'), storyUrl);
                }
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? t('تم النسخ!', 'Copied!') : t('نسخ الرابط', 'Copy Link')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {!isManualPayment && (
            <Button onClick={async () => {
              // Manual Download Trigger
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
            }} className="text-lg px-8 py-3 bg-brand-orange hover:bg-brand-coral rounded-xl shadow-lg w-full sm:w-auto animate-pulse">
              {t('⬇ تنزيل الملفات', '⬇ Download Files')}
            </Button>
          )}

          {shippingDetails?.email && (
            <Button onClick={handleSendEmail} variant="outline" className="text-lg px-8 py-3 bg-white/50 border-white hover:bg-white rounded-xl w-full sm:w-auto">
              {isManualPayment ? t('أرسل تفاصيل الحجز بالإيميل', 'Send Reservation via Email') : t('أرسل الفاتورة بالإيميل', 'Send Invoice via Email')}
            </Button>
          )}
          
          <Button onClick={onRestart} className="text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl w-full sm:w-auto bg-gray-800 hover:bg-black">
            {t('صنع قصة جديدة', 'Create a New Story')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;