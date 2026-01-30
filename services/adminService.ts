
import type { AdminOrder, AdminCustomer, OrderStatus, StoryData, ShippingDetails, ProductSize, StoryTheme, AppSettings } from '../types';
import { INITIAL_THEMES, ART_STYLE_OPTIONS } from '../constants';
import * as imageStore from './imageStore';

const SETTINGS_KEY = 'albumii_settings_v5';
const BIBLE_KEY = 'rawy_series_bible';

export interface SeriesBible {
  masterGuardrails: string;
  storyFlowLogic: string;
  compositionMandates: string;
}

const defaultBible: SeriesBible = {
  masterGuardrails: `STRICT MASTER PRODUCTION RULES (MANDATORY):
1. **NO REAL FAMILY:** Do not include Grandmother, Mother, Father, Brother, or Sister. Use neighbors, friends, or magical creatures.
2. **NO RAINBOWS:** Never describe or generate rainbows.
3. **CULTURAL AUTHENTICITY (CONTEXT AWARE):** Characters must always show respect and modesty.
   - **For Local/Traditional Stories ONLY:** Use arches, clay walls, palm mats, sadu patterns.
   - **For ALL OTHER Themes (Space, Dino, Ocean, etc.):** DO NOT use heritage elements. Use pure genre visuals (e.g. High-tech spaceship, Prehistoric Jungle). make it look international standard.
4. **NATURAL SPACE:** Do not use artificial blur. Instead, use "cinematic wide-angle composition with integrated negative space".
5. **CONTINUOUS CANVAS:** No vertical seams or dividers in the center 30% of the image.
6. **ACTIVE LIMITER:** The limiter must NOT be a passive rule. It must be an active pressure that blocks progress and forces a decision.

STYLISTIC GUIDELINES & WORD COUNTS (STRICT):
Rule 1: Title & Expectation Consistency. The title, cover concept, and content must match exactly.
Rule 2: Age-Appropriate Rhythm & Phrasing. Use the "Rule of Three" (e.g., "Thump! Thump! Shake!").
Rule 3: Show, Don't Tell. Every page should appeal to at least one sense beyond sight.
Rule 4: Child Agency. The child protagonist must solve the problem. Adults cannot fix the main issue.
Rule 5: **NO PRONOUNS FOR HERO:** Never use "he" or "she". ALWAYS use the child's name (e.g., "Leo ran," "Leo laughed").
Rule 6: **HERO NAME EMPHASIS:** The hero's name is the most important word.

**STRICT WORD COUNT & STRUCTURE BY AGE:**
- **Ages 1-3:** 5–10 words/page. (Total 40-80). STRUCTURE: 1 Concept per page. No complex plot.
- **Ages 4-6:** 10–25 words/page. (Total 80-200). STRUCTURE: 1 Plot point per page. Fast transitions.
- **Ages 7-9:** 20–35 words/page. (Total 160-280). STRUCTURE: Each page is a full scene.
- **Ages 10-12:** 35–45 words/page. (Total 280-360). STRUCTURE: Dense text blocks, detailed narrative.`,
  storyFlowLogic: `THE 9-POINT NARRATIVE ARC (REQUIRED):
1. Desire (The "I Want"): Protagonist expresses a clear wish/goal (Pages 1-2). Contrast with reality.
2. Catalyst (The "Uh-Oh"): Inciting incident disrupts status quo. Sensory and immediate.
3. Launch Event (The "Action"): Protagonist chooses to engage. No passivity.
4. Challenge (The "Obstacle"): Two-Layer Challenge (Physical Threat + Social/External Misunderstanding).
5. The Limiter (The "Ticking Clock"): Constraint forcing immediate action (e.g., sunset, melting ice).
6. Limited Resources (The "Tool"): Hero uses perspective, empathy, or cleverness (never weapons).
7. Logical Flow: Cause must lead to Effect ("But... Therefore..."). No "And then...".
8. Character Introduction: All key characters established/hinted before climax. No Deus Ex Machina.
9. End State (The "New Normal"): World returns to peace, hero has changed/learned.`,
  compositionMandates: `VISUAL COMPOSITION MANDATES:
- **50% HEADROOM:** For covers, the top half must be clean background for titles.
- **HERO PLACEMENT:** Protagonists must be clearly visible on their assigned side.
- **PANORAMIC 16:9:** All spreads must be a single continuous painting.`
};

const defaultSettings: AppSettings = {
  defaultMethod: 'method4',
  defaultSpreadCount: 8,
  enableDebugView: false,
  generationDelay: 0,
  unitProductionCost: 13.250,
  unitAiCost: 0.600,
  unitShippingCost: 1.500,
  targetModel: 'gemini-3-pro-preview'
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
}

// Initializations
if (!localStorage.getItem(BIBLE_KEY)) setToStorage(BIBLE_KEY, defaultBible);
if (!localStorage.getItem(SETTINGS_KEY)) setToStorage(SETTINGS_KEY, defaultSettings);

const storedProducts = getFromStorage<ProductSize[]>('admin_products', []);
if (storedProducts.length === 0) {
  setToStorage('admin_products', [{ id: '20x20', name: 'Square', price: 29.900, previewImageUrl: 'https://i.imgur.com/KCXTGBh.png', isAvailable: true, cover: { totalWidthCm: 46.2, totalHeightCm: 23.4, spineWidthCm: 1 }, page: { widthCm: 20, heightCm: 20 }, margins: { topCm: 0.5, bottomCm: 0.5, outerCm: 2, innerCm: 1 }, coverContent: { barcode: { fromRightCm: 15.2, fromTopCm: 21.4, widthCm: 3, heightCm: 0.5 }, format: { fromTopCm: 0, widthCm: 0, heightCm: 0 }, title: { fromTopCm: 3, widthCm: 17, heightCm: 3 } } }]);
}

