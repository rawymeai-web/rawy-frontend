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

          {/* Language Dropdown */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none flex items-center gap-2 px-6 py-1.5 pr-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-bold text-brand-navy border-none outline-none cursor-pointer"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="ar">🇸🇦 عربي</option>
              <option value="de">🇩🇪 DE</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="it">🇮🇹 IT</option>
              <option value="pt">🇵🇹 PT</option>
              <option value="ru">🇷🇺 RU</option>
              <option value="ja">🇯🇵 JA</option>
              <option value="tr">🇹🇷 TR</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-brand-navy">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>

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