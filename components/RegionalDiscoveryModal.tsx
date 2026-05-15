import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currencies, type Currency } from '../services/currencyService';
import { Button } from './Button';
import { Logo } from './Logo';
import type { Language } from '../types';

interface RegionalDiscoveryModalProps {
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    onCurrencyChange: (currencyCode: string) => void;
}

export const RegionalDiscoveryModal: React.FC<RegionalDiscoveryModalProps> = ({
    currentLanguage,
    onLanguageChange,
    onCurrencyChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [detectedRegion, setDetectedRegion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedCountry, setSelectedCountry] = useState('KW');
    const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage);
    const [selectedCurrency, setSelectedCurrency] = useState('KWD');
    
    const [countrySearch, setCountrySearch] = useState('');
    const [langSearch, setLangSearch] = useState('');
    
    const [isShowingAllCountries, setIsShowingAllCountries] = useState(false);
    const [isShowingAllLangs, setIsShowingAllLangs] = useState(false);

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
        { code: 'ES', name: 'Spain', ar: 'إسبانيا', flag: '🇪🇸', currency: 'EUR' },
        { code: 'IT', name: 'Italy', ar: 'إيطاليا', flag: '🇮🇹', currency: 'EUR' },
    ];

    const languages: { code: Language, label: string, flag: string }[] = [
        { code: 'ar', label: 'العربية', flag: '🇸🇦' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'it', label: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', label: 'Português', flag: '🇵🇹' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    ];

    useEffect(() => {
        const checkRegion = async () => {
            const hasSeen = localStorage.getItem('rawy_region_discovered');
            if (hasSeen) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                setDetectedRegion(data);

                const country = allCountries.find(c => c.code === data.country_code) || 
                                { code: data.country_code, name: data.country_name, ar: data.country_name, flag: '🌍', currency: 'USD' };
                
                setSelectedCountry(country.code);
                const supportedCurrency = currencies.find(c => c.code === country.currency);
                setSelectedCurrency(supportedCurrency ? supportedCurrency.code : 'USD');
                
                const initialLang = ['KW', 'SA', 'AE', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB'].includes(country.code) ? 'ar' : 'en';
                setSelectedLang(initialLang as Language);
                
                setIsOpen(true);
            } catch (error) {
                console.error("Region detection failed", error);
                setIsOpen(true);
            } finally {
                setIsLoading(false);
            }
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
            // Auto-detect language but don't force if they already chose something exotic
            if (['ar', 'en'].includes(selectedLang)) {
                setSelectedLang(['KW', 'SA', 'AE', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB'].includes(code) ? 'ar' : 'en');
            }
            setIsShowingAllCountries(false);
        }
    };

    const handleConfirm = () => {
        onLanguageChange(selectedLang);
        onCurrencyChange(selectedCurrency);
        localStorage.setItem('rawy_region_discovered', 'true');
        setIsOpen(false);
    };

    if (isLoading || !isOpen) return null;

    const filteredCountries = allCountries.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.ar.includes(countrySearch)
    );

    const filteredLangs = languages.filter(l => 
        l.label.toLowerCase().includes(langSearch.toLowerCase()) || 
        l.code.includes(langSearch.toLowerCase())
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-navy/60 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl border border-white/50 max-w-xl w-full overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-brand-orange/15 to-transparent" />
                    
                    <div className="p-10 relative z-10 space-y-8">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-50 mb-1">
                                <Logo />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-brand-navy tracking-tighter uppercase">
                                    {t('مرحباً بك في راوي', 'Welcome to Rawy')}
                                </h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">
                                    {t('لنخصص تجربتك السحرية', 'Let\'s personalize your magical experience')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Country Selector */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-brand-navy/40 uppercase tracking-widest ml-4">
                                    {t('الدولة أو المنطقة', 'Your Country or Region')}
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => { setIsShowingAllCountries(!isShowingAllCountries); setIsShowingAllLangs(false); }}
                                        className="w-full flex items-center justify-between px-6 py-4 bg-gray-100/50 rounded-[1.8rem] border-2 border-transparent hover:border-brand-teal/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">
                                                {allCountries.find(c => c.code === selectedCountry)?.flag || '🌍'}
                                            </span>
                                            <div className="text-left">
                                                <div className="text-xs font-black text-brand-navy uppercase tracking-tight">
                                                    {allCountries.find(c => c.code === selectedCountry)?.name || detectedRegion?.country_name || 'International'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-brand-navy/30 group-hover:text-brand-teal transition-colors">expand_more</span>
                                    </button>

                                    {isShowingAllCountries && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                                                <input 
                                                    type="text"
                                                    placeholder={t('ابحث عن دولتك...', 'Search for your country...')}
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    autoFocus
                                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-teal/20"
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto no-scrollbar p-2">
                                                {filteredCountries.map(c => (
                                                    <button 
                                                        key={c.code}
                                                        onClick={() => handleCountryChange(c.code)}
                                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCountry === c.code ? 'bg-brand-teal/10' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">{c.flag}</span>
                                                            <span className="text-[11px] font-bold text-brand-navy">{selectedLang === 'ar' ? c.ar : c.name}</span>
                                                        </div>
                                                        {selectedCountry === c.code && <span className="material-symbols-outlined text-brand-teal text-sm">check_circle</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Enhanced Language Selector */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-brand-navy/40 uppercase tracking-widest ml-4">
                                        {t('لغة القصة المفضلة', 'Preferred Story Language')}
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => { setIsShowingAllLangs(!isShowingAllLangs); setIsShowingAllCountries(false); }}
                                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-100/50 rounded-[1.8rem] border-2 border-transparent hover:border-brand-teal/20 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">
                                                    {languages.find(l => l.code === selectedLang)?.flag || '🌐'}
                                                </span>
                                                <span className="text-xs font-black text-brand-navy uppercase">
                                                    {languages.find(l => l.code === selectedLang)?.label || 'Select'}
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined text-brand-navy/30 group-hover:text-brand-teal text-sm">expand_more</span>
                                        </button>

                                        {isShowingAllLangs && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden"
                                            >
                                                <div className="p-3 border-b border-gray-50 bg-gray-50/30">
                                                    <input 
                                                        type="text"
                                                        placeholder={t('ابحث عن لغة...', 'Search language...')}
                                                        value={langSearch}
                                                        onChange={(e) => setLangSearch(e.target.value)}
                                                        autoFocus
                                                        className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-teal/20"
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto no-scrollbar p-2">
                                                    {filteredLangs.map(l => (
                                                        <button 
                                                            key={l.code}
                                                            onClick={() => { setSelectedLang(l.code); setIsShowingAllLangs(false); }}
                                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedLang === l.code ? 'bg-brand-teal/10' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-lg">{l.flag}</span>
                                                                <span className="text-[11px] font-bold text-brand-navy">{l.label}</span>
                                                            </div>
                                                            {selectedLang === l.code && <span className="material-symbols-outlined text-brand-teal text-sm">check_circle</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Currency Selection */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-brand-navy/40 uppercase tracking-widest ml-4">
                                        {t('عملة التسوق', 'Shopping Currency')}
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={selectedCurrency}
                                            onChange={(e) => setSelectedCurrency(e.target.value)}
                                            className="w-full px-6 py-4 bg-gray-100/50 border-none rounded-[1.8rem] outline-none text-xs font-black text-brand-navy appearance-none cursor-pointer focus:ring-4 focus:ring-brand-orange/10 transition-all"
                                        >
                                            {currencies.map(c => (
                                                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy/40">
                                            <span className="material-symbols-outlined text-sm">unfold_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleConfirm}
                                className="w-full bg-brand-navy text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.25em] hover:bg-brand-orange hover:shadow-2xl hover:shadow-brand-orange/30 transition-all flex items-center justify-center gap-4 group"
                            >
                                {t('ابدأ رحلتك الآن', 'Start Your Journey')}
                                <span className="material-symbols-outlined text-2xl group-hover:translate-x-2 transition-transform">auto_fix_high</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

