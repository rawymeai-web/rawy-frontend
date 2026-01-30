
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { Logo } from './Logo';
import { Spinner } from './Spinner';
import * as adminService from '../services/adminService';
import * as promptService from '../services/promptService';
import * as fileService from '../services/fileService';
import * as imageStore from '../services/imageStore';
import type { Language, AdminOrder, AdminCustomer, OrderStatus, ProductSize, StoryTheme, AppSettings } from '../types';
import { OrderPreviewModal } from './OrderPreviewModal';
import { ProductEditorModal } from './ProductEditorModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import { ThemePreviewView } from './ThemePreviewView';
import StitchingScreen from './StitchingScreen';

interface AdminScreenProps {
    onExit: () => void;
    language: Language;
}

type AdminView = 'orders' | 'customers' | 'products' | 'themes' | 'bible' | 'prompts' | 'settings' | 'themePreview' | 'stitching';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = 'bg-brand-navy/5' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 rtl:space-x-reverse">
        <div className={`${color} text-brand-navy rounded-xl p-3`}>{icon}</div>
        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p><p className="text-2xl font-black text-brand-navy leading-none mt-1">{value}</p></div>
    </div>
);

const GuidelinesView: React.FC = () => {
    const [bible, setBible] = useState(adminService.getSeriesBible());
    const handleSave = () => { adminService.saveSeriesBible(bible); alert('System Guidelines Updated!'); };

    return (
        <div className="space-y-6 animate-enter-forward">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">Production Guidelines</h2>
                    <p className="text-sm text-gray-500">Master logic injected into Junior Writers, Art Directors, and Illustrators.</p>
                </div>
                <Button onClick={handleSave} className="shadow-lg shadow-brand-orange/20">Save Guidelines</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-orange uppercase tracking-widest px-1">1. Master Production Rules</label>
                    <textarea
                        value={bible.masterGuardrails}
                        onChange={e => setBible({ ...bible, masterGuardrails: e.target.value })}
                        className="w-full h-[550px] p-5 font-mono text-[11px] bg-white border border-gray-200 rounded-2xl shadow-inner leading-relaxed focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest px-1">2. Story Flow Logic</label>
                    <textarea
                        value={bible.storyFlowLogic}
                        onChange={e => setBible({ ...bible, storyFlowLogic: e.target.value })}
                        className="w-full h-[550px] p-5 font-mono text-[11px] bg-white border border-gray-200 rounded-2xl shadow-inner leading-relaxed focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest px-1">3. Visual Composition</label>
                    <textarea
                        value={bible.compositionMandates}
                        onChange={e => setBible({ ...bible, compositionMandates: e.target.value })}
                        className="w-full h-[550px] p-5 font-mono text-[11px] bg-white border border-gray-200 rounded-2xl shadow-inner leading-relaxed focus:ring-2 focus:ring-brand-navy/20 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-brand-navy text-white p-6 rounded-3xl flex items-center gap-6 border-4 border-brand-orange/20">
                <div className="text-4xl">💡</div>
                <div className="text-sm font-medium leading-relaxed opacity-90">
                    <p className="font-black text-brand-orange uppercase text-xs mb-1">Expert Note:</p>
                    These guidelines define the "Soul" of Rawy. Use them to enforce cultural nuances, prevent AI hallucinations like rainbows, and ensure every story has a meaningful failure and growth arc.
                </div>
            </div>
        </div>
    );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isActive: boolean; }> = ({ icon, label, onClick, isActive }) => (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30 translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-brand-navy'}`}>
        <div className={isActive ? 'text-white' : 'text-brand-navy/40'}>{icon}</div>
        <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>{label}</span>
    </button>
);

