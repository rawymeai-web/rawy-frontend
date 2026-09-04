import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import type { Language, CartItem } from '../types';
import { convertPrice, type Currency } from '../services/currencyService';

interface CartDrawerProps {
  language?: Language;
  currency?: Currency;
  onCheckout?: (items: CartItem[]) => void;
  onResumeDraft?: (draft: CartItem) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  language = 'ar',
  currency = 'KWD',
  onCheckout,
  onResumeDraft
}) => {
  const {
    items,
    drafts,
    activeTab,
    isOpen,
    openCart,
    closeCart,
    removeItem,
    clearCart,
    removeDraft,
    totalItemsCount,
    totalCartPrice
  } = useCart();

  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const handleCheckoutClick = () => {
    closeCart();
    if (onCheckout) {
      onCheckout(items);
    } else {
      // Default to navigating to checkout screen if window event exists
      window.dispatchEvent(new CustomEvent('navigate-to-checkout', { detail: { items } }));
    }
  };

  const handleResumeClick = (draft: CartItem) => {
    closeCart();
    if (onResumeDraft) {
      onResumeDraft(draft);
    } else {
      window.dispatchEvent(new CustomEvent('resume-draft-project', { detail: { draft } }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm transition-opacity"
          />

          {/* Sliding Panel */}
          <div className={`fixed inset-y-0 ${isAr ? 'left-0' : 'right-0'} max-w-full flex pl-0 pr-0`}>
            <motion.div
              initial={{ x: isAr ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col h-full border-l border-r border-white/40"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                  </div>
                  <div>
                    <h3 className="font-black text-brand-navy text-base">{t('سلة التسوق والمشاريع', 'Cart & Projects')}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('قصصك المخصصة', 'Your Custom Stories')}</p>
                  </div>
                </div>

                <button
                  onClick={closeCart}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Tabs Switcher: Cart vs Drafts */}
              <div className="p-2 bg-gray-50 border-b border-gray-100 flex gap-2">
                <button
                  onClick={() => openCart('cart')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'cart'
                      ? 'bg-white text-brand-navy shadow-sm border border-gray-100'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span>🛒 {t('السلة', 'Cart')}</span>
                  {items.length > 0 && (
                    <span className="bg-brand-coral text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
                      {items.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => openCart('drafts')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'drafts'
                      ? 'bg-white text-brand-navy shadow-sm border border-gray-100'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span>📝 {t('مشاريع غير مكتملة', 'Draft Projects')}</span>
                  {drafts.length > 0 && (
                    <span className="bg-brand-navy text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
                      {drafts.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scroller-thin">
                {activeTab === 'cart' ? (
                  items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-brand-coral/40">
                        <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-brand-navy text-sm">{t('السلة فارغة حالياً', 'Your cart is empty')}</p>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                          {t('خصص قصة طفلك الآن وأضفها للسلة لإتمام الطلب بسهولة', 'Personalize your child story and add it to cart for easy checkout')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    items.map(item => (
                      <div
                        key={item.id}
                        className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-3.5 items-start"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-20 bg-brand-cream rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                          {item.thumbnailUrl || item.storyData?.coverImageUrl ? (
                            <img
                              src={item.thumbnailUrl || item.storyData?.coverImageUrl}
                              alt={item.storyData?.title || 'Story'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-brand-coral/40 text-2xl">menu_book</span>
                          )}
                        </div>

                        {/* Story & Item Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-black text-xs text-brand-navy truncate">
                              {item.storyData?.title || t('قصة مخصصة', 'Custom Storybook')}
                            </h4>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title={t('حذف من السلة', 'Remove item')}
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>

                          <p className="text-[11px] text-gray-500 truncate">
                            {t('البطل: ', 'Hero: ')}
                            <strong className="text-brand-navy">{item.storyData?.childName || t('طفل راوي', 'Rawy Child')}</strong>
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="text-[9px] bg-orange-50 text-brand-coral font-bold px-2 py-0.5 rounded-md">
                              {item.isPhysicalPrint ? t('نسخة مطبوعة فاخرة', 'Hardcover Print') : t('نسخة رقمية فقط', 'Digital Softcopy')}
                            </span>
                            {item.isGiftWrapping && (
                              <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                                🎁 {t('تغليف هدية', 'Gift Wrap')}
                              </span>
                            )}
                            {item.isGiftCard && (
                              <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                                💌 {t('كرت إهداء', 'Gift Card')}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="font-black text-brand-navy text-xs">
                              {convertPrice(item.totalPrice, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  drafts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                        <span className="material-symbols-outlined text-3xl">edit_document</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-brand-navy text-sm">{t('لا توجد مشاريع غير مكتملة', 'No saved draft projects')}</p>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                          {t('أي قصة تبدأ بتخصيصها ولم تكملها سيتم حفظها هنا تلقائياً لتعود إليها متى شئت', 'Any story you start personalizing will be automatically saved here')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    drafts.map(draft => (
                      <div
                        key={draft.id}
                        className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-3.5 items-start"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-20 bg-blue-50/50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                          {draft.thumbnailUrl || draft.storyData?.coverImageUrl ? (
                            <img
                              src={draft.thumbnailUrl || draft.storyData?.coverImageUrl}
                              alt={draft.storyData?.title || 'Draft'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-blue-400 text-2xl">draw</span>
                          )}
                        </div>

                        {/* Story & Draft Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-black text-xs text-brand-navy truncate">
                              {draft.storyData?.title || t('مشروع قصة قيد التصميم', 'Story Project Draft')}
                            </h4>
                            <button
                              onClick={() => removeDraft(draft.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title={t('حذف المسودة', 'Delete draft')}
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>

                          <p className="text-[11px] text-gray-500 truncate">
                            {t('البطل: ', 'Hero: ')}
                            <strong className="text-brand-navy">{draft.storyData?.childName || t('طفل راوي', 'Rawy Child')}</strong>
                          </p>

                          <p className="text-[10px] text-gray-400 font-mono">
                            {t('آخر تعديل: ', 'Updated: ')}
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>

                          <div className="pt-2 flex items-center justify-between">
                            <button
                              onClick={() => handleResumeClick(draft)}
                              className="w-full py-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-xs rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">play_arrow</span>
                              {t('استكمال تصميم القصة', 'Resume Project')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* Drawer Footer */}
              {activeTab === 'cart' && items.length > 0 && (
                <div className="p-5 border-t border-gray-100 bg-white/95 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{t('المجموع الفرعي للقصص:', 'Stories Subtotal:')}</span>
                    <span className="font-black text-brand-navy text-sm">
                      {convertPrice(totalCartPrice, currency)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={clearCart}
                      className="py-3 px-3 rounded-2xl border border-gray-200 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      {t('تفريغ السلة', 'Clear Cart')}
                    </button>

                    <button
                      onClick={handleCheckoutClick}
                      className="py-3 px-4 bg-brand-coral hover:bg-brand-coral/90 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-brand-coral/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{t('إتمام الطلب', 'Checkout')}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
