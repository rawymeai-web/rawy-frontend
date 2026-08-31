
import React, { useState } from 'react';
import { Button } from './Button';
import type { StoryData, Language } from '../types';
import * as fileService from '../services/fileService';

interface ShareComponentProps {
    storyData: StoryData;
    language: Language;
}

const ShareButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    className: string;
    ariaLabel: string;
}> = ({ onClick, children, className, ariaLabel }) => (
    <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform hover:scale-110 ${className}`}
    >
        {children}
    </button>
);


const ShareComponent: React.FC<ShareComponentProps> = ({ storyData, language }) => {
    const [copied, setCopied] = useState(false);
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

    const storyId = storyData.orderId || (storyData as any).orderNumber || (storyData as any).id;
    const storyUrl = storyId ? `${window.location.origin}/?story=${encodeURIComponent(storyId)}` : window.location.origin;

    const handleDownloadCover = () => {
        fileService.downloadCoverImage(storyData, language);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(storyUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch (e) {
            prompt(t('انسخ الرابط التالي:', 'Copy this story link:'), storyUrl);
        }
    };

    const handleShare = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
        const shareText = t(
            `✨ اقرأ قصة طفلي المخصصة "${storyData.title}" على راوي 📖!`,
            `✨ Read my child's custom storybook "${storyData.title}" on Rawy 📖!`
        );
        const fullMessage = `${shareText}\n${storyUrl} #Rawy #PersonalizedBook`;

        let url = '';
        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}&quote=${encodeURIComponent(shareText)}`;
                break;
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
                break;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="p-8 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white space-y-6 max-w-2xl mx-auto text-brand-navy">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-black uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">share</span>
                    {t('رابط القصة العام', 'Public Story Link')}
                </div>
                <h3 className="text-2xl font-black text-brand-navy">{t('شارك هذه القصة مع العائلة والأصدقاء!', 'Share This Story With Family & Friends!')}</h3>
                <p className="text-sm text-brand-navy/70 max-w-md mx-auto">
                    {t('يمكن لأي شخص فتح الرابط وقراءة القصة كاملة على هاتفه بدون الحاجة لتسجيل الدخول ✨', 'Anyone with the link can open and flip through the complete story without needing to log in ✨')}
                </p>
            </div>

            {/* Direct Link Box */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-200">
                <input 
                    type="text" 
                    readOnly 
                    value={storyUrl} 
                    className="flex-1 px-4 py-2.5 bg-transparent text-xs font-mono font-bold text-gray-700 outline-none select-all truncate"
                />
                <button
                    onClick={handleCopyLink}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                        copied ? 'bg-emerald-600 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                    }`}
                >
                    <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                    <span>{copied ? t('تم النسخ! ✓', 'Copied! ✓') : t('نسخ الرابط', 'Copy Link')}</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100">
                <Button onClick={handleDownloadCover} variant="secondary" className="w-full sm:w-auto flex items-center justify-center gap-2 !px-6 !py-3 !rounded-2xl text-xs font-black uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">download</span>
                    {t('تنزيل الغلاف', 'Download Cover')}
                </Button>

                <div className="flex items-center justify-center gap-3">
                    <ShareButton onClick={() => handleShare('whatsapp')} className="!w-12 !h-12 bg-[#25D366] hover:bg-[#20bd5a]" ariaLabel="Share on WhatsApp">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.75 13.96c.27.42.36.94.11 1.46l-.11.23c-.27.53-.76 1.03-1.24 1.22-.49.19-1.22.38-1.7.19-.48-.19-1.34-.67-2.3-1.14-.95-.48-2.02-1.34-2.82-2.3-1.05-1.24-1.52-2.67-1.43-3.72.09-1.05.67-1.81 1.24-2.19.58-.38 1.22-.58 1.7-.58.26 0 .51.1.75.29l.11.09c.49.48.58 1.22.58 1.46 0 .23-.09.48-.28.72l-.11.13c-.23.28-.47.52-.47.62 0 .09.1.18.28.37.19.19.38.37.67.66.28.28.47.47.76.76.28.28.47.47.56.47.09 0 .28-.19.56-.47.28-.28.47-.47.47-.47.23-.28.47-.47.75-.47.28 0 .57.09.76.19zM12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                    </ShareButton>
                    <ShareButton onClick={() => handleShare('facebook')} className="!w-12 !h-12 bg-[#1877F2] hover:bg-[#166fe5]" ariaLabel="Share on Facebook">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0H14.192C10.596 0 9 1.583 9 4.615z" /></svg>
                    </ShareButton>
                    <ShareButton onClick={() => handleShare('twitter')} className="!w-12 !h-12 bg-[#1DA1F2] hover:bg-[#1a94df]" ariaLabel="Share on Twitter">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </ShareButton>
                </div>
            </div>
        </div>
    );
};

export default ShareComponent;
