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
    const childFirstName = childName.split(' ')[0].toUpperCase();
    const nameRegex = new RegExp(`(\\b${childFirstName}\\b)`, 'gi');

    let formatted = text.split('\n\n').map(p => `<p class="mb-2 last:mb-0 leading-relaxed">${p.trim()}</p>`).join('');

    // HERO NAME IN BOLD UPPERCASE
    if (childFirstName) {
        formatted = formatted.replace(nameRegex, `<span class="font-black text-brand-navy underline decoration-brand-orange/40">$1</span>`);
    }

    return formatted;
};

const PageWrapper: React.FC<{ children: React.ReactNode; side: 'left' | 'right' }> = ({ children, side }) => {
    return (
        <div className={`w-1/2 h-full relative z-20 flex items-center justify-center`}>
            {children}
        </div>
    );
};

const TextBox: React.FC<{ text: string; storyData: StoryData; language: Language; style?: React.CSSProperties; blobIndex: number; }> = ({ text, storyData, language, style, blobIndex }) => {
    const formattedText = useMemo(() => formatStoryTextHTML(text, storyData.childName), [text, storyData.childName]);
    if (!text) return null;

    const combinedStyle: React.CSSProperties = {
        ...style,
        backgroundColor: 'rgba(255, 255, 255, 0.75)', // Slightly more opaque for better contrast
        borderRadius: blobBorderRadii[blobIndex % blobBorderRadii.length],
        padding: '2.5rem 3rem', // Increased padding ("bigger than text")
        width: 'auto',
        maxWidth: '85%',
        minWidth: '240px',
        maxHeight: '60%',
        overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        lineHeight: '1.8', // "Stretched" vertical space
        letterSpacing: '0.025em', // "Stretched" horizontal space
        fontWeight: '700', // Bold/Black font
        color: '#000000', // Pure black
        fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Nunito, sans-serif', // Brand Fonts
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        border: '3px solid rgba(255, 255, 255, 0.8)',
    };

    return (
        <div
            style={combinedStyle}
            className={`story-text-container no-scrollbar ${getAgeBasedFontSizeClass(text, storyData.childAge)} transition-all duration-700`}
            dangerouslySetInnerHTML={{ __html: formattedText }}
        />
    );
};

const TextContainer: React.FC<{
    textBlocks: TextBlock[];
    storyData: StoryData;
    language: Language;
}> = ({ textBlocks, storyData, language }) => {
    if (!textBlocks || textBlocks.length === 0) return null;
    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            {textBlocks.map((block, index) => (
                <TextBox
                    key={index}
                    blobIndex={index}
                    text={block.text}
                    storyData={storyData}
                    language={language}
                    style={{ textAlign: 'center' }}
                />
            ))}
        </div>
    );
};

const Endpaper: React.FC = () => <div className="w-full h-full bg-white flex items-center justify-center opacity-10 grayscale brightness-150">
    <img src="https://imgur.com/WEMI2UE.png" className="w-32 h-auto" />
</div>;

const Cover: React.FC<{ storyData: StoryData, language: Language, onTitleChange: (v: string) => void, type: 'front' | 'back' }> = ({ storyData, language, onTitleChange, type }) => {
    const isFront = type === 'front';
    const isRtl = language === 'ar';

    // Orientation logic: Arabic (Front on Right), English (Front on Left)
    const bgPos = isFront
        ? (isRtl ? 'left center' : 'right center')
        : (isRtl ? 'right center' : 'left center');

    return (
        <div className="w-full h-full relative overflow-hidden"
            style={{
                backgroundImage: `url(data:image/jpeg;base64,${storyData.coverImageUrl})`,
                backgroundSize: '200% 100%',
                backgroundPosition: bgPos,
            }}>
            {isFront && (
                <div className="absolute top-[8%] left-0 w-full px-8 z-30 flex flex-col items-center text-center">
                    {language === 'en' ? (
                        // ENGLISH: "DESIGNED" TITLE (Titan One + Effects)
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
                            style={{
                                fontFamily: '"Titan One", sans-serif',
                                WebkitTextStroke: '3px white',
                                textShadow: '0px 8px 0px rgba(0,0,0,0.2), 0px 8px 24px rgba(0,0,0,0.4)',
                                transform: 'rotate(-2deg)',
                            }}
                            className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-brand-yellow to-brand-orange drop-shadow-2xl focus:outline-none transition-all hover:scale-105"
                        >
                            {storyData.title}
                        </div>
                    ) : (
                        // ARABIC: Standard Elegant Title
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
                            className={`w-full max-w-xl text-white drop-shadow-2xl focus:outline-none bg-black/20 p-6 md:p-8 rounded-[3rem] backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:bg-black/30 ${getTitleFontSizeClass(storyData.title, language)}`}
                        >
                            {storyData.title}
                        </div>
                    )}
                </div>
            )}
            <Watermark />
        </div>
    );
};

const PresentationView: React.FC<BookProps> = ({ storyData, language, onTitleChange }) => {
    const spreads = useMemo(() => {
        const result = [];
        for (let i = 0; i < storyData.pages.length; i += 2) {
            const p = storyData.pages[i];
            if (p) result.push(p);
        }
        return result;
    }, [storyData.pages]);

    const views = useMemo(() => ['cover', ...spreads.map((_, i) => i), 'back'], [spreads]);
    const [viewIndex, setViewIndex] = useState(0);

    const goNext = () => setViewIndex(i => Math.min(i + 1, views.length - 1));
    const goPrev = () => setViewIndex(i => Math.max(i - 1, 0));

    const currentView = views[viewIndex];

    const renderCurrentView = () => {
        if (currentView === 'cover') {
            return (
                <div className="aspect-[2/1.1] max-w-5xl mx-auto flex shadow-2xl rounded-3xl overflow-hidden border-8 border-white ring-1 ring-gray-200">
                    <PageWrapper side="left">
                        {language === 'en' ? <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="front" /> : <Endpaper />}
                    </PageWrapper>
                    <PageWrapper side="right">
                        {language === 'ar' ? <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="front" /> : <Endpaper />}
                    </PageWrapper>
                </div>
            );
        }

        if (currentView === 'back') {
            return (
                <div className="aspect-[2/1.1] max-w-5xl mx-auto flex shadow-2xl rounded-3xl overflow-hidden border-8 border-white ring-1 ring-gray-200">
                    <PageWrapper side="left">
                        {language === 'ar' ? <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="back" /> : <Endpaper />}
                    </PageWrapper>
                    <PageWrapper side="right">
                        {language === 'en' ? <Cover storyData={storyData} language={language} onTitleChange={onTitleChange} type="back" /> : <Endpaper />}
                    </PageWrapper>
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

interface BookProps {
    storyData: StoryData;
    language: Language;
    onTitleChange: (v: string) => void;
}

const ScrollView: React.FC<BookProps> = ({ storyData, language, onTitleChange }) => {
    const spreads = useMemo(() => {
        const result = [];
        for (let i = 0; i < storyData.pages.length; i += 2) {
            const p = storyData.pages[i];
            if (p) result.push(p);
        }
        return result;
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