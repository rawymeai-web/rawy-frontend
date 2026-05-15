export type Screen =
  | 'language'
  | 'welcome'
  | 'personalization'
  | 'modeSelection'
  | 'styleChoice'
  | 'styleSelection'
  | 'theme'
  | 'size'
  | 'workflow'
  | 'generating'
  | 'unified-generation'
  | 'editor' // NEW: The spread editor and generation view
  | 'preview'
  | 'debug-view' // NEW: For showing the live logs
  | 'checkout'
  | 'confirmation'
  | 'admin'
  | 'customerDashboard'
  | 'orderStatus';

export type Language = 'ar' | 'en' | 'de' | 'es' | 'fr' | 'pt' | 'it' | 'ru' | 'ja' | 'tr';

export interface Character {
  name: string;
  type: 'person' | 'object';
  age?: string;
  gender?: 'boy' | 'girl'; // NEW: For Second Character pronoun logic
  images: File[];
  imageBases64: string[];
  imageDNA?: string[];
  description: string;
  refinedDescription?: string;
  relationship?: string;
}

export interface StoryBlueprint {
  foundation: {
    title: string;
    targetAge: string;
    storyCore: string;
    heroDesire: string;
    mainChallenge: string;
    primaryVisualAnchor: string; // NEW
    moral: string;
    failedAttemptSpread?: number; // NEW
    insightSpread?: number; // NEW
    finalSolutionMethod?: string; // NEW
    // Legacy fields kept optional for backward compat if needed
    masterSetting?: string;
    catalyst?: string;
    limiter?: string;
    signatureAccessory?: string;
    bibleSelections?: {
      coreIndex: number;
      catalystIndex: number;
      limiterIndex: number;
      dnaIndex: number;
      mandateIndex: number;
    };
  };
  characters: {
    heroProfile: string;
    supportingRoles: {
      name: string;
      role: string;
      functionType?: string; // NEW
      appearanceSpreads?: number[]; // NEW
      influenceSpreads?: number[]; // NEW
      influence?: string;
      visualKey: string;
    }[];
  };
  structure: {
    arcSummary: string;
    spreads: {
      spreadNumber: number;
      purpose?: string; // NEW
      narrative: string;
      transitionHook?: string; // NEW
      visualFocus?: string; // NEW
      emotionalBeat: string;
      specificLocation: string;
      environmentType: string;
      timeOfDay: string;
      newCharacters?: string[];
    }[];
  };
}

export interface ThemeVariant {
  title: { ar: string; en: string; };
  description: { ar: string; en: string; };
  skeleton: {
    storyCores: string[];
    catalysts: string[];
    limiters: string[];
    themeVisualDNA: string[];
    settingMandates: string[];
  };
}

export interface StoryTheme {
  id: string;
  title: { ar: string; en: string;[key: string]: string | undefined };
  description: { ar: string; en: string;[key: string]: string | undefined };
  emoji: string;
  category: 'values' | 'adventures' | 'custom';
  visualDNA: string;
  variants?: {
    younger: ThemeVariant; // Ages 1-5
    older: ThemeVariant;   // Ages 6+
  };
  skeleton: {
    storyCores: string[];
    catalysts: string[];
    limiters: string[];
    themeVisualDNA: string[];
    settingMandates: string[];
  };
}

export interface AppSettings {
  defaultMethod: string;
  defaultSpreadCount: number;
  enableDebugView: boolean;
  generationDelay: number;
  unitProductionCost: number;
  unitAiCost: number;
  unitShippingCost: number;
  targetModel: string;
}

export interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  region?: 'kuwait' | 'gcc' | 'row'; // NEW: For shipping matrix
}

export interface AdminOrder {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  status: OrderStatus;
  total: number;
  productionCost: number;
  aiCost: number;
  shippingCost: number;
  storyData: StoryData;
  shippingDetails: ShippingDetails;
  packageUrl?: string;
}

// Added interface for CoverDebugImages to support debugging views and step-by-step review
export interface CoverDebugImages {
  finalComposite?: string;
  step1_anchorScene?: string;
  step2_frontCover?: string;
  step3_finalWrap?: string;
}

