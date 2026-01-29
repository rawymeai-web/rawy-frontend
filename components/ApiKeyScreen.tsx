
import React from 'react';
import { Button } from './Button';
import type { Language } from '../types';

interface ApiKeyScreenProps {
  onContinue: () => void;
  language: Language;
}

const ApiKeyScreen: React.FC<ApiKeyScreenProps> = ({ onContinue, language }) => {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Per instructions, assume success after triggering openSelectKey
      onContinue();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-center py-10">
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-10 shadow-2xl space-y-6 animate-enter-forward">
        <div className="w-20 h-20 bg-brand-baby-blue/10 rounded-full flex items-center justify-center mx-auto text-brand-navy">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-brand-navy">
          {t('مطلوب مفتاح برمجي للإنشاء', 'API Key Required for Generation')}
        </h2>
        
        <p className="text-lg text-gray-600 leading-relaxed">
          {t(
            'تستخدم راوي تقنيات ذكاء اصطناعي متقدمة لإنشاء رسوم توضيحية عالية الجودة. يتطلب هذا استخدام مفتاح برمجي خاص بك من مشروع مدفوع.',
            'Rawy uses advanced AI to generate high-fidelity illustrations. This requires using your own API key from a paid GCP project.'
          )}
        </p>

        <div className="bg-brand-navy/5 p-4 rounded-xl text-sm text-brand-navy/80 text-left space-y-2">
          <p className="font-bold">{t('ملاحظات هامة:', 'Important Notes:')}</p>
          <ul className="list-disc list-inside space-y-1 rtl:list-none rtl:space-x-reverse">
            <li>{t('يجب أن يكون المفتاح من مشروع GCP مفعل به الفوترة.', 'The key must be from a GCP project with billing enabled.')}</li>
            <li>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-coral underline font-bold">
                {t('تعرف على كيفية إعداد الفوترة والمفاتيح', 'Learn how to set up billing and keys')}
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-4 flex flex-col gap-4">
          <Button onClick={handleSelectKey} className="text-xl px-12 py-4 shadow-xl hover:shadow-brand-coral/40 transition-all">
            {t('ربط مفتاح API الخاص بي', 'Connect My API Key')}
          </Button>
          <p className="text-xs text-gray-400 italic">
            {t('سيتم تخزين المفتاح في متصفحك فقط لاستخدام Gemini Pro.', 'The key is stored only in your browser for Gemini Pro usage.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyScreen;
