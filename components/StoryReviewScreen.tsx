import React from 'react';
import { Button } from './Button';
import type { StoryPlan, Language, StoryData } from '../types';

interface StoryReviewScreenProps {
  plan: StoryPlan;
  onApprove: () => void;
  onBack: () => void;
  language: Language;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-navy/5 rounded-xl text-brand-coral">{icon}</div>
            <h3 className="text-xl font-bold text-brand-navy">{title}</h3>
        </div>
        <div className="flex-grow space-y-2 text-brand-navy/80 leading-relaxed font-medium">
            {children}
        </div>
    </div>
);

const StoryReviewScreen: React.FC<StoryReviewScreenProps> = ({ plan, onApprove, onBack, language }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-12">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">
                    {t('مراجعة هيكل القصة', 'Review Story Blueprint')}
                </h2>
                <p className="text-xl text-brand-navy/70 max-w-3xl mx-auto">
                    {t('قام المهندس المعماري للقصة بإنشاء مسار رحلتك. راجع العناصر الأساسية قبل أن نبدأ في رسم العوالم.', 'The Story Architect has created your path. Review the core elements before we start painting the worlds.')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard title={t('جوهر القصة', 'Story Core')} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}>
                    <p><strong>{t('رغبة البطل:', 'Hero Desire:')}</strong> {plan.core.heroDesire}</p>
                    <p><strong>{t('التحدي:', 'Main Challenge:')}</strong> {plan.core.mainChallenge}</p>
                </InfoCard>

                <InfoCard title={t('المحركات والموانع', 'Engines & Limits')} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                    <p><strong>{t('المحفز (Catalyst):', 'The Catalyst:')}</strong> {plan.core.catalyst}</p>
                    <p><strong>{t('المعيق (Limiter):', 'The Limiter:')}</strong> {plan.core.limiter}</p>
                </InfoCard>

                <InfoCard title={t('توزيع الأدوار', 'Character Roles')} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}>
                    {plan.characterRoles.map((char, i) => (
                        <div key={i} className="mb-2 last:mb-0 pb-2 border-b border-navy/5 last:border-0">
                            <p><strong>{char.name}:</strong> <span className="text-brand-coral uppercase text-xs font-black">{char.roleType}</span></p>
                            <p className="text-xs italic">{char.influence}</p>
                        </div>
                    ))}
                </InfoCard>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-baby-blue/10 rounded-xl text-brand-teal">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-navy">{t('مخطط الصفحات (8 صفحات مزدوجة)', 'Spread-by-Spread Plan (8 Spreads)')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plan.phases.map((phase, i) => (
                        <div key={i} className="p-4 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 space-y-1">
                            <p className="text-xs font-black text-brand-coral uppercase tracking-widest">{t(`المرحلة ${phase.phaseNumber}`, `Phase ${phase.phaseNumber}`)}</p>
                            <p className="font-bold text-brand-navy text-sm leading-tight">{phase.purpose}</p>
                            <p className="text-xs text-brand-navy/60 italic">{phase.keyAction}</p>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-navy/5">
                    <h4 className="text-sm font-black uppercase text-brand-navy/40 tracking-tighter mb-4">{t('مراسي التناسق البصري', 'Visual Consistency Anchors')}</h4>
                    <div className="flex flex-wrap gap-3">
                        {plan.consistencyAnchors.map((anchor, i) => (
                            <div key={i} className="bg-white border px-4 py-2 rounded-full shadow-sm text-sm">
                                <span className="font-bold text-brand-navy">{anchor.objectName}:</span> {anchor.description}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl">
                    {t('رجوع وتعديل', 'Back & Modify')}
                </Button>
                <Button onClick={onApprove} className="text-xl px-16 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                    {t('الموافقة وبدء الرسم!', 'Approve & Start Painting!')}
                </Button>
            </div>
        </div>
    );
};

export default StoryReviewScreen;