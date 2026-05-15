
import React, { useState, useEffect, useCallback } from 'react';
import * as fileService from '../services/fileService';
import { compressBase64Image } from '../utils/imageUtils';
import { convertPrice, type Currency, currencies } from '../services/currencyService';
import { backendApi } from '../services/backendApi';
import WelcomeScreen from './WelcomeScreen';
import PersonalizationScreen from './PersonalizationScreen';
import StyleChoiceScreen from './StyleChoiceScreen';
import ThemeScreen from './ThemeScreen';
import { UnifiedGenerationScreen } from './UnifiedGenerationScreen';
import PreviewScreen from './PreviewScreen';
import CheckoutScreen from './CheckoutScreen';
import ConfirmationScreen from './ConfirmationScreen';
import Header from './Header';
import Footer from './Footer';
import PageDecorations from './PageDecorations';
import PaymentModal from './PaymentModal';
import OrderStatusModal from './OrderStatusModal';
import { CustomerDashboard } from './CustomerDashboard';
import { AuthScreen } from './AuthScreen';
import StyleSelectionScreen from './StyleSelectionScreen';
import SizeScreen from './SizeScreen';
import { useStory } from '../context/StoryContext';
import { useWorkflow } from '../context/WorkflowContext';
import { type StoryData } from '../types';
import { RegionalDiscoveryModal } from './RegionalDiscoveryModal';

import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { useStoryGeneration } from '../hooks/useStoryGeneration';

import { supabase } from '../utils/supabaseClient';

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
    const [paymentAmount, setPaymentAmount] = useState(18.5); 
    const [user, setUser] = useState<any>(null);

    // Auth Initialization & Listener
    useEffect(() => {
        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                console.log("Auth: Found existing session on mount", session.user.email);
                setUser(session.user);
            }
        });

        // 2. Auth State Listener (Handles Magic Link redirects, login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event);
            if (session?.user) {
                setUser(session.user);
                
                // AUTO-ADVANCE: If user is on 'auth' screen, they likely just finished a magic link or provider flow
                // We want to push them to the next logical step.
                setScreen(prev => {
                    if (prev === 'auth') {
                        // If they have story data (theme selected), go to checkout
                        // Otherwise (they just wanted to see orders), go to dashboard
                        return (storyData.theme) ? 'checkout' : 'customerDashboard';
                    }
                    return prev;
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        backendApi.getCatalog().then((res: any) => {
            const sizes = res.data?.sizes || [];
            const p = sizes.find((s: any) => s.id === storyData.size);
            if (p) setCurrentPrice(p.price);
        });
    }, [storyData.size]);

    const {
        stage: workflowStage,
        isLoading: isWorkflowLoading,
        artifact: workflowArtifact,
        nextStage,
        prevStage,
        startWorkflow,
        isLoading: isWorkflowBusy 
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
    const [isResumeMode, setIsResumeMode] = useState(false);

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

                    // Route to checkout but ONLY IF LOGGED IN
                    if (user) {
                      setScreen('checkout');
                    } else {
                      setScreen('auth');
                    }
                }} onBack={() => setScreen('theme')} storyData={storyData} language={language} />;
                break;
            case 'editor':
                content = <PreviewScreen 
                    storyData={storyData} 
                    onOrder={() => setScreen('confirmation')} 
                    onDownloadPreview={() => { }} 
                    onRestart={() => { resetStory(); }} 
                    onTitleChange={(t) => updateStory({ title: t })} 
                    onRegenerate={() => { 
                        // Customers can't regenerate directly anymore, they restart or contact support
                        setScreen('unified-generation'); 
                        startWorkflow(); 
                    }} 
                    language={language} 
                    onBack={() => setScreen('welcome')} 
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
                        // CRITICAL: Prioritize the specific Book Language (storyData.language) if set, fallback to UI language
                        const updatedStory: StoryData = { 
                            ...storyData, 
                            planType, 
                            language: storyData.language || language,
                            isPhysicalPrint: totalAmount > 5.0, // Simplistic check or pass it from Checkout
                            shippingRegion: details.region,
                            printStatus: (totalAmount > 5.0) ? 'ordered' : 'none'
                        };
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
                content = <ConfirmationScreen orderNumber={storyData.orderId || 'RWY-UNKNOWN'} onRestart={() => { resetStory(); }} language={language} shippingDetails={shippingDetails} storyData={storyData} currency={currency} totalPrice={paymentAmount} />;
                break;
            case 'customerDashboard':
                if (!user) {
                    content = <AuthScreen language={language} onBack={() => setScreen('welcome')} onSuccess={setUser} />;
                } else {
                    content = <CustomerDashboard 
                        language={language} 
                        onLogout={async () => {
                            // Backend-only auth Logout would happen here
                            setUser(null);
                            setScreen('welcome');
                        }} 
                        onEditPreferences={() => {}} 
                        onViewBook={(order) => {
                            updateStory(order.storyData);
                            setScreen('preview');
                        }}
                        onOrderPrint={(order) => {
                            updateStory({ ...order.storyData, isPrintUpsell: true, isPhysicalPrint: true });
                            setShippingDetails(order.shippingDetails || {} as any);
                            setScreen('checkout');
                        }}
                    />;
                }
                break;
            case 'auth':
                content = <AuthScreen language={language} onBack={() => setScreen('welcome')} onSuccess={setUser} />;
                break;
;
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
                onMyOrdersClick={() => setScreen(user ? 'customerDashboard' : 'auth')}
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
            <RegionalDiscoveryModal 
                currentLanguage={language} 
                onLanguageChange={(lang) => {
                    setLanguage(lang);
                    updateStory({ language: lang }); // Synchronize book language default
                }} 
                onCurrencyChange={(c) => setCurrency(currencies.find(x => x.code === c) || currencies[0])} 
            />
        </div>
    );
};

export default MainLayout;
