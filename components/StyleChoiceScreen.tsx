import React, { useState, useMemo, useEffect } from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';
import { ART_STYLE_OPTIONS } from '../constants';
import { backendApi } from '../services/backendApi';
import { motion, AnimatePresence } from 'framer-motion';

interface StyleChoiceScreenProps {
    onNext: (data: Partial<StoryData>) => void;
    onBack: () => void;
    storyData: StoryData;
    language: Language;
}

interface StyleItem {
    id?: string;
    name: string;
    category?: string;
    prompt: string;
    sampleUrl?: string;
    preview_url?: string;
    badge?: string | null;
    is_active?: boolean;
}

const BADGE_MAP: Record<string, { labelAr: string; labelEn: string; bg: string; icon: string }> = {
    limited_time: {
        labelAr: '🔥 لفترة محدودة',
        labelEn: '🔥 Limited Edition',
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30',
        icon: 'local_fire_department'
    },
    new: {
        labelAr: '✨ جديد وحصري',
        labelEn: '✨ New Release',
        bg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30',
        icon: 'auto_awesome'
    },
    leaving_soon: {
        labelAr: '⏳ ينتهي قريباً',
        labelEn: '⏳ Leaving Soon',
        bg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30',
        icon: 'hourglass_top'
    },
    fan_favorite: {
        labelAr: '⭐ الأكثر طلباً',
        labelEn: '⭐ Fan Favorite',
        bg: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30',
        icon: 'star'
    },
    exclusive: {
        labelAr: '💎 إصدار خاص',
        labelEn: '💎 Exclusive VIP',
        bg: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-violet-500/30',
        icon: 'diamond'
    }
};

