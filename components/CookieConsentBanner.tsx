import React, { useState, useEffect } from 'react';
import type { Language } from '../types';

interface CookieConsentBannerProps {
  language: Language;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ language }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('rawy_cookie_consent');
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      } else if (consent === 'accepted') {
        if (typeof (window as any).initMetaPixel === 'function') {
          (window as any).initMetaPixel();
        }
      }
    } catch (e) {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('rawy_cookie_consent', 'accepted');
    } catch (e) {}
    setIsVisible(false);
    if (typeof (window as any).initMetaPixel === 'function') {
      (window as any).initMetaPixel();
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('rawy_cookie_consent', 'declined');
    } catch (e) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 inset-x-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md z-50 bg-white/95 backdrop-blur-xl border border-brand-navy/10 rounded-3xl p-5 shadow-2xl transition-all duration-300 animate-enter-forward"
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 text-xl font-bold">
          🍪
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-sm font-black text-brand-navy">
            {t('خصوصيتك تهمنا', 'Your Privacy Matters')}
          </h4>
          <p className="text-xs text-brand-navy/70 leading-relaxed font-medium">
            {t(
              'نستخدم ملفات تعريف الارتباط الأساسية لتشغيل راوي وملفات اختيارية لتحسين تجربتك وفقاً لـ ',
              'We use essential cookies to operate Rawy and optional analytics to enhance your experience per our '
            )}
            <a
              href="/policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange hover:underline font-bold"
            >
              {t('سياسة الخصوصية', 'Privacy Policy')}
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-brand-navy/5 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={handleDecline}
          className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-brand-navy hover:bg-gray-100 transition-colors"
        >
          {t('الضرورية فقط', 'Essential Only')}
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="px-5 py-2 rounded-xl text-xs font-black bg-brand-navy hover:bg-brand-orange text-white shadow-md transition-all"
        >
          {t('قبول الكل', 'Accept All')}
        </button>
      </div>
    </aside>
  );
};
