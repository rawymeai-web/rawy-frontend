
import { supabase } from '../utils/supabaseClient';
import type { AdminOrder, AdminCustomer, OrderStatus, StoryData, ShippingDetails, ProductSize, StoryTheme, AppSettings } from '../types';
import { INITIAL_THEMES, ART_STYLE_OPTIONS } from '../constants';
import * as imageStore from './imageStore';

// --- DB Interfaces ---
// These match the Supabase table columns
interface DBOrder {
  order_number: string;
  customer_id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  story_data: any; // JSONB
  shipping_details: any; // JSONB
  production_cost: number;
  ai_cost: number;
  shipping_cost: number;
}
interface DBTheme {
  id: string;
  title: any;
  description: any;
  emoji: string;
  category: string;
  visual_dna: string;
  skeleton: any;
}
interface DBProduct {
  id: string;
  name: string;
  price: number;
  preview_image_url: string;
  dimensions: any;
}
interface DBSettings {
  id: number;
  default_method: string;
  default_spread_count: number;
  enable_debug_view: boolean;
  generation_delay: number;
  unit_production_cost: number;
  unit_ai_cost: number;
  unit_shipping_cost: number;
  target_model: string;
}

// --- Converters ---
const mapDBOrder = (o: DBOrder): AdminOrder => ({
  orderNumber: o.order_number,
  customerName: o.customer_name,
  orderDate: o.created_at,
  status: o.status as OrderStatus,
  total: o.total,
  productionCost: o.production_cost || 0,
  aiCost: o.ai_cost || 0,
  shippingCost: o.shipping_cost || 0,
  storyData: o.story_data,
  shippingDetails: o.shipping_details,
});

// --- Services ---

// 1. Settings
export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error || !data) {
    console.warn('Could not fetch settings, returning defaults', error);
    return {
      defaultMethod: 'method4',
      defaultSpreadCount: 8,
      enableDebugView: false,
      generationDelay: 0,
      unitProductionCost: 13.250,
      unitAiCost: 0.600,
      unitShippingCost: 1.500,
      targetModel: 'gemini-1.5-flash'
    };
  }
  return {
    defaultMethod: data.default_method,
    defaultSpreadCount: data.default_spread_count,
    enableDebugView: data.enable_debug_view,
    generationDelay: data.generation_delay,
    unitProductionCost: data.unit_production_cost,
    unitAiCost: data.unit_ai_cost,
    unitShippingCost: data.unit_shipping_cost,
    targetModel: data.target_model
  };
}

export async function saveSettings(s: AppSettings): Promise<void> {
  const { error } = await supabase.from('settings').upsert({
    id: 1, // Single row
    default_method: s.defaultMethod,
    default_spread_count: s.defaultSpreadCount,
    enable_debug_view: s.enableDebugView,
    generation_delay: s.generationDelay,
    unit_production_cost: s.unitProductionCost,
    unit_ai_cost: s.unitAiCost,
    unit_shipping_cost: s.unitShippingCost,
    target_model: s.targetModel
  });
  if (error) throw error;
}

// --- Local Storage Fallback Helpers ---
const LOCAL_ORDERS_KEY = 'rawy_local_orders';

function getLocalOrders(): AdminOrder[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveLocalOrder(order: AdminOrder) {
  const current = getLocalOrders();
  // Avoid duplicates
  if (current.find(o => o.orderNumber === order.orderNumber)) return;
  const updated = [order, ...current];
  window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
}

function updateLocalOrderStatus(orderNumber: string, status: OrderStatus) {
  const current = getLocalOrders();
  const index = current.findIndex(o => o.orderNumber === orderNumber);
  if (index !== -1) {
    current[index].status = status;
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(current));
  }
}

