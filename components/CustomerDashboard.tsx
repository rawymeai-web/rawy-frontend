import React, { useState, useEffect } from 'react';
import { backendApi } from '../services/backendApi';
import { authService } from '../services/authService';
import { supabase } from '../utils/supabaseClient';
import type { Language, DbOrderStatus, Subscription, AdminOrder } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { useCart } from '../context/CartContext';

interface DashboardProps {
    language: Language;
    onLogout: () => void;
    onEditPreferences: () => void;
    onViewBook: (order: AdminOrder) => void;
    onOrderPrint: (order: AdminOrder) => void;
    onTrackOrder?: (orderNumber: string) => void;
    onBack: () => void;
    onStartAdventure: () => void;
}

export const CustomerDashboard: React.FC<DashboardProps> = ({ 
    language, 
    onLogout, 
    onEditPreferences, 
    onViewBook, 
    onOrderPrint,
    onTrackOrder,
    onBack,
    onStartAdventure
}) => {
    const { draftCount, openCart } = useCart();
    const [activeSub, setActiveSub] = useState<Subscription | null>(() => {
        try {
            const cached = localStorage.getItem('rawy_cached_sub');
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    });
    const [orders, setOrders] = useState<AdminOrder[]>(() => {
        try {
            const cached = localStorage.getItem('rawy_cached_orders');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(() => {
        try {
            const cached = localStorage.getItem('rawy_cached_orders');
            return !cached || JSON.parse(cached).length === 0;
        } catch (e) {
            return true;
        }
    });
    const [user, setUser] = useState<any>(null);
    const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
    const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancellingSub, setIsCancellingSub] = useState(false);
    const [cancelMessage, setCancelMessage] = useState('');

    const handleCancelSubscription = async () => {
        if (!user) return;
        setIsCancellingSub(true);
        try {
            await backendApi.cancelSubscription(user.id, user.email);
            if (activeSub) {
                const updated = { ...activeSub, status: 'cancelled' as const };
                setActiveSub(updated);
                try {
                    localStorage.setItem('rawy_cached_sub', JSON.stringify(updated));
                } catch (e) {}
            }
            setCancelMessage(t('تم إلغاء التجديد التلقائي لاشتراكك بنجاح.', 'Your subscription auto-renewal has been successfully cancelled.'));
            setShowCancelModal(false);
        } catch (err: any) {
            alert(t('تعذر إلغاء الاشتراك، يرجى التواصل مع الدعم', 'Failed to cancel subscription, please contact support.'));
        } finally {
            setIsCancellingSub(false);
        }
    };

    const handleDownloadOrderPdf = async (order: any) => {
        setDownloadingOrderId(order.orderNumber);
        try {
            // @ts-ignore
            const fileService = await import('../services/fileService');
            const blob = await fileService.generatePreviewPdf(order.storyData, language, undefined, order.orderNumber);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeTitle = (order.storyData?.title || 'Storybook').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
            link.download = `Rawy_${safeTitle}_${order.orderNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert(t('حدث خطأ أثناء تنزيل الـ PDF: ', 'Error downloading PDF: ') + e);
        } finally {
            setDownloadingOrderId(null);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const initDashboard = async () => {
            try {
                const currentUser = await authService.getUser();
                if (!isMounted) return;
                setUser(currentUser);
                
                if (currentUser) {
                    const identifier = currentUser.email || currentUser.id;
                    let loadedOrders: AdminOrder[] = [];
                    let loadedSub: Subscription | null = null;

                    // 1. Attempt backend API first
                    try {
                        const data = await backendApi.getCustomerDashboard(identifier);
                        if (data && Array.isArray(data.orders) && data.orders.length > 0) {
                            loadedOrders = data.orders;
                            loadedSub = data.subscription || null;
                        } else if (data && data.subscription) {
                            loadedSub = data.subscription;
                        }
                    } catch (apiErr) {
                        console.warn("[Dashboard] Backend API unavailable or returning HTML, using direct Supabase fallback:", apiErr);
                    }

                    // 2. Direct Supabase fallback if backend API returned 0 orders
                    if (loadedOrders.length === 0 && currentUser.email) {
                        try {
                            const email = currentUser.email.trim().toLowerCase();
                            const { data: dbOrders, error: sbErr } = await supabase
                                .from('orders')
                                .select('*')
                                .or(`customer_id.eq.${email},customer_id.ilike.%${email}%,shipping_details->>email.ilike.%${email}%`)
                                .order('created_at', { ascending: false });

                            if (!sbErr && dbOrders && dbOrders.length > 0) {
                                loadedOrders = dbOrders.map((order: any) => ({
                                    orderNumber: order.order_number,
                                    status: order.status,
                                    orderDate: order.created_at,
                                    total: order.total,
                                    shippingDetails: order.shipping_details || {},
                                    storyData: order.story_data || {}
                                }));
                            }

                            if (!loadedSub) {
                                const { data: dbSub } = await supabase
                                    .from('subscriptions')
                                    .select('plan, next_billing_date, status')
                                    .or(`customer_id.eq.${email},customer_id.eq.${currentUser.id}`)
                                    .maybeSingle();
                                if (dbSub) {
                                    loadedSub = {
                                        plan: dbSub.plan,
                                        status: dbSub.status || 'active',
                                        next_billing_date: dbSub.next_billing_date
                                    } as any;
                                }
                            }
                        } catch (directErr) {
                            console.error("[Dashboard] Direct Supabase fetch error:", directErr);
                        }
                    }

                    if (!isMounted) return;
                    setActiveSub(loadedSub);
                    setOrders(loadedOrders);
                    try {
                        localStorage.setItem('rawy_cached_sub', JSON.stringify(loadedSub));
                        localStorage.setItem('rawy_cached_orders', JSON.stringify(loadedOrders));
                    } catch (e) {}
                }
            } catch (err) {
                console.error("Dashboard failed to load", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        initDashboard();
        return () => { isMounted = false; };
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
                        {user?.email && (
                            <div className="flex items-center gap-2 mt-2.5 px-3 py-1 bg-brand-teal/10 border border-brand-teal/25 text-brand-navy rounded-full w-fit text-xs font-semibold shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-gray-500 font-bold">{t('الحساب:', 'Signed in as:')}</span>
                                <span className="font-black text-brand-navy">{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openCart('drafts')}
                        className="px-4 py-2 rounded-xl bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                        title={t('المشاريع غير المكتملة', 'Uncompleted Projects')}
                    >
                        <span>📝 {t('المشاريع غير المكتملة', 'Draft Projects')}</span>
                        {draftCount > 0 && (
                            <span className="bg-brand-teal text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {draftCount}
                            </span>
                        )}
                    </button>
                    <Button onClick={onLogout} variant="outline" className="!px-6 !py-2 text-xs font-black uppercase tracking-widest border-2">
                        {t('تسجيل الخروج', 'Sign Out')}
                    </Button>
                </div>
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
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-8 items-center">
                                    <div>
                                        <span className="block text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">{t('الباقة', 'Current Plan')}</span>
                                        <span className="text-2xl sm:text-3xl font-black uppercase">{activeSub.plan}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">
                                            {activeSub.status === 'cancelled' ? t('تاريخ الانتهاء', 'Access Until') : t('التجديد القادم', 'Next Renewal')}
                                        </span>
                                        <span className="text-2xl sm:text-3xl font-black uppercase">
                                            {activeSub.next_billing_date ? new Date(activeSub.next_billing_date).toLocaleDateString() : 'Active'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">{t('الحالة', 'Status')}</span>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${activeSub.status === 'cancelled' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                            {activeSub.status === 'cancelled' ? t('ملغي (ينتهي قريباً)', 'Cancelled') : t('نشط', 'Active')}
                                        </span>
                                    </div>
                                </div>

                                {activeSub.status !== 'cancelled' && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCancelModal(true)}
                                            className="text-xs font-bold text-red-300 hover:text-red-100 underline transition-colors cursor-pointer"
                                        >
                                            {t('إلغاء الاشتراك (توقف التجديد التلقائي)', 'Cancel Membership (Stop Auto-Renewal)')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400 font-medium">{t('لا يوجد اشتراك نشط حالياً', 'No active subscription found.')}</p>
                        )}
                        {cancelMessage && (
                            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-bold rounded-xl mt-3">
                                {cancelMessage}
                            </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-1 bg-brand-orange rounded-full" />
                        {t('تاريخ الكتب', 'Book Production Pipeline')}
                    </h2>
                    {user?.email && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-navy/5 border border-brand-navy/10 rounded-full w-fit text-xs font-bold text-brand-navy/70">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{user.email}</span>
                        </div>
                    )}
                </div>

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
                                            {(() => {
                                                const status = (order.status || '') as string;
                                                const isProduction = [
                                                    'queued', 'paid_confirmed', 'processing', 'Processing',
                                                    'blueprint_generating', 'blueprint_ready',
                                                    'character_generating', 'character_ready',
                                                    'story_generating', 'story_ready',
                                                    'illustrations_generating', 'illustrations_ready',
                                                    'book_compiling', 'compiling'
                                                ].includes(status);
                                                const isPendingPayment = ['pending_payment', 'New Order', 'draft_unpaid'].includes(status);
                                                const hasPages = Array.isArray(order.storyData?.spreads) && order.storyData.spreads.some((s: any) => !!(s.text || s.leftText || s.illustrationUrl || s.imageUrl));

                                                if (isPendingPayment) {
                                                    return (
                                                        <Button 
                                                            onClick={() => {
                                                                if (onTrackOrder) onTrackOrder(order.orderNumber);
                                                                else window.location.href = `/?order=${encodeURIComponent(order.orderNumber)}`;
                                                            }}
                                                            className="flex-1 md:flex-none !px-6 !py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">credit_card</span>
                                                            {t('إتمام الدفع', 'Complete Payment')}
                                                        </Button>
                                                    );
                                                }

                                                if (isProduction) {
                                                    return (
                                                        <Button 
                                                            onClick={() => {
                                                                if (onTrackOrder) onTrackOrder(order.orderNumber);
                                                                else window.location.href = `/?order=${encodeURIComponent(order.orderNumber)}`;
                                                            }}
                                                            className="flex-1 md:flex-none !px-6 !py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-coral text-white hover:brightness-105 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-orange/25 flex items-center justify-center gap-2 animate-pulse"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                                                            {t('متابعة تجهيز القصة ⚡', 'Track & Continue Production ⚡')}
                                                        </Button>
                                                    );
                                                }

                                                // Ready or Completed Orders
                                                return (
                                                    <>
                                                        {(hasPreview || hasPages) && (
                                                            <Button 
                                                                onClick={() => onViewBook(order)}
                                                                className="flex-1 md:flex-none !px-5 sm:!px-7 !py-3 rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">auto_stories</span>
                                                                {t('قراءة 📖', 'Read 📖')}
                                                            </Button>
                                                        )}
                                                        {(hasPreview || hasPages) && (
                                                            <button
                                                                onClick={() => handleDownloadOrderPdf(order)}
                                                                disabled={downloadingOrderId === order.orderNumber}
                                                                title={t('تنزيل ملف الـ PDF', 'Download Storybook PDF')}
                                                                className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-navy transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                                                            >
                                                                <span className="material-symbols-outlined text-base text-brand-coral">
                                                                    {downloadingOrderId === order.orderNumber ? 'hourglass_top' : 'picture_as_pdf'}
                                                                </span>
                                                                <span>
                                                                    {downloadingOrderId === order.orderNumber ? t('جاري التجهيز...', 'Preparing...') : t('تنزيل PDF', 'Download PDF')}
                                                                </span>
                                                            </button>
                                                        )}
                                                        {(hasPreview || hasPages) && (
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
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cancel Subscription Confirmation Modal (Automatic Renewal Law Compliance) */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 text-center animate-enter-forward" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl">
                            ⚠️
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-brand-navy">
                                {t('تأكيد إلغاء التجديد التلقائي', 'Cancel Subscription Renewal?')}
                            </h3>
                            <p className="text-xs text-brand-navy/70 leading-relaxed font-medium">
                                {t(
                                    'عند الإلغاء، لن يتم خصم أي مبالغ إضافية في دورة التجديد القادمة. ستظل ميزات باقتك الحالية متاحة حتى نهاية الفترة الحالية. يمكنك العودة والاشتراك بأي وقت.',
                                    'Cancelling will stop all future automatic renewals. You will retain access to your plan benefits until the end of your current billing period. No cancellation fees apply.'
                                )}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                disabled={isCancellingSub}
                                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                {t('الاحتفاظ بالاشتراك', 'Keep Subscription')}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelSubscription}
                                disabled={isCancellingSub}
                                className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all disabled:opacity-50"
                            >
                                {isCancellingSub ? t('جاري الإلغاء...', 'Cancelling...') : t('تأكيد الإلغاء', 'Confirm Cancellation')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
