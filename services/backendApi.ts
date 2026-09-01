export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

/**
 * Interface for backend API responses to maintain consistency
 */
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    logs?: any[];
}

/**
 * Centralized API handler for frontend to backend communication
 */
async function fetchBackend<T>(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    
    // Diagnostic Payload Analyzer
    let payloadStr = "";
    if (options.body && typeof options.body === 'string') {
        const payloadBytes = new TextEncoder().encode(options.body).length;
        if (payloadBytes > 1024 * 1024) {
            payloadStr = `[Payload: ${(payloadBytes / (1024 * 1024)).toFixed(2)} MB]`;
        } else {
            payloadStr = `[Payload: ${(payloadBytes / 1024).toFixed(1)} KB]`;
        }
    }

    // Dynamic intelligent timeout:
    // AI generation (DNA, image preview, story generation, editing) takes 15-90s -> 180s (3 min) timeout
    // Standard data fetches (catalog, orders, draft updates) -> 30s timeout
    const isGeneration = endpoint.startsWith('/generate') || endpoint.includes('preview') || endpoint.includes('dna') || endpoint.includes('image');
    const timeoutMs = options.timeoutMs || (isGeneration ? 180000 : 30000);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        console.log(`📡 [API] Request => ${options.method || 'GET'} ${url} ${payloadStr} (timeout: ${timeoutMs / 1000}s)`);

        const response = await fetch(url, {
            ...options,
            signal: options.signal || controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Server responded, but with an error status (e.g. 500 or 400)
            const errorText = await response.text();
            let parsedError: any = {};
            try { parsedError = JSON.parse(errorText); } catch(e) {}
            
            const fullMessage = [
                parsedError.error,
                parsedError.details,
                parsedError.hint
            ].filter(Boolean).join(' | ');
            
            throw new Error(`[HTTP ${response.status}] ${fullMessage || errorText || 'Server Error'}`);
        }

        return await response.json();
        
    } catch (networkError: any) {
        clearTimeout(timeoutId);

        if (networkError.name === 'AbortError' || networkError.message?.includes('aborted')) {
            throw new Error(`AI Generation took longer than ${timeoutMs / 1000}s. Please verify your connection or try again.`);
        }

        // Network-level drops (CORS, 413 abrupt closure, invalid URL)
        if (networkError.name === 'TypeError' || networkError.message === 'Failed to fetch') {
            const extraHint = payloadStr.includes('MB') ? " (POSSIBLE VERCEL 4.5MB PAYLOAD LIMIT REACHED)" : " (POSSIBLE CORS OR TIMEOUT)";
            throw new Error(`Network Connection Dropped => ${url} ${payloadStr}${extraHint}. Verify VITE_BACKEND_URL or Backend Health.`);
        }
        throw networkError;
    }
}

const apiMemoryCache = new Map<string, { data: any; expiry: number }>();

/**
 * Intelligent In-Memory + localStorage SWR Caching Layer for GET endpoints
 */
async function fetchCachedBackend<T>(endpoint: string, ttlMs: number = 10 * 60 * 1000): Promise<T> {
    const cacheKey = `rawy_cache_${endpoint}`;
    const now = Date.now();

    // 1. In-memory check (0ms)
    if (apiMemoryCache.has(cacheKey)) {
        const entry = apiMemoryCache.get(cacheKey)!;
        if (entry.expiry > now) {
            return entry.data as T;
        }
    }

    // 2. LocalStorage check (1ms)
    try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.expiry > now) {
                apiMemoryCache.set(cacheKey, parsed);
                return parsed.data as T;
            }
        }
    } catch (e) {}

    // 3. Network fetch
    const freshData = await fetchBackend<T>(endpoint, { method: 'GET' });

    // 4. Save to caches
    const cacheEntry = { data: freshData, expiry: now + ttlMs };
    apiMemoryCache.set(cacheKey, cacheEntry);
    try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (e) {}

    return freshData;
}

