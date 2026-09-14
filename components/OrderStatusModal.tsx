
import React, { useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import type { Language, AdminOrder } from '../types';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({ isOpen, onClose, language }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundOrder, setFoundOrder] = useState<AdminOrder | null>(null);

  if (!isOpen) return null;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFoundOrder(null);

    try {
      const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || t('لم يتم العثور على طلب مطابق. يرجى التحقق من المعلومات والمحاولة مرة أخرى.', 'No matching order found. Please check your information and try again.'));
        return;
      }

      const data = await res.json();
      if (data.success && data.order) {
        setFoundOrder(data.order);
      } else {
        setError(t('لم يتم العثور على طلب مطابق. يرجى التحقق من المعلومات والمحاولة مرة أخرى.', 'No matching order found. Please check your information and try again.'));
      }
    } catch (err) {
      console.error(err);
      setError(t('حدث خطأ أثناء البحث.', 'An error occurred while searching.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOrderNumber('');
    setPhone('');
    setIsLoading(false);
    setError('');
    setFoundOrder(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-brand-navy">{t('التحقق من حالة الطلب', 'Check Order Status')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        {!foundOrder ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('رقم الطلب', 'Order Number')}</label>
              <input type="text" id="orderNumber" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="RWY-123456789" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('رقم الهاتف المستخدم في الطلب', 'Phone Number used in Order')}</label>
              <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="pt-2">
              <Button type="submit" className="w-full text-lg flex items-center justify-center" disabled={isLoading}>
                {isLoading ? <Spinner /> : t('بحث', 'Search')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-bold text-brand-coral">{t('حالة طلبك', 'Your Order Status')}</h3>
            <p className="text-gray-700">{t('الطلب رقم:', 'Order #:')} <span className="font-bold text-brand-navy font-mono">#{foundOrder.orderNumber}</span></p>
            
            {(() => {
              const status = foundOrder.status;
              const isSuccess = ['softcopy_ready', 'awaiting_preview_approval', 'completed', 'sent_to_print', 'printing', 'shipped', 'delivered'].includes(status);
              const isOnHold = status === 'on_hold';
              const isAction = ['processing', 'Processing', 'story_generating', 'illustrations_generating', 'book_compiling', 'blueprint_generating', 'queued', 'paid_confirmed'].includes(status);

              const statusLabels: Record<string, { ar: string; en: string; descAr: string; descEn: string }> = {
                'paid_confirmed': { ar: 'تم تأكيد الدفع والطلب 🎉', en: 'Payment Confirmed 🎉', descAr: 'تم استلام طلبك وجاري بدء التجهيز والإنتاج.', descEn: 'Order confirmed and entering production queue.' },
                'queued': { ar: 'في قائمة الإنتاج 🚀', en: 'In Production Queue 🚀', descAr: 'طلبك في قائمة الانتظار لبدء الرسم والكتابة.', descEn: 'Your story is in the queue to begin illustration and writing.' },
                'blueprint_generating': { ar: 'بناء مخطط القصة 📝', en: 'Constructing Blueprint 📝', descAr: 'نقوم ببناء عقدة القصة وشخصية طفلكم.', descEn: 'Structuring the custom narrative arc and character identity.' },
                'story_generating': { ar: 'كتابة أحداث القصة 📖', en: 'Drafting Narrative 📖', descAr: 'نقوم بصياغة النص الأدبي ومراجعته بدقة.', descEn: 'Drafting the story text and running editorial quality checks.' },
                'story_ready': { ar: 'تمت كتابة القصة ✨', en: 'Story Drafted ✨', descAr: 'تم اعتماد نص القصة وجاري تحضير الرسومات.', descEn: 'Story approved, preparing custom illustrations.' },
                'illustrations_generating': { ar: 'جاري رسم المشاهد 🎨', en: 'Painting Illustrations 🎨', descAr: 'يقوم نظامنا الآلي برسم وفحص المشاهد بمطابقة صورة طفلكم.', descEn: 'AI engine is painting and QA-inspecting character spreads.' },
                'illustrations_ready': { ar: 'الرسومات مكتملة 🖼️', en: 'Illustrations Ready 🖼️', descAr: 'اكتملت جميع الرسومات وجاري تجميع الكتاب.', descEn: 'All spreads illustrated, assembling high-res book.' },
                'book_compiling': { ar: 'تجميع وتنسيق الكتاب 📑', en: 'Binding & Compiling 📑', descAr: 'جاري تجميع الصفحات في ملف PDF عالي الجودة للطباعة.', descEn: 'Compiling high-resolution print-ready files.' },
                'softcopy_ready': { ar: 'قصتك جاهزة بالكامل! 🎉', en: 'Storybook Ready! 🎉', descAr: 'يمكنك الآن تصفح القصة وتنزيل ملف الـ PDF.', descEn: 'Your custom storybook is ready to read and download.' },
                'awaiting_preview_approval': { ar: 'القصة جاهزة للقراءة 📚', en: 'Story Ready for Reading 📚', descAr: 'القصة جاهزة للتصفح والمطالعة الفورية.', descEn: 'Story is ready for instant viewing.' },
                'sent_to_print': { ar: 'تم الإرسال للمطبعة 🖨️', en: 'Sent to Press 🖨️', descAr: 'تم إرسال النسخة الفاخرة للطباعة والتجليد.', descEn: 'Hardcover edition sent to our premium printing partner.' },
                'printing': { ar: 'جاري الطباعة والتجليد 📦', en: 'Printing in Progress 📦', descAr: 'يتم الآن طباعة وتجليد نسختكم الورقية الفاخرة.', descEn: 'Your physical book is being printed and bound.' },
                'shipped': { ar: 'تم الشحن والتسليم لشركة التوصيل 🚚', en: 'Shipped! 🚚', descAr: 'طلبك في الطريق إليكم مع شركة الشحن.', descEn: 'Package dispatched with express delivery.' },
                'delivered': { ar: 'تم التوصيل بنجاح 🏡', en: 'Delivered 🏡', descAr: 'نتمنى لكم ولطفلكم أمتع اللحظات مع القصة!', descEn: 'Package delivered! Enjoy your magical adventure.' },
                'on_hold': { ar: 'قيد المراجعة الفنية من فريق الجودة 🛡️', en: 'Under Art & Quality Review 🛡️', descAr: 'يقوم فريق الجودة الفني بالتدقيق على تفاصيل الرسم لضمان أعلى مطابقة. سنرسل لك إشعاراً فور اعتمادها.', descEn: 'Our art directors are fine-tuning the illustrations to ensure highest visual fidelity. We will notify you once approved.' },
                'failed': { ar: 'توقف مؤقت ⚠️', en: 'Paused for Review ⚠️', descAr: 'يرجى التواصل مع الدعم الفني للاستفسار أو المساعدة.', descEn: 'Please contact customer support for assistance with this order.' }
              };

              const currentInfo = statusLabels[status] || {
                ar: status,
                en: status,
                descAr: 'طلبك قيد المتابعة.',
                descEn: 'Your order is being processed.'
              };

              return (
                <div className={`p-4 rounded-xl text-center space-y-2 ${
                  isSuccess ? 'bg-emerald-50 border border-emerald-200 text-emerald-950' :
                  isOnHold ? 'bg-amber-50 border border-amber-200 text-amber-950' :
                  isAction ? 'bg-orange-50 border border-orange-200 text-brand-navy' :
                  'bg-gray-50 border border-gray-200 text-gray-900'
                }`}>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isSuccess ? 'bg-emerald-100 text-emerald-800' :
                    isOnHold ? 'bg-amber-100 text-amber-800' :
                    'bg-brand-orange/15 text-brand-orange'
                  }`}>
                    {t(currentInfo.ar, currentInfo.en)}
                  </span>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {t(currentInfo.descAr, currentInfo.descEn)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono">
                    {t('آخر تحديث:', 'Last updated:')} {new Date(foundOrder.orderDate).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => {
                  window.location.href = `/?order=${encodeURIComponent(foundOrder.orderNumber)}`;
                }} 
                className="flex-1 bg-brand-orange hover:bg-brand-coral text-white font-bold"
              >
                {t('📖 عرض ومتابعة القصة', '📖 View & Track Story')}
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                {t('إغلاق', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusModal;
