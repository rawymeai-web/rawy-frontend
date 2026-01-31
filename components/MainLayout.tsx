
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
import { UnifiedGenerationScreen } from './UnifiedGenerationScreen';
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
    const {
        storyData, updateStory, resetStory,
        language, setLanguage,
        currency, setCurrency,
        shippingDetails, setShippingDetails,
        screen, setScreen,
        isPaymentModalOpen, setPaymentModalOpen,
        isOrderStatusModalOpen, setOrderStatusModalOpen
    } = useStory();

    const [currentPrice, setCurrentPrice] = useState(29.9);
    useEffect(() => {
        adminService.getProductSizeById(storyData.size).then(p => { if (p) setCurrentPrice(p.price); });
    }, [storyData.size]);

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

    // Combined Logic: Auto-advance from Workflow to Generation in Unified Screen
    useEffect(() => {
        if (screen === 'unified-generation') {
            if (workflowStage < 6) {
                // Ensure we advance even if loading seems stuck (failsafe)
                // If loading, wait a bit longer (2s), else rapid advance (800ms)
                const delay = isWorkflowLoading ? 2000 : 800;

                const timer = setTimeout(() => {
                    nextStage();
                }, delay);
                return () => clearTimeout(timer);
            } else if (!isGenerating && !generationProgress) {
                // Workflow Done, Start Generation
                startGeneration(
                    language,
                    () => setScreen('preview'),
                    () => { }
                );
            }
        }
    }, [screen, workflowStage, isWorkflowLoading, isGenerating, generationProgress, nextStage, startGeneration, language]);

    // Calculate Unified Progress
    // Workflow: 6 stages -> 40% of total
    // Generation: 0-100% -> 60% of total
    const unifiedProgress = (() => {
        if (screen !== 'unified-generation') return 0;

        // Map 1-6 to 5-40% (Start at 5% so it's not empty)
        const wfProgress = 5 + ((Math.max(0, workflowStage - 1)) / 5) * 35;

        if (workflowStage < 6) {
            return wfProgress;
        }
        // If workflow done, show 40% + scaled generation
        return 40 + (generationProgress * 0.6);
    })();

    const unifiedStatus = (() => {
        if (workflowStage < 2) return "Characters are waking up...";
        if (workflowStage < 3) return "Mixing the magic ink...";
        if (workflowStage < 4) return "Painting the skies...";
        if (workflowStage < 5) return "Adding sparkle to the story...";
        if (workflowStage < 6) return "Reviewing with the Chief Wizard...";
        return generationStatus || "Wrapping up your gift...";
    })();

    const handlePaymentSuccess = useCallback(async (isBypass: boolean = false) => {
        try {
            const newOrderNumber = 'RWY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            setOrderNumber(newOrderNumber);
            if (shippingDetails) {
                // 1. Save Order to Database
                await adminService.saveOrder(newOrderNumber, storyData, shippingDetails);

                // 2. Generate Full Zip Package
                console.log("Generating Print Package...");
                const zipBlob = await fileService.generatePrintPackage(storyData, shippingDetails, language, newOrderNumber);

                // 3. Upload to Cloud (Supabase)
                console.log("Uploading to Cloud...");
                const publicUrl = await fileService.uploadOrderFiles(newOrderNumber, zipBlob);
                if (publicUrl) {
                    console.log("File Uploaded:", publicUrl);
                }

                // 4. Trigger Local Download (For User/Testing)
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `Order_${newOrderNumber}_Package.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            setPaymentModalOpen(false);
            setScreen('confirmation');
        } catch (error) {
            console.error("Payment/Order Error:", error);
            if (isBypass) {
                // If bypassing, ignore backend errors (likely demo mode / no supabase connection)
                console.warn("Bypassing backend error in demo mode.");
                setPaymentModalOpen(false);
                setScreen('confirmation');
            } else {
                alert("Order creation failed. Please try 'Bypass Payment' if this is a demo.");
            }
        }
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
                content = <StyleSelectionScreen onNext={(data) => { updateStory(data); setScreen('unified-generation'); startWorkflow(); }} onBack={() => setScreen('theme')} storyData={storyData} language={language} />;
                break;
            case 'unified-generation':
                content = <UnifiedGenerationScreen progress={unifiedProgress} statusMessage={unifiedStatus} onComplete={() => setScreen('preview')} language={language} />;
                break;
            case 'workflow': // Navigation fallback to unified
                content = <UnifiedGenerationScreen progress={unifiedProgress} statusMessage={unifiedStatus} onComplete={() => setScreen('preview')} language={language} />;
                break;
            case 'generating': // Navigation fallback to unified
                content = <UnifiedGenerationScreen progress={unifiedProgress} statusMessage={unifiedStatus} onComplete={() => setScreen('preview')} language={language} />;
                break;
            case 'preview':
                content = <PreviewScreen storyData={storyData} onOrder={() => setScreen('checkout')} onDownloadPreview={() => { }} onRestart={() => { resetStory(); }} onTitleChange={(t) => updateStory({ title: t })} onRegenerate={() => { setScreen('unified-generation'); startWorkflow(); }} language={language} onBack={() => setScreen('unified-generation')} />;
                break;
            case 'checkout':
                content = <CheckoutScreen onProceedToPayment={(details) => { setShippingDetails(details); setPaymentModalOpen(true); }} onBack={() => setScreen('preview')} language={language} storyData={storyData} currency={currency} />;
                break;
            case 'confirmation':
                content = <ConfirmationScreen orderNumber={orderNumber} onRestart={() => { resetStory(); }} language={language} shippingDetails={shippingDetails} storyData={storyData} currency={currency} />;
                break;
            case 'admin':
                return <AdminScreen onExit={() => setScreen('welcome')} language={language} />;
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
            <main className="flex-grow relative">
                <PageDecorations />
                <div className="relative z-10 w-full h-full p-4 sm:p-8 flex flex-col justify-center">{renderScreen()}</div>
            </main>
            <Footer language={language} onCheckOrderStatus={() => setOrderStatusModalOpen(true)} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} totalAmount={convertPrice(currentPrice, currency)} language={language} />
            <OrderStatusModal isOpen={isOrderStatusModalOpen} onClose={() => setOrderStatusModalOpen(false)} language={language} />
        </div>
    );
};

export default MainLayout;
