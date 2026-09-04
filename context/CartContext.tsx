import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, StoryData } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  draftItems: CartItem[];
  cartCount: number;
  draftCount: number;
  isCartOpen: boolean;
  cartTab: 'cart' | 'drafts';
  openCart: (tab?: 'cart' | 'drafts') => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  saveStoryAsDraft: (storyData: StoryData, planType?: 'one_time' | 'monthly' | 'yearly') => string;
  removeDraft: (id: string) => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Cart Items (ready for checkout)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('rawy_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 2. Draft Projects (uncompleted in-progress stories)
  const [draftItems, setDraftItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('rawy_draft_projects');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState<'cart' | 'drafts'>('cart');

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rawy_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('rawy_draft_projects', JSON.stringify(draftItems));
    } catch (e) {
      console.warn('Failed to save drafts to localStorage:', e);
    }
  }, [draftItems]);

  const openCart = (tab: 'cart' | 'drafts' = 'cart') => {
    setCartTab(tab);
    setIsCartOpen(true);
  };

  const closeCart = () => setIsCartOpen(false);

  const addToCart = (itemData: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: CartItem = {
      ...itemData,
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCartItems(prev => [newItem, ...prev]);
    setIsCartOpen(true);
    setCartTab('cart');
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const saveStoryAsDraft = (storyData: StoryData, planType: 'one_time' | 'monthly' | 'yearly' = 'monthly'): string => {
    const existingIndex = draftItems.findIndex(d => 
      (d.storyData.title && d.storyData.title === storyData.title) ||
      (d.storyData.childName && d.storyData.childName === storyData.childName && d.storyData.theme === storyData.theme)
    );

    const draftId = existingIndex >= 0 ? draftItems[existingIndex].id : 'draft_' + Date.now();
    const thumbnail = storyData.coverImageUrl || storyData.mainCharacter?.imageDNA?.[0] || storyData.mainCharacter?.imageBases64?.[0] || '';

    const newDraft: CartItem = {
      id: draftId,
      createdAt: existingIndex >= 0 ? draftItems[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storyData,
      planType,
      isPhysicalPrint: !!storyData.isPhysicalPrint,
      physicalCount: 1,
      unitPrice: 5.000,
      totalPrice: 5.000,
      status: 'draft',
      thumbnailUrl: thumbnail
    };

    if (existingIndex >= 0) {
      setDraftItems(prev => {
        const next = [...prev];
        next[existingIndex] = newDraft;
        return next;
      });
    } else {
      setDraftItems(prev => [newDraft, ...prev]);
    }

    return draftId;
  };

  const removeDraft = (id: string) => {
    setDraftItems(prev => prev.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice || 0), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      draftItems,
      cartCount: cartItems.length,
      draftCount: draftItems.length,
      isCartOpen,
      cartTab,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      saveStoryAsDraft,
      removeDraft,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