const AdminDashboard: React.FC<AdminScreenProps> = ({ onExit, language }) => {
    const [view, setView] = useState<AdminView>('orders');
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        // Initial Fetch
        adminService.getOrders().then(setOrders);
        adminService.getSettings().then(setSettings);
    }, []);

    const stats = React.useMemo(() => {
        const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
        return { totalRevenue, orderCount: orders.length };
    }, [orders]);

    const renderView = () => {
        switch (view) {
            case 'orders': return <OrdersView orders={orders} language={language} refreshOrders={() => adminService.getOrders().then(setOrders)} />;
            case 'bible': return <GuidelinesView />;
            case 'themes': return <ThemesView language={language} />;
            case 'products': return <ProductsView />;
            case 'prompts': return <PromptsView />;
            case 'settings': return <SettingsView />;
            case 'themePreview': return <ThemePreviewView language={language} />;
            case 'stitching': return <StitchingScreen onExit={() => setView('orders')} language={language} />;
            default: return <OrdersView orders={orders} language={language} refreshOrders={() => adminService.getOrders().then(setOrders)} />;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* Extended Sidebar with all Tabs */}
            <aside className="w-full md:w-72 bg-white p-6 space-y-8 border-r border-gray-100 flex flex-col shrink-0 z-20">
                <Logo />
                <nav className="space-y-1.5 flex-grow overflow-y-auto no-scrollbar">
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Performance" onClick={() => setView('orders')} isActive={view === 'orders'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.253v11.494m-9-5.747h18" /></svg>} label="Guidelines" onClick={() => setView('bible')} isActive={view === 'bible'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} label="Themes" onClick={() => setView('themes')} isActive={view === 'themes'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 6h16M4 12h16m-7 6h7" /></svg>} label="Products" onClick={() => setView('products')} isActive={view === 'products'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 10h4.757a2 2 0 110 4H14M4 10h4.757a2 2 0 110 4H4M9 5h6v14H9z" /></svg>} label="Visual Lab" onClick={() => setView('themePreview')} isActive={view === 'themePreview'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} label="Tech Prompts" onClick={() => setView('prompts')} isActive={view === 'prompts'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} label="Stitching" onClick={() => setView('stitching')} isActive={view === 'stitching'} />
                    <NavItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Config" onClick={() => setView('settings')} isActive={view === 'settings'} />
                </nav>
                <div className="pt-4 border-t">
                    <Button onClick={onExit} variant="outline" className="w-full !px-2 !py-2 text-[10px] uppercase font-black">Exit Terminal</Button>
                </div>
            </aside>

            <main className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto max-h-screen no-scrollbar bg-[#fcfcfc]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <StatCard title="Global Revenue" value={`${stats.totalRevenue.toFixed(3)} ${t('د.ك', 'KWD')}`} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08.402-2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-brand-orange/10" />
                    <StatCard title="Books Printed" value={stats.orderCount} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v11.494m-9-5.747h18" /></svg>} color="bg-brand-teal/10" />
                    <StatCard title="Active Systems" value={settings?.targetModel?.replace('gemini-', '').replace('-preview', '').replace('-exp', '') || '3 Pro'} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} color="bg-purple-100" />
                </div>
                {renderView()}
            </main>
        </div>
    );
};

const AdminScreen: React.FC<AdminScreenProps> = ({ onExit, language }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (password === 'admin') setIsAuthenticated(true); else alert('Incorrect password'); };

    if (!isAuthenticated) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-navy p-4">
            <div className="p-10 bg-white rounded-[3rem] shadow-2xl text-center w-full max-w-sm space-y-6">
                <Logo />
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tighter">Terminal Alpha</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Biometric Access Required</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-brand-orange outline-none transition-all text-center font-black tracking-[0.5em]" placeholder="••••" />
                    <Button type="submit" className="w-full !py-4 shadow-xl shadow-brand-orange/20">Initiate Sequence</Button>
                </form>
            </div>
        </div>
    );
    return <AdminDashboard onExit={onExit} language={language} />;
};