// 2. Orders
export async function getOrders(): Promise<AdminOrder[]> {
  // 1. Fetch Remote
  let remoteOrders: AdminOrder[] = [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data) {
    remoteOrders = data.map(mapDBOrder);
  } else {
    console.warn('Supabase fetch failed, using local orders only.');
  }

  // 2. Fetch Local
  const localOrders = getLocalOrders();

  // 3. Merge (Prefer Remote if duplicate)
  const remoteIds = new Set(remoteOrders.map(o => o.orderNumber));
  const uniqueLocal = localOrders.filter(o => !remoteIds.has(o.orderNumber));

  return [...remoteOrders, ...uniqueLocal].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

export async function saveOrder(orderNumber: string, storyData: StoryData, shippingDetails: ShippingDetails): Promise<void> {
  const settings = await getSettings();
  const product = await getProductSizeById(storyData.size);
  const basePrice = product ? product.price : 29.900;
  const totalPrice = basePrice + 1.500;

  // Prepare Order Object for Potential Fallback
  const fallbackOrder: AdminOrder = {
    orderNumber,
    customerName: shippingDetails.name,
    orderDate: new Date().toISOString(),
    status: 'New Order',
    total: totalPrice,
    productionCost: settings.unitProductionCost,
    aiCost: settings.unitAiCost,
    shippingCost: settings.unitShippingCost,
    storyData: storyData, // Store full data locally
    shippingDetails: shippingDetails
  };

  try {
    // 1. Upload Images
    const imageFiles: imageStore.OrderImages = {
      cover: new File([await (await fetch(`data:image/jpeg;base64,${storyData.coverImageUrl}`)).blob()], 'cover.jpeg', { type: 'image/jpeg' }),
      spreads: await Promise.all(storyData.pages.filter((_, i) => i % 2 === 0).map(async (p, i) => {
        return new File([await (await fetch(`data:image/jpeg;base64,${p.illustrationUrl}`)).blob()], `spread_${i + 1}.jpeg`, { type: 'image/jpeg' });
      }))
    };

    const imageUrls = await imageStore.saveImagesForOrder(orderNumber, imageFiles);

    // 2. Sanitize Story Data (Remove Base64)
    const sanitizedStoryData = {
      ...storyData,
      coverImageUrl: imageUrls.cover,
      pages: storyData.pages.map((page, i) => {
        const spreadIndex = Math.floor((Math.max(1, page.pageNumber) - 1) / 2);
        return { ...page, illustrationUrl: imageUrls.spreads[spreadIndex] || page.illustrationUrl };
      }),
      mainCharacter: { ...storyData.mainCharacter, imageBases64: [], images: [] },
      secondCharacter: storyData.secondCharacter ? { ...storyData.secondCharacter, imageBases64: [], images: [] } : undefined,
    };

    // 3. Upsert Customer
    const customerId = shippingDetails.email.toLowerCase();
    await supabase.from('customers').upsert({
      id: customerId,
      email: shippingDetails.email,
      name: shippingDetails.name,
      phone: shippingDetails.phone,
      last_order_date: new Date().toISOString(),
    }, { onConflict: 'id' });

    // 4. Insert Order
    const { error: orderError } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_name: shippingDetails.name,
      total: totalPrice,
      status: 'New Order',
      story_data: sanitizedStoryData,
      shipping_details: shippingDetails,
      production_cost: settings.unitProductionCost,
      ai_cost: settings.unitAiCost,
      shipping_cost: settings.unitShippingCost
    });

    if (orderError) throw orderError;

  } catch (error) {
    console.warn("Supabase Save Failed. Falling back to Local Storage.", error);
    saveLocalOrder(fallbackOrder);
    // We do NOT re-throw, so the UI flow continues successfully
  }
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('order_number', orderNumber);
  if (error) {
    console.warn("Supabase update failed, trying local.");
    updateLocalOrderStatus(orderNumber, status);
  }
}

// 3. Products
const mapDBProduct = (p: DBProduct): ProductSize => ({
  id: p.id,
  name: p.name,
  price: p.price,
  previewImageUrl: p.preview_image_url,
  isAvailable: true,
  ...p.dimensions // spread cover, page, margins
});

export async function getProductSizes(): Promise<ProductSize[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return [];
  return data.map(mapDBProduct);
}
export async function getProductSizeById(id: string): Promise<ProductSize | undefined> {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  if (!data) return undefined;
  return mapDBProduct(data);
}
export async function saveProductSize(p: ProductSize): Promise<void> {
  // Extract dimensions
  const { id, name, price, previewImageUrl, isAvailable, ...dimensions } = p;
  const { error } = await supabase.from('products').upsert({
    id,
    name,
    price,
    preview_image_url: previewImageUrl,
    dimensions
  });
  if (error) throw error;
}

// 4. Themes
const mapDBTheme = (t: DBTheme): StoryTheme => ({
  id: t.id,
  title: t.title,
  description: t.description,
  emoji: t.emoji,
  category: t.category as any,
  visualDNA: t.visual_dna,
  skeleton: t.skeleton
});

export async function getThemes(): Promise<StoryTheme[]> {
  const { data, error } = await supabase.from('themes').select('*');
  if (error || !data || data.length === 0) return INITIAL_THEMES;
  return data.map(mapDBTheme);
}

export async function saveTheme(t: StoryTheme): Promise<void> {
  const { error } = await supabase.from('themes').upsert({
    id: t.id,
    title: t.title,
    description: t.description,
    emoji: t.emoji,
    category: t.category,
    visual_dna: t.visualDNA,
    skeleton: t.skeleton
  });
  if (error) throw error;
}

// 5. Bible (Keep Local for now as per plan, or basic store)
const BIBLE_KEY = 'rawy_series_bible';
export interface SeriesBible {
  masterGuardrails: string;
  storyFlowLogic: string;
  compositionMandates: string;
}
const defaultBible: SeriesBible = {
  masterGuardrails: `STRICT MASTER PRODUCTION RULES (MANDATORY):... (same as before) ...`,
  storyFlowLogic: `THE 9-POINT NARRATIVE ARC (REQUIRED):...`,
  compositionMandates: `VISUAL COMPOSITION MANDATES:...`
};

export function getSeriesBible(): SeriesBible {
  const item = window.localStorage.getItem(BIBLE_KEY);
  return item ? JSON.parse(item) : defaultBible;
}
export function saveSeriesBible(bible: SeriesBible): void {
  window.localStorage.setItem(BIBLE_KEY, JSON.stringify(bible));
}

// 6. Prompts (Keep Local or move to Settings?)
// For now, let's assume they are handled by promptService which might use localStorage.
// If prompted, we can move them too.

// 7. Customers (Read Only in Admin for now)
export async function getCustomers(): Promise<AdminCustomer[]> {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) return [];
  return data.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    firstOrderDate: c.first_order_date || '',
    lastOrderDate: c.last_order_date || '',
    orderCount: c.order_count || 0
  }));
}
