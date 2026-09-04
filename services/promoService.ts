import type { PromoCode, DiscountDetails } from '../types';
import { backendApi } from './backendApi';

// Fallback initial promo codes (Can also be managed dynamically from backend)
export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    code: 'RAWY10',
    discountType: 'percentage',
    discountValue: 10,
    appliesTo: 'all',
    allowSubscriptions: true,
    isActive: true,
    description: { ar: 'خصم 10% على إجمالي الطلب', en: '10% off total order' }
  },
  {
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    appliesTo: 'product',
    allowSubscriptions: false,
    isActive: true,
    description: { ar: 'خصم ترحيبي 20% على القصص المخصصة', en: '20% welcome discount on custom stories' }
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed_value',
    discountValue: 5.000,
    appliesTo: 'shipping',
    allowSubscriptions: true,
    isActive: true,
    description: { ar: 'خصم يصل إلى 5 د.ك على الشحن', en: 'Up to 5 KWD discount on shipping' }
  },
  {
    code: 'VIP5',
    discountType: 'fixed_value',
    discountValue: 5.000,
    appliesTo: 'all',
    allowSubscriptions: true,
    minOrderAmount: 15.000,
    isActive: true,
    description: { ar: 'خصم 5 د.ك للطلبات فوق 15 د.ك', en: '5 KWD discount on orders above 15 KWD' }
  }
];

export interface OrderPricingContext {
  planType: 'one_time' | 'monthly' | 'yearly';
  productTotal: number; // Digital + Hardcover physical price (KWD)
  shippingTotal: number; // Standard + Express shipping (KWD)
  addonsTotal: number; // 2nd hero + custom event + gift options (KWD)
  orderTotal: number; // Subtotal before discount (KWD)
}

export interface PromoValidationResult {
  isValid: boolean;
  discountAmount: number; // In KWD
  discountDetails?: DiscountDetails;
  message: { ar: string; en: string };
  code?: string;
}

export async function validateAndCalculatePromo(
  rawCode: string,
  context: OrderPricingContext
): Promise<PromoValidationResult> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return {
      isValid: false,
      discountAmount: 0,
      message: { ar: 'يرجى إدخال رمز الخصم', en: 'Please enter a discount code' }
    };
  }

  // 1. Try backend validation first
  try {
    const res = await backendApi.validatePromoCode?.({ code, context });
    if (res && res.isValid) {
      return res;
    }
  } catch (e) {
    // Fall back to client-side catalog verification
  }

  // 2. Check cached/default codes
  const promo = DEFAULT_PROMO_CODES.find(p => p.code.toUpperCase() === code);
  if (!promo || !promo.isActive) {
    return {
      isValid: false,
      discountAmount: 0,
      message: { ar: 'كود الخصم غير صالح أو غير موجود', en: 'Invalid or inactive discount code' }
    };
  }

  // Check expiry date
  if (promo.expiryDate) {
    const expiry = new Date(promo.expiryDate);
    if (new Date() > expiry) {
      return {
        isValid: false,
        discountAmount: 0,
        message: { ar: 'عذراً، كود الخصم منتهي الصلاحية', en: 'Sorry, this discount code has expired' }
      };
    }
  }

  // Check subscription restriction
  const isSubscription = context.planType === 'monthly' || context.planType === 'yearly';
  if (isSubscription && !promo.allowSubscriptions) {
    return {
      isValid: false,
      discountAmount: 0,
      message: {
        ar: 'كود الخصم هذا مخصص للطلبات الفردية فقط ولا ينطبق على الاشتراكات',
        en: 'This discount code is valid for one-time purchases only, not subscriptions'
      }
    };
  }

  // Check minimum order amount
  if (promo.minOrderAmount && context.orderTotal < promo.minOrderAmount) {
    return {
      isValid: false,
      discountAmount: 0,
      message: {
        ar: `الحد الأدنى لتطبيق هذا الكود هو ${promo.minOrderAmount.toFixed(3)} د.ك`,
        en: `Minimum order amount for this code is ${promo.minOrderAmount.toFixed(3)} KWD`
      }
    };
  }

  // Calculate discount based on applicability
  let applicableBase = 0;
  if (promo.appliesTo === 'product') {
    applicableBase = context.productTotal;
  } else if (promo.appliesTo === 'shipping') {
    applicableBase = context.shippingTotal;
  } else if (promo.appliesTo === 'addons') {
    applicableBase = context.addonsTotal;
  } else {
    applicableBase = context.orderTotal;
  }

  if (applicableBase <= 0) {
    return {
      isValid: false,
      discountAmount: 0,
      message: {
        ar: 'كود الخصم لا ينطبق على العناصر المحددة في طلبك حالياً',
        en: 'This discount code does not apply to the selected items in your order'
      }
    };
  }

  let calculatedDiscount = 0;
  if (promo.discountType === 'percentage') {
    calculatedDiscount = (applicableBase * promo.discountValue) / 100;
    if (promo.maxDiscountAmount && calculatedDiscount > promo.maxDiscountAmount) {
      calculatedDiscount = promo.maxDiscountAmount;
    }
  } else {
    // Fixed value discount
    calculatedDiscount = Math.min(promo.discountValue, applicableBase);
  }

  // Clean rounding
  calculatedDiscount = Math.max(0, Math.min(calculatedDiscount, context.orderTotal));

  return {
    isValid: true,
    code: promo.code,
    discountAmount: calculatedDiscount,
    discountDetails: {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: calculatedDiscount,
      appliesTo: promo.appliesTo,
      description: promo.description?.ar || promo.description?.en || `${promo.code} Discount`
    },
    message: {
      ar: `🎉 تم تطبيق كود الخصم (${promo.code}) بنجاح!`,
      en: `🎉 Promo code (${promo.code}) applied successfully!`
    }
  };
}