export function getSeriesBible(): SeriesBible {
  return getFromStorage<SeriesBible>(BIBLE_KEY, defaultBible);
}

export function saveSeriesBible(bible: SeriesBible): void {
  setToStorage(BIBLE_KEY, bible);
}

export function getSettings(): AppSettings {
  return getFromStorage<AppSettings>(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: AppSettings): void {
  setToStorage(SETTINGS_KEY, settings);
}

export function getOrders(): AdminOrder[] {
  const orders = getFromStorage<AdminOrder[]>('admin_orders', []);
  return orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

export function updateOrderStatus(orderNumber: string, status: OrderStatus): void {
  const orders = getOrders();
  const orderIndex = orders.findIndex(o => o.orderNumber === orderNumber);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    setToStorage('admin_orders', orders);
  }
}

export function getCustomers(): AdminCustomer[] {
  const customers = getFromStorage<AdminCustomer[]>('admin_customers', []);
  return customers.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
}

export function getProductSizes(): ProductSize[] { return getFromStorage<ProductSize[]>('admin_products', []); }
export function getProductSizeById(id: string): ProductSize | undefined { return getProductSizes().find(p => p.id === id); }
export function saveProductSize(productData: ProductSize): void {
  const products = getProductSizes();
  const index = products.findIndex(p => p.id === productData.id);
  if (index > -1) products[index] = productData;
  else products.push(productData);
  setToStorage('admin_products', products);
}
export function deleteProductSize(id: string): void { setToStorage('admin_products', getProductSizes().filter(p => p.id !== id)); }

export function getThemes(): StoryTheme[] { return getFromStorage<StoryTheme[]>('admin_themes', INITIAL_THEMES); }
export function saveTheme(themeData: StoryTheme): void {
  const themes = getThemes();
  const index = themes.findIndex(t => t.id === themeData.id);
  if (index > -1) themes[index] = themeData;
  else themes.push(themeData);
  setToStorage('admin_themes', themes);
}
export function deleteTheme(id: string): void { setToStorage('admin_themes', getThemes().filter(t => t.id !== id)); }

export function getArtStyles(): any[] { return getFromStorage<any[]>('admin_styles', ART_STYLE_OPTIONS); }
export function saveArtStyle(style: any): void {
  const styles = getArtStyles();
  const index = styles.findIndex(s => s.name === style.name);
  if (index > -1) styles[index] = style;
  else styles.push(style);
  setToStorage('admin_styles', styles);
}
export function deleteArtStyle(name: string): void { setToStorage('admin_styles', getArtStyles().filter(s => s.name !== name)); }

export async function saveOrder(orderNumber: string, storyData: StoryData, shippingDetails: ShippingDetails): Promise<void> {
  const orders = getOrders();
  const customers = getCustomers();
  const now = new Date();
  const settings = getSettings();

  const product = getProductSizeById(storyData.size);
  const basePrice = product ? product.price : 29.900;
  const totalPrice = basePrice + 1.500;

  const imageFiles: imageStore.OrderImages = {
    cover: new File([await (await fetch(`data:image/jpeg;base64,${storyData.coverImageUrl}`)).blob()], 'cover.jpeg', { type: 'image/jpeg' }),
    spreads: await Promise.all(storyData.pages.filter((_, i) => i % 2 === 0).map(async (p, i) => {
      return new File([await (await fetch(`data:image/jpeg;base64,${p.illustrationUrl}`)).blob()], `spread_${i + 1}.jpeg`, { type: 'image/jpeg' });
    }))
  };
  await imageStore.saveImagesForOrder(orderNumber, imageFiles);

  const sanitizedStoryData = {
    ...storyData,
    coverImageUrl: 'Persisted in IDB',
    pages: storyData.pages.map(page => ({ ...page, illustrationUrl: 'Persisted in IDB' })),
    mainCharacter: { ...storyData.mainCharacter, imageBases64: [], images: [] },
    secondCharacter: storyData.secondCharacter ? { ...storyData.secondCharacter, imageBases64: [], images: [] } : undefined,
  };

  const newOrder: AdminOrder = {
    orderNumber,
    customerName: shippingDetails.name,
    orderDate: now.toISOString(),
    status: 'New Order',
    total: totalPrice,
    productionCost: settings.unitProductionCost,
    aiCost: settings.unitAiCost,
    shippingCost: settings.unitShippingCost,
    storyData: sanitizedStoryData as any,
    shippingDetails,
  };
  orders.unshift(newOrder);
  setToStorage('admin_orders', orders);

  const customerId = shippingDetails.email.toLowerCase();
  const existingCustomerIndex = customers.findIndex(c => c.id === customerId);
  if (existingCustomerIndex > -1) {
    customers[existingCustomerIndex].orderCount += 1;
    customers[existingCustomerIndex].lastOrderDate = now.toISOString();
    customers[existingCustomerIndex].name = shippingDetails.name;
    customers[existingCustomerIndex].phone = shippingDetails.phone;
  } else {
    const newCustomer: AdminCustomer = { id: customerId, name: shippingDetails.name, email: shippingDetails.email, phone: shippingDetails.phone, firstOrderDate: now.toISOString(), lastOrderDate: now.toISOString(), orderCount: 1 };
    customers.unshift(newCustomer);
  }
  setToStorage('admin_customers', customers);
}