export interface StoryData {
  childName: string;
  childAge: string;
  childGender?: 'boy' | 'girl'; // NEW: Captured conditionally for age >= 6
  parentName?: string; // NEW: Capture parent name early
  parentEmail?: string; // NEW: Capture parent email early
  title: string;
  coverSubtitle?: string; // NEW: Allow explicit setting of Cover Subtitle
  theme: string;
  themeId?: string;
  occasion?: string; // NEW: Special occasion like Birthday, Sibling etc.
  themeVisualDNA?: string; // NEW: Thematic visual instructions (e.g. "Indigo and gold, Mashrabiya moon motifs")
  storyMode?: 'classic' | 'portals';
  mainCharacter: Character;
  secondCharacter?: Character;
  useSecondCharacter: boolean;
  coverImageUrl: string;
  actualCoverPrompt?: string;
  coverTextSide?: 'left' | 'right';
  spreadCount?: number;   // Resolved from settings.defaultSpreadCount; defaults to 8
  spreads: Spread[];      // Cover (index 0) + N inner spreads
  pages?: Page[];         // @deprecated — kept for legacy order migration only
  size: string;
  selectedStylePrompt: string;
  selectedStyleNames?: string[];
  technicalStyleGuide?: string;
  styleSeed?: number;
  customGoal?: string;
  customChallenge?: string;
  customStoryText?: string; // NEW: Explicit script or poem provided by user
  customIllustrationNotes?: string;
  blueprint?: StoryBlueprint;
  script?: any[]; // NEW: The array of spread texts
  rawScript?: any[]; // NEW: For logging the initial draft vs edited draft
  spreadPlan?: SpreadDesignPlan;
  finalPrompts?: string[];
  styleReferenceImageBase64?: string;
  secondCharacterImageBase64?: string; // Hosted / Raw base64 for secondary character DNA
  styleReferenceImageUrl?: string;     // Hosted URL for the DNA image

  // --- DNA Audit Trail (Customer Proof of Choice) ---
  dnaAudit?: {
    heroA: {
      selectedPreviewIndex: number;       // Which of the 4 cards was clicked (0–3)
      lockedImageBase64Prefix: string;    // First 100 chars of chosen base64 (fingerprint)
      lockedAt: string;                   // ISO timestamp when customer locked
    };
    heroB?: {
      selectedPreviewIndex: number;
      lockedImageBase64Prefix: string;
      validSecondImagePresent: boolean;   // false = fell back to Hero A image (bad)
      lockedAt: string;
    };
  };

  // Added optional fields for debug and comparison
  coverDebugImages?: CoverDebugImages;
  selectedDebugMethods?: string[];
  workflowLogs?: WorkflowLog[];
  language?: Language;
  userId?: string;
  orderId?: string; // NEW: Track the backend order ID
  planType?: 'one_time' | 'monthly' | 'yearly'; // NEW: Track subscription choice
  
  // --- Physical Print Workflow ---
  isPhysicalPrint?: boolean;
  isPrintUpsell?: boolean; // NEW: For post-read physical re-orders
  shippingRegion?: 'kuwait' | 'gcc' | 'row';
  printStatus?: 'none' | 'ordered' | 'printed' | 'delivered';
  isCustomTheme?: boolean; // NEW: Track if this book uses a special event/custom theme (+1 KD)
}

export interface WorkflowLog {
  stage: 'Blueprint' | 'Drafting' | 'Visual Plan' | 'Prompt Engineering' | 'QA' | 'Production';
  timestamp: number;
  inputs: any;
  outputs: any;
  status: 'Success' | 'Failed';
  durationMs: number;
}

export type OrderStatus = 'New Order' | 'character_ready' | 'Processing' | 'Shipping' | 'Completed' | 'draft' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'cancelled' | 'failed' | 'paid_confirmed' | 'queued' | 'theme_assigned' | 'story_generating' | 'story_ready' | 'illustrations_generating' | 'illustrations_ready' | 'book_compiling' | 'softcopy_ready' | 'awaiting_preview_approval' | 'sent_to_print' | 'printing' | 'delivered' | 'on_hold';

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  firstOrderDate: string;
  lastOrderDate: string;
  orderCount: number;
}

export interface ProductSize {
  id: string;
  name: string;
  price: number;
  previewImageUrl: string;
  isAvailable: boolean;
  cover: { totalWidthCm: number; totalHeightCm: number; spineWidthCm: number; };
  page: { widthCm: number; heightCm: number; };
  margins: { topCm: number; bottomCm: number; outerCm: number; innerCm: number; };
  coverContent: {
    barcode: { fromRightCm: number; fromTopCm: number; widthCm: number; heightCm: number; },
    format: { fromTopCm: number; widthCm: number; heightCm: number; }
    title: { fromTopCm: number; widthCm: number; heightCm: number; }
  };
}

