import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from '../services/adminService';
import * as fileService from '../services/fileService';
import { convertPrice, type Currency, currencies } from '../services/currencyService';
import LanguageScreen from './LanguageScreen';
import WelcomeScreen from './WelcomeScreen';
import PersonalizationScreen from './PersonalizationScreen';
import ModeSelectionScreen from './ModeSelectionScreen';
import StyleChoiceScreen from './StyleChoiceScreen';
import ThemeScreen from './ThemeScreen';
import WorkflowScreen from './WorkflowScreen';
import GeneratingScreen from './GeneratingScreen';
import PreviewScreen from './PreviewScreen';
import CheckoutScreen from './CheckoutScreen';
import ConfirmationScreen from './ConfirmationScreen';
import AdminScreen from './AdminScreen';
import Header from './Header';
import Footer from './Footer';
import PageDecorations from './PageDecorations';
import PaymentModal from './PaymentModal';
import OrderStatusModal from './OrderStatusModal';
import StyleSelectionScreen from './StyleSelectionScreen';
import { useStory } from '../context/StoryContext';
import { useWorkflow } from '../context/WorkflowContext';

import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { useStoryGeneration } from '../hooks/useStoryGeneration';

const MainLayout: React.FC = () => {
    // Context State
    const {
        storyData, updateStory, resetStory,
        language, setLanguage,
        currency, setCurrency,
        shippingDetails, setShippingDetails,
        screen, setScreen,
        isPaymentModalOpen, setPaymentModalOpen,
        isOrderStatusModalOpen, setOrderStatusModalOpen
    } = useStory();

    const {
        stage: workflowStage,
        isLoading: isWorkflowLoading,
        artifact: workflowArtifact,
        nextStage,
        prevStage,
        startWorkflow,
        isLoading: isWorkflowBusy // Alias for local usage merge
    } = useWorkflow();

    // Generation Hook
    const {
        isGenerating,
        generationStatus,
        generationProgress,
        error: generationError,
        startGeneration
    } = useStoryGeneration(storyData, updateStory);

    const [orderNumber, setOrderNumber] = useState('');

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const handleWorkflowApprove = async () => {
        if (workflowStage < 6) {
            nextStage();
        } else {
            setScreen('generating');
            startGeneration(
                language,
                () => setScreen('preview'),
                () => { /* Stay on generating screen to show error */ }
            );
        }
    };

    const handlePaymentSuccess = useCallback(async () => {
        const newOrderNumber = 'RWY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        setOrderNumber(newOrderNumber);
        if (shippingDetails) {
            await adminService.saveOrder(newOrderNumber, storyData, shippingDetails);
            fileService.generatePrintPackage(storyData, shippingDetails, language, newOrderNumber).catch(err => console.error(err));
        }
        setPaymentModalOpen(false);
        setScreen('confirmation');
    }, [shippingDetails, storyData, language, setPaymentModalOpen, setScreen, setOrderNumber]);

    const renderScreen = () => {
        let content;
        switch (screen) {
            case 'welcome':
                content = <WelcomeScreen onStart={() => setScreen('personalization')} onBack={() => { }} language={language} />;
                break;
            case 'personalization':
                content = <PersonalizationScreen onNext={(data) => { updateStory(data); setScreen('modeSelection'); }} onBack={() => setScreen('welcome')} storyData={storyData} language={language} />;
                break;
            case 'modeSelection':
                content = <ModeSelectionScreen onNext={(data) => { updateStory(data); setScreen('styleChoice'); }} onBack={() => setScreen('personalization')} language={language} />;
                break;
            case 'styleChoice':
                content = <StyleChoiceScreen onNext={(data) => { updateStory(data); setScreen('theme'); }} onBack={() => setScreen('modeSelection')} storyData={storyData} language={language} />;
                break;
            case 'theme':
                content = <ThemeScreen onNext={(data) => { updateStory(data); setScreen('styleSelection'); }} onBack={() => setScreen('styleChoice')} storyData={storyData} language={language} />;
                break;
            case 'styleSelection':
                content = <StyleSelectionScreen onNext={(data) => { updateStory(data); setScreen('workflow'); startWorkflow(); }} onBack={() => setScreen('theme')} storyData={storyData} language={language} />;
                break;
            case 'workflow':
                content = <WorkflowScreen stage={workflowStage} artifact={workflowArtifact} isLoading={isWorkflowLoading} onApprove={handleWorkflowApprove} onBack={() => { if (workflowStage > 1) { prevStage(); } else { setScreen('styleSelection'); } }} language={language} />;
                break;
            case 'generating':
                content = <GeneratingScreen status={generationStatus} language={language} progress={generationProgress} storyData={storyData} error={generationError} />;
                break;
            case 'preview':
                content = <PreviewScreen storyData={storyData} onOrder={() => setScreen('checkout')} onDownloadPreview={() => { }} onRestart={() => { resetStory(); }} onTitleChange={(t) => updateStory({ title: t })} onRegenerate={() => { setScreen('workflow'); startWorkflow(); /* Technically should jump to stage 6? */ }} language={language} onBack={() => setScreen('workflow')} />;
                break;
            case 'checkout':
                content = <CheckoutScreen onProceedToPayment={(details) => { setShippingDetails(details); setPaymentModalOpen(true); }} onBack={() => setScreen('preview')} language={language} storyData={storyData} currency={currency} />;
                break;
            case 'confirmation':
                content = <ConfirmationScreen orderNumber={orderNumber} onRestart={() => { resetStory(); }} language={language} shippingDetails={shippingDetails} storyData={storyData} currency={currency} />;
                break;
            case 'admin':
                return <AdminScreen onExit={() => setScreen('welcome')} language={language} />; // Admin screens don't animate usually to separate context
            default:
                content = <WelcomeScreen onStart={() => setScreen('personalization')} onBack={() => { }} language={language} />;
        }

        return (
            <AnimatePresence mode="wait">
                <PageTransition key={screen}>
                    {content}
                </PageTransition>
            </AnimatePresence>
        );
    };

    return (
        <div className={`app-container font-sans bg-gray-50 text-gray-800 min-h-screen flex flex-col ${language === 'ar' ? 'rtl' : 'ltr'}`}>
            <Header
                onAdminLoginClick={() => setScreen('admin')}
                onMyOrdersClick={() => setOrderStatusModalOpen(true)}
                language={language}
                setLanguage={setLanguage}
                currency={currency}
                onCurrencyChange={(c) => setCurrency(currencies.find(x => x.code === c) || currencies[0])}
            />
            <main className="flex-grow relative overflow-hidden">
                <PageDecorations />
                <div className="relative z-10 w-full h-full p-4 sm:p-8 flex flex-col justify-center">{renderScreen()}</div>
            </main>
            <Footer language={language} onCheckOrderStatus={() => setOrderStatusModalOpen(true)} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} totalAmount={convertPrice(adminService.getProductSizeById(storyData.size)?.price || 29.9, currency)} language={language} />
            <OrderStatusModal isOpen={isOrderStatusModalOpen} onClose={() => setOrderStatusModalOpen(false)} language={language} />
        </div>
    );
};

export default MainLayout;
