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
    pages: [],
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
    const [language, setLanguage] = useState<Language>('en');
    const [currency, setCurrency] = useState<Currency>(currencies[0]);

    // UI State
    // Default to 'welcome' as language is now handled in the header
    const [screen, setScreen] = useState<Screen>('welcome');

    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isOrderStatusModalOpen, setOrderStatusModalOpen] = useState(false);

    // Persistence Effect
    React.useEffect(() => {
        try {
            localStorage.setItem('storyData', JSON.stringify(storyData));
        } catch (e) {
            console.error("Failed to save story", e);
        }
    }, [storyData]);

    const updateStory = (updates: Partial<StoryData>) => {
        setStoryData(prev => ({ ...prev, ...updates }));
    };

    const resetStory = () => {
        setStoryData(initialStoryData);
        setScreen('welcome');
        localStorage.removeItem('storyData');
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
            setOrderStatusModalOpen
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
