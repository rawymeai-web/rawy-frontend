import React, { useState, useEffect, useCallback } from 'react';
import { backendApi } from '../services/backendApi';
import { Button } from './Button';
import { Spinner } from './Spinner';
import type { Language, StoryData } from '../types';
import { type Currency } from '../services/currencyService';

interface OrderTrackingScreenProps {
  orderNumber?: string;
  language: Language;
  onRestart: () => void;
  onViewBook?: (storyData: StoryData) => void;
  currency?: Currency;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  orderNumber: propOrderNumber,
  language,
  onRestart,
  onViewBook,
  currency = { code: 'KWD', symbol: 'د.ك', rate: 1, flag: '🇰🇼' }
}) => {
  // Resolve order number safely from props, URL query param, or localStorage
  const resolvedOrderNumber = (propOrderNumber && propOrderNumber !== 'RWY-UNKNOWN')
    ? propOrderNumber
    : (typeof window !== 'undefined'
        ? (new URLSearchParams(window.location.search).get('order') ||
           new URLSearchParams(window.location.search).get('orderNumber') ||
           new URLSearchParams(window.location.search).get('orderId') ||
           localStorage.getItem('last_tracked_order') || '')
        : '');

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Delightful, customer-friendly storytelling progress tips (NO internal technical jargon)
  const craftTips = [
    t('✨ ننسج فكرة القصة ونبني أحداث المغامرة لبطلكم الصغير...', '✨ Weaving the story adventure and personal journey for your hero...'),
    t('🎨 نرسم ونلون المشاهد والشخصيات بألوان زاهية وساحرة...', '🎨 Painting vibrant and whimsical scenes starring your hero...'),
    t('📖 نراجع تدفق الكلمات لتكون ممتعة وسهلة القراءة ومناسبة لعمر الطفل...', '📖 Polishing the story rhythm so it is fun and delightful to read aloud...'),
    t('✨ نضيف التفاصيل الدقيقة والألوان الدافئة في كل صفحة...', '✨ Adding rich details and warm magical lighting to every page...'),
    t('📚 نجمع صفحات القصة ونجهز كتابكم الفاخر بجودة طباعة فائقة...', '📚 Binding the pages and preparing your high-resolution storybook...')
  ];

  // Rotate craft tips every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTipIndex(prev => (prev + 1) % craftTips.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [craftTips.length]);

  // Persist order in localStorage and keep URL clean with ?order=RWY-...
  useEffect(() => {
    if (resolvedOrderNumber && typeof window !== 'undefined') {
      try {
        localStorage.setItem('last_tracked_order', resolvedOrderNumber);
        const url = new URL(window.location.href);
        if (url.searchParams.get('order') !== resolvedOrderNumber) {
          url.searchParams.set('order', resolvedOrderNumber);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (e) {}
    }
  }, [resolvedOrderNumber]);

  // Fetch & Poll order status from backend
  const fetchStatus = useCallback(async () => {
    if (!resolvedOrderNumber) return;
    try {
      const res = await backendApi.lookupOrder(resolvedOrderNumber);
      if (res && res.success && res.order) {
        setOrder(res.order);
        setError(null);
      } else {
        if (!order) setError(t('لم يتم العثور على الطلب.', 'Order not found.'));
      }
    } catch (err: any) {
      console.warn('[OrderTracking] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedOrderNumber, order, language]);

  useEffect(() => {
    fetchStatus();

    // Check if terminal state reached
    const terminalStatuses = ['softcopy_ready', 'completed', 'sent_to_print', 'printing', 'shipped', 'delivered', 'on_hold', 'failed'];
    const currentStatus = order?.status;

    if (currentStatus && terminalStatuses.includes(currentStatus)) {
      return; // Stop polling
    }

    // Poll every 3.5s
    const pollInterval = setInterval(() => {
      fetchStatus();
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [fetchStatus, order?.status]);

  const [isTriggeringTestPayment, setIsTriggeringTestPayment] = useState(false);

  // Calculate Progress and Stage Details
  const calculateProgress = () => {
    if (!order) return { percent: 10, stageNumber: 1, label: t('جاري التحضير...', 'Preparing...'), etaSeconds: 120 };

    const status = order.status;
    const progress = order.progress || { totalSpreads: 8, completedSpreads: 0 };
    const totalSpreads = progress.totalSpreads || 8;
    const completedSpreads = progress.completedSpreads || 0;

    if (['pending_payment', 'New Order', 'draft_unpaid'].includes(status)) {
      return {
        percent: 5,
        stageNumber: 1,
        label: t('💳 بانتظار إرسال وتأكيد رابط الدفع', '💳 Awaiting Payment Link & Confirmation'),
        etaSeconds: 150
      };
    }

    if (['softcopy_ready', 'awaiting_preview_approval', 'completed', 'sent_to_print', 'printing', 'shipped', 'delivered'].includes(status)) {
      return {
        percent: 100,
        stageNumber: 5,
        label: t('🎉 قصة طفلكم جاهزة بالكامل!', '🎉 Your storybook is completely ready!'),
        etaSeconds: 0
      };
    }

    if (status === 'on_hold') {
      return {
        percent: 60,
        stageNumber: 3,
        label: t('🔍 قيد المراجعة الفنية من فريق الجودة', '🔍 Quality Review in Progress'),
        etaSeconds: 0
      };
    }

    if (status === 'illustrations_generating') {
      const spreadFraction = totalSpreads > 0 ? completedSpreads / totalSpreads : 0;
      const percent = Math.min(88, Math.round(40 + spreadFraction * 48));
      const remainingSpreads = Math.max(1, totalSpreads - completedSpreads);
      return {
        percent,
        stageNumber: 3,
        label: t(`🎨 جاري رسم وتلوين الصفحات (${completedSpreads} من ${totalSpreads})`, `🎨 Painting Story Spreads (${completedSpreads} of ${totalSpreads})`),
        etaSeconds: remainingSpreads * 14 + 10
      };
    }

    if (status === 'illustrations_ready' || status === 'book_compiling') {
      return {
        percent: 92,
        stageNumber: 4,
        label: t('📑 جاري تجميع وتنسيق ملف الطباعة والـ PDF...', '📑 Binding book & compiling high-res PDF...'),
        etaSeconds: 15
      };
    }

    if (status === 'story_generating' || status === 'story_ready') {
      return {
        percent: 35,
        stageNumber: 2,
        label: t('📖 كتابة أحداث القصة ومراجعة الكلمات...', '📖 Drafting story narrative & editor review...'),
        etaSeconds: 90
      };
    }

    if (status === 'blueprint_generating') {
      return {
        percent: 20,
        stageNumber: 1,
        label: t('📝 بناء المخطط الدرامي للشخصية...', '📝 Constructing story blueprint...'),
        etaSeconds: 110
      };
    }

    // Default queued / paid_confirmed
    return {
      percent: 15,
      stageNumber: 1,
      label: t('🚀 تم تأكيد الطلب، جاري بدء التنفيذ...', '🚀 Order confirmed, initiating production...'),
      etaSeconds: 130
    };
  };

  const { percent, label, etaSeconds } = calculateProgress();
  const isReady = percent === 100;
  const isOnHold = order?.status === 'on_hold';
  const isPendingPayment = ['pending_payment', 'New Order', 'draft_unpaid'].includes(order?.status || '');
  const hasFlaggedSpreads = Boolean(
    order?.storyData?.coverQcStatus === 'flagged' ||
    order?.storyData?.spreads?.some((s: any) => s.qcStatus === 'flagged')
  );

  const handleSimulatePayment = async () => {
    setIsTriggeringTestPayment(true);
    try {
      const res = await fetch('/api/orders/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: resolvedOrderNumber,
          status: 'paid_confirmed'
        })
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (e) {
      console.error('Test mode payment trigger error:', e);
    } finally {
      setIsTriggeringTestPayment(false);
    }
  };

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return t('جاهز الآن! ✨', 'Ready now! ✨');
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return language === 'ar'
        ? `متبقي حوالي ${mins} دقيقة و ${secs} ثانية`
        : `~${mins} min ${secs} sec remaining`;
    }
    return language === 'ar' ? `متبقي حوالي ${secs} ثانية` : `~${secs} seconds remaining`;
  };

  const handleDownloadPdf = async () => {
    if (!order?.storyData) return;
    setIsDownloadingPdf(true);
    try {
      const fileService = await import('../services/fileService');
      const blob = await fileService.generatePreviewPdf(order.storyData, language, undefined, resolvedOrderNumber);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeTitle = (order.storyData?.title || 'Storybook').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      link.download = `Rawy_${safeTitle}_${resolvedOrderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert(t('حدث خطأ أثناء تنزيل الـ PDF: ', 'Error downloading PDF: ') + e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?order=${encodeURIComponent(resolvedOrderNumber)}`
    : '';

  if (isLoading && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          {t('جاري جلب تفاصيل طلبك...', 'Loading order progress...')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full p-4" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-2xl w-full text-center space-y-6 animate-enter-forward relative overflow-hidden">
        
        {/* Glow ambient background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-teal/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        {/* Icon & Title */}
        {isReady ? (
          <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <span className="material-symbols-outlined text-4xl text-emerald-600">auto_stories</span>
          </div>
        ) : isOnHold ? (
          <div className="w-20 h-20 bg-amber-100 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl text-amber-600">verified</span>
          </div>
        ) : isPendingPayment ? (
          <div className="w-20 h-20 bg-amber-100 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <span className="material-symbols-outlined text-4xl text-brand-orange">link</span>
          </div>
        ) : (
          <div className="w-20 h-20 bg-brand-orange/10 border-2 border-brand-orange/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl text-brand-orange animate-spin">palette</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-black font-mono bg-brand-navy/5 text-brand-navy px-3 py-1 rounded-lg">
              #{order?.orderNumber || resolvedOrderNumber || 'RWY'}
            </span>
            <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              isReady && hasFlaggedSpreads ? 'bg-amber-100 text-amber-900 border border-amber-300' :
              isReady ? 'bg-emerald-100 text-emerald-800' :
              isOnHold ? 'bg-amber-100 text-amber-800' :
              isPendingPayment ? 'bg-amber-100 text-amber-800' :
              'bg-brand-orange/15 text-brand-orange'
            }`}>
              {isReady && hasFlaggedSpreads ? t('جاهز للمعاينة (رتوش فنية جارية) ✨', 'Ready to Preview (Art Polish in Progress) ✨') :
               isReady ? t('جاهز للقراءة والتحميل ✨', 'Ready to Read & Download ✨') :
               isOnHold ? t('إتقان التفاصيل والرسومات ✨', 'Fine-Tuning Illustrations ✨') :
               isPendingPayment ? t('بانتظار إرسال رابط الدفع 💳', 'Awaiting Payment Link 💳') :
               t('جاري تجهيز وتأليف القصة 📖', 'Crafting Your Storybook 📖')}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy pt-2">
            {isReady && hasFlaggedSpreads
              ? t(`قصة ${order?.storyData?.childName || 'بطلكم'} جاهزة للمعاينة! 🎉`, `${order?.storyData?.childName || 'Your Hero'}'s Story is Ready to Preview! 🎉`)
              : isReady
              ? t(`اكتملت قصة ${order?.storyData?.childName || 'بطلكم'} بنجاح! 🎉`, `${order?.storyData?.childName || 'Your Hero'}'s Story is Ready! 🎉`)
              : isOnHold
              ? t('نقوم بإتقان ومطابقة تفاصيل الرسم بدقة عالية', 'Fine-Tuning Your Custom Illustrations')
              : isPendingPayment
              ? t(`تم تسجيل طلب قصة ${order?.storyData?.childName || 'بطلكم'} بنجاح! 🎉`, `Order for ${order?.storyData?.childName || 'your hero'} Registered! 🎉`)
              : t(`نصنع قصة ساحرة لبطلكم ${order?.storyData?.childName || ''}...`, `Crafting a magical book for ${order?.storyData?.childName || 'your hero'}...`)}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {isReady && hasFlaggedSpreads
              ? t('يمكنك الآن تصفح القصة فوراً! فريقنا يضع لمساته الفنية على بعض المشاهد لضمان أعلى جودة وسنوافيك بإشعار فور اكتمالها.', 'You can now flip through and preview your custom story! Our art team is putting final touches on selected scenes and will notify you once complete.')
              : isReady
              ? t('يمكنك الآن تصفح القصة فوراً أو تنزيل ملف الـ PDF عالي الدقة للطباعة والقراءة.', 'You can now flip through your custom story or download the print-ready high-res PDF.')
              : isOnHold
              ? t('نراجع تفاصيل المشاهد لضمان أعلى مستوى من الجمال والبهجة. سنرسل لك إشعاراً فور اكتمالها.', 'We are adding final touches to your illustrations for the highest quality. We will notify you once complete.')
              : isPendingPayment
              ? t('سنرسل لك رابط دفع مخصص لتأكيد طلبك وبدء رسم وتجهيز القصة فوراً.', 'We will send a payment link to activate your order and start crafting your book.')
              : t('نقوم بتأليف القصة، رسم المشاهد وتجهيز كتابكم صفحة بصفحة.', 'Writing the story, painting illustrations, and crafting your book page by page.')}
          </p>
        </div>

        {/* Pending Payment Notice & Local Test Trigger */}
        {isPendingPayment && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 text-left rtl:text-right space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <span className="material-symbols-outlined text-xl text-amber-600">link</span>
              <span>{t('بانتظار تأكيد الدفع لبدء الإنتاج التلقائي', 'Awaiting Payment to Begin Production')}</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {t(
                'بمجرد سداد المبلغ أو تأكيده، سيبدأ النظام فوراً برسم المشاهد وفحص جودتها صفحة بصفحة وتجهيز ملف الطباعة.',
                'Once payment is confirmed, our engine will automatically generate, inspect, and deliver your customized storybook here.'
              )}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isTriggeringTestPayment}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-coral hover:to-orange-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isTriggeringTestPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('جاري تفعيل الإنتاج التلقائي...', 'Activating Production...')}</span>
                  </>
                ) : (
                  <>
                    <span>🧪</span>
                    <span>{t('تأكيد الدفع للاختبار وبدء الإنتاج التلقائي فوراً (Local Test)', 'Test Mode: Confirm Payment & Start Auto-Production')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar & ETA (When in production) */}
        {!isReady && !isOnHold && (
          <div className="bg-[#FFF9F0] border border-[#F78F50]/20 rounded-2xl p-5 space-y-3 text-left rtl:text-right shadow-inner">
            <div className="flex justify-between items-center text-xs font-black text-brand-navy">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                {label}
              </span>
              <span className="font-mono text-brand-coral">{percent}%</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-gray-200/80 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
              <div 
                className="bg-gradient-to-r from-brand-orange via-brand-coral to-brand-teal h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* ETA Countdown */}
            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1 font-bold">
              <span>⏳ {t('الوقت المتوقع:', 'Estimated Time:')}</span>
              <span className="text-brand-teal font-black">{formatEta(etaSeconds)}</span>
            </div>
          </div>
        )}

        {/* On Hold Notification Box */}
        {isOnHold && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left rtl:text-right space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-black">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span>{t('حرصاً على خروج القصة بأبهى صورة:', 'To ensure absolute excellence:')}</span>
            </div>
            <p className="text-amber-800 leading-relaxed font-medium">
              {t(
                'قام نظام فحص الجودة برصد بعض المشاهد لإعادة ضبطها ومطابقتها يدوياً مع صورة طفلكم. لا داعي لأي إجراء من طرفكم، سنوافيك بالنسخة المكتملة قريباً عبر البريد الإلكتروني.',
                'Our QA system flagged a spread for precise manual calibration against your child\'s photo. No action is required from you; we will email you as soon as the final approved edition is ready.'
              )}
            </p>
          </div>
        )}

        {/* Live Craft Notice Carousel (When generating) */}
        {!isReady && !isOnHold && (
          <div className="p-4 bg-white/70 border border-brand-teal/20 rounded-2xl text-center space-y-1 shadow-sm transition-all">
            <p className="text-xs text-brand-navy font-bold animate-fade-in">
              {craftTips[activeTipIndex]}
            </p>
          </div>
        )}

        {/* Close & Return Reassurance Card */}
        {!isReady && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl text-xs text-brand-navy/80 space-y-2 text-left rtl:text-right">
            <div className="flex items-center gap-1.5 font-black text-brand-navy">
              <span>💡 {t('يمكنك إغلاق هذه الصفحة والعودة لاحقاً في أي وقت!', 'You can safely close this page and return anytime!')}</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {t(
                'تتم المعالجة بالكامل على خوادمنا الآمنة. احتفظ برابط الطلب أو ارجع إليه من بريدك الإلكتروني متى شئت.',
                'Processing happens securely in the background. Keep this link or return anytime via your confirmation email.'
              )}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  } catch (e) {
                    prompt(t('انسخ الرابط:', 'Copy link:'), shareUrl);
                  }
                }}
                className={`py-1.5 px-3 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                }`}
              >
                <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'link'}</span>
                <span>{copied ? t('تم النسخ!', 'Copied!') : t('نسخ رابط المتابعة', 'Copy Tracking Link')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions when Ready */}
        {isReady && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onViewBook && order?.storyData && (
                <Button 
                  onClick={() => onViewBook(order.storyData)}
                  className="text-base px-8 py-4 bg-brand-orange hover:bg-brand-coral rounded-2xl shadow-xl flex items-center justify-center gap-2 font-black cursor-pointer transform hover:scale-105 transition-all text-white"
                >
                  <span className="material-symbols-outlined text-xl">auto_stories</span>
                  <span>{t('📖 قراءة وتصفح القصة', '📖 Read & Flip Through Story')}</span>
                </Button>
              )}

              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="text-base px-6 py-4 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl text-brand-coral">
                  {isDownloadingPdf ? 'hourglass_top' : 'picture_as_pdf'}
                </span>
                <span>{isDownloadingPdf ? t('جاري تجهيز الـ PDF...', 'Preparing PDF...') : t('📄 تنزيل الـ PDF', '📄 Download High-Res PDF')}</span>
              </Button>
            </div>

            {/* Share link card */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(
                    t(
                      `✨ اقرأ قصة "${order?.storyData?.title || 'طفلي'}" المخصصة على راوي 📖:\n${shareUrl}`,
                      `✨ Read my child's custom storybook "${order?.storyData?.title || 'Personalized'}" on Rawy 📖:\n${shareUrl}`
                    )
                  );
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}
                className="py-2 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  } catch (e) {
                    prompt(t('انسخ الرابط:', 'Copy link:'), shareUrl);
                  }
                }}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-brand-navy'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                <span>{copied ? t('تم النسخ!', 'Copied!') : t('مشاركة الرابط', 'Share Link')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Restart / Create New Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onRestart}
            className="text-xs text-gray-500 hover:text-brand-navy font-bold underline cursor-pointer"
          >
            {t('✨ صنع قصة جديدة', '✨ Create Another Story')}
          </button>
        </div>

      </div>
    </div>
  );
};
