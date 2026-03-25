
import { GoogleGenAI } from "@google/genai";

// Access API Key safely
const getApiKey = () => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    return process.env.GEMINI_API_KEY || 'REDACTED';
};

export const API_KEY = getApiKey();

// Initialize Gemini Client
export const ai = () => new GoogleGenAI({
    apiKey: API_KEY,
    baseURL: typeof window !== 'undefined' ? '/api/gemini' : undefined
} as any);

/**
 * Helper to clean JSON strings from Markdown code blocks
 */
export const cleanJsonString = (str: string): string => {
    if (!str) return "{}";
    return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Generic Retry Wrapper for AI calls
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    delayMs = 1000,
    fallbackValue?: T
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Operation failed, retrying... (${retries} attempts left). Error: ${error}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return withRetry(operation, retries - 1, delayMs * 2, fallbackValue);
        } else {
            console.error("Operation failed after max retries:", error);
            if (fallbackValue !== undefined) return fallbackValue;
            throw error;
        }
    }
}
