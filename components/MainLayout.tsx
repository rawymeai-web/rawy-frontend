
import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from '../services/adminService';
import * as fileService from '../services/fileService';
import { compressBase64Image } from '../utils/imageUtils';
import { convertPrice, type Currency, currencies } from '../services/currencyService';
import { backendApi } from '../services/backendApi';
import LanguageScreen from './LanguageScreen'; // Keep import but unused for now
import WelcomeScreen from './WelcomeScreen';
import PersonalizationScreen from './PersonalizationScreen';
import StyleChoiceScreen from './StyleChoiceScreen';
import ThemeScreen from './ThemeScreen';
import GeneratingScreen from './GeneratingScreen';
import { UnifiedGenerationScreen } from './UnifiedGenerationScreen';
import EditorScreen from './EditorScreen'; // NEW
import PreviewScreen from './PreviewScreen';
import CheckoutScreen from './CheckoutScreen';
import ConfirmationScreen from './ConfirmationScreen';
import AdminScreen from './AdminScreen';
import Header from './Header';
import Footer from './Footer';
import PageDecorations from './PageDecorations';
import PaymentModal from './PaymentModal';
import OrderStatusModal from './OrderStatusModal';
import { CustomerDashboard } from './CustomerDashboard';
import StyleSelectionScreen from './StyleSelectionScreen';
import SizeScreen from './SizeScreen';
import { useStory } from '../context/StoryContext';
import { useWorkflow } from '../context/WorkflowContext';
import { type StoryData } from '../types';

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

    const [currentPrice, setCurrentPrice] = useState(17.0);
    const [paymentAmount, setPaymentAmount] = useState(18.5); // Default for Standard One-Time
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
        startGeneration,
        currentQuote
    } = useStoryGeneration(storyData, updateStory);

    const [orderNumber, setOrderNumber] = useState('');
    const [isLegacyMode, setIsLegacyMode] = useState(false);

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
            }
            // Logic for auto-starting generation is now DEPRECATED.
            // The backend handles this automatically when order moves to paid_confirmed.
        }
    }, [screen, workflowStage, isWorkflowLoading, nextStage]);

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
            if (storyData.orderId) {
                console.log("Marking Order as Paid Confirmed:", storyData.orderId);
                await backendApi.updateDraftOrder({
                    orderId: storyData.orderId,
                    status: 'paid_confirmed',
                    shippingDetails
                });
            } else {
                console.warn("No Order ID found in context! Falling back to legacy flow (or displaying error).");
                // TODO: Handle no-order scenario gracefully
            }

            setPaymentModalOpen(false);
            setScreen('confirmation'); // NEW: Skip generation entirely

        } catch (error) {
            console.error("Payment Confirmation Error:", error);
        }
    }, [shippingDetails, storyData, language, setPaymentModalOpen, setScreen, startWorkflow]);

    const lightenStoryData = async (data: StoryData) => {
        // DIAGNOSTIC CORE: Log the size of all top-level keys to investigate the 7.06MB bloat
        try {
            const report = Object.entries(data).map(([key, value]) => {
                const size = encodeURI(JSON.stringify(value)).split(/%..|./).length - 1;
                return { 
                    key, 
                    sizeMB: (size / (1024 * 1024)).toFixed(2) + ' MB',
                    rawSize: size
                };
            }).sort((a, b) => b.rawSize - a.rawSize)
              .filter(x => x.rawSize > 1024); // Only show > 1KB
            
            console.warn("🚨 [PAYLOAD DIAGNOSTIC] Analyzing StoryData Components:");
            console.table(report);
        } catch (e) {
            console.error("Failed to run payload diagnostic:", e);
        }

        let compressedRefImg = data.styleReferenceImageBase64;
        let compressedSecondImg = data.secondCharacterImageBase64;
    
        if (compressedRefImg && compressedRefImg.length > 500) {
            try {
                compressedRefImg = await compressBase64Image(compressedRefImg, 512, 0.7);
                if (compressedRefImg.startsWith('data:image')) {
                    compressedRefImg = compressedRefImg.split(',')[1];
                }
            } catch (e) {
                console.error("Failed to compress style reference image:", e);
            }
        }
        
        if (compressedSecondImg && compressedSecondImg.length > 500) {
            try {
                compressedSecondImg = await compressBase64Image(compressedSecondImg, 512, 0.7);
                if (compressedSecondImg.startsWith('data:image')) {
                    compressedSecondImg = compressedSecondImg.split(',')[1];
                }
            } catch (e) {
                console.error("Failed to compress second character image:", e);
            }
        }

        let compressedMainImages: string[] = [];
        if (data.mainCharacter && data.mainCharacter.imageBases64) {
            for (const img of data.mainCharacter.imageBases64) {
                if (img && img.length > 500) {
                    try {
                        let comp = await compressBase64Image(img, 512, 0.7);
                        if (comp.startsWith('data:image')) comp = comp.split(',')[1];
                        compressedMainImages.push(comp);
                    } catch (e) {
                        compressedMainImages.push(img);
                    }
                } else if (img) {
                    compressedMainImages.push(img);
                }
            }
        }

        let compressedSecondImages: string[] = [];
        if (data.secondCharacter && data.secondCharacter.imageBases64) {
             for (const img of data.secondCharacter.imageBases64) {
                if (img && img.length > 500) {
                    try {
                        let comp = await compressBase64Image(img, 512, 0.7);
                        if (comp.startsWith('data:image')) comp = comp.split(',')[1];
                        compressedSecondImages.push(comp);
                    } catch (e) {
                        compressedSecondImages.push(img);
                    }
                } else if (img) {
                    compressedSecondImages.push(img);
                }
             }
        }

        return {
            ...data,
            styleReferenceImageBase64: compressedRefImg,
            secondCharacterImageBase64: compressedSecondImg,
            mainCharacter: { ...data.mainCharacter, imageBases64: compressedMainImages, images: [] },
            secondCharacter: data.secondCharacter ? { ...data.secondCharacter, imageBases64: compressedSecondImages, images: [] } : undefined,
            coverImageUrl: data.coverImageUrl ? data.coverImageUrl.substring(0, 100) + '...[TRUNCATED]' : undefined,
            spreads: (data.spreads || []).map((s: any) => ({ ...s, illustrationUrl: s.illustrationUrl ? s.illustrationUrl.substring(0, 100) + '...[TRUNCATED]' : undefined }))
        };
    };

    const renderScreen = () => {
        let content;
        switch (screen) {
            case 'welcome':
            case 'language': // Fallback mapping language to welcome
                content = <WelcomeScreen onStart={() => setScreen('personalization')} onBack={() => { }} language={language} setLanguage={setLanguage} />;
                break;
            case 'personalization':
                content = <PersonalizationScreen onNext={(data) => { updateStory(data); setScreen('styleChoice'); }} onBack={() => setScreen('welcome')} storyData={storyData} language={language} />;
                break;
            case 'styleChoice':
                content = <StyleChoiceScreen onNext={(data) => { updateStory(data); setScreen('theme'); }} onBack={() => setScreen('personalization')} storyData={storyData} language={language} />;
                break;
            case 'theme':
                content = <ThemeScreen onNext={(data) => { updateStory(data); setScreen('styleSelection'); }} onBack={() => setScreen('styleChoice')} storyData={storyData} language={language} />;
                break;
            case 'styleSelection':
                content = <StyleSelectionScreen onNext={async (data) => {
                    const defaultSize = 'square-20x20';
                    const defaultSpreadCount = 8;
                    const updatedStory = {
                        ...storyData,
                        ...data,
                        size: defaultSize,
                        spreads: []
                    };
                    updateStory(updatedStory);

                    // Route to checkout to select subscription & shipping
                    setScreen('checkout');

                }} onBack={() => setScreen('theme')} storyData={storyData} language={language} />;
                break;
            case 'editor':
                content = <EditorScreen
                    storyData={storyData}
                    language={language}
                    onUpdateStory={updateStory}
                    onFinalize={async (finalizedStoryData) => {
                        console.log("Editor Finalized! Args:", { title: finalizedStoryData?.title });
                        let blob;
                        try {
                            // CRITICAL FIX: The editor now passes the completely constructed, latest storyData.
                            // We use it directly to avoid stale-closure issues with React state updates.
                            const freshStoryData = finalizedStoryData || storyData;
                            
                            console.log("[Finalize] Using title:", freshStoryData.title);
                            blob = await fileService.generatePrintPackage(freshStoryData, shippingDetails || {} as any, language, freshStoryData.orderId || 'RWY-UNKNOWN');
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `Order_${freshStoryData.orderId || 'RWY'}_Package.zip`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setScreen('preview');
                        } catch (e: any) {
                            console.error("Auto-download failed:", e);
                            throw new Error(e.message || 'Unknown packaging error');
                        }
                    }}
                    isLegacy={isLegacyMode}
                    shippingDetails={shippingDetails}
                    isGenerating={isGenerating}
                    onBack={() => setScreen('admin')}
                    total={paymentAmount}
                />;
                break;
            case 'unified-generation':
            case 'workflow': // Navigation fallback to unified
            case 'generating': // Navigation fallback to unified
                // Fallback rendering during the workflow stages before editor shows its UI
                content = <UnifiedGenerationScreen progress={unifiedProgress} statusMessage={unifiedStatus} quote={currentQuote} onComplete={() => setScreen('editor')} language={language} onStartWorkflow={startWorkflow} />;
                break;
            case 'preview':
                content = <PreviewScreen storyData={storyData} onOrder={() => setScreen('confirmation')} onDownloadPreview={() => { }} onRestart={() => { resetStory(); }} onTitleChange={(t) => updateStory({ title: t })} onRegenerate={() => { setScreen('unified-generation'); startWorkflow(); }} language={language} onBack={() => setScreen('unified-generation')} />;
                break;
            case 'checkout':
                content = <CheckoutScreen
                    onProceedToPayment={async (details, planType, totalAmount) => {
                        setShippingDetails(details);
                        // CRITICAL: Explicitly inject the selected language into storyData
                        const updatedStory = { ...storyData, planType, language };
                        updateStory(updatedStory);

                        try {
                            // Prevent "413 Payload Too Large" by stripping raw photo arrays (base64) 
                            // before sending to the database, since we already saved the generated DNA!
                            const apiStory = await lightenStoryData(updatedStory);
                            
                            console.log("Creating Draft Order with intent...");
                            const res = await backendApi.createDraftOrder({
                                storyData: apiStory, // Sends lightweight version
                                customerName: details.name,
                                customerEmail: details.email,
                                total: totalAmount
                            });

                            if (res.success && res.orderId) {
                                console.log("Draft Created:", res.orderId);
                                updateStory({ orderId: res.orderId });
                                setPaymentAmount(totalAmount);
                                setPaymentModalOpen(true);

                            } else {
                                alert(`Could not create order: ${res.message || 'Unknown error'}`);
                            }
                        } catch (e: any) {
                            console.error("Draft API Error:", e);
                            alert(`Error creating order: ${e.message || 'Unknown network error'}. Please check backend logs or connection.`);
                        }
                    }}
                    onBack={() => setScreen('styleSelection')}
                    language={language}
                    storyData={storyData}
                    currency={currency}
                />;
                break;
            case 'confirmation':
                content = <ConfirmationScreen orderNumber={storyData.orderId || 'RWY-UNKNOWN'} onRestart={() => { resetStory(); }} language={language} shippingDetails={shippingDetails} storyData={storyData} currency={currency} />;
                break;
            case 'admin':
                content = <AdminScreen
                    onExit={() => setScreen('welcome')}
                    onEditOrder={(order, isLegacy, isRestart) => {
                        console.log("MainLayout onEditOrder triggered with:", order.orderNumber, "isLegacy:", isLegacy, "isRestart:", isRestart);
                        // Explicitly wipe intermediate states to prevent context bleed from previous orders
                        updateStory({ 
                            coverImageUrl: '', 
                            spreads: [], 
                            script: [], 
                            blueprint: undefined, 
                            finalPrompts: [], 
                            ...order.storyData, 
                            orderId: order.orderNumber 
                        });
                        
                        // CRITICAL: Sync UI Language to match the Customer's chosen Book Language!
                        if (order.storyData.language) {
                            setLanguage(order.storyData.language);
                        }

                        if (order.shippingDetails) setShippingDetails(order.shippingDetails);
                        setPaymentAmount(order.total);
                        setIsLegacyMode(!!isLegacy);
                        
                        // If it's a hard restart, we wipe the data
                        if (isRestart) {
                           updateStory({ 
                               coverImageUrl: '', 
                               spreads: [], 
                               script: [], 
                               blueprint: undefined, 
                               finalPrompts: [], 
                               // We deliberately DO NOT wipe mainCharacter.imageDNA or description here!
                               // The user selected this DNA during Checkout on the frontend, and it is the only copy.
                               orderId: order.orderNumber 
                           });
                        }

                        setScreen('editor');
                    }}
                    language={language}
                />;
                break;
            case 'customerDashboard':
                content = <CustomerDashboard language={language} onLogout={() => setScreen('welcome')} onEditPreferences={() => {}} />;
                break;
            default:
                content = <WelcomeScreen onStart={() => setScreen('personalization')} onBack={() => { }} language={language} setLanguage={setLanguage} />;
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
                onMyOrdersClick={() => setScreen('customerDashboard')}
                language={language}
                setLanguage={setLanguage}
                currency={currency}
                onCurrencyChange={(c) => setCurrency(currencies.find(x => x.code === c) || currencies[0])}
            />
            <main className="flex-grow relative">
                <PageDecorations />
                <div className={`relative w-full h-full p-4 sm:p-8 flex flex-col justify-center ${(screen === 'unified-generation' || screen === 'editor') ? 'z-50' : 'z-10'}`}>{renderScreen()}</div>
            </main>
            <Footer language={language} onCheckOrderStatus={() => setScreen('customerDashboard')} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} totalAmount={convertPrice(paymentAmount, currency)} language={language} />
            <OrderStatusModal isOpen={isOrderStatusModalOpen} onClose={() => setOrderStatusModalOpen(false)} language={language} />
        </div>
    );
};

export default MainLayout;
