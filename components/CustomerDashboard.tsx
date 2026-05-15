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
}

export const CustomerDashboard: React.FC<DashboardProps> = ({ language, onLogout, onEditPreferences, onViewBook, onOrderPrint }) => {
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const initDashboard = async () => {
            try {
                setIsLoading(true);
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
                
                if (currentUser) {
                    const data = await backendApi.getCustomerDashboard(currentUser.id);
                    setActiveSub(data.subscription);
                    setOrders(data.orders);
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
            'paid_confirmed': t('تم تأكيد الدفع', 'Payment Confirmed'),
            'queued': t('في قائمة الانتظار', 'In Queue'),
            'story_generating': t('كتابة القصة', 'Drafting Story'),
            'story_ready': t('تمت كتابة القصة', 'Story Written'),
            'illustrations_generating': t('رسم الصور', 'Painting Illustrations'),
            'illustrations_ready': t('الصور جاهزة', 'Illustrations Ready'),
            'book_compiling': t('تجميع الكتاب', 'Binding Book'),
            'softcopy_ready': t('النسخة الرقمية جاهزة!', 'Digital Copy Ready!'),
            'awaiting_preview_approval': t('بانتظار موافقتك', 'Action: Preview'),
            'sent_to_print': t('تم الإرسال للمطبعة', 'Sent to Printers'),
            'printing': t('جاري الطباعة', 'Printing'),
            'shipped': t('تم الشحن!', 'Shipped!'),
            'delivered': t('تم التوصيل', 'Delivered'),
        };
        const translated = friendlyMap[dbStatus] || dbStatus;

        const isSuccess = ['shipped', 'delivered', 'softcopy_ready'].includes(dbStatus);
        const isAction = ['awaiting_preview_approval'].includes(dbStatus);

        return (
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isSuccess ? 'bg-green-100 text-green-700' : 
                isAction ? 'bg-brand-orange text-white animate-pulse' : 
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
        <div className="max-w-6xl mx-auto p-6 space-y-12 animate-enter-forward pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-brand-navy tracking-tight uppercase">
                        {t('مغامراتي', 'My Adventures')}
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">
                        {user?.email || 'Authenticated Explorer'}
                    </p>
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
                            {t('تخصيص البطل (DNA)', 'Customize Hero DNA')}
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
                        <Button className="mt-6 !px-8 !py-3 rounded-xl">{t('ابدأ مغامرتك الأولى', 'Start First Adventure')}</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {orders.map(order => (
                            <div key={order.orderNumber} className="group bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                            {order.storyData?.coverImageUrl ? (
                                                <img src={`data:image/jpeg;base64,${order.storyData.coverImageUrl}`} alt="Cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v11.494m-9-5.747h18" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-brand-navy opacity-40">#{order.orderNumber}</span>
                                                {getStatusBadge(order.status as string)}
                                            </div>
                                            <h3 className="text-xl font-black text-brand-navy uppercase tracking-tight truncate max-w-xs md:max-w-md">
                                                {order.storyData?.title || t('مغامرة خاصة', 'A Personalized Adventure')}
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {new Date(order.orderDate).toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {['softcopy_ready', 'awaiting_preview_approval', 'sent_to_print', 'printing', 'shipped', 'delivered'].includes(order.status as string) && (
                                            <Button 
                                                onClick={() => onViewBook(order)}
                                                className="flex-1 md:flex-none !px-8 !py-3 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-black uppercase tracking-widest shadow-lg"
                                            >
                                                {t('مشاهدة الكتاب', 'View Book')}
                                            </Button>
                                        )}
                                        {(!order.storyData?.isPhysicalPrint) && (
                                            <Button 
                                                onClick={() => onOrderPrint(order)}
                                                className="flex-1 md:flex-none !px-8 !py-3 rounded-xl bg-brand-coral text-white hover:bg-brand-coral/90 text-xs font-black uppercase tracking-widest shadow-lg"
                                            >
                                                {t('طلب نسخة مطبوعة', 'Order HD Print')}
                                            </Button>
                                        )}
                                        {order.status === 'delivered' && (
                                            <Button variant="outline" className="!p-3 rounded-xl">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
