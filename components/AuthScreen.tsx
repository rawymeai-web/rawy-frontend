import React, { useState } from 'react';
import { Button } from './Button';
import { Logo } from './Logo';
import { authService } from '@/services/authService';
import { motion } from 'framer-motion';

interface AuthScreenProps {
    onBack: () => void;
    onSuccess: (user: any) => void;
    language: 'ar' | 'en';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack, onSuccess, language }) => {
    const [isLoading, setIsLoading] = useState(false);
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await authService.signInWithGoogle();
        } catch (e) {
            alert(t('فشل تسجيل الدخول بجوجل', 'Google login failed'));
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            await authService.signInWithApple();
        } catch (e) {
            alert(t('فشل تسجيل الدخول بآبل', 'Apple login failed'));
            setIsLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setIsLoading(true);
        try {
            await authService.signInWithFacebook();
        } catch (e) {
            alert(t('فشل تسجيل الدخول بفيسبوك', 'Facebook login failed'));
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        try {
            await authService.signInWithOtp(email);
            setEmailSent(true);
        } catch (e) {
            alert(t('فشل إرسال الرابط', 'Failed to send magic link'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3.5rem] shadow-2xl border border-white/60 max-w-lg w-full text-center space-y-8 relative overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-orange/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-teal/10 rounded-full -ml-20 -mb-20 blur-3xl animate-pulse" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-gray-50 overflow-hidden p-3">
                        <Logo showText={false} className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-brand-navy uppercase tracking-tighter">
                            {t('مرحباً بك مجدداً', 'Welcome Explorer')}
                        </h2>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] max-w-[200px] mx-auto leading-relaxed">
                            {t('سجل دخولك للوصول إلى عالمك السحري', 'Sign in to access your magical library')}
                        </p>
                    </div>
                </div>

                {emailSent ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-10 space-y-6"
                    >
                        <div className="w-20 h-20 bg-brand-teal/10 text-brand-teal rounded-full flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-brand-navy">{t('تحقق من بريدك', 'Check your Email')}</h3>
                            <p className="text-sm text-gray-500 font-medium mt-2">{t('لقد أرسلنا لك رابطاً سحرياً للدخول', "We've sent a magic link to your inbox")}</p>
                        </div>
                        <Button onClick={() => setEmailSent(false)} variant="outline" className="w-full">
                            {t('العودة', 'Go Back')}
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-8 relative z-10">
                        {/* Social Buttons */}
                        <div className="space-y-4">
                            <button 
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-4 bg-white border border-gray-100 py-5 rounded-3xl hover:border-brand-orange hover:shadow-xl hover:shadow-brand-orange/5 transition-all group disabled:opacity-50"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.16 1.54 15.3 0 12 0 7.31 0 3.25 2.67 1.25 6.57l4.13 3.2C6.39 7.04 8.97 5.04 12 5.04z"/>
                                    <path fill="#4285F4" d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.66-5.02 3.66-8.73z"/>
                                    <path fill="#FBBC05" d="M5.38 14.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.25 7.03C.45 8.54 0 10.22 0 12s.45 3.46 1.25 4.97l4.13-3.2z"/>
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.76-2.91c-1.08.72-2.45 1.16-4.17 1.16-3.03 0-5.61-2.02-6.53-4.73l-4.13 3.2C3.25 21.33 7.31 24 12 24z"/>
                                </svg>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-brand-navy">
                                    {t('الدخول بحساب Google', 'Continue with Google')}
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t('أو عبر البريد', 'Or via Email')}</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <input 
                                type="email" 
                                placeholder={t('بريدك الإلكتروني...', 'Your email address...')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all font-bold text-brand-navy"
                            />
                            <button 
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full bg-brand-navy text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-brand-orange hover:shadow-2xl hover:shadow-brand-orange/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {t('دخول الرابط السحري', 'Send Magic Link')}
                                        <span className="material-symbols-outlined text-xl group-hover:translate-x-2 transition-transform">bolt</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                    <button onClick={onBack} className="text-xs font-bold text-gray-400 hover:text-brand-orange uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        {t('العودة', 'Back')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
