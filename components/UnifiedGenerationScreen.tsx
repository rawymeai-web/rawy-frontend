
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Logo } from './Logo';
import { QuillGame } from './games/QuillGame';
import { FlyingHeroGame } from './games/FlyingHeroGame';
import { ColorSortGame } from './games/ColorSortGame';
import { ItemMergeGame } from './games/ItemMergeGame';
import { useStory } from '../context/StoryContext';
import { WorkflowDebugger } from './WorkflowDebugger';
import type { Language } from '../types';

interface UnifiedGenerationScreenProps {
    progress: number; // 0-100 Global Progress
    statusMessage: string;
    onComplete: () => void;
    language: Language;
    quote?: string;
    onStartWorkflow?: () => void; // NEW: Trigger for generation
}

export const UnifiedGenerationScreen: React.FC<UnifiedGenerationScreenProps> = ({ progress, statusMessage, onComplete, language, quote, onStartWorkflow }) => {
    const { storyData } = useStory();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [showPopup, setShowPopup] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [activeGameIndex, setActiveGameIndex] = useState(0);
    const [isGameHidden, setIsGameHidden] = useState(false);

    const GAMES = [
        { id: 'fly', name: t('تحليق البطل', 'Hero Flight'), component: FlyingHeroGame },
        { id: 'quill', name: t('جمع الريش', 'Quill Collect'), component: QuillGame },
        { id: 'sort', name: t('فرز الألوان', 'Color Sort'), component: ColorSortGame },
        { id: 'merge', name: t('دمج العناصر', 'Item Merge'), component: ItemMergeGame },
    ];

    const ActiveGame = GAMES[activeGameIndex].component;

    // Simulate completion when progress hits 100 (in a real app, this is driven by the parent)
    useEffect(() => {
        if (progress >= 100) {
            const timer = setTimeout(onComplete, 1500);
            return () => clearTimeout(timer);
        }
    }, [progress, onComplete]);

    const submitContactInfo = (e: React.FormEvent) => {
        e.preventDefault();
        setShowPopup(false);
        // In a real app, save this to Supabase/Marketing list
        console.log("Contact Info Captured:", { email, phone });
    };

    return (
        <div className="fixed inset-0 bg-[#FAF9F6] flex flex-col items-center justify-center p-4 z-50 overflow-hidden">

            {/* Header: Global Progress */}
            <div className="absolute top-0 inset-x-0 p-6 bg-white/95 backdrop-blur-xl z-[60] shadow-lg border-b border-gray-200">
                <div className="max-w-4xl mx-auto flex items-center gap-6">
                    <div className="w-12 opacity-50"><Logo /></div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-baseline">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black text-brand-navy tracking-tight">{statusMessage}</h2>
                                {storyData.orderId && (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -mt-1">
                                        {t('رقم الطلب', 'Order Number')}: {storyData.orderId}
                                    </span>
                                )}
                            </div>
                            <span className="text-2xl font-black text-brand-orange font-mono">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-black/5">
                            <div
                                className="h-full bg-gradient-to-r from-brand-orange via-brand-yellow to-brand-teal transition-all duration-700 ease-out shadow-[0_0_15px_rgba(246,147,56,0.3)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    {/* NEW: Guidebook Logs Button */}
                    {storyData.workflowLogs && storyData.workflowLogs.length > 0 && (
                        <button
                            onClick={() => setShowLogs(true)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                        >
                            Logs ({storyData.workflowLogs.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-5xl h-[70vh] relative mt-12 bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white ring-1 ring-black/5">

                {isGameHidden ? (
                    // "Relax" View
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 animate-fade-in bg-gradient-to-b from-blue-50 to-white">
                        <div className="w-32 h-32 relative">
                            <Spinner />
                            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">✨</div>
                        </div>
                        <div className="text-center space-y-2 px-8">
                            <h3 className="text-3xl font-black text-brand-navy">{t('يتم تجهيز قصتك...', 'Crafting your story...')}</h3>
                            <p className="text-brand-navy/60 font-medium">{t('أشياء عظيمة تستغرق وقتاً', 'Good things take time')}</p>
                            {quote && (
                                <div className="mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-brand-orange/30 max-w-lg mx-auto transform rotate-1 transition-all hover:rotate-0">
                                    <p className="text-brand-orange font-handwriting text-xl italic leading-relaxed">
                                        "{quote}"
                                    </p>
                                </div>
                            )}
                        </div>
                        <Button onClick={() => setIsGameHidden(false)} variant="outline" className="mt-8 rounded-full px-8">
                            {t('لعب الألعاب', 'Play Games')}
                        </Button>
                    </div>
                ) : (
                    // Game Arcade View
                    <div className="absolute inset-0 flex flex-col">
                        {/* Game Area */}
                        <div className="flex-1 relative bg-gray-50 overflow-hidden">
                            <ActiveGame
                                onComplete={() => { }} // Games loop forever here
                                characterImage={storyData.mainCharacter.imageBases64[0] || storyData.styleReferenceImageBase64}
                            />
                        </div>

                        {/* Arcade Controls */}
                        <div className="h-24 bg-white border-t border-gray-100 flex items-center justify-between px-8 shadow-2xl z-30">
                            <div className="flex gap-2">
                                {GAMES.map((g, i) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setActiveGameIndex(i)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeGameIndex === i
                                            ? 'bg-brand-navy text-white shadow-lg scale-105'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsGameHidden(true)}
                                className="text-xs font-bold text-gray-400 hover:text-brand-coral uppercase tracking-widest transition-colors"
                            >
                                {t('تخطي ومشاهدة التقدم فقط', 'Skip & Watch Progress')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Popup */}
            {showPopup && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full animate-bounce-in text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-orange to-brand-coral"></div>

                        <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto text-3xl">🚀</div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-brand-navy uppercase tracking-tight">
                                {t('بدأت رحلة القصة!', 'Your Story Has Started!')}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {t('سنقوم بتحديثك عند انتهاء كل مرحلة. أدخل معلوماتك لنرسل لك الإشعار.', 'We will update you on the progress. Good things take time! Enter your info to get notified when ready.')}
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                                <div className="text-2xl">✅</div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{t('تم تأكيد الدفع', 'Payment Confirmed')}</p>
                                    <p className="text-lg font-black text-brand-navy font-mono tracking-tight">{storyData.orderId}</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">
                                {t('بطلنا جاهز للمغامرة! اضغط أدناه لبدء صنع القصة السحرية.', 'Our hero is ready! Click below to start crafting your magical story.')}
                            </p>

                            <Button
                                onClick={() => {
                                    setShowPopup(false);
                                    onStartWorkflow?.();
                                    onComplete(); // Jump straight to Editor Screen
                                }}
                                className="w-full py-4 rounded-xl text-lg shadow-xl mt-2 animate-pulse"
                            >
                                {t('ابدأ المغامرة السحرية!', 'Start Magical Adventure!')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Debugger Overlay */}
            {showLogs && storyData.workflowLogs && (
                <WorkflowDebugger logs={storyData.workflowLogs} onClose={() => setShowLogs(false)} />
            )}
        </div>
    );
};

