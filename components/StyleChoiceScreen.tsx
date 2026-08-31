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
    const [infoModalStyle, setInfoModalStyle] = useState<StyleItem | null>(null);

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

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16 px-3 sm:px-6 animate-fade-in">
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
                    {t('اختر النمط الفني الذي ستُرسم به جميع صفحات قصة طفلك.', 'Select the signature art style for all custom illustrations starring your child.')}
                </p>
            </div>

            {/* Main Big Grid of Wide Style Cards (Primary Focus First) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {availableStyles.map(style => {
                    const isSelected = selectedStyleName === style.name;
                    const badgeObj = style.badge ? BADGE_MAP[style.badge] : null;

                    return (
                        <div
                            key={style.id || style.name}
                            onClick={() => setSelectedStyleName(style.name)}
                            className={`group relative text-left rtl:text-right rounded-[2.5rem] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none ${
                                isSelected 
                                    ? 'bg-white shadow-[0_20px_50px_rgba(247,143,80,0.25)] ring-4 ring-brand-orange scale-[1.02] border-transparent' 
                                    : 'bg-white/75 hover:bg-white/95 hover:shadow-2xl border border-white/80 hover:scale-[1.015]'
                            }`}
                        >
                            {/* Glowing Aura for Selected Card */}
                            {isSelected && (
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none"></div>
                            )}

                            {/* Large Wide 16:10 Visual Image */}
                            <div className="relative aspect-[16/10] w-full rounded-[2rem] overflow-hidden bg-slate-100 shadow-md mb-4 group-hover:shadow-lg transition-shadow">
                                <img 
                                    src={style.sampleUrl || style.preview_url} 
                                    alt={style.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>

                                {/* Marketing Badge Tag (Top Left / Right based on RTL) */}
                                {badgeObj && (
                                    <div className="absolute top-3.5 left-3.5 z-10">
                                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md flex items-center gap-1.5 ${badgeObj.bg}`}>
                                            <span className="material-symbols-outlined text-sm">{badgeObj.icon}</span>
                                            {isAr ? badgeObj.labelAr : badgeObj.labelEn}
                                        </span>
                                    </div>
                                )}

                                {/* Card Actions Header: Information Button & Selection Radio */}
                                <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
                                    {/* 'i' Information Details Trigger Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setInfoModalStyle(style);
                                        }}
                                        className="w-8 h-8 rounded-full bg-black/40 hover:bg-brand-navy backdrop-blur-md text-white border border-white/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md group/btn"
                                        title={t('عرض تفاصيل ومعاينة هذا الأسلوب', 'View Style Details & Preview')}
                                    >
                                        <span className="material-symbols-outlined text-base font-black group-hover/btn:text-brand-orange transition-colors">info</span>
                                    </button>

                                    {/* Selection Checkmark Indicator */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                                        isSelected 
                                            ? 'bg-brand-orange text-white scale-110 shadow-brand-orange/40' 
                                            : 'bg-white/80 backdrop-blur-md text-transparent border border-white/60'
                                    }`}>
                                        <span className="material-symbols-outlined text-base font-black">check</span>
                                    </div>
                                </div>

                                {/* Live Selected Chip Over Image on Mobile */}
                                {isSelected && (
                                    <div className="absolute bottom-3 left-3.5 z-10">
                                        <span className="px-3 py-1 bg-brand-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                                            {t('الأسلوب المختار ✓', 'Selected Style ✓')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer: Title & Subtitle */}
                            <div className="space-y-1.5 px-1">
                                <h3 className={`text-lg sm:text-xl font-black tracking-tight transition-colors ${
                                    isSelected ? 'text-brand-orange' : 'text-brand-navy group-hover:text-brand-orange'
                                }`}>
                                    {style.name}
                                </h3>
                                <p className="text-xs text-brand-navy/70 line-clamp-2 leading-relaxed font-medium">
                                    {getVibeSubtitle(style.prompt)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="text-center flex flex-col-reverse sm:flex-row justify-center items-center gap-4 sm:gap-6 pt-6">
                <Button 
                    onClick={onBack} 
                    variant="outline" 
                    className="w-full sm:w-auto text-lg px-10 py-4 rounded-2xl bg-white/80 border-white hover:bg-white text-brand-navy font-bold shadow-sm"
                >
                    {t('رجوع', 'Back')}
                </Button>
                <Button 
                    onClick={handleNext} 
                    className="w-full sm:w-auto text-lg px-16 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all bg-brand-orange text-white font-black"
                >
                    {t('متابعة إلى موضوع القصة ✨', 'Continue to Story Theme ✨')}
                </Button>
            </div>

            {/* 🌟 'i' Information Modal Pop-Up Dialog 🌟 */}
            <AnimatePresence>
                {infoModalStyle && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/70 backdrop-blur-md animate-fade-in"
                        onClick={() => setInfoModalStyle(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[3rem] max-w-2xl w-full overflow-hidden shadow-2xl border border-white/80 relative text-left rtl:text-right"
                        >
                            {/* Modal Header Image */}
                            <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                                <img 
                                    src={infoModalStyle.sampleUrl || infoModalStyle.preview_url} 
                                    alt={infoModalStyle.name} 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                {/* Close Button */}
                                <button
                                    onClick={() => setInfoModalStyle(null)}
                                    className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all active:scale-90"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>

                                {/* Badges on Modal Image */}
                                {infoModalStyle.badge && BADGE_MAP[infoModalStyle.badge] && (
                                    <div className="absolute top-5 left-5 z-10">
                                        <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md flex items-center gap-1.5 ${BADGE_MAP[infoModalStyle.badge].bg}`}>
                                            <span className="material-symbols-outlined text-sm">{BADGE_MAP[infoModalStyle.badge].icon}</span>
                                            {isAr ? BADGE_MAP[infoModalStyle.badge].labelAr : BADGE_MAP[infoModalStyle.badge].labelEn}
                                        </span>
                                    </div>
                                )}

                                <div className="absolute bottom-5 left-6 right-6 z-10 text-white">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('تفاصيل الأسلوب الفني', 'Visual Style Specs')}</span>
                                    <h3 className="text-2xl sm:text-3xl font-black">{infoModalStyle.name}</h3>
                                </div>
                            </div>

                            {/* Modal Body Details */}
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange font-black text-xs uppercase tracking-wider rounded-full">
                                            {t('عن هذا الأسلوب', 'Style Breakdown')}
                                        </span>
                                    </div>
                                    <p className="text-sm sm:text-base text-brand-navy/80 leading-relaxed font-medium bg-[#FFF9F0] p-5 rounded-2xl border border-brand-orange/15">
                                        {infoModalStyle.prompt}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 text-xs font-bold text-brand-teal">
                                    <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                                    <span>{t('توليد ذكي متناسق مع ملامح الطفل بدقة فائقة 4K', '4K High-Fidelity Character Consistency Guarantee')}</span>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => {
                                            setSelectedStyleName(infoModalStyle.name);
                                            setInfoModalStyle(null);
                                        }}
                                        className="flex-1 py-4 text-base font-black bg-brand-orange text-white rounded-2xl shadow-xl hover:shadow-2xl"
                                    >
                                        {t('اختيار هذا الأسلوب ✓', 'Select This Style ✓')}
                                    </Button>
                                    <Button
                                        onClick={() => setInfoModalStyle(null)}
                                        variant="outline"
                                        className="py-4 px-8 text-base font-bold bg-slate-100 border-slate-200 text-brand-navy rounded-2xl hover:bg-slate-200"
                                    >
                                        {t('إغلاق', 'Close')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StyleChoiceScreen;
