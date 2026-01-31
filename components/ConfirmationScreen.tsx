import React from 'react';
import { Button } from './Button';
import type { Language, ShippingDetails, StoryData } from '../types';
import { getProductSizeById } from '../services/adminService';
import { convertPrice, type Currency } from '../services/currencyService';

interface ConfirmationScreenProps {
  orderNumber: string;
  onRestart: () => void;
  language: Language;
  shippingDetails: ShippingDetails | null;
  storyData: StoryData;
  currency: Currency;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ orderNumber, onRestart, language, shippingDetails, storyData, currency }) => {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSendEmail = async () => {
    if (!shippingDetails || !storyData) return;

    const productConfig = await getProductSizeById(storyData.size);
    const basePrice = productConfig ? productConfig.price : 29.900;
    const shippingPrice = 1.500; // Updated shipping price
    const totalPrice = basePrice + shippingPrice;
    const bookTitle = t('كتاب أطفال مخصص', 'Custom Children\'s Book') + ` (${storyData.size})`;

    const subject = t(`فاتورة وتأكيد طلب Rawy رقم ${orderNumber}`, `Invoice & Confirmation for Rawy Order #${orderNumber}`);

    const body = `
${t('شكراً لطلبك من Rawy!', 'Thank you for your order from Rawy!')}

${t('هذا ملخص لطلبك وفاتورتك.', 'Here is a summary of your order and invoice.')}

----------------------------------------
${t('تفاصيل الطلب', 'ORDER DETAILS')}
----------------------------------------
${t('رقم الطلب:', 'Order Number:')} ${orderNumber}
${t('تاريخ الطلب:', 'Order Date:')} ${new Date().toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US')}

----------------------------------------
${t('بيانات الشحن', 'SHIPPING TO')}
----------------------------------------
${shippingDetails.name}
${shippingDetails.address}, ${shippingDetails.city}
${shippingDetails.phone}

----------------------------------------
${t('الفاتورة', 'INVOICE')}
----------------------------------------
- ${bookTitle}: ${convertPrice(basePrice, currency)}
- ${t('الشحن:', 'Shipping:')} ${convertPrice(shippingPrice, currency)}

${t('الإجمالي:', 'Total:')} ${convertPrice(totalPrice, currency)}
----------------------------------------

${t('نتمنى أن تستمتعوا بالقصة!', 'We hope you enjoy the story!')}

${t('فريق Rawy', 'The Rawy Team')}
`;

    window.location.href = `mailto:${shippingDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full p-4">
      {/* Glassmorphism Card */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-10 shadow-2xl max-w-2xl w-full text-center space-y-8 animate-enter-forward">

        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path></svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('شكرًا لك!', 'Thank you!')}</h2>
          <p className="text-xl text-brand-navy/70 max-w-md mx-auto">
            {t('تم استلام طلبك بنجاح! جاري تحضير ملفات الطباعة السحرية.', 'Your order has been received! Preparing your magical print files.')}
          </p>
        </div>

        <div className="p-6 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">{t('رقم الطلب', 'Order Number')}</p>
          <p className="text-3xl font-black text-brand-coral font-mono tracking-widest">{orderNumber}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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

          {shippingDetails?.email && (
            <Button onClick={handleSendEmail} variant="outline" className="text-lg px-8 py-3 bg-white/50 border-white hover:bg-white rounded-xl w-full sm:w-auto">
              {t('أرسل الفاتورة بالإيميل', 'Send Invoice via Email')}
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