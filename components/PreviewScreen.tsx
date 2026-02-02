import React, { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { Button } from './Button';
import { Watermark } from './Watermark';
import type { StoryData, Language, Page, ProductSize, TextBlock } from '../types';
import { getProductSizeById } from '../services/adminService';
import { Spinner } from './Spinner';
import { TEXT_BLOB_COLOR } from '../constants';
import * as fileService from '../services/fileService';

const ShareComponent = lazy(() => import('./ShareComponent'));

const blobBorderRadii = [
    '47% 53% 70% 30% / 30% 43% 57% 70%',
    '36% 64% 64% 36% / 64% 42% 58% 36%',
    '65% 35% 38% 62% / 61% 63% 37% 39%',
    '58% 42% 43% 57% / 41% 54% 46% 59%',
];

const getAgeBasedFontSizeClass = (text: string, age: string): string => {
    const ageNum = parseInt(age, 10) || 8;
    if (ageNum <= 3) return 'text-xl md:text-2xl font-kids';
    return 'text-base md:text-lg font-sans';
};

const getTitleFontSizeClass = (title: string, language: Language): string => {
    const len = title?.length || 0;
    const font = language === 'en' ? 'font-magical' : 'font-fancy';
    if (len > 40) return `${font} text-xl md:text-2xl`;
    if (len > 25) return `${font} text-2xl md:text-3xl`;
    return `${font} text-3xl md:text-5xl`;
};

const formatStoryTextHTML = (text: string, childName: string): string => {
    if (!text) return '';

    // Normalize spaces and casing for detection
    const childFirstName = childName.trim().split(/\s+/)[0];
    const escapedName = childFirstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars

    // Regex to match name (case-insensitive) but wrap it
    // Using simple replacement for now, complex logical matching if needed.
    const nameRegex = new RegExp(`\\b(${escapedName})\\b`, 'gi');

    let formatted = text.split('\n\n').map(p => `<p class="mb-2 last:mb-0 leading-relaxed">${p.trim()}</p>`).join('');

    // HERO NAME IN BOLD UPPERCASE with visual pop
    if (childFirstName) {
        formatted = formatted.replace(nameRegex, `<span class="font-black text-brand-navy text-110">$1</span>`);
    }

    return formatted;
};

const PageWrapper: React.FC<{ children: React.ReactNode, side: 'left' | 'right' }> = ({ children, side }) => {
    return (
        <div className={`w-1/2 h-full relative ${side === 'left' ? 'border-r border-black/5' : ''}`}>
            {children}
        </div>
    );
};

const TextContainer: React.FC<{ textBlocks: TextBlock[], storyData: StoryData, language: Language }> = ({ textBlocks, storyData, language }) => {
    return (
        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center">
            {textBlocks.map((block, i) => (
                <div key={i} className="bg-white/60 p-6 rounded-2xl shadow-sm backdrop-blur-sm border border-white/50 text-brand-navy"
                    style={{
                        textAlign: block.alignment || 'center',
                    }}>
                    <div
                        className={getAgeBasedFontSizeClass(block.text, storyData.childAge)}
                        dangerouslySetInnerHTML={{ __html: formatStoryTextHTML(block.text, storyData.childName) }}
                    />
                </div>
            ))}
        </div>
    );
};

const Endpaper: React.FC = () => (
    <div className="w-full h-full bg-amber-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply"></div>
    </div>
);

const Cover: React.FC<{ storyData: StoryData, language: Language, onTitleChange: (v: string) => void, type: 'spread' | 'front' }> = ({ storyData, language, onTitleChange, type }) => {
    // LAYOUT LOGIC:
    // ARABIC: Hero/Title = RIGHT SIDE.
    // ENGLISH: Hero/Title = LEFT SIDE.

    const isAr = language === 'ar';
    const isHeroRight = !isAr; // English = Title Right (Front)
    const isHeroLeft = isAr;   // Arabic = Title Left (Front)

    // STYLING: Match PDF "Logo" Look
    const titleStyle: React.CSSProperties = {
        fontFamily: "'Luckiest Guy', cursive",
        color: '#FFFFFF',
        textShadow: language === 'en'
            ? '4px 4px 0 #203A72, -2px -2px 0 #203A72, 2px -2px 0 #203A72, -2px 2px 0 #203A72, 2px 2px 0 #203A72, 0 8px 15px rgba(0,0,0,0.3)'
            : '2px 2px 0 #203A72, -1px -1px 0 #203A72, 1px -1px 0 #203A72, -1px 1px 0 #203A72, 1px 1px 0 #203A72',
        lineHeight: 1.1,
        letterSpacing: language === 'en' ? '2px' : '0'
    };

    return (
        <div className="w-full h-full relative overflow-hidden flex shadow-2xl rounded-3xl border-8 border-white ring-1 ring-gray-200"
            style={{
                backgroundImage: `url(data:image/jpeg;base64,${storyData.coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>

            {/* LEFT HALF */}
            <div className="w-1/2 h-full relative flex flex-col justify-between p-8">
                {isHeroLeft ? (
                    // ARABIC FRONT (Hero Title Side)
                    <div className="relative z-10 h-full flex flex-col items-center pt-2">
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
                            style={titleStyle}
                            className="text-5xl md:text-7xl text-center transform -rotate-2 cursor-text uppercase"
                        >
                            {storyData.title}
                        </div>
                    </div>
                ) : (
                    // ENGLISH BACK - Empty
                    <div className="relative z-10 h-full flex flex-col justify-end items-center pb-8 opacity-80 mix-blend-multiply"></div>
                )}
            </div>

            {/* RIGHT HALF */}
            <div className="w-1/2 h-full relative flex flex-col justify-between p-8">
                {isHeroRight ? (
                    // ENGLISH FRONT (Hero Title Side)
                    <div className="relative z-10 h-full flex flex-col items-center pt-2">
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
                            style={titleStyle}
                            className="text-5xl md:text-7xl text-center transform -rotate-2 cursor-text uppercase"
                        >
                            {storyData.title}
                        </div>
                    </div>
                ) : (
                    // ARABIC BACK - Empty
                    <div className="relative z-10 h-full flex flex-col justify-end items-center pb-8 opacity-80 mix-blend-multiply"></div>
                )}
            </div>

            <Watermark />
        </div>
    );
};

interface BookProps {
    storyData: StoryData;
    language: Language;
    onTitleChange: (v: string) => void;
}

const PresentationView: React.FC<BookProps> = ({ storyData, language, onTitleChange }) => {
    const spreads = useMemo(() => {
        // v4 Workflow: 1 Page Item = 1 Full Spread
        return storyData.pages;
    }, [storyData.pages]);

    const views = useMemo(() => ['cover', ...spreads.map((_, i) => i)], [spreads]);
    const [viewIndex, setViewIndex] = useState(0);

    const goNext = () => setViewIndex(i => Math.min(i + 1, views.length - 1));
    const goPrev = () => setViewIndex(i => Math.max(i - 1, 0));
    const currentView = views[viewIndex];

    const renderCurrentView = () => {
        if (currentView === 'cover') {
            return (
                <div className="max-w-5xl mx-auto aspect-[2/1.1]">
                    <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="spread" />
                </div>
            );
        }

        const spreadPage = spreads[currentView as number];
        return (
            <div className="aspect-[2/1.1] max-w-5xl mx-auto flex shadow-2xl rounded-3xl overflow-hidden relative border-8 border-white ring-1 ring-gray-200"
                style={{ backgroundImage: `url(data:image/jpeg;base64,${spreadPage.illustrationUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <PageWrapper side="left">
                    {spreadPage.textSide === 'left' && <TextContainer textBlocks={spreadPage.textBlocks || []} storyData={storyData} language={language} />}
                </PageWrapper>
                <PageWrapper side="right">
                    {spreadPage.textSide === 'right' && <TextContainer textBlocks={spreadPage.textBlocks || []} storyData={storyData} language={language} />}
                </PageWrapper>
                <Watermark />
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-center">
                <Button onClick={goPrev} disabled={viewIndex === 0} variant="secondary" className="!p-4 rounded-full shadow-xl z-30 mx-4 bg-white/90 border-none text-brand-navy hover:bg-white transition-all transform hover:scale-110">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </Button>
                <div className="w-full transform transition-all duration-700 ease-out">{renderCurrentView()}</div>
                <Button onClick={goNext} disabled={viewIndex === views.length - 1} variant="secondary" className="!p-4 rounded-full shadow-xl z-30 mx-4 bg-white/90 border-none text-brand-navy hover:bg-white transition-all transform hover:scale-110">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </Button>
            </div>
            <div className="flex justify-center gap-1">
                {views.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === viewIndex ? 'w-8 bg-brand-orange shadow-sm' : 'w-2 bg-gray-300'}`}></div>
                ))}
            </div>
        </div>
    );
};

const ScrollView: React.FC<BookProps> = ({ storyData, language, onTitleChange }) => {
    const spreads = useMemo(() => {
        // v4 Workflow: 1 Page Item = 1 Full Spread
        return storyData.pages;
    }, [storyData.pages]);

    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            <div className="aspect-[2/1.1] flex shadow-2xl rounded-3xl overflow-hidden border-8 border-white ring-1 ring-gray-200">
                <PageWrapper side="left">{language === 'en' ? <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="front" /> : <Endpaper />}</PageWrapper>
                <PageWrapper side="right">{language === 'ar' ? <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="front" /> : <Endpaper />}</PageWrapper>
            </div>
            {spreads.map((s, i) => (
                <div key={i} className="aspect-[2/1.1] flex shadow-2xl rounded-3xl overflow-hidden relative border-8 border-white ring-1 ring-gray-200" style={{ backgroundImage: `url(data:image/jpeg;base64,${s.illustrationUrl})`, backgroundSize: 'cover' }}>
                    <PageWrapper side="left">{s.textSide === 'left' && <TextContainer textBlocks={s.textBlocks || []} storyData={storyData} language={language} />}</PageWrapper>
                    <PageWrapper side="right">{s.textSide === 'right' && <TextContainer textBlocks={s.textBlocks || []} storyData={storyData} language={language} />}</PageWrapper>
                    <Watermark />
                </div>
            ))}
        </div>
    );
};

export interface PreviewScreenProps {
    storyData: StoryData;
    onOrder: () => void;
    onDownloadPreview: () => void;
    onRestart: () => void;
    onTitleChange: (v: string) => void;
    onRegenerate: (feedback: string) => void;
    language: Language;
    onBack: () => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = (props) => {
    const [viewMode, setViewMode] = useState<'presentation' | 'scroll'>('presentation');
    const t = (ar: string, en: string) => props.language === 'ar' ? ar : en;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50 sticky top-20 z-40">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button onClick={() => setViewMode('presentation')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'presentation' ? 'bg-white text-brand-orange shadow-sm' : 'text-gray-500'}`}>{t('عرض التقديم', 'Presentation')}</button>
                    <button onClick={() => setViewMode('scroll')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'scroll' ? 'bg-white text-brand-orange shadow-sm' : 'text-gray-500'}`}>{t('عرض التمرير', 'Scroll')}</button>
                </div>
                <div className="flex gap-3">
                    <Button onClick={props.onRestart} variant="outline" className="!px-4 !py-2 text-sm">{t('ابدأ من جديد', 'Start Over')}</Button>
                    <Button onClick={props.onOrder} className="!px-6 !py-2 text-sm shadow-lg">{t('اطلب الكتاب الآن!', 'Order Book Now!')}</Button>
                </div>
            </div>

            <div className="animate-enter-forward">
                {viewMode === 'presentation' && <PresentationView storyData={props.storyData} language={props.language} onTitleChange={props.onTitleChange} />}
                {viewMode === 'scroll' && <ScrollView storyData={props.storyData} language={props.language} onTitleChange={props.onTitleChange} />}
            </div>

            <div className="mt-12">
                <Suspense fallback={<Spinner />}>
                    <ShareComponent storyData={props.storyData} language={props.language} />
                </Suspense>
            </div>

            <div className="flex justify-center pt-8">
                <Button onClick={props.onBack} variant="outline" className="text-xl px-12 py-4 rounded-xl">{t('رجوع', 'Back')}</Button>
            </div>
        </div>
    );
};

export default PreviewScreen;