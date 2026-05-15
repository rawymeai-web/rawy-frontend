import { supabase } from '../utils/supabaseClient';
import type { AdminOrder, OrderStatus, StoryData, ShippingDetails, ProductSize, StoryTheme, AppSettings } from '../types';

// --- DB Interfaces ---
interface DBOrder {
  order_number: string;
  customer_id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  story_data: any;
  shipping_details: any;
  production_cost: number;
  ai_cost: number;
  shipping_cost: number;
  package_url?: string;
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

// --- Mappers ---
const mapDBOrder = (o: DBOrder): AdminOrder => ({
  orderNumber: o.order_number,
  customerName: o.customer_name,
  orderDate: o.created_at,
  status: o.status as OrderStatus,
  total: o.total,
  productionCost: o.production_cost || 0,
  aiCost: o.ai_cost || 0,
  shippingCost: o.shipping_cost || 0,
  storyData: o.story_data || {},
  shippingDetails: o.shipping_details || {},
  packageUrl: o.package_url
});

const mapDBProduct = (p: DBProduct): ProductSize => {
  const defaults = {
    coverContent: {
      barcode: { fromRightCm: 2, fromTopCm: 2, widthCm: 4, heightCm: 2.5 },
      format: { fromTopCm: 2, widthCm: 10, heightCm: 2 },
      title: { fromTopCm: 2, widthCm: 10, heightCm: 3 }
    }
  };
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    previewImageUrl: p.preview_image_url,
    isAvailable: true,
    ...p.dimensions,
    coverContent: {
      ...defaults.coverContent,
      ...(p.dimensions?.coverContent || {}),
      title: {
        ...defaults.coverContent.title,
        ...(p.dimensions?.coverContent?.title || {})
      }
    }
  };
};

const mapDBTheme = (t: DBTheme): StoryTheme => ({
  id: t.id,
  title: t.title,
  description: t.description,
  emoji: t.emoji,
  category: t.category as any,
  visualDNA: t.visual_dna,
  skeleton: t.skeleton
});

// --- Services ---

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error || !data) {
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

export async function getThemes(): Promise<StoryTheme[]> {
  const { data, error } = await supabase.from('themes').select('*');
  if (error || !data) return [];
  return data.map(mapDBTheme);
}

export async function getProductSizes(): Promise<ProductSize[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error || !data) return [];
  return data.map(mapDBProduct);
}

export async function getProductSizeById(id: string): Promise<ProductSize | undefined> {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  if (!data) return undefined;
  return mapDBProduct(data);
}

export async function getOrders(): Promise<{ orders: AdminOrder[] }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return { orders: [] };
  return { orders: data.map(mapDBOrder) };
}

export async function getOrderById(orderNumber: string): Promise<AdminOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();
  if (error || !data) return null;
  return mapDBOrder(data);
}

export async function updateOrderPackageUrl(orderNumber: string, packageUrl: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ package_url: packageUrl })
    .eq('order_number', orderNumber);
  if (error) throw error;
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_number', orderNumber);
  if (error) throw error;
}

export async function saveOrder(orderNumber: string, storyData: StoryData, shippingDetails: ShippingDetails, total?: number): Promise<void> {
  const settings = await getSettings();
  const totalPrice = total || 18.000;

  // Stripping large base64s for DB storage safety (if not using bucket storage in frontend)
  const cleanStoryData = JSON.parse(JSON.stringify(storyData));
  if (cleanStoryData.mainCharacter) {
    cleanStoryData.mainCharacter.imageBases64 = [];
    cleanStoryData.mainCharacter.imageDNA = storyData.mainCharacter.imageDNA || [];
  }
  if (cleanStoryData.secondCharacter) {
    cleanStoryData.secondCharacter.imageBases64 = [];
    cleanStoryData.secondCharacter.imageDNA = storyData.secondCharacter.imageDNA || [];
  }

  const customerId = shippingDetails.email.toLowerCase();
  
  // Upsert Customer
  await supabase.from('customers').upsert({
    id: customerId,
    email: shippingDetails.email,
    name: shippingDetails.name,
    phone: shippingDetails.phone,
    last_order_date: new Date().toISOString(),
  });

  // Upsert Order
  const { error } = await supabase.from('orders').upsert({
    order_number: orderNumber,
    customer_id: customerId,
    customer_name: shippingDetails.name,
    total: totalPrice,
    status: 'paid_confirmed',
    story_data: cleanStoryData,
    shipping_details: shippingDetails,
    production_cost: settings.unitProductionCost,
    ai_cost: settings.unitAiCost,
    shipping_cost: settings.unitShippingCost
  });

  if (error) throw error;
}

export async function getQualityLogs(orderId: string, spreadNumber: number) {
  const { data, error } = await supabase
    .from('generation_quality_logs')
    .select('*')
    .eq('order_id', orderId)
    .eq('spread_number', spreadNumber)
    .order('iteration_number', { ascending: true });

  if (error) return [];
  return data;
}
