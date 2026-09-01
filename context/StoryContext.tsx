import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { StoryData, Character, ShippingDetails, Language, Screen } from '../types';
import { currencies, type Currency } from '../services/currencyService';
import * as adminService from '../services/adminService';

const initialCharacter: Character = {
    name: '',
    type: 'person',
    age: '',
    images: [],
    imageBases64: [],
    description: ''
};

const initialStoryData: StoryData = {
    childName: '',
    childAge: '',
    title: '',
    theme: '',
    storyMode: 'classic',
    mainCharacter: { ...initialCharacter },
    useSecondCharacter: false,
    coverImageUrl: '',
    spreads: [],
    size: '20x20',
    selectedStylePrompt: ''
};

interface StoryContextType {
    storyData: StoryData;
    setStoryData: React.Dispatch<React.SetStateAction<StoryData>>;
    updateStory: (updates: Partial<StoryData>) => void;
    shippingDetails: ShippingDetails | null;
    setShippingDetails: (details: ShippingDetails | null) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    resetStory: () => void;

    // UI State
    screen: Screen;
    setScreen: (screen: Screen) => void;
    isPaymentModalOpen: boolean;
    setPaymentModalOpen: (isOpen: boolean) => void;
    isOrderStatusModalOpen: boolean;
    setOrderStatusModalOpen: (isOpen: boolean) => void;
    isRegionModalOpen: boolean;
    setRegionModalOpen: (isOpen: boolean) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Lazy init from storage
    const [storyData, setStoryData] = useState<StoryData>(() => {
        try {
            const saved = localStorage.getItem('storyData');
            return saved ? JSON.parse(saved) : initialStoryData;
        } catch (e) {
            console.error("Failed to load story from storage", e);
            return initialStoryData;
        }
    });

    const [shippingDetails, setShippingDetails] = useState<ShippingDetails | null>(null);
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const savedLang = localStorage.getItem('preferred_language');
            if (savedLang) return savedLang as Language;

            // Auto-detect Arabic if user browser / system locale is Arabic
            if (typeof navigator !== 'undefined' && navigator.language) {
                const navLang = navigator.language.toLowerCase();
                if (navLang.startsWith('ar')) return 'ar';
            }
            // Default to Arabic as primary regional brand language, or 'ar'
            return 'ar';
        } catch (e) {
            return 'ar';
        }
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('preferred_language', lang);
        } catch (e) {
            console.error("Failed to save language to storage", e);
        }
    };

    const [currency, setCurrencyState] = useState<Currency>(() => {
        try {
            const savedCurrCode = localStorage.getItem('preferred_currency');
            if (savedCurrCode) {
                const found = currencies.find(c => c.code === savedCurrCode);
                if (found) return found;
            }
            return currencies[0];
        } catch (e) {
            return currencies[0];
        }
    });

    const setCurrency = (curr: Currency) => {
        setCurrencyState(curr);
        try {
            localStorage.setItem('preferred_currency', curr.code);
        } catch (e) {}
    };

    // Helper to detect if user opened a direct shared story link (?story=... or ?read=...)
    const hasSharedStoryInUrl = () => {
        if (typeof window === 'undefined') return false;
        try {
            const search = window.location.search || '';
            const hash = window.location.hash || '';
            return search.includes('story=') || search.includes('read=') || search.includes('preview=') || search.includes('orderId=') ||
                   hash.includes('story=') || hash.includes('read=') || hash.includes('preview=') || hash.includes('orderId=');
        } catch (e) {
            return false;
        }
    };

    // Default screen determination:
    // 1. Direct shared story links jump straight to 'preview'
    // 2. Returning users who completed onboarding jump straight to 'personalization' (or saved screen)
    // 3. Brand new first-time users see 'welcome'
    const [screen, setScreen] = useState<Screen>(() => {
        try {
            if (hasSharedStoryInUrl()) return 'preview';

            const hasCompletedWelcome = localStorage.getItem('has_completed_welcome') === 'true' ||
                                        localStorage.getItem('rawy_user_preferences_set') === 'true' ||
                                        localStorage.getItem('rawy_region_confirmed') === 'true';
            const saved = localStorage.getItem('currentScreen');

            if (saved && saved !== 'welcome' && saved !== 'language') return saved as Screen;
            if (hasCompletedWelcome) return 'personalization';
            return 'welcome';
        } catch (e) {
            return 'welcome';
        }
    });

    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isOrderStatusModalOpen, setOrderStatusModalOpen] = useState(false);

    // Regional discovery modal (Language / Country / Currency setup)
    // NEVER show on shared story links, and only show ONCE for first-time visitors
    const [isRegionModalOpen, setRegionModalOpen] = useState<boolean>(() => {
        try {
            if (hasSharedStoryInUrl()) return false;

            const hasConfirmed = localStorage.getItem('rawy_region_confirmed') === 'true' || 
                                 localStorage.getItem('rawy_user_preferences_set') === 'true' ||
                                 localStorage.getItem('has_completed_welcome') === 'true' ||
                                 sessionStorage.getItem('rawy_region_confirmed') === 'true';
            return !hasConfirmed;
        } catch (e) {
            return false;
        }
    });

    // Persistence Effect
    React.useEffect(() => {
        try {
            localStorage.setItem('storyData', JSON.stringify(storyData));
        } catch (e) {
            console.error("Failed to save story", e);
        }
    }, [storyData]);

    React.useEffect(() => {
        try {
            localStorage.setItem('currentScreen', screen);
        } catch (e) {
            console.error("Failed to save screen", e);
        }
    }, [screen]);

    const updateStory = (updates: Partial<StoryData>) => {
        setStoryData(prev => ({ ...prev, ...updates }));
    };

    const resetStory = () => {
        setStoryData(initialStoryData);
        setShippingDetails(null);
        setScreen('welcome');
        localStorage.removeItem('storyData');
        localStorage.removeItem('currentScreen');
    };

    return (
        <StoryContext.Provider value={{
            storyData,
            setStoryData,
            updateStory,
            shippingDetails,
            setShippingDetails,
            language,
            setLanguage,
            currency,
            setCurrency,
            resetStory,
            screen,
            setScreen,
            isPaymentModalOpen,
            setPaymentModalOpen,
            isOrderStatusModalOpen,
            setOrderStatusModalOpen,
            isRegionModalOpen,
            setRegionModalOpen
        }}>
            {children}
        </StoryContext.Provider>
    );
};

export const useStory = () => {
    const context = useContext(StoryContext);
    if (!context) {
        throw new Error('useStory must be used within a StoryProvider');
    }
    return context;
};
