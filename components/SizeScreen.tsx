import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import type { Language, ProductSize } from '../types';
import * as adminService from '../services/adminService';
import { convertPrice, type Currency } from '../services/currencyService';

interface SizeScreenProps {
  onNext: (sizeId: string, spreadCount?: number) => void;
  onBack: () => void;
  language: Language;
  currency: Currency;
}

interface SizeOptionProps {
    title: string;
    dimensions: string;
    price: string;
    isSelected: boolean;
    onClick: () => void;
    imageUrl: string;
    disabled?: boolean;
    language: Language;
}

const SizeOption: React.FC<SizeOptionProps> = ({ title, dimensions, price, isSelected, onClick, imageUrl, disabled = false, language }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative p-0 text-center rounded-3xl transition-all duration-300 h-full flex flex-col items-center justify-start w-full sm:w-72 group overflow-hidden ${
                isSelected
                    ? 'bg-white shadow-2xl ring-4 ring-brand-coral scale-105 z-10'
                    : 'bg-white/70 backdrop-blur-md hover:bg-white hover:shadow-xl hover:scale-[1.02] border border-white/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
            aria-pressed={isSelected}
        >
            {disabled && (
                <div className="absolute top-4 right-4 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                    {t('غير متوفر', 'Unavailable')}
                </div>
            )}
            <div className="w-full h-48 overflow-hidden relative bg-gray-100">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                {isSelected && (
                    <div className="absolute inset-0 bg-brand-coral/10 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-full shadow-lg text-brand-coral animate-bounce">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-6 w-full space-y-2">
                <h3 className="text-2xl font-bold text-brand-navy">{title}</h3>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{dimensions}</p>
                <div className={`text-2xl font-black ${isSelected ? 'text-brand-coral' : 'text-brand-navy'}`}>{price}</div>
            </div>
        </button>
    )
};


const SizeScreen: React.FC<SizeScreenProps> = ({ onNext, onBack, language, currency }) => {
    const [availableSizes, setAvailableSizes] = useState<ProductSize[]>([]);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [spreadCount, setSpreadCount] = useState<number>(adminService.getSettings().defaultSpreadCount);
    
    useEffect(() => {
        const sizes = adminService.getProductSizes();
        setAvailableSizes(sizes);
        const firstAvailable = sizes.find(s => s.isAvailable);
        if (firstAvailable) { setSelectedSize(firstAvailable.id); }
    }, []);
    
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const handleSpreadCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (val > 0 && val <= 12) { setSpreadCount(val); } else if (e.target.value === '') { setSpreadCount(4); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة السادسة: اختر الحجم والصفحات', 'Step 6: Choose Size & Pages')}</h2>
                <p className="text-xl text-brand-navy/80 max-w-2xl mx-auto font-medium">{t('اختر الحجم المثالي لقصتك السحرية وحدد عدد صفحاتها.', 'Select the perfect size for your magical story and define the page count.')}</p>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-8 px-4">
                {availableSizes.map(size => (<SizeOption key={size.id} title={size.name} dimensions={`${size.page.widthCm}x${size.page.heightCm} cm`} price={convertPrice(size.price, currency)} isSelected={selectedSize === size.id} onClick={() => setSelectedSize(size.id)} imageUrl={size.previewImageUrl} disabled={!size.isAvailable} language={language} />))}
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto border border-white/50 shadow-lg text-center">
                <label htmlFor="spreadCount" className="block text-lg font-bold text-brand-navy mb-2">{t('عدد الصفحات المزدوجة', 'Number of Spreads')}</label>
                <div className="flex items-center justify-center gap-4">
                    <input type="number" id="spreadCount" value={spreadCount} onChange={handleSpreadCountChange} min="1" max="12" className="w-20 text-center text-2xl font-bold py-2 rounded-xl border-2 border-brand-baby-blue focus:border-brand-coral focus:ring-0 text-brand-navy" />
                    <span className="text-gray-500 font-medium"> = {spreadCount * 2} {t('صفحات', 'Pages')} </span>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl bg-white/50">{t('رجوع', 'Back')}</Button>
                <Button onClick={() => onNext(selectedSize, spreadCount)} className="text-xl px-16 py-4 rounded-2xl shadow-xl" disabled={!selectedSize}>{t('اصنع القصة الآن!', 'Create the Story Now!')}</Button>
            </div>
        </div>
    );
};

export default SizeScreen;