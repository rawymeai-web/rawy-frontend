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
}

const Header: React.FC<HeaderProps> = ({
  onAdminLoginClick,
  onMyOrdersClick,
  language,
  setLanguage,
  currency,
  onCurrencyChange
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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 w-full py-4 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
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
        <div className={`flex items-center gap-3 sm:gap-6 ${language === 'ar' ? 'order-first' : 'order-last'}`}>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-bold text-brand-navy"
          >
            <span>{language === 'en' ? '🇺🇸' : '🇸🇦'}</span>
            <span>{language === 'en' ? 'EN' : 'عربي'}</span>
          </button>

          <div className="hidden sm:block w-32">
            <CurrencySelector selectedCurrency={currency} onCurrencyChange={onCurrencyChange} />
          </div>

          {/* Customer Login / My Orders */}
          <Button
            onClick={onMyOrdersClick}
            variant="secondary"
            className="!px-5 !py-2 text-sm font-bold shadow-sm hover:shadow-md border-brand-teal/20 text-brand-teal hover:bg-brand-teal hover:text-white transition-all"
          >
            {language === 'ar' ? 'طلباتي' : 'My Orders'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;