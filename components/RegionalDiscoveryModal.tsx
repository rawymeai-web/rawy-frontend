import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currencies, type Currency } from '../services/currencyService';
import { Button } from './Button';
import { Logo } from './Logo';
import type { Language } from '../types';

interface RegionalDiscoveryModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    onCurrencyChange: (currencyCode: string) => void;
}

export const RegionalDiscoveryModal: React.FC<RegionalDiscoveryModalProps> = ({
    isOpen: controlledIsOpen,
    onClose,
    currentLanguage,
    onLanguageChange,
    onCurrencyChange
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const [detectedRegion, setDetectedRegion] = useState<any>(null);
    const [detectedLangCode, setDetectedLangCode] = useState<Language | null>(null);
    const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);

    const [selectedCountry, setSelectedCountry] = useState('KW');
    const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage);
    const [selectedCurrency, setSelectedCurrency] = useState('KWD');
    
    const [countrySearch, setCountrySearch] = useState('');
    const [langSearch, setLangSearch] = useState('');
    
    const [isShowingAllCountries, setIsShowingAllCountries] = useState(false);
    const [isShowingAllLangs, setIsShowingAllLangs] = useState(false);

    useEffect(() => {
        setSelectedLang(currentLanguage);
    }, [currentLanguage]);

    const t = (ar: string, en: string) => ['ar'].includes(selectedLang) ? ar : en;

    const featuredCountries = [
        { code: 'KW', name: 'Kuwait', ar: 'الكويت', flag: '🇰🇼', currency: 'KWD' },
        { code: 'SA', name: 'Saudi Arabia', ar: 'السعودية', flag: '🇸🇦', currency: 'SAR' },
        { code: 'AE', name: 'UAE', ar: 'الإمارات', flag: '🇦🇪', currency: 'AED' },
        { code: 'QA', name: 'Qatar', ar: 'قطر', flag: '🇶🇦', currency: 'QAR' },
        { code: 'BH', name: 'Bahrain', ar: 'البحرين', flag: '🇧🇭', currency: 'BHD' },
        { code: 'OM', name: 'Oman', ar: 'عمان', flag: '🇴🇲', currency: 'OMR' },
        { code: 'EG', name: 'Egypt', ar: 'مصر', flag: '🇪🇬', currency: 'EGP' },
    ];

    const allCountries = [
        ...featuredCountries,
        { code: 'US', name: 'United States', ar: 'الولايات المتحدة', flag: '🇺🇸', currency: 'USD' },
        { code: 'GB', name: 'United Kingdom', ar: 'المملكة المتحدة', flag: '🇬🇧', currency: 'USD' },
        { code: 'DE', name: 'Germany', ar: 'ألمانيا', flag: '🇩🇪', currency: 'EUR' },
        { code: 'FR', name: 'France', ar: 'فرنسا', flag: '🇫🇷', currency: 'EUR' },
        { code: 'CA', name: 'Canada', ar: 'كندا', flag: '🇨🇦', currency: 'USD' },
        { code: 'AU', name: 'Australia', ar: 'أستراليا', flag: '🇦🇺', currency: 'USD' },
        { code: 'JO', name: 'Jordan', ar: 'الأردن', flag: '🇯🇴', currency: 'USD' },
        { code: 'LB', name: 'Lebanon', ar: 'لبنان', flag: '🇱🇧', currency: 'USD' },
        { code: 'TR', name: 'Turkey', ar: 'تركيا', flag: '🇹🇷', currency: 'USD' },
        { code: 'CN', name: 'China', ar: 'الصين', flag: '🇨🇳', currency: 'USD' },
        { code: 'ES', name: 'Spain', ar: 'إسبانيا', flag: '🇪🇸', currency: 'EUR' },
        { code: 'IT', name: 'Italy', ar: 'إيطاليا', flag: '🇮🇹', currency: 'EUR' },
    ];

    const languages: { code: Language, label: string, nativeLabel: string, flag: string }[] = [
        { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
        { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
        { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
        { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
        { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
        { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
        { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
        { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
        { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
        { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
    ];

    const getPhoneLanguage = (): Language => {
        if (typeof navigator === 'undefined') return 'en';
        const navLangs = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
        for (const raw of navLangs) {
            if (!raw) continue;
            const code = raw.toLowerCase().split('-')[0];
            if (code === 'ar') return 'ar';
            if (['en', 'de', 'tr', 'zh', 'ja', 'fr', 'es', 'it', 'pt', 'ru'].includes(code)) {
                return code as Language;
            }
        }
        return 'en';
    };

    useEffect(() => {
        const checkRegion = async () => {
            // 1. Phone / Device Language Detection
            const phoneLang = getPhoneLanguage();
            setDetectedLangCode(phoneLang);
            setSelectedLang(phoneLang);

            // 2. IP Detection with reliable fallback
            let countryCode = 'US';
            let countryName = 'United States';
            let detectedCurr = 'USD';

            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.country_code) {
                        countryCode = data.country_code;
                        countryName = data.country_name || 'United States';
                        detectedCurr = data.currency || 'USD';
                        setDetectedRegion(data);
                    }
                } else {
                    throw new Error('ipapi error');
                }
            } catch (e) {
                try {
                    const res2 = await fetch('https://ipwho.is/');
                    if (res2.ok) {
                        const data2 = await res2.json();
                        if (data2 && data2.country_code) {
                            countryCode = data2.country_code;
                            countryName = data2.country || 'United States';
                            detectedCurr = data2.currency?.code || 'USD';
                            setDetectedRegion(data2);
                        }
                    }
                } catch (e2) {
                    console.error("IP detection fallback failed", e2);
                }
            }

            setDetectedCountryCode(countryCode);

            const country = allCountries.find(c => c.code === countryCode) || 
                            { code: countryCode, name: countryName, ar: countryName, flag: '🌍', currency: detectedCurr };
            
            setSelectedCountry(country.code);
            const supportedCurrency = currencies.find(c => c.code === country.currency) || 
                                     currencies.find(c => c.code === detectedCurr) || 
                                     currencies[0];
            setSelectedCurrency(supportedCurrency.code);

            // Silently apply auto-detected language if not manually chosen before
            try {
                const savedLanguage = localStorage.getItem('preferred_language');
                if (!savedLanguage && phoneLang) {
                    onLanguageChange(phoneLang);
                }
                const savedCurrency = localStorage.getItem('preferred_currency');
                if (!savedCurrency && supportedCurrency) {
                    onCurrencyChange(supportedCurrency.code);
                }
                localStorage.setItem('rawy_region_confirmed', 'true');
            } catch (e) {}
        };

        checkRegion();
    }, []);

    const handleCountryChange = (code: string) => {
        let country = allCountries.find(c => c.code === code);
        if (!country && detectedRegion && detectedRegion.country_code === code) {
            country = { code: detectedRegion.country_code, name: detectedRegion.country_name, ar: detectedRegion.country_name, flag: '🌍', currency: 'USD' };
        }
        
        if (country) {
            setSelectedCountry(code);
            setSelectedCurrency(country.currency);
            // Auto-detect language if switching regions
            if (['ar', 'en'].includes(selectedLang)) {
                setSelectedLang(['KW', 'SA', 'AE', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB'].includes(code) ? 'ar' : 'en');
            }
            setIsShowingAllCountries(false);
        }
    };

    const handleConfirm = () => {
        onLanguageChange(selectedLang);
        onCurrencyChange(selectedCurrency);
        try {
            localStorage.setItem('rawy_region_confirmed', 'true');
            localStorage.setItem('rawy_user_preferences_set', 'true');
            localStorage.setItem('has_completed_welcome', 'true');
            sessionStorage.setItem('rawy_region_confirmed', 'true');
        } catch (e) {}
        setInternalIsOpen(false);
        onClose?.();
    };

    const handleClose = () => {
        try {
            localStorage.setItem('rawy_region_confirmed', 'true');
            localStorage.setItem('rawy_user_preferences_set', 'true');
            sessionStorage.setItem('rawy_region_confirmed', 'true');
        } catch (e) {}
        setInternalIsOpen(false);
        onClose?.();
    };

    if (!isModalOpen) return null;

    const filteredCountries = allCountries.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.ar.includes(countrySearch)
    );

    const filteredLangs = languages.filter(l => 
        l.label.toLowerCase().includes(langSearch.toLowerCase()) || 
        l.nativeLabel.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.code.includes(langSearch.toLowerCase())
    );

    const currentCountryObj = allCountries.find(c => c.code === selectedCountry) || 
                              (detectedRegion ? { code: selectedCountry, name: detectedRegion.country_name || 'International', ar: detectedRegion.country_name || 'دولي', flag: '🌍' } : { code: 'KW', name: 'Kuwait', ar: 'الكويت', flag: '🇰🇼' });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-brand-navy/65 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3.2rem] shadow-2xl border border-white/60 max-w-lg w-full overflow-hidden relative"
                >
                    {/* Glowing Brand Header Background */}
                    <div className="absolute top-0 left-0 w-full h-36 bg-gradient-to-br from-brand-orange/20 via-brand-yellow/15 to-transparent pointer-events-none" />
                    
                    {onClose && (
                        <button
                            onClick={handleClose}
                            className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-navy flex items-center justify-center shadow-md border border-gray-100 z-20 transition-all active:scale-95"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}

                    <div className="p-6 sm:p-8 relative z-10 space-y-6">
                        {/* Header Branding */}
                        <div className="flex flex-col items-center text-center space-y-2.5">
                            <div className="w-14 h-14 bg-gradient-to-br from-brand-orange to-brand-yellow rounded-2xl shadow-lg shadow-brand-orange/25 flex items-center justify-center border-2 border-white mb-0.5 overflow-hidden p-2 text-white">
                                <span className="material-symbols-outlined text-2xl font-bold">auto_stories</span>
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
                                    {t('مرحباً بك في راوي', 'Welcome to Rawy')}
                                </h2>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                    {t('خصص لغة وعملة تجربتك', 'Personalize your language & currency')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Primary Story Language Quick Selector */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-black text-brand-navy/60 uppercase tracking-wider">
                                        {t('لغة القصة', 'Story Language')}
                                    </label>
                                    {detectedLangCode && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-full shadow-xs">
                                            <span>✨</span> {t(`تم التعرف: ${detectedLangCode === 'ar' ? 'العربية' : 'English'}`, `Detected: ${detectedLangCode === 'ar' ? 'Arabic' : 'English'}`)}
                                        </span>
                                    )}
                                </div>

                                {/* Quick Primary Pills */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLang('ar')}
                                        className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm transition-all border-2 ${
                                            selectedLang === 'ar'
                                                ? 'bg-gradient-to-r from-brand-orange to-brand-yellow text-white border-brand-orange shadow-lg shadow-brand-orange/25 scale-[1.02]'
                                                : 'bg-[#FFF9F0] text-brand-navy border-amber-200/60 hover:border-brand-orange/40 hover:bg-amber-50/70'
                                        }`}
                                    >
                                        <span className="text-lg">🇸🇦</span>
                                        <span>العربية</span>
                                        {detectedLangCode === 'ar' && selectedLang !== 'ar' && (
                                            <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedLang('en')}
                                        className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm transition-all border-2 ${
                                            selectedLang === 'en'
                                                ? 'bg-gradient-to-r from-brand-teal to-teal-600 text-white border-brand-teal shadow-lg shadow-brand-teal/25 scale-[1.02]'
                                                : 'bg-[#FFF9F0] text-brand-navy border-amber-200/60 hover:border-brand-teal/40 hover:bg-teal-50/40'
                                        }`}
                                    >
                                        <span className="text-lg">🇺🇸</span>
                                        <span>English</span>
                                        {detectedLangCode === 'en' && selectedLang !== 'en' && (
                                            <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
                                        )}
                                    </button>
                                </div>

                                {/* More Languages Dropdown Toggle */}
                                <div className="relative pt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setIsShowingAllLangs(!isShowingAllLangs); setIsShowingAllCountries(false); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50/80 hover:bg-amber-50/50 rounded-xl border border-gray-200/70 text-xs font-bold text-gray-700 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-brand-navy/50">translate</span>
                                            <span>
                                                {selectedLang !== 'ar' && selectedLang !== 'en'
                                                    ? `${languages.find(l => l.code === selectedLang)?.nativeLabel} (${languages.find(l => l.code === selectedLang)?.label})`
                                                    : t('لغات أخرى...', 'More languages...')}
                                            </span>
                                        </div>
                                        <span className="material-symbols-outlined text-xs text-gray-400">expand_more</span>
                                    </button>

                                    {isShowingAllLangs && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                                        >
                                            <div className="p-3 border-b border-gray-100 bg-gray-50/60">
                                                <input 
                                                    type="text"
                                                    placeholder={t('ابحث عن لغة...', 'Search language...')}
                                                    value={langSearch}
                                                    onChange={(e) => setLangSearch(e.target.value)}
                                                    autoFocus
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-teal/30"
                                                />
                                            </div>
                                            <div className="max-h-44 overflow-y-auto no-scrollbar p-1.5 space-y-0.5">
                                                {filteredLangs.map(l => (
                                                    <button 
                                                        key={l.code}
                                                        type="button"
                                                        onClick={() => { setSelectedLang(l.code); setIsShowingAllLangs(false); }}
                                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${selectedLang === l.code ? 'bg-brand-teal/10 text-brand-teal font-black' : 'hover:bg-amber-50/60 text-gray-700'}`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-base">{l.flag}</span>
                                                            <span className="text-xs">{l.nativeLabel} <span className="text-gray-400 text-[10px]">({l.label})</span></span>
                                                        </div>
                                                        {selectedLang === l.code && <span className="material-symbols-outlined text-brand-teal text-sm">check_circle</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Country & Currency Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Country Selector */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[11px] font-black text-brand-navy/60 uppercase tracking-wider">
                                            {t('البلد / الوجهة', 'Country / Region')}
                                        </label>
                                        {detectedCountryCode && selectedCountry === detectedCountryCode && (
                                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md">
                                                {t('موقعك', 'Your IP')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => { setIsShowingAllCountries(!isShowingAllCountries); setIsShowingAllLangs(false); }}
                                            className="w-full flex items-center justify-between px-3.5 py-3 bg-[#FFF9F0] hover:bg-amber-50/70 rounded-2xl border-2 border-amber-200/70 hover:border-brand-orange/40 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-xl shrink-0">
                                                    {currentCountryObj.flag}
                                                </span>
                                                <span className="text-xs font-black text-brand-navy truncate">
                                                    {selectedLang === 'ar' ? currentCountryObj.ar : currentCountryObj.name}
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined text-brand-navy/40 group-hover:text-brand-orange transition-colors text-sm">expand_more</span>
                                        </button>

                                        {isShowingAllCountries && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                                            >
                                                <div className="p-3 border-b border-gray-100 bg-gray-50/60">
                                                    <input 
                                                        type="text"
                                                        placeholder={t('ابحث عن دولتك...', 'Search country...')}
                                                        value={countrySearch}
                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                        autoFocus
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-orange/30"
                                                    />
                                                </div>
                                                <div className="max-h-44 overflow-y-auto no-scrollbar p-1.5 space-y-0.5">
                                                    {filteredCountries.map(c => (
                                                        <button 
                                                            key={c.code}
                                                            type="button"
                                                            onClick={() => handleCountryChange(c.code)}
                                                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${selectedCountry === c.code ? 'bg-brand-orange/10 text-brand-orange font-black' : 'hover:bg-amber-50/60 text-gray-700'}`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-lg">{c.flag}</span>
                                                                <span className="text-xs font-bold">{selectedLang === 'ar' ? c.ar : c.name}</span>
                                                            </div>
                                                            {selectedCountry === c.code && <span className="material-symbols-outlined text-brand-orange text-sm">check_circle</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Currency Selection */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[11px] font-black text-brand-navy/60 uppercase tracking-wider">
                                            {t('العملة', 'Currency')}
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <select 
                                            value={selectedCurrency}
                                            onChange={(e) => setSelectedCurrency(e.target.value)}
                                            className="w-full px-3.5 py-3 bg-[#FFF9F0] hover:bg-amber-50/70 border-2 border-amber-200/70 hover:border-brand-orange/40 rounded-2xl outline-none text-xs font-black text-brand-navy appearance-none cursor-pointer focus:ring-2 focus:ring-brand-orange/30 transition-all pr-8"
                                        >
                                            {currencies.map(c => (
                                                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy/40">
                                            <span className="material-symbols-outlined text-sm">unfold_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <div className="pt-2">
                            <button 
                                type="button"
                                onClick={handleConfirm}
                                className="w-full bg-gradient-to-r from-brand-navy via-[#193056] to-brand-navy text-white py-4 sm:py-4.5 rounded-2xl font-black uppercase tracking-wider hover:from-brand-orange hover:to-amber-500 hover:shadow-xl hover:shadow-brand-orange/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                            >
                                <span>{t('ابدأ رحلتك السحرية', 'Continue to Rawy')}</span>
                                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};