const OrdersView: React.FC<{ orders: AdminOrder[], language: Language, refreshOrders: () => void }> = ({ orders, language, refreshOrders }) => {
    const [allOrders, setAllOrders] = useState<AdminOrder[]>(orders);
    const [previewingOrder, setPreviewingOrder] = useState<AdminOrder | null>(null);
    const [isExporting, setIsExporting] = useState<string | null>(null);

    useEffect(() => { setAllOrders(orders); }, [orders]);

    const handleStatusChange = async (orderNumber: string, status: OrderStatus) => {
        await adminService.updateOrderStatus(orderNumber, status);
        refreshOrders();
    };

    const handleDownloadZip = async (order: AdminOrder) => {
        setIsExporting(order.orderNumber);
        try {
            await fileService.generatePrintPackage(order.storyData as any, order.shippingDetails, language, order.orderNumber);
        } catch (e) { alert('Extraction failed.'); console.error(e); } finally { setIsExporting(null); }
    };

    return (
        <div className="space-y-4 animate-enter-forward">
            {previewingOrder && <OrderPreviewModal order={previewingOrder} onClose={() => setPreviewingOrder(null)} language={language} />}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-xs text-left text-gray-500">
                    <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-b">
                        <tr><th className="px-6 py-4">Order Identity</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Revenue</th><th className="px-6 py-4">Pipeline Status</th><th className="px-6 py-4 text-center">Protocol</th></tr>
                    </thead>
                    <tbody>
                        {allOrders.map(order => (
                            <tr key={order.orderNumber} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-5 font-black text-brand-navy">{order.orderNumber}</td>
                                <td className="px-6 py-5 font-medium">{order.customerName}</td>
                                <td className="px-6 py-5 font-mono font-bold text-brand-teal">{order.total.toFixed(3)}</td>
                                <td className="px-6 py-5">
                                    <select value={order.status} onChange={(e) => handleStatusChange(order.orderNumber, e.target.value as OrderStatus)} className="p-2 rounded-xl bg-white border border-gray-200 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-orange/20">
                                        <option>New Order</option><option>Processing</option><option>Shipping</option><option>Completed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-5 flex justify-center gap-2">
                                    <Button variant="outline" className="!px-4 !py-1.5 text-[9px] font-black uppercase" onClick={() => setPreviewingOrder(order)}>Inspect</Button>
                                    <Button variant="secondary" className="!px-4 !py-1.5 text-[9px] font-black uppercase" onClick={() => handleDownloadZip(order)} disabled={isExporting === order.orderNumber}>{isExporting === order.orderNumber ? 'Extracting...' : 'Export ZIP'}</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const ThemesView: React.FC<{ language: Language }> = ({ language }) => {
    const [themes, setThemes] = useState<StoryTheme[]>([]);
    const [editingTheme, setEditingTheme] = useState<StoryTheme | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { adminService.getThemes().then(setThemes); }, []);

    const handleSave = async (theme: StoryTheme) => {
        await adminService.saveTheme(theme);
        adminService.getThemes().then(setThemes);
        setIsModalOpen(false);
    };
    return (
        <div className="space-y-4 animate-enter-forward">
            <div className="flex justify-between items-center px-2"><div><h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">Story Themes</h2></div><Button onClick={() => { setEditingTheme(null); setIsModalOpen(true); }} className="shadow-lg shadow-brand-orange/20">Construct New Theme</Button></div>
            {isModalOpen && <ThemeEditorModal theme={editingTheme} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-xs text-left text-gray-500">
                    <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Descriptor</th><th className="px-6 py-4">Classification</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-center">Actions</th></tr></thead>
                    <tbody>
                        {themes.map(t => (
                            <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-6 py-5 font-bold text-brand-navy"><span className="text-xl mr-3">{t.emoji}</span> {t.title.en}</td>
                                <td className="px-6 py-5 font-medium uppercase tracking-tighter text-brand-orange">{t.category}</td>
                                <td className="px-6 py-5"><span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase">Live</span></td>
                                <td className="px-6 py-5 flex justify-center gap-2"><Button variant="outline" className="!px-4 !py-1.5 text-[9px] font-black uppercase" onClick={() => { setEditingTheme(t); setIsModalOpen(true); }}>Modify</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ProductsView: React.FC = () => {
    const [products, setProducts] = useState<ProductSize[]>([]);
    const [editingProduct, setEditingProduct] = useState<ProductSize | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { adminService.getProductSizes().then(setProducts); }, []);

    const handleSave = async (p: ProductSize) => {
        await adminService.saveProductSize(p);
        adminService.getProductSizes().then(setProducts);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4 animate-enter-forward">
            <div className="flex justify-between items-center px-2"><div><h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">Product Catalog</h2></div><Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="shadow-lg shadow-brand-orange/20">New SKU</Button></div>
            {isModalOpen && <ProductEditorModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-xs text-left text-gray-500">
                    <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">SKU Name</th><th className="px-6 py-4">Retail Price</th><th className="px-6 py-4">Dimensions</th><th className="px-6 py-4 text-center">Actions</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-6 py-5 font-black text-brand-navy">{p.name}</td>
                                <td className="px-6 py-5 font-mono font-bold text-brand-teal">{p.price.toFixed(3)}</td>
                                <td className="px-6 py-5 text-gray-400 font-medium">{p.page.widthCm} x {p.page.heightCm} cm</td>
                                <td className="px-6 py-5 flex justify-center gap-2"><Button variant="outline" className="!px-4 !py-1.5 text-[9px] font-black uppercase" onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}>Edit Spec</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PromptsView: React.FC = () => {
    const [prompts, setPrompts] = useState<promptService.PromptTemplates>(promptService.getPrompts());
    const handleSave = () => { promptService.savePrompts(prompts); alert('Super Prompts Deployed!'); };
    return (
        <div className="space-y-6 animate-enter-forward">
            <div className="flex justify-between items-center px-2"><div><h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">Super Prompt Terminal</h2></div><Button onClick={handleSave} className="shadow-lg shadow-brand-orange/20">Deploy Logic</Button></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest px-1">Cover Prompt Architecture</label>
                    <textarea value={prompts.method4CoverPrompt.template} onChange={e => setPrompts({ ...prompts, method4CoverPrompt: { ...prompts.method4CoverPrompt, template: e.target.value } })} className="w-full h-96 p-5 border-2 border-gray-100 rounded-3xl font-mono text-[11px] leading-relaxed focus:border-brand-orange outline-none transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest px-1">Spread Prompt Architecture</label>
                    <textarea value={prompts.method4SpreadPrompt.template} onChange={e => setPrompts({ ...prompts, method4SpreadPrompt: { ...prompts.method4SpreadPrompt, template: e.target.value } })} className="w-full h-96 p-5 border-2 border-gray-100 rounded-3xl font-mono text-[11px] leading-relaxed focus:border-brand-orange outline-none transition-all shadow-inner" />
                </div>
            </div>
            <div className="p-5 bg-gray-900 rounded-2xl font-mono text-[10px] text-green-400">
                // Variables available: {'{summary}'}, {'{main_content_side}'}, {'{style_prompt}'}
            </div>
        </div>
    );
};

const SettingsView: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        adminService.getSettings().then(setSettings);
    }, []);

    const handleSave = async () => {
        if (settings) {
            await adminService.saveSettings(settings);
            alert('Global Configuration Updated!');
        }
    };

    if (!settings) return <Spinner />;

    return (
        <div className="animate-enter-forward space-y-8">
            <div>
                <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">System Engine Config</h2>
                <p className="text-sm text-gray-500 font-medium">Fine-tune the behavior and financials of the Rawy platform.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Generation Engine Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-orange/10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-coral"></div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-sm font-black text-brand-orange uppercase tracking-widest">Generation Engine</h3>
                        </div>
                        {/* Debug Toggle */}
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Debug Mode</label>
                            <button
                                onClick={() => setSettings({ ...settings, enableDebugView: !settings.enableDebugView })}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.enableDebugView ? 'bg-brand-orange' : 'bg-gray-200'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableDebugView ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Model Architecture</label>
                            <select
                                value={settings.targetModel || 'gemini-3-pro-preview'}
                                onChange={e => setSettings({ ...settings, targetModel: e.target.value })}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all font-black text-brand-navy"
                            >
                                <option value="gemini-3-pro-preview">Gemini 3 Pro (Preview)</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (High Speed)</option>
                                <option value="gemini-1.5-pro-002">Gemini 1.5 Pro (Legacy Stable)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Rate Limit Delay (ms)</label>
                            <input type="number" value={settings.generationDelay} onChange={e => setSettings({ ...settings, generationDelay: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all font-black text-brand-navy" />
                            <p className="text-[10px] text-gray-400 italic">Time between parallel API calls. Lower = faster but riskier (429 errors).</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Default Volume (Spreads)</label>
                            <input type="number" value={settings.defaultSpreadCount} onChange={e => setSettings({ ...settings, defaultSpreadCount: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all font-black text-brand-navy" />
                            <p className="text-[10px] text-gray-400 italic">Default book length in 2-page spreads. 8 spreads = 16 pages.</p>
                        </div>
                    </div>
                </div>

                {/* Financial Metrics Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-green-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-sm font-black text-green-600 uppercase tracking-widest">Financial Metrics (KWD)</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Production Cost</label>
                            <input type="number" step="0.001" value={settings.unitProductionCost} onChange={e => setSettings({ ...settings, unitProductionCost: parseFloat(e.target.value) })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all font-black text-brand-navy" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Token Cost</label>
                            <input type="number" step="0.001" value={settings.unitAiCost} onChange={e => setSettings({ ...settings, unitAiCost: parseFloat(e.target.value) })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all font-black text-brand-navy" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Shipping Cost</label>
                        <input type="number" step="0.001" value={settings.unitShippingCost} onChange={e => setSettings({ ...settings, unitShippingCost: parseFloat(e.target.value) })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all font-black text-brand-navy" />
                        <p className="text-[10px] text-gray-400 italic">Used for internal ROI calculations. Retail price is managed in the Products tab.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-4">
                <Button onClick={handleSave} className="shadow-xl shadow-brand-orange/30 !px-12 !py-4 text-lg rounded-2xl">Save Platform Configuration</Button>
            </div>
        </div>
    );
};

export default AdminScreen;