export interface SpreadDesignPlan {
  visualAnchors: {
    heroTraits: string;
    signatureItems: string;
    recurringLocations: string;
    persistentProps: string;
    spatialLogic: string;
  };
  characters?: StoryBlueprint['characters']; // NEW: Propagate Blueprint characters for consistency
  spreads: {
    spreadNumber: number;
    setting: string;
    environmentType: string;
    timeOfDay: string;
    lighting: string;
    mainContentSide: string;
    keyActions: string;
    mood: string;
    emotion: string; // NEW: Specific emotional resonance
    cameraAngle: string; // NEW: Cinematic camera placement
    colorPalette: string; // NEW: Specific color tones for this spread
    props: string;
    continuityNotes: string;
  }[];
}

export interface TextBlock {
  text: string;
  position: { top: number; left: number; width: number; };
  alignment: string;
}

/** @deprecated Use Spread instead */
export interface Page {
  pageNumber: number;
  text: string;
  illustrationUrl: string;
  actualPrompt?: string;
  textBlocks?: TextBlock[];
  textSide?: 'left' | 'right';
  anchorIllustrationUrl?: string;
  alternativeIllustrationUrl?: string;
  debugContext?: any;
  sceneBlueprint?: any;
  pageSummary?: string;
}

/** One visual unit = one широко illustration + its two halves of story text */
export interface Spread {
  spreadNumber: number;       // 0 = cover, 1–N = inner spreads
  illustrationUrl: string;    // Supabase Storage public URL (or temp base64 during generation)
  leftText: string;           // Story text displayed on the left half
  rightText: string;          // Story text displayed on the right half
  actualPrompt?: string;      // The exact image prompt used
  textSide?: 'left' | 'right'; // Which side the subject occupies (drives layout)
  // Layout overrides (set in EditorScreen, applied in fileService PDF rendering)
  textOffsetX?: number;       // PDF mm — left edge of text box (overrides auto calculation)
  textOffsetY?: number;       // PDF mm — top edge of text box (overrides auto calculation)
  imageOffsetX?: number;      // % shift of illustration horizontally (-50 to +50, default 0)
  imageOffsetY?: number;      // % shift of illustration vertically (-50 to +50, default 0)
  imageScale?: number;        // scale of illustration (100 = default, 150 = 1.5x zoom)
}


export interface StoryPlan {
  core: {
    heroDesire: string;
    mainChallenge: string;
    catalyst: string;
    limiter: string;
  };
  characterRoles: {
    name: string;
    roleType: string;
    influence: string;
    visualKey: string;
  }[];
  phases: {
    phaseNumber: number;
    purpose: string;
    keyAction: string;
  }[];
  consistencyAnchors: {
    objectName: string;
    description: string;
  }[];
}

// ==========================================
// SUBSCRIPTION PIPELINE TYPES
// ==========================================

export type DbOrderStatus =
  | 'draft' | 'pending_payment' | 'paid'
  | 'paid_confirmed' | 'queued' | 'theme_assigned'
  | 'story_generating' | 'story_ready'
  | 'illustrations_generating' | 'illustrations_ready'
  | 'book_compiling' | 'softcopy_ready'
  | 'awaiting_preview_approval' | 'sent_to_print'
  | 'printing' | 'shipped' | 'delivered'
  | 'failed' | 'on_hold' | 'cancelled';

export type SubscriptionStatus = 'active' | 'payment_retry' | 'paused' | 'cancelled' | 'expired';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Hero {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string;
  dna_image_url?: string;
  created_at?: string;
}

export interface HeroPreferences {
  hero_id: string;
  preferred_theme_tags: string[];
  blocked_theme_tags: string[];
  style_mode: 'fixed' | 'rotate';
  style_reference_image_base64?: string;
  updated_at?: string;
}

export interface Theme {
  id: string;
  title: string;
  description?: string;
  visual_dna_prompt: string;
  tags: string[];
  active_from: string;
  active_to?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  hero_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  shipping_address_id?: string;
  next_billing_date: string;
}

export interface HeroThemeHistory {
  id: string;
  hero_id: string;
  theme_id: string;
  subscription_id?: string;
  order_id?: string;
  assigned_at?: string;
}

export interface OrderJob {
  id: string;
  order_id: string;
  job_type: 'story' | 'illustration' | 'compilation' | 'print_handoff';
  status: JobStatus;
  attempts: number;
  started_at?: string;
  finished_at?: string;
  error_message?: string;
  worker_name?: string;
  artifact_refs?: Record<string, any>;
}

export interface EventAuditLog {
  id: string;
  event_type: string;
  order_id?: string;
  subscription_id?: string;
  admin_id?: string;
  details?: Record<string, any>;
  created_at?: string;
}
