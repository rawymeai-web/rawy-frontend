import React from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface CoverDebugScreenProps {
  storyData: StoryData;
  onContinue: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  language: Language;
}

const ImagePanel: React.FC<{ title: string; subtitle: string; imageBase64?: string; }> = ({ title, subtitle, imageBase64 }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col">
            <div className="border-b pb-2 mb-2">
                <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
            <div className="flex-grow bg-gray-100 rounded-md flex items-center justify-center min-h-[200px]">
                {imageBase64 ? (
                    <img 
                        src={`data:image/jpeg;base64,${imageBase64}`} 
                        alt={title} 
                        className="max-w-full max-h-full object-contain rounded-md"
                    />
                ) : (
                    <Spinner />
                )}
            </div>
        </div>
    );
};


const CoverDebugScreen: React.FC<CoverDebugScreenProps> = ({ storyData, onContinue, onRegenerate, onBack, language }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { coverDebugImages } = storyData;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
             <h2 className="text-3xl font-bold text-brand-navy text-center">{t('مراجعة إنشاء الغلاف', 'Cover Generation Review')}</h2>
             <p className="text-center text-gray-600 max-w-3xl mx-auto">
                {t(
                    'هذه هي مراحل إنشاء غلاف كتابك. تحقق من كل خطوة للتأكد من أن كل شيء يبدو مثاليًا قبل المتابعة لإنشاء صفحات القصة الداخلية.',
                    'These are the stages of your book cover\'s creation. Check each step to ensure everything looks perfect before proceeding to generate the inner story pages.'
                )}
             </p>
            
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-brand-navy text-center mb-2">{t('النتيجة النهائية (مع العناصر الإضافية)', 'Final Composite (with Overlays)')}</h3>
                <p className="text-sm text-gray-500 text-center mb-4">{t('هذا هو شكل الغلاف مع العناصر النائبة. سيتم وضع العنوان الفعلي والنص على العمود الفقري في حزمة الطباعة النهائية.', 'This is how the cover looks with placeholders. The final title and spine text will be rendered in the print package.')}</p>
                 <div className="flex-grow bg-gray-100 rounded-md flex items-center justify-center p-2">
                    {coverDebugImages?.finalComposite ? (
                        <img 
                            src={`data:image/jpeg;base64,${coverDebugImages.finalComposite}`} 
                            alt="Final Composite" 
                            className="max-w-full max-h-[400px] object-contain rounded-md shadow-inner"
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center"><Spinner /></div>
                    )}
                </div>
            </div>

            <div className="border-t pt-8">
                <h3 className="text-xl font-bold text-brand-navy text-center mb-4">{t('مراحل الإنشاء', 'Generation Steps')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ImagePanel 
                        title={t('الخطوة 1: المشهد الأساسي', 'STEP 1: Anchor Scene (1:1)')}
                        subtitle={t('إنشاء الصورة الرئيسية للغلاف', 'Generating the main story moment')}
                        imageBase64={coverDebugImages?.step1_anchorScene}
                    />
                    <ImagePanel 
                        title={t('الخطوة 2: الغلاف الأمامي', 'STEP 2: Front Cover (3:4)')}
                        subtitle={t('توسيع الصورة عموديًا لمساحة العنوان', 'Extending upwards for title space')}
                        imageBase64={coverDebugImages?.step2_frontCover}
                    />
                    <ImagePanel 
                        title={t('الخطوة 3: الغلاف الكامل', 'STEP 3: Full Wrap-around')}
                        subtitle={t('توسيع الصورة لتغطية الظهر والعمود الفقري', 'Inpainting to create back cover & spine')}
                        imageBase64={coverDebugImages?.step3_finalWrap}
                    />
                </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg space-y-4 text-center">
                <h3 className="text-xl font-bold text-brand-coral">{t('هل أنت راضٍ عن الغلاف؟', 'Happy with the cover?')}</h3>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                    <Button onClick={onBack} variant="outline" className="w-full sm:w-auto">
                        {t('رجوع (تغيير الحجم/الموضوع)', 'Go Back (Change Size/Theme)')}
                    </Button>
                    <Button onClick={onRegenerate} variant="secondary" className="w-full sm:w-auto">
                        {t('أعد إنشاء الغلاف', 'Regenerate Cover')}
                    </Button>
                    <Button onClick={onContinue} className="text-xl w-full sm:w-auto">
                        {t('متابعة وإنشاء القصة', 'Continue & Create Story')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CoverDebugScreen;