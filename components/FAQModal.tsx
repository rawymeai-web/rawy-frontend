import React, { useState } from 'react';
import type { Language } from '../types';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose, language }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const faqs = [
    {
      q: t('كيف تصنع راوي قصة مخصصة لطفلي؟', 'How does Rawy create a personalized story for my child?'),
      a: t(
        'تقوم تقنية راوي الذكية بتحليل ملامح طفلك من الصورة التي ترفعها، ثم تحويله إلى بطل مرسوم بأسلوب فني ساحر (مثل الألوان المائية أو الرسوم الكرتونية ثلاثية الأبعاد) ودمجه كبطل رئيسي في حبكة قصصية هادفة وممتعة تناسب عمره.',
        'Rawy uses state-of-the-art AI to transform your child\'s photo into a beautifully stylized storybook hero (Watercolor, 3D animated, Gouache, etc.) and seamlessly weaves them into an engaging, age-appropriate educational adventure.'
      )
    },
    {
      q: t('كم يستغرق تجهيز القصة والتوصيل؟', 'How long does creation and delivery take?'),
      a: t(
        'النسخة الرقمية الفورية (PDF عالي الدقة): تكون جاهزة للتصفح والتنزيل في دقائق معدودة. النسخة المطبوعة الفاخرة (Hardcover): تستغرق الطباعة والتجليد الاحترافي من 2 إلى 4 أيام عمل، ويتم التوصيل داخل الكويت والخليج خلال 2 - 5 أيام.',
        'Digital Softcopy (HD Interactive): Ready in minutes for immediate reading and download. Premium Hardcover Print: Professional 12-color printing and binding takes 2-4 business days, with doorstep delivery across Kuwait and the GCC in 2-5 days.'
      )
    },
    {
      q: t('ما هي طرق الدفع المتاحة؟', 'What payment methods are available?'),
      a: t(
        'نوفر الدفع المباشر عبر رابط رسمي آمن يدعم كي نت (KNET)، أبل باي (Apple Pay)، وفيزا / ماستركارد. بمجرد تأكيد طلبك، نرسل لك رابط الدفع المباشر على الواتساب أو الرسائل القصيرة.',
        'We support secure instant payment links for KNET, Apple Pay, Visa, and MasterCard. Once you place an order, you\'ll receive a direct payment link on WhatsApp or SMS.'
      )
    },
    {
      q: t('هل يمكنني إضافة طفلين في نفس القصة؟', 'Can I include two children in the same book?'),
      a: t(
        'نعم بكل تأكيد! يمكنك تفعيل خيار "إضافة بطل ثانٍ" ليشارك الأخوان أو الأصدقاء البطولة والمغامرة سوياً في جميع صفحات القصة.',
        'Absolutely! You can enable the "Add Second Hero" feature so siblings or best friends can star together as dual protagonists across all pages.'
      )
    },
    {
      q: t('ما هي جودة النسخة المطبوعة الفاخرة؟', 'What is the quality of the Hardcover Edition?'),
      a: t(
        'تتم طباعة كتب راوي بدعم وتصنيع من Albumii باستخدام أحدث طابعات HD بـ 12 لوناً، على ورق مقوى غير لامع يحمي عيون الأطفال ومقاوم للبصمات، مع تجليد فندقي فاخر بغلاف مقوى يدوم لسنوات طويلة.',
        'Rawy books are manufactured with Albumii\'s premium photobook technology using 12-color HD archival inks, glare-free child-safe matte pages, and heirloom-grade hardcover binding built to last a lifetime.'
      )
    },
    {
      q: t('هل يمكنني تعديل القصة قبل الطباعة؟', 'Can I preview and edit the story before ordering?'),
      a: t(
        'نعم! يتيح لك تطبيق راوي تصفح القصة بالكامل صفحة بصفحة، وتعديل النصوص، واختيار أسلوب الرسم المفضل قبل الدفع وتأكيد الطباعة.',
        'Yes! You can flip through every single page in full interactive 3D, customize the text, and choose your favorite illustration style before finalizing your order.'
      )
    }
  ];

  return (
    <div
      className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-10 w-full max-w-2xl border border-gray-100 my-8 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-2xl">
              💡
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-navy">
                {t('الأسئلة الشائعة', 'Frequently Asked Questions')}
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                {t('كل ما تحتاج لمعرفته عن راوي', 'Everything You Need to Know')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-brand-navy transition-colors text-3xl font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-6 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all ${
                  isOpen ? 'border-brand-orange bg-orange-50/30 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left rtl:text-right gap-4 cursor-pointer"
                >
                  <span className="font-black text-brand-navy text-sm sm:text-base leading-snug">
                    {faq.q}
                  </span>
                  <span className={`material-symbols-outlined text-brand-orange transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-brand-navy/80 leading-relaxed font-medium pt-1 border-t border-brand-orange/10">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Close */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl text-sm font-black transition-all cursor-pointer"
          >
            {t('إغلاق', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