const StyleChoiceScreen: React.FC<StyleChoiceScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const isAr = language === 'ar';
    const [availableStyles, setAvailableStyles] = useState<StyleItem[]>(ART_STYLE_OPTIONS);

    // Initial style selection
    const defaultStyle = storyData.selectedStyleNames?.[0] || ART_STYLE_OPTIONS[0].name;
    const [selectedStyleName, setSelectedStyleName] = useState<string>(defaultStyle);

    // Synchronize styles from Backend Catalog
    useEffect(() => {
        let isMounted = true;
        const loadCatalogStyles = async () => {
            try {
                const catalog = await backendApi.getCatalog();
                if (isMounted && catalog?.styles && catalog.styles.length > 0) {
                    const mapped: StyleItem[] = catalog.styles
                        .filter((s: any) => s.is_active !== false)
                        .map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            category: s.category || '3d',
                            prompt: s.prompt || s.prompt_template || '',
                            sampleUrl: s.sampleUrl || s.preview_url || '/style-previews/cinematic_3d_pixar_style.png',
                            badge: s.badge || null
                        }));

                    if (mapped.length > 0) {
                        setAvailableStyles(mapped);
                        if (!mapped.some(s => s.name === selectedStyleName)) {
                            setSelectedStyleName(mapped[0].name);
                        }
                    }
                }
            } catch (err) {
                console.warn('Using default styles fallback:', err);
            }
        };

        loadCatalogStyles();
        return () => { isMounted = false; };
    }, []);

    const selectedStyleObj = useMemo(() => 
        availableStyles.find(s => s.name === selectedStyleName) || availableStyles[0] || ART_STYLE_OPTIONS[0], 
    [availableStyles, selectedStyleName]);

    const handleNext = () => {
        if (!selectedStyleObj) return;
        onNext({
            selectedStyleNames: [selectedStyleObj.name],
            selectedStylePrompt: selectedStyleObj.prompt,
            styleReferenceImageBase64: ''
        });
    };

    const t = (ar: string, en: string) => isAr ? ar : en;

    const getVibeSubtitle = (prompt: string) => {
        if (!prompt) return '';
        const firstSentence = prompt.split('.')[0];
        return firstSentence ? `${firstSentence}.` : prompt;
    };

    const currentBadgeConfig = selectedStyleObj.badge ? BADGE_MAP[selectedStyleObj.badge] : null;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-12 px-3 sm:px-6">
            {/* Header Title */}
            <div className="text-center space-y-3 pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-orange/10 border border-brand-orange/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
                    <span className="text-xs font-black text-brand-orange uppercase tracking-wider">
                        {t('الخطوة 3 من 4', 'Step 3 of 4')}
                    </span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-brand-navy drop-shadow-sm tracking-tight">
                    {t('اختر أسلوب الرسم المفضل', 'Choose Your Visual Art Style')}
                </h2>
                <p className="text-sm sm:text-base text-brand-navy/70 max-w-xl mx-auto font-medium">
                    {t('كل رسمة سيتم توليدها خصيصاً لطفلك بهذا الأسلوب الفني الساحر.', 'Every scene will be custom illustrated starring your child in this signature art style.')}
                </p>
            </div>

            {/* Featured Visual Hero Presentation */}
            <motion.div 
                layout
                className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border border-white/80 flex flex-col md:flex-row relative z-10 w-full max-w-5xl mx-auto group"
            >
                {/* Wide Visual Canvas */}
                <div className="w-full md:w-1/2 relative aspect-[16/11] md:aspect-auto md:min-h-[460px] overflow-hidden bg-slate-900">
                    <AnimatePresence mode="wait">
                        <motion.img 
                            key={selectedStyleObj.name}
                            src={selectedStyleObj.sampleUrl || selectedStyleObj.preview_url} 
                            alt={selectedStyleObj.name} 
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.45 }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>

                    {/* Active Highlight Badge on Hero */}
                    {currentBadgeConfig && (
                        <div className="absolute top-6 left-6 z-20 animate-bounce">
                            <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 ${currentBadgeConfig.bg}`}>
                                <span className="material-symbols-outlined text-sm">{currentBadgeConfig.icon}</span>
                                {isAr ? currentBadgeConfig.labelAr : currentBadgeConfig.labelEn}
                            </span>
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 md:hidden z-10 text-white drop-shadow-md">
                        <p className="text-xs font-black uppercase tracking-widest opacity-80">{t('الأسلوب المختار', 'Selected Style')}</p>
                        <h3 className="text-2xl font-black">{selectedStyleObj.name}</h3>
                    </div>
                </div>

                {/* Style Narrative Details */}
                <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center text-center md:text-left rtl:md:text-right space-y-6 relative z-10">
                    <div className="flex flex-wrap items-center justify-center md:justify-start rtl:md:justify-start gap-2">
                        <span className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange font-black rounded-full text-xs tracking-wider uppercase">
                            {t('معاينة حية', 'Live Style Preview')}
                        </span>
                        {selectedStyleObj.category && (
                            <span className="px-3 py-1 bg-brand-navy/5 text-brand-navy/70 font-bold rounded-full text-xs uppercase tracking-wider">
                                {selectedStyleObj.category.toUpperCase()}
                            </span>
                        )}
                    </div>
                    
                    <h3 className="text-3xl sm:text-5xl font-black text-brand-navy leading-tight tracking-tight">
                        {selectedStyleObj.name}
                    </h3>
                    
                    <div className="bg-[#FFF9F0] p-6 rounded-3xl border border-brand-orange/15 shadow-inner">
                        <p className="text-sm sm:text-base text-brand-navy/80 font-medium leading-relaxed italic">
                            "{getVibeSubtitle(selectedStyleObj.prompt)}"
                        </p>
                    </div>

                    <div className="flex items-center justify-center md:justify-start rtl:md:justify-start gap-2 text-xs font-black text-brand-teal">
                        <span className="material-symbols-outlined text-base">verified</span>
                        <span>{t('متوافق مع الذكاء الاصطناعي بدقة 4K', 'High Definition Ultra-Crisp Rendering')}</span>
                    </div>
                </div>
            </motion.div>

            {/* Wide Creative Cards Selector (Matching Character/DNA Style) */}
            <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-black text-brand-navy/60 uppercase tracking-widest">
                        {t('جميع الأنماط المتاحة', 'Available Signature Styles')} ({availableStyles.length})
                    </h4>
                    <span className="text-xs font-bold text-brand-orange">
                        {t('اضغط لاختيار الأسلوب', 'Click any style to select')}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {availableStyles.map(style => {
                        const isSelected = selectedStyleName === style.name;
                        const badgeObj = style.badge ? BADGE_MAP[style.badge] : null;

                        return (
                            <button
                                key={style.id || style.name}
                                onClick={() => setSelectedStyleName(style.name)}
                                className={`group relative text-left rtl:text-right rounded-[2rem] p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden outline-none cursor-pointer ${
                                    isSelected 
                                        ? 'bg-white shadow-2xl ring-4 ring-brand-orange scale-[1.02] border-transparent' 
                                        : 'bg-white/70 hover:bg-white/95 hover:shadow-xl border border-white/80 hover:scale-[1.01]'
                                }`}
                                aria-pressed={isSelected}
                            >
                                {/* Active Selection Glow Background */}
                                {isSelected && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl pointer-events-none"></div>
                                )}

                                {/* Wide Horizontal Image Card (16:10 aspect ratio) */}
                                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-md mb-4 group-hover:shadow-lg transition-shadow">
                                    <img 
                                        src={style.sampleUrl || style.preview_url} 
                                        alt={style.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>

                                    {/* Marketing Badge Chip */}
                                    {badgeObj && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md flex items-center gap-1 ${badgeObj.bg}`}>
                                                <span className="material-symbols-outlined text-xs">{badgeObj.icon}</span>
                                                {isAr ? badgeObj.labelAr : badgeObj.labelEn}
                                            </span>
                                        </div>
                                    )}

                                    {/* Selection Radio / Checkmark Icon */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
                                            isSelected 
                                                ? 'bg-brand-orange text-white scale-110 shadow-brand-orange/40' 
                                                : 'bg-white/80 backdrop-blur-md text-transparent border border-white'
                                        }`}>
                                            <span className="material-symbols-outlined text-sm font-black">check</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Title & Flavor Description */}
                                <div className="space-y-1 px-1">
                                    <div className="flex items-center justify-between">
                                        <h5 className={`text-base sm:text-lg font-black tracking-tight transition-colors ${
                                            isSelected ? 'text-brand-orange' : 'text-brand-navy group-hover:text-brand-orange'
                                        }`}>
                                            {style.name}
                                        </h5>
                                    </div>
                                    <p className="text-xs text-brand-navy/60 line-clamp-2 leading-relaxed font-medium">
                                        {getVibeSubtitle(style.prompt)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="text-center flex flex-col-reverse sm:flex-row justify-center items-center gap-4 sm:gap-6 pt-6">
                <Button 
                    onClick={onBack} 
                    variant="outline" 
                    className="w-full sm:w-auto text-lg px-10 py-4 rounded-2xl bg-white/70 border-white hover:bg-white text-brand-navy font-bold shadow-sm"
                >
                    {t('رجوع', 'Back')}
                </Button>
                <Button 
                    onClick={handleNext} 
                    className="w-full sm:w-auto text-lg px-16 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all bg-brand-orange text-white font-black"
                >
                    {t('متابعة القصة ✨', 'Continue to Theme ✨')}
                </Button>
            </div>
        </div>
    );
};

export default StyleChoiceScreen;