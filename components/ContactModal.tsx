import React, { useState } from 'react';
import { Button } from './Button';
import type { Language } from '../types';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, language }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate message dispatch
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            setName('');
            setEmail('');
            setPhone('');
            setMessage('');
            onClose();
        }, 2500);
    };

    return (
        <div className="fixed inset-0 bg-[#001a40]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
            <div className="bg-white/90 border border-white/60 shadow-2xl rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 relative overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Background glow decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-teal/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors outline-none cursor-pointer"
                >
                    <svg className="w-5 h-5 text-brand-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {isSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
                        </div>
                        <h3 className="text-2xl font-black text-brand-navy">
                            {t('شكراً لتواصلك معنا!', 'Thank you for reaching out!')}
                        </h3>
                        <p className="text-sm text-brand-navy/60 font-bold max-w-xs leading-relaxed">
                            {t('لقد تم استلاف رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت ممكن.', 'Your message has been received. We will get back to you shortly.')}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-y-auto space-y-6">
                        <div>
                            <h2 className="text-3xl font-black text-brand-navy uppercase tracking-tight">
                                {t('اتصل بنا', 'Contact Us')}
                            </h2>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                {t('يسعدنا الرد على جميع استفساراتك', 'We are happy to answer your questions')}
                            </p>
                        </div>

                        {/* Direct Contact Numbers */}
                        <div className="bg-brand-navy text-white p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-brand-orange text-xl">phone_in_talk</span>
                                <div className="text-start">
                                    <span className="block text-[8px] text-white/50 font-black uppercase tracking-wider">{t('الهاتف', 'Phone Support')}</span>
                                    <a href="tel:+96522200000" className="text-sm font-black hover:text-brand-orange transition-colors">+965 2220 0000</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                                <span className="material-symbols-outlined text-brand-orange text-xl">mail</span>
                                <div className="text-start">
                                    <span className="block text-[8px] text-white/50 font-black uppercase tracking-wider">{t('البريد الإلكتروني', 'Email Support')}</span>
                                    <a href="mailto:support@rawytime.com" className="text-sm font-black hover:text-brand-orange transition-colors">support@rawytime.com</a>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 text-start">
                            <div>
                                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.15em] mb-1.5">{t('الاسم', 'Name')}</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-brand-navy/5 rounded-xl focus:ring-2 focus:ring-brand-orange/50 outline-none text-sm font-bold text-brand-navy"
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.15em] mb-1.5">{t('البريد الإلكتروني', 'Email')}</label>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-brand-navy/5 rounded-xl focus:ring-2 focus:ring-brand-orange/50 outline-none text-sm font-bold text-brand-navy"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.15em] mb-1.5">{t('رقم الهاتف', 'Phone Number')}</label>
                                    <input 
                                        type="tel" 
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-brand-navy/5 rounded-xl focus:ring-2 focus:ring-brand-orange/50 outline-none text-sm font-bold text-brand-navy"
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.15em] mb-1.5">{t('الرسالة', 'Message')}</label>
                                <textarea 
                                    rows={3} 
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-brand-navy/5 rounded-xl focus:ring-2 focus:ring-brand-orange/50 outline-none text-sm font-bold text-brand-navy resize-none"
                                    required 
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                        {t('جاري الإرسال...', 'Sending...')}
                                    </>
                                ) : (
                                    t('إرسال الرسالة', 'Send Message')
                                )}
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
