
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
// Added missing Logo import
import { Logo } from './Logo';
import type { Language } from '../types';

interface WorkflowScreenProps {
    stage: number;
    artifact: any;
    previousArtifact?: any;
    isLoading: boolean;
    onApprove: () => void;
    onBack: () => void;
    language: Language;
}

import { useStory } from '../context/StoryContext';
import * as adminService from '../services/adminService';
import { FlyingHeroGame } from './games/FlyingHeroGame';
import { ColorSortGame } from './games/ColorSortGame';
import { ItemMergeGame } from './games/ItemMergeGame';

const WorkflowScreen: React.FC<WorkflowScreenProps> = ({ stage, artifact, previousArtifact, isLoading, onApprove, onBack, language }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const [simulatedProgress, setSimulatedProgress] = useState(0);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const settings = adminService.getSettings();
    const isDebug = settings.enableDebugView;
    const { storyData } = useStory(); // Access Story Context

    // AUTO-ADVANCE LOGIC: If not in debug mode, automatically approve when loading finishes
    useEffect(() => {
        if (!isDebug && !isLoading) {
            // Give user a moment to see "Done" if they are playing
            const delay = (stage === 2 || stage === 3 || stage === 4) ? 2000 : 1500;
            const timer = setTimeout(() => {
                onApprove();
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isDebug, onApprove, stage]);

    const stages = [
        { name: t('المسودة الأولية: بذور القصة', 'Junior Writer: Story DNA'), tasks: [t('تحليل ملامح البطل...', 'Analyzing Hero DNA...'), t('بناء الهيكل القصصي...', 'Building Narrative Engine...')] },
        { name: t('مراجعة المحرر الخبير', 'Senior Editor: Plot Audit'), tasks: [t('تطبيق القواعد الصارمة...', 'Applying Guardrails...'), t('تحسين الحبكة الدرامية...', 'Polishing Narrative Flow...')] },
        { name: t('تخطيط الإخراج البصري', 'Visual Director: Canvas'), tasks: [t('تثبيت مراسي التناسق...', 'Fixing Visual Anchors...'), t('تخطيط المشاهد البانورامية...', 'Drafting 16:9 Continuity...')] },
        { name: t('مراجعة المدير الفني', 'Creative Director: Quality'), tasks: [t('فحص الاتساق المكاني...', 'Checking Spatial Logic...'), t('التأكد من ظهور البطل...', 'Confirming Hero Visibility...')] },
        { name: t('بناء الأوامر التقنية', 'Prompt Engineer: Logic'), tasks: [t('تحويل الرؤية إلى الأوامر...', 'Coding Visual Logic...'), t('تطبيق مبدأ المساحات الطبيعية...', 'Applying Natural Space Guardrails...')] },
        { name: t('المراجعة النهائية للجودة', 'QA Final Lock'), tasks: [t('الفحص التقني النهائي...', 'Final syntax audit...'), t('تأمين قفل التناسق البصري...', 'Securing production lock...')] },
    ];

    useEffect(() => {
        let interval: any;
        if (isLoading) {
            setSimulatedProgress(0);
            setCurrentTaskIndex(0);
            interval = setInterval(() => {
                setSimulatedProgress(prev => (prev < 95 ? prev + Math.random() * 5 : prev + 0.1));
                setCurrentTaskIndex(prev => (prev + 1) % (stages[stage - 1]?.tasks.length || 1));
            }, 2500);
        } else { setSimulatedProgress(100); }
        return () => clearInterval(interval);
    }, [isLoading, stage]);

    const renderArtifact = () => {
        if (!isDebug) return null; // HIDDEN IN NORMAL MODE
        if (!artifact) return null;

        return (
            <div className="bg-white rounded-[2rem] shadow-inner border border-gray-100 p-8 overflow-y-auto max-h-[60vh] no-scrollbar">
                {/* ... existing artifact debug rendering ... */}
                <div className="space-y-8">
                    {stage <= 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="p-6 bg-brand-navy/5 rounded-3xl border border-brand-navy/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10"><Logo /></div>
                                <h4 className="text-2xl font-black text-brand-navy uppercase mb-6 tracking-tighter border-b border-brand-navy/10 pb-2">{artifact.foundation?.title}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-5">
                                        <div className="group"><p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1 group-hover:text-brand-navy transition-colors">Desire</p><p className="text-md font-bold text-brand-navy leading-tight">{artifact.foundation?.storyCore}</p></div>
                                        <div className="group"><p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1 group-hover:text-brand-navy transition-colors">Challenge</p><p className="text-md font-bold text-brand-navy leading-tight">{artifact.foundation?.mainChallenge}</p></div>
                                        <div className="group"><p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1 group-hover:text-brand-navy transition-colors">End State</p><p className="text-md font-bold text-brand-navy leading-tight">{artifact.foundation?.moral}</p></div>
                                    </div>
                                    <div className="space-y-5 p-5 bg-white/60 rounded-2xl border border-dashed border-brand-navy/20">
                                        <div className="group"><p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.2em] mb-1">Catalyst</p><p className="text-sm italic font-medium text-brand-navy/80 leading-snug">{artifact.foundation?.catalyst}</p></div>
                                        <div className="group"><p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.2em] mb-1">Limiter</p><p className="text-sm italic font-medium text-brand-navy/80 leading-snug">{artifact.foundation?.limiter}</p></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {artifact.structure?.spreads?.map((s: any) => (
                                    <div key={s.spreadNumber} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-teal transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spread {s.spreadNumber}</p>
                                        </div>
                                        <p className="text-xs font-bold text-brand-navy mt-1 leading-relaxed italic">"{s.narrative}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(stage === 3 || stage === 4) && (
                        <div className="space-y-6 animate-fade-in">
                            <h4 className="text-xl font-black text-brand-teal uppercase tracking-tight">{t('خطة الإخراج الفني المعتمدة', 'Approved Art Direction Plan')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {artifact.spreads?.map((s: any) => (
                                    <div key={s.spreadNumber} className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-black text-blue-400 uppercase">Spread {s.spreadNumber}</p>
                                            <span className="text-[9px] px-2 py-0.5 bg-blue-500 text-white rounded-full font-black uppercase tracking-tighter">{s.mainContentSide} Focus</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-800 leading-tight">{s.keyActions}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {stage >= 5 && (
                        <div className="space-y-4 animate-fade-in">
                            <h4 className="text-xl font-black text-purple-600 uppercase tracking-widest">{t('أوامر الإنتاج النهائية (المقفل)', 'Final Production Payload (Locked)')}</h4>
                            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-[10px] text-green-700 font-black mb-2 flex items-center gap-3">
                                <span className="text-2xl">🛡️</span>
                                {t('تم تأمين المساحات الطبيعية وضمان تكامل الملامح بنسبة 100%.', 'Natural Space composition & perfect likeness logic locked for production.')}
                            </div>
                            {Array.isArray(artifact) && artifact.map((p: string, i: number) => (
                                <div key={i} className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl font-mono text-[10px] text-purple-900 leading-relaxed shadow-sm">
                                    <span className="font-black text-purple-400 mr-2 border-r pr-2">S{i + 1}</span> {p}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-enter-forward pb-12">
            <div className="flex justify-between items-center px-4">
                {/* Simplified Header for User Mode */}
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-brand-coral tracking-[0.3em]">
                        {isDebug ? `Phase ${stage} of 6` : t('جاري بناء القصة...', 'Building Story...')}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-brand-navy tracking-tighter italic">
                        {isDebug ? stages[stage - 1]?.name : t('السحر يحدث الآن', 'Magic is Happening')}
                    </h2>
                </div>
            </div>

            <div className="relative min-h-[300px] md:min-h-[480px] bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-center">
                {/* Unified Loading/Progress View */}
                <div className="flex flex-col items-center justify-center space-y-10 w-full max-w-lg">
                    {/* Only show spinner if actually loading or if not debug (so it looks busy during auto-advance) */}
                    {(isLoading || (!isDebug && stage < 6)) ? (
                        <>
                            {stage === 2 ? (
                                <FlyingHeroGame
                                    characterImage={storyData.mainCharacter.imageBases64[0]}
                                    onComplete={() => !isDebug && onApprove()}
                                />
                            ) : stage === 3 ? (
                                <ColorSortGame onComplete={() => !isDebug && onApprove()} />
                            ) : stage === 4 ? (
                                <ItemMergeGame onComplete={() => !isDebug && onApprove()} />
                            ) : (
                                <>
                                    <div className="relative">
                                        <Spinner />
                                        <span className="absolute inset-0 flex items-center justify-center font-black text-brand-orange">{stage}</span>
                                    </div>

                                    <div className="text-center space-y-5 w-full">
                                        <p className="text-2xl font-black text-brand-navy uppercase tracking-tighter animate-pulse">
                                            {stages[stage - 1]?.tasks[currentTaskIndex]}
                                        </p>
                                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner p-0.5 border">
                                            <div className="bg-gradient-to-r from-brand-orange to-brand-yellow h-full transition-all duration-700 ease-out rounded-full shadow-[0_0_15px_rgba(246,147,56,0.4)]" style={{ width: `${simulatedProgress}%` }}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        isDebug ? renderArtifact() : (
                            <div className="text-center space-y-4 animate-enter-forward">
                                <span className="text-6xl mb-4 block">✨</span>
                                <h3 className="text-2xl font-bold text-brand-navy">Done! Starting next step...</h3>
                            </div>
                        )
                    )}
                </div>

                {/* Only render detailed artifact if debug is ON and we are NOT loading */}
                {!isLoading && isDebug && renderArtifact()}
            </div>

            {/* Controls - Hide in normal mode unless stuck or final step */}
            <div className={`flex flex-col sm:flex-row justify-center items-center gap-6 transition-opacity duration-500 ${!isDebug && isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {isDebug && <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl border-2 transition-all hover:bg-brand-navy hover:text-white" disabled={isLoading}>{t('رجوع', 'Back')}</Button>}

                {/* On final stage in auto-mode, or always in debug mode, show button */}
                <Button onClick={onApprove} className="text-xl px-16 py-4 rounded-2xl shadow-2xl shadow-brand-coral/40 min-w-[250px]" disabled={isLoading}>
                    {isLoading ? t('جاري المعالجة...', 'Thinking...') : (stage === 6 ? t('اعتماد وبدء الرسم!', 'Start Painting Now!') : t('موافقة ومتابعة', 'Approve & Continue'))}
                </Button>
            </div>
        </div>
    );
};

export default WorkflowScreen;
