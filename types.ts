

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
  | 'preview'
  | 'checkout'
  | 'confirmation'
  | 'admin'
  | 'orderStatus';

export type Language = 'ar' | 'en';

export interface Character {
  name: string;
  type: 'person' | 'object';
  age?: string;
  images: File[];
  imageBases64: string[];
  description: string;
  refinedDescription?: string;
  relationship?: string;
}

export interface StoryBlueprint {
  foundation: {
    title: string;
    targetAge: string;
    storyCore: string;
    masterSetting: string;
    heroDesire: string;
    mainChallenge: string;
    catalyst: string;
    limiter: string;
    moral: string;
    signatureAccessory: string;
    bibleSelections: {
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
      influence: string;
      visualKey: string; // NEW: Strict visual description for consistency
    }[];
  };
  structure: {
    arcSummary: string;
    spreads: {
      spreadNumber: number;
      narrative: string;
      emotionalBeat: string;
      specificLocation: string;
      environmentType: string;
      timeOfDay: string;
    }[];
  };
}

export interface StoryTheme {
  id: string;
  title: { ar: string; en: string; };
  description: { ar: string; en: string; };
  emoji: string;
  category: 'values' | 'adventures' | 'custom';
  visualDNA: string;
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
  title: string;
  theme: string;
  themeId?: string;
  storyMode?: 'classic' | 'portals';
  mainCharacter: Character;
  secondCharacter?: Character;
  useSecondCharacter: boolean;
  coverImageUrl: string;
  actualCoverPrompt?: string;
  pages: Page[];
  size: string;
  selectedStylePrompt: string;
  selectedStyleNames?: string[];
  technicalStyleGuide?: string;
  styleSeed?: number;
  customGoal?: string;
  customChallenge?: string;
  customIllustrationNotes?: string;
  blueprint?: StoryBlueprint;
  spreadPlan?: SpreadDesignPlan;
  finalPrompts?: string[];
  styleReferenceImageBase64?: string;
  // Added optional fields for debug and advanced comparison workflows to fix missing property errors
  coverDebugImages?: CoverDebugImages;
  selectedDebugMethods?: string[];
}

export type OrderStatus = 'New Order' | 'Processing' | 'Shipping' | 'Completed';

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
  spreads: {
    spreadNumber: number;
    setting: string;
    environmentType: string;
    timeOfDay: string;
    lighting: string;
    mainContentSide: string;
    keyActions: string;
    mood: string;
    props: string;
    continuityNotes: string;
  }[];
}

export interface TextBlock {
  text: string;
  position: { top: number; left: number; width: number; };
  alignment: string;
}

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
