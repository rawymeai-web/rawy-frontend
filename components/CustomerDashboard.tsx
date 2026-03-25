import React, { useState, useEffect } from 'react';
import { backendApi } from '../services/backendApi';
import type { Language, DbOrderStatus, Subscription, AdminOrder } from '../types';

interface DashboardProps {
    language: Language;
    onLogout: () => void;
    onEditPreferences: () => void; // Route to a preferences screen
}

export const CustomerDashboard: React.FC<DashboardProps> = ({ language, onLogout, onEditPreferences }) => {
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real implementation this fetches via backendApi.getCustomerDashboard()
        // For now we simulate the new schema requirements
        const fetchDashboard = async () => {
            try {
                setIsLoading(true);
                // const data = await backendApi.getCustomerDashboard();
                // setActiveSub(data.subscription);
                // setOrders(data.orders);

                // Mocking PRD requirements
                setTimeout(() => {
                    setActiveSub({
                        id: 'sub_123',
                        user_id: 'user_99',
                        hero_id: 'hero_1',
                        plan: 'monthly',
                        status: 'active',
                        next_billing_date: '2026-04-01T00:00:00.000Z'
                    });
                    setOrders([{
                        orderNumber: 'RWY-SUBDEV-0001',
                        customerName: 'Tester',
                        orderDate: new Date().toISOString(),
                        status: 'illustrations_generating' as any, // Mocking DbOrderStatus
                        total: 0,
                        productionCost: 0, aiCost: 0, shippingCost: 0,
                        storyData: {} as any,
                        shippingDetails: {} as any
                    }]);
                    setIsLoading(false);
                }, 800);
            } catch (err) {
                console.error("Dashboard failed to load", err);
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getStatusBadge = (dbStatus: DbOrderStatus | string) => {
        // Basic mapping of backend pipeline states to customer-friendly labels
        const friendlyMap: Record<string, string> = {
            'paid_confirmed': 'Payment Confirmed',
            'queued': 'In Queue for Production',
            'theme_assigned': 'Theme Selected',
            'story_generating': 'Drafting Story',
            'story_ready': 'Story Written',
            'illustrations_generating': 'Painting Illustrations',
            'illustrations_ready': 'Illustrations Complete',
            'book_compiling': 'Binding Book',
            'softcopy_ready': 'Digital Copy Ready!',
            'awaiting_preview_approval': 'Action Required: Preview',
            'sent_to_print': 'Sent to Printers',
            'printing': 'Printing Physical Book',
            'shipped': 'Shipped!',
            'delivered': 'Delivered',
            'on_hold': 'On Hold'
        };
        const translated = friendlyMap[dbStatus] || dbStatus;

        // Style logic
        if (['shipped', 'delivered', 'softcopy_ready'].includes(dbStatus)) return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">{translated}</span>;
        if (['awaiting_preview_approval', 'payment_retry'].includes(dbStatus)) return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold animate-pulse">{translated}</span>;
        if (dbStatus === 'on_hold') return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">{translated}</span>;
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{translated}</span>;
    };

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    if (isLoading) return <div className="p-10 text-center">{t('جاري التحميل...', 'Loading Dashboard...')}</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-brand-navy/5">
                <div>
                    <h1 className="text-3xl font-bold text-brand-navy">{t('لوحة التحكم', 'My Dashboard')}</h1>
                    <p className="text-gray-500 mt-1">{t('إدارة اشتراكاتك وكتبك', 'Manage your subscriptions and books from the backend engine.')}</p>
                </div>
                <button onClick={onLogout} className="px-4 py-2 text-sm font-bold text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-colors">
                    {t('تسجيل الخروج', 'Logout')}
                </button>
            </div>

            {/* Subscription Status Panel */}
            <div className="bg-brand-navy text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand-coral/20 rounded-full blur-2xl pointer-events-none" />

                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    {t('الاشتراك الحالي', 'Active Subscription')}
                </h2>

                {activeSub ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                            <span className="block text-xs uppercase tracking-widest text-brand-baby-blue mb-1">{t('الخطة', 'Plan')}</span>
                            <span className="text-2xl font-bold capitalize">{activeSub.plan} Storybook</span>
                            <span className="block text-sm opacity-80 mt-1">Status: {activeSub.status}</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                            <span className="block text-xs uppercase tracking-widest text-brand-baby-blue mb-1">{t('الإصدار القادم', 'Next Billing & Generation')}</span>
                            <span className="text-2xl font-bold">{new Date(activeSub.next_billing_date).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex flex-col justify-center items-start">
                            <button onClick={onEditPreferences} className="w-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform hover:-translate-y-0.5">
                                {t('إدارة التفضيلات (دي إن إيه)', 'Manage Hero Preferences')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/10">
                        <p className="opacity-80">{t('لا يوجد اشتراك نشط. هل ترغب في بدء رحلة القصص؟', "No active subscription found. Ready to start the journey?")}</p>
                    </div>
                )}
            </div>

            {/* Orders Pipeline Tracking */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-brand-navy mb-6">{t('تاريخ الكتب وحالة الإنتاج', 'Book History & Production Status')}</h2>

                {orders.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
                        {t('لا توجد طلبات بعد.', 'No orders yet.')}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.orderNumber} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-coral/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-black text-brand-navy">{order.orderNumber}</span>
                                        <span className="text-sm text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</span>
                                        {getStatusBadge(order.status as string)}
                                    </div>
                                    <p className="text-sm text-gray-600 truncate max-w-md">
                                        {order.storyData?.title || 'Personalised Adventure'}
                                    </p>
                                </div>

                                <div className="mt-4 md:mt-0 flex gap-3">
                                    {/* Only show download button if generation reached the softcopy threshold */}
                                    {['softcopy_ready', 'awaiting_preview_approval', 'sent_to_print', 'printing', 'shipped', 'delivered'].includes(order.status as string) && (
                                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-bold rounded-xl hover:bg-brand-navy/90 transition-colors shadow-sm">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            {t('تحميل النسخة الرقمية', 'Download PDF')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