export const backendApi = {
    // Catalog (Cached for 30 minutes)
    getCatalog: () => fetchCachedBackend('/catalog', 30 * 60 * 1000),

    // Generation
    generateDna: (payload: any) => {
        const cleanPayload = {
            ...payload,
            mainCharacter: payload.mainCharacter ? {
                ...payload.mainCharacter,
                imageDNA: undefined,
                images: undefined
            } : undefined,
            secondCharacter: payload.secondCharacter ? {
                ...payload.secondCharacter,
                imageDNA: undefined,
                images: undefined
            } : undefined
        };
        return fetchBackend('/generate/dna', {
            method: 'POST',
            body: JSON.stringify(cleanPayload)
        });
    },

    generateBlueprint: (payload: any) => fetchBackend('/generate/blueprint', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    generateStory: (payload: any) => fetchBackend('/generate/story', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    generateVisualPlan: (payload: any) => fetchBackend('/generate/plan', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    generatePrompts: (payload: any) => fetchBackend('/generate/prompts', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    generateSpreadText: (payload: { blueprint: any, language: string, childName: string, spreadIndex: number, currentText: string, age: string }) => fetchBackend<{ text: string }>('/generate/spread-text', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    generateImage: (payload: any) => fetchBackend('/generate/image', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    editSpreadImage: (payload: { imageBase64: string; editInstruction: string; stylePrompt: string; childDNA?: string; secondDNA?: string }) =>
        fetchBackend<{ imageBase64: string }>('/generate/edit-image', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    outpaintSpreadImage: (payload: { imageBase64: string; stylePrompt: string; childDNA?: string; secondDNA?: string }) =>
        fetchBackend<{ imageBase64: string }>('/generate/outpaint', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),


    generatePreview: (payload: { character: any, secondCharacter?: any, themeDescription: string, themeId?: string, stylePrompt: string, age: string }) => {
        const cleanPayload = {
            ...payload,
            character: payload.character ? {
                ...payload.character,
                imageDNA: undefined,
                images: undefined
            } : undefined,
            secondCharacter: payload.secondCharacter ? {
                ...payload.secondCharacter,
                imageDNA: undefined,
                images: undefined
            } : undefined
        };
        return fetchBackend<{ imageBase64: string, prompt: string, secondImageBase64?: string, secondPrompt?: string }>('/generate/preview', {
            method: 'POST',
            body: JSON.stringify(cleanPayload)
        });
    },

    generateStyleGuide: (payload: { imageBase64: string, stylePrompt: string }) => fetchBackend<{ guide: string }>('/generate/style-guide', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    describeSubject: (payload: { imageBase64: string }) => fetchBackend<{ description: string }>('/generate/describe-subject', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    analyzeImage: (payload: { imageBase64: string, email?: string | null }) => fetchBackend<{
        score: 'not_usable' | 'not_good' | 'acceptable' | 'great';
        feedback_en: string;
        feedback_ar: string;
        issues: string[];
    }>('/generate/analyze-image', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    // Drafts / Orders V2
    createDraftOrder: (payload: { storyData: any, customerEmail?: string, userId?: string, customerName?: string, total?: number, shippingDetails?: any }) => fetchBackend<{ success: boolean; orderId: string; message: string }>('/orders/draft', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    updateDraftOrder: (payload: { orderId: string, storyData?: any, stepProgress?: number, status?: string, shippingDetails?: any }) => fetchBackend<{ success: boolean; message: string }>('/orders/draft', {
        method: 'PUT',
        body: JSON.stringify(payload)
    }),

    // Customer Tools
    getCustomerDashboard: (userId: string) => fetchBackend<{ orders: any[], subscription: any }>(`/orders/customer/${userId}`),
    
    getOrderDetails: (orderId: string) => fetchBackend<any>(`/orders/${orderId}`),

    getPublicStory: (storyId: string) => fetchCachedBackend<{ success: boolean; story: any }>(`/orders/public-story/${storyId}`, 15 * 60 * 1000),

    // Admin Tools
    triggerCron: () => fetchBackend<{ executedTasks: number; failedTasks: number }>('/cron', {
        method: 'GET'
    })
};
