import React from 'react';
import type { Language } from '../types';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

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
            <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-2xl">
              📖✨
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-navy">
                {t('عن راوي', 'About Rawy')}
              </h2>
              <p className="text-xs text-brand-teal font-bold uppercase tracking-widest">
                {t('قصص مخصصة تُلهم الأبطال الصغار', 'Personalized Stories for Little Heroes')}
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

        {/* Content Body */}
        <div className="mt-6 space-y-5 max-h-[60vh] overflow-y-auto pr-1 text-brand-navy leading-relaxed text-sm">
          <div className="p-5 bg-gradient-to-r from-teal-50/60 to-emerald-50/60 rounded-3xl border border-teal-100/80 space-y-2">
            <h3 className="font-black text-brand-teal text-base flex items-center gap-2">
              <span>🌟 {t('رؤيتنا', 'Our Vision')}</span>
            </h3>
            <p className="text-xs sm:text-sm text-brand-navy/80 font-medium leading-relaxed">
              {t(
                'في "راوي"، نؤمن بأن كل طفل يستحق أن يشعر بأنه بطل حقيقي. نحول القراءة إلى شغف ومغامرة لا تُنسى من خلال وضع طفلك في قلب الحكاية برسمه، واسمه، وشخصيته.',
                'At Rawy, we believe every child deserves to feel like a true hero. We transform reading into an unforgettable passion by placing your child at the heart of the adventure with their own likeness, name, and personality.'
              )}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-brand-navy text-base">
              {t('لماذا يختار الآباء راوي؟', 'Why Parents Love Rawy?')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xl block">🎨</span>
                <h4 className="font-black text-xs text-brand-navy">{t('فن ساحر وهادف', 'Magical Artistry')}</h4>
                <p className="text-[11px] text-gray-500">{t('أساليب فنية عالمية متقنة بألوان غنية تناسب خيال الأطفال.', 'Archival artistic styles with vibrant palettes that ignite young imaginations.')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xl block">📚</span>
                <h4 className="font-black text-xs text-brand-navy">{t('قيم وقصص ملهمة', 'Inspiring Values')}</h4>
                <p className="text-[11px] text-gray-500">{t('حبكات تعزز الشجاعة، التعاون، الفضول العلمي، وحب الاستكشاف.', 'Plots crafted to foster courage, teamwork, curiosity, and empathy.')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xl block">🖨️</span>
                <h4 className="font-black text-xs text-brand-navy">{t('صناعة وطباعة Albumii', 'Powered by Albumii')}</h4>
                <p className="text-[11px] text-gray-500">{t('طباعة فاخرة بـ 12 لوناً وتجليد مقوى يدوم لأجيال.', 'High-definition 12-color archival printing with heirloom hardcover binding.')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xl block">⚡</span>
                <h4 className="font-black text-xs text-brand-navy">{t('تصفح فوري وسريع', 'Instant Digital Preview')}</h4>
                <p className="text-[11px] text-gray-500">{t('تصفح كتابك الرقمي التفاعلي بالكامل وشاركه مع العائلة.', 'Flip through your complete storybook in 3D and share with loved ones.')}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/50 text-xs text-amber-900 font-medium text-center">
            {t(
              '❤️ صُنع بكل حب في الكويت والخليج بواسطة فريق Albumii & Rawy.',
              '❤️ Crafted with love in Kuwait & the GCC by the Albumii & Rawy team.'
            )}
          </div>
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
