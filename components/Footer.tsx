
import React from 'react';
import type { Language } from '../types';
import { getPrompts, fetchPrompts } from '../services/promptService';

interface FooterProps {
    language: Language;
    onCheckOrderStatus: () => void;
}

const Footer: React.FC<FooterProps> = ({ language, onCheckOrderStatus }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const prompts = getPrompts();

    const links = [
        { href: '#', ar: 'اتصل بنا', en: 'Contact Us', isExternal: true },
        { href: '#', ar: 'طلباتي', en: 'My Order', onClick: onCheckOrderStatus },
        { href: '#', ar: 'من نحن', en: 'About Us', isExternal: true },
        { href: '#', ar: 'الأسئلة الشائعة', en: 'FAQ' },
    ];

    return (
        <footer className="bg-brand-navy text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

                    {/* Brand Section */}
                    <div className="text-center md:text-left rtl:md:text-right space-y-2">
                        <div className="flex items-center justify-center md:justify-start rtl:md:justify-end gap-3 mb-2">
                            {/* Text Logo Replacement to fix white boxes */}
                            <h1 className="text-3xl font-black tracking-tight text-white">Rawy</h1>
                        </div>
                        <p className="text-sm text-white/80 font-medium max-w-xs">
                            {t('حيث يصبح كل طفل بطلاً في قصته الخاصة.', 'Where every child becomes the hero of their own story.')}
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 font-medium">
                        {links.map(link => {
                            if (link.onClick) {
                                return (
                                    <button key={link.en} onClick={link.onClick} className="text-white hover:text-brand-orange transition-colors bg-transparent border-none">
                                        {t(link.ar, link.en)}
                                    </button>
                                );
                            }
                            return (
                                <a
                                    key={link.en}
                                    href={link.href}
                                    className="text-white hover:text-brand-orange transition-colors"
                                    {...(link.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                >
                                    {t(link.ar, link.en)}
                                </a>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/60 gap-4">
                    <p>&copy; {new Date().getFullYear()} Rawy. {t('جميع الحقوق محفوظة.', 'All rights reserved.')}</p>
                    <div className="flex items-center gap-4">
                        <p className="font-bold opacity-80">Powered by Albumii</p>
                        <span className="opacity-30">|</span>
                        <p className="font-mono opacity-50">v{prompts.coverSuperPrompt.version}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
