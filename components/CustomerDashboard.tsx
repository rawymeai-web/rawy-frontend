import React, { useState, useEffect } from 'react';
import { backendApi } from '../services/backendApi';
import { authService } from '../services/authService';
import type { Language, DbOrderStatus, Subscription, AdminOrder } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface DashboardProps {
    language: Language;
    onLogout: () => void;
    onEditPreferences: () => void;
    onViewBook: (order: AdminOrder) => void;
    onOrderPrint: (order: AdminOrder) => void;
    onBack: () => void;
    onStartAdventure: () => void;
}

export const CustomerDashboard: React.FC<DashboardProps> = ({ 
    language, 
    onLogout, 
    onEditPreferences, 
    onViewBook, 
    onOrderPrint,
    onBack,
    onStartAdventure
}) => {
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const initDashboard = async () => {
            try {
                setIsLoading(true);
                const currentUser = await authService.getUser();
                setUser(currentUser);
                
                if (currentUser) {
                    const identifier = currentUser.email || currentUser.id;
                    const data = await backendApi.getCustomerDashboard(identifier);
                    setActiveSub(data?.subscription || null);
                    setOrders(data?.orders || []);
                }
            } catch (err) {
                console.error("Dashboard failed to load", err);
            } finally {
                setIsLoading(false);
            }
        };
        initDashboard();
    }, []);

    const getStatusBadge = (dbStatus: DbOrderStatus | string) => {
        const friendlyMap: Record<string, string> = {
            'paid_confirmed': t('تم تأكيد الطلب', 'Order Confirmed'),
            'processing': t('جاري التجهيز والرسم', 'In Production'),
            'Processing': t('جاري التجهيز والرسم', 'In Production'),
            'queued': t('في قائمة الانتظار', 'In Queue'),
            'story_generating': t('كتابة القصة', 'Drafting Story'),
            'story_ready': t('تمت كتابة القصة', 'Story Ready'),
            'illustrations_generating': t('رسم الصور', 'Painting Illustrations'),
            'illustrations_ready': t('الصور جاهزة', 'Illustrations Ready'),
            'book_compiling': t('تجميع الكتاب', 'Binding Book'),
            'softcopy_ready': t('النسخة الرقمية جاهزة!', 'Digital Book Ready!'),
            'awaiting_preview_approval': t('القصة جاهزة للقراءة!', 'Story is Ready!'),
            'completed': t('مكتمل وجاهز', 'Complete & Ready'),
            'sent_to_print': t('تم الإرسال للمطبعة', 'Sent to Print'),
            'printing': t('جاري الطباعة', 'Printing'),
            'shipped': t('تم الشحن!', 'Shipped!'),
            'delivered': t('تم التوصيل', 'Delivered'),
            'pending_payment': t('بانتظار الدفع', 'Pending Payment'),
        };
        const translated = friendlyMap[dbStatus] || dbStatus;

        const isSuccess = ['shipped', 'delivered', 'softcopy_ready', 'completed', 'awaiting_preview_approval'].includes(dbStatus as string);
        const isAction = ['Processing', 'processing', 'story_generating', 'illustrations_generating'].includes(dbStatus as string);

        return (
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isSuccess ? 'bg-emerald-100 text-emerald-800' : 
                isAction ? 'bg-brand-orange text-white' : 
                'bg-blue-50 text-blue-600'
            }`}>
                {translated}
            </span>
        );
    };

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Spinner />
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">
                {t('جاري مزامنة بياناتك...', 'Syncing your adventures...')}
            </p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 animate-fade-in text-brand-navy">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button 
                        type="button" 
                        onClick={onBack}
                        className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm hover:scale-105 transition-all text-brand-navy"
                    >
                        <span className="material-symbols-outlined">{language === 'ar' ? 'arrow_forward' : 'arrow_back'}</span>
                    </button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">{t('حسابي والمكتبة', 'My Library & Account')}</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{t('إدارة اشتراكاتك والكتب الخاصة بك', 'Manage your subscriptions & custom stories')}</p>
                    </div>
                </div>
                <Button onClick={onLogout} variant="outline" className="!px-6 !py-2 text-xs font-black uppercase tracking-widest border-2">
                    {t('تسجيل الخروج', 'Sign Out')}
                </Button>
            </div>

            {/* Subscription Section */}
            <div className="bg-brand-navy rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-white border-4 border-brand-orange/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-teal/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-brand-orange rounded-2xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">{t('العضوية النشطة', 'Active Membership')}</h2>
                        </div>
                        
                        {activeSub ? (
                            <div className="flex gap-10">
                                <div>
                                    <span className="block text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">{t('الباقة', 'Current Plan')}</span>
                                    <span className="text-3xl font-black uppercase">{activeSub.plan}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">{t('التجديد القادم', 'Next Story')}</span>
                                    <span className="text-3xl font-black uppercase">{new Date(activeSub.next_billing_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 font-medium">{t('لا يوجد اشتراك نشط حالياً', 'No active subscription found.')}</p>
                        )}
                    </div>

                    <div className="w-full md:w-auto">
                        <Button 
                            onClick={onEditPreferences} 
                            className="w-full md:w-auto !px-10 !py-5 rounded-2xl bg-white text-brand-navy hover:bg-gray-100 shadow-xl transition-all transform hover:-translate-y-1 font-black uppercase tracking-widest text-sm"
                        >
                            {t('بدء طلب جديد', 'Start an Order')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Orders History */}
            <div className="space-y-8">
                <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight flex items-center gap-3">
                    <span className="w-8 h-1 bg-brand-orange rounded-full" />
                    {t('تاريخ الكتب', 'Book Production Pipeline')}
                </h2>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">{t('لا توجد مغامرات بعد', 'Your library is empty... for now.')}</p>
                        <Button onClick={onStartAdventure} className="mt-6 !px-8 !py-3 rounded-xl">{t('ابدأ مغامرتك الأولى', 'Start First Adventure')}</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {orders.map(order => {
                            const hasPreview = !!(
                                order.storyData?.coverImageUrl ||
                                (order.storyData?.spreads && order.storyData.spreads.length > 0) ||
                                order.storyData?.title
                            );

                            return (
                                <div key={order.orderNumber} className="group bg-white rounded-[2.5rem] p-6 sm:p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 sm:gap-6 flex-1 w-full">
                                            
                                            {/* Cover Thumbnail */}
                                            {(() => {
                                                const rawCover = order.storyData?.coverImageUrl 
                                                    || order.storyData?.spreads?.[0]?.illustrationUrl 
                                                    || (order.storyData?.spreads as any)?.[0]?.imageUrl
                                                    || (order.storyData?.spreads as any)?.find((s: any) => s?.illustrationUrl)?.illustrationUrl;
                                                    
                                                const coverSrc = rawCover
                                                    ? (rawCover.startsWith('http') || rawCover.startsWith('/') || rawCover.startsWith('data:')
                                                        ? rawCover
                                                        : `data:image/jpeg;base64,${rawCover}`)
                                                    : null;

                                                return (
                                                    <div className="w-20 h-24 sm:w-24 sm:h-28 bg-gradient-to-br from-brand-orange/10 via-brand-teal/5 to-brand-navy/10 rounded-2xl overflow-hidden border border-gray-200 shrink-0 shadow-md relative flex items-center justify-center group-hover:scale-105 transition-transform">
                                                        {coverSrc && (
                                                            <img 
                                                                src={coverSrc} 
                                                                alt="" 
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                                className="w-full h-full object-cover object-center relative z-10" 
                                                            />
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center text-brand-navy/30 z-0">
                                                            <span className="material-symbols-outlined text-3xl">auto_stories</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Story Metadata */}
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    <span className="text-xs font-mono font-black text-brand-navy/60 bg-gray-100 px-2 py-0.5 rounded-md">
                                                        #{order.orderNumber}
                                                    </span>
                                                    {getStatusBadge(order.status as string)}
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-black text-brand-navy uppercase tracking-tight line-clamp-1">
                                                    {order.storyData?.title || t('مغامرة خاصة', 'A Personalized Adventure')}
                                                </h3>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {new Date(order.orderDate).toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                                            {hasPreview && (
                                                <Button 
                                                    onClick={() => onViewBook(order)}
                                                    className="flex-1 md:flex-none !px-6 sm:!px-8 !py-3 rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">auto_stories</span>
                                                    {t('تصفح وقراءة الكتاب 📖', 'Read & Flip Storybook 📖')}
                                                </Button>
                                            )}
                                            {hasPreview && (
                                                <button
                                                    onClick={async () => {
                                                        const url = `${window.location.origin}/?story=${encodeURIComponent(order.orderNumber)}`;
                                                        try {
                                                            await navigator.clipboard.writeText(url);
                                                            setCopiedOrderId(order.orderNumber);
                                                            setTimeout(() => setCopiedOrderId(null), 3000);
                                                        } catch (e) {
                                                            prompt(t('انسخ رابط القصة:', 'Copy story link:'), url);
                                                        }
                                                    }}
                                                    title={t('مشاركة رابط القصة', 'Share Story Link')}
                                                    className={`p-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm ${
                                                        copiedOrderId === order.orderNumber 
                                                            ? 'bg-emerald-600 text-white' 
                                                            : 'bg-gray-100 hover:bg-gray-200 text-brand-navy'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-base">
                                                        {copiedOrderId === order.orderNumber ? 'check' : 'share'}
                                                    </span>
                                                    <span className="hidden sm:inline">
                                                        {copiedOrderId === order.orderNumber ? t('تم النسخ!', 'Copied!') : t('مشاركة', 'Share')}
                                                    </span>
                                                </button>
                                            )}
                                            {(!order.storyData?.isPhysicalPrint) && (
                                                <Button 
                                                    onClick={() => onOrderPrint(order)}
                                                    className="flex-1 md:flex-none !px-6 sm:!px-8 !py-3 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-black uppercase tracking-widest shadow-lg"
                                                >
                                                    {t('طلب نسخة مطبوعة', 'Order HD Print')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
