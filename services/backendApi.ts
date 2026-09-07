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

async function sanitizeAndCompressStoryData(storyData: any): Promise<any> {
    if (!storyData || typeof storyData !== 'object') return storyData;
    const clean = { ...storyData };

    // 1. Remove volatile runtime preview caches and large debug dumps
    delete clean.cachedPreviews;
    delete clean.previewImages;
    delete clean.styleVariants;
    delete clean.coverDebugImages;
    delete clean.workflowLogs;

    // Helper: compress base64 images if they exceed 150KB
    const compressArrayOfImages = async (imgList: any[]) => {
        if (!Array.isArray(imgList)) return imgList;
        return Promise.all(
            imgList.map(async (img) => {
                if (typeof img === 'string' && img.length > 150000 && !img.startsWith('http')) {
                    try {
                        const { compressBase64Image } = await import('../utils/imageUtils');
                        return await compressBase64Image(img, 1024, 0.75);
                    } catch (e) {
                        return img;
                    }
                }
                return img;
            })
        );
    };

    // 2. Compress hero photos
    if (clean.mainCharacter) {
        clean.mainCharacter = { ...clean.mainCharacter };
        if (clean.mainCharacter.imageBases64) {
            clean.mainCharacter.imageBases64 = await compressArrayOfImages(clean.mainCharacter.imageBases64);
        }
        if (clean.mainCharacter.images) {
            clean.mainCharacter.images = await compressArrayOfImages(clean.mainCharacter.images);
        }
    }

    if (clean.secondCharacter) {
        clean.secondCharacter = { ...clean.secondCharacter };
        if (clean.secondCharacter.imageBases64) {
            clean.secondCharacter.imageBases64 = await compressArrayOfImages(clean.secondCharacter.imageBases64);
        }
        if (clean.secondCharacter.images) {
            clean.secondCharacter.images = await compressArrayOfImages(clean.secondCharacter.images);
        }
    }

    // 3. Compress single cover image if embedded as huge base64
    if (typeof clean.coverImageUrl === 'string' && clean.coverImageUrl.length > 250000 && !clean.coverImageUrl.startsWith('http')) {
        try {
            const { compressBase64Image } = await import('../utils/imageUtils');
            clean.coverImageUrl = await compressBase64Image(clean.coverImageUrl, 1024, 0.75);
        } catch (e) {}
    }

    // 4. Strip heavy debug b64 from spreads
    if (Array.isArray(clean.spreads)) {
        clean.spreads = clean.spreads.map((spread: any) => {
            if (!spread) return spread;
            const cleanSpread = { ...spread };
            delete cleanSpread.rawGeneratedB64;
            return cleanSpread;
        });
    }

    return clean;
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
    createDraftOrder: async (payload: { storyData: any, customerEmail?: string, userId?: string, customerName?: string, total?: number, shippingDetails?: any }) => {
        const cleanStory = await sanitizeAndCompressStoryData(payload.storyData);
        return fetchBackend<{ success: boolean; orderId: string; message: string }>('/orders/draft', {
            method: 'POST',
            body: JSON.stringify({ ...payload, storyData: cleanStory })
        });
    },

    updateDraftOrder: async (payload: { orderId: string, storyData?: any, stepProgress?: number, status?: string, shippingDetails?: any }) => {
        const cleanStory = payload.storyData ? await sanitizeAndCompressStoryData(payload.storyData) : undefined;
        return fetchBackend<{ success: boolean; message: string }>('/orders/draft', {
            method: 'PUT',
            body: JSON.stringify({ ...payload, storyData: cleanStory })
        });
    },

    // Customer Tools
    getCustomerDashboard: (userId: string) => fetchBackend<{ orders: any[], subscription: any }>(`/orders/customer/${userId}`),
    
    getPublicStory: (storyId: string) => fetchBackend<{ success: boolean; story: any }>(`/orders/public-story/${storyId}?_t=${Date.now()}`),

    // Admin Tools
    triggerCron: () => fetchBackend<{ executedTasks: number; failedTasks: number }>('/cron', {
        method: 'GET'
    })
};
