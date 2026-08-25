import React, { useState } from 'react';
import { Logo } from './Logo';
import { Button } from './Button';
import { CurrencySelector } from './CurrencySelector';
import type { Language } from '../types';
import type { Currency } from '../services/currencyService';

interface HeaderProps {
  onAdminLoginClick?: () => void;
  onMyOrdersClick: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  onCurrencyChange: (currencyCode: string) => void;
  onOpenRegionModal?: () => void;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  ar: 'عربي',
  en: 'EN',
  de: 'DE',
  tr: 'TR',
  zh: '中文',
  ja: 'JA',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  ru: 'RU'
};

const Header: React.FC<HeaderProps> = ({
  onAdminLoginClick,
  onMyOrdersClick,
  language,
  setLanguage,
  currency,
  onCurrencyChange,
  onOpenRegionModal
}) => {
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 5) {
      onAdminLoginClick?.();
      setLogoClicks(0);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full py-3 bg-white/70 backdrop-blur-xl saturate-180 border-b border-white/20 border-t border-t-white/35 shadow-[0_2px_12px_rgba(0,0,0,0.015)] transition-all duration-300 header-blur">
      <div className="flex items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">

        {/* Logo with Secret Admin Trigger */}
        <div
          onClick={handleLogoClick}
          className={`cursor-pointer transition-transform active:scale-95 ${language === 'ar' ? 'order-last' : 'order-first'}`}
          title="Rawy Admin (Tap 5 times)"
        >
          <Logo />
        </div>

        {/* Controls */}
        <div className={`flex items-center gap-2.5 sm:gap-4 ${language === 'ar' ? 'order-first' : 'order-last'}`}>

          {/* Regional & Language Modal Trigger Button */}
          <button
            onClick={onOpenRegionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 hover:bg-amber-100/80 border border-gray-200/60 hover:border-amber-300 transition-all text-xs font-black text-brand-navy shadow-sm group"
            title="Change Country, Language & Currency"
          >
            <span className="text-sm">🌐</span>
            <span>{LANGUAGE_LABELS[language] || 'EN'}</span>
            <span className="text-gray-300">·</span>
            <span className="text-brand-orange">{currency.code}</span>
            <span className="material-symbols-outlined text-xs text-brand-navy/40 group-hover:text-brand-orange transition-colors">expand_more</span>
          </button>

          {/* Customer Login / My Orders */}
          <Button
            onClick={onMyOrdersClick}
            variant="secondary"
            className="!px-4 sm:!px-5 !py-2 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md border-brand-teal/20 text-brand-teal hover:bg-brand-teal hover:text-white transition-all"
          >
            {language === 'ar' ? 'حسابي' : 'My Account'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;