
import { GoogleGenAI, Type } from "@google/genai";
import type { Character, StoryData, Language, StoryBlueprint, SpreadDesignPlan, StoryTheme } from '../types';
import * as adminService from './adminService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const ai = () => new GoogleGenAI({
    apiKey: API_KEY,
    // Use local proxy if in browser to avoid CORS. Node.js scripts won't use this.
    baseURL: typeof window !== 'undefined' ? '/api/gemini' : undefined
} as any);

const getContext = () => {
    const bible = adminService.getSeriesBible();
    return `${bible.masterGuardrails}\n\n${bible.storyFlowLogic}\n\n${bible.compositionMandates}`;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('disturbed') || error.status === 500)) {
            console.warn(`Transient error detected, retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 1000));
            return withRetry(fn, retries - 1);
        }
        throw error;
    }
}

function cleanJsonString(str: string | undefined): string {
    if (!str) return '[]';
    let cleaned = str.trim();
    const firstBracket = Math.min(
        cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
        cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{')
    );
    const lastBracket = Math.max(
        cleaned.lastIndexOf(']'),
        cleaned.lastIndexOf('}')
    );
    if (firstBracket !== Infinity && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    return cleaned;
}

const blueprintSchema = {
    type: Type.OBJECT,
    properties: {
        foundation: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                targetAge: { type: Type.STRING },
                storyCore: { type: Type.STRING },
                mainChallenge: { type: Type.STRING },
                moral: { type: Type.STRING },
                catalyst: { type: Type.STRING },
                limiter: { type: Type.STRING },
                masterSetting: { type: Type.STRING },
                bibleSelections: {
                    type: Type.OBJECT,
                    properties: {
                        coreIndex: { type: Type.INTEGER },
                        catalystIndex: { type: Type.INTEGER },
                        limiterIndex: { type: Type.INTEGER },
                        dnaIndex: { type: Type.INTEGER },
                        mandateIndex: { type: Type.INTEGER }
                    },
                    required: ['coreIndex', 'catalystIndex', 'limiterIndex', 'dnaIndex', 'mandateIndex']
                }
            },
            required: ['title', 'storyCore', 'mainChallenge', 'moral', 'catalyst', 'limiter', 'bibleSelections']
        },
        characters: {
            type: Type.OBJECT,
            properties: {
                heroProfile: { type: Type.STRING },
                supportingRoles: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, visualKey: { type: Type.STRING } },
                        required: ['name', 'role', 'visualKey']
                    }
                }
            },
            required: ['heroProfile', 'supportingRoles']
        },
        structure: {
            type: Type.OBJECT,
            properties: {
                arcSummary: { type: Type.STRING },
                spreads: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { spreadNumber: { type: Type.INTEGER }, narrative: { type: Type.STRING }, keyActions: { type: Type.STRING } },
                        required: ['spreadNumber', 'narrative', 'keyActions']
                    }
                }
            },
            required: ['arcSummary', 'spreads']
        }
    },
    required: ['foundation', 'characters', 'structure']
};

export async function runJuniorWriter(data: StoryData, theme: StoryTheme | undefined): Promise<StoryBlueprint> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));

        const bible = adminService.getSeriesBible();

        const prompt = `ROLE: Creative Writer.
            ${getContext()}
        TASK: Create a Story Blueprint for a children's book.
        Title: "${data.childName} and the ${theme?.title.en || 'Adventure'}"
        Protagonist: ${data.childName}, Age ${data.childAge}.
        Theme: ${theme?.title.en || 'General Adventure'}.
        Moral: Courage (Derived from ${theme?.title.en || 'Adventure'}).
        
        REQUIREMENTS:
        1. Create a "Hero Profile" and 1-2 "Supporting Roles" (Sidekicks).
        2. Outline a 5-beat narrative arc.
        3. Select appropriate "Bible Indices" for the story elements.
        
        OUTPUT: JSON matching the Blueprint Schema.`;

        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: blueprintSchema }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runSeniorWriter(blueprint: StoryBlueprint): Promise<StoryBlueprint> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const prompt = `ROLE: Senior Editor.
            ${getContext()}
        AUDIT: Validate the narrative arc against the Story Flow logic.Ensure failure leads to internal growth.
            Blueprint: ${JSON.stringify(blueprint)} `;
        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: blueprintSchema }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runVisualDesigner(blueprint: StoryBlueprint): Promise<SpreadDesignPlan> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const prompt = `ROLE: Art Director.Plan ${settings.defaultSpreadCount} panoramic layouts.
            ${getContext()}
        Blueprint: ${JSON.stringify(blueprint)} `;
        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        spreads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { spreadNumber: { type: Type.INTEGER }, keyActions: { type: Type.STRING }, mainContentSide: { type: Type.STRING, enum: ["Left", "Right"] } }, required: ['spreadNumber', 'keyActions', 'mainContentSide'] } }
                    },
                    required: ['spreads']
                }
            }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runCreativeDirector(blueprint: StoryBlueprint, plan: SpreadDesignPlan): Promise<SpreadDesignPlan> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const prompt = `ROLE: Executive Creative Director.
            ${getContext()}
        Plan: ${JSON.stringify(plan)} `;
        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { spreads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { spreadNumber: { type: Type.INTEGER }, keyActions: { type: Type.STRING }, mainContentSide: { type: Type.STRING, enum: ["Left", "Right"] } }, required: ['spreadNumber', 'keyActions', 'mainContentSide'] } } }, required: ['spreads'] } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runPromptEngineer(plan: SpreadDesignPlan, technicalStyleGuide: string, stylePrompt: string, blueprint: StoryBlueprint): Promise<string[]> {
    return withRetry(async () => {
        const prompt = `ROLE: Lead Illustrator.
            ${getContext()}
        TASK: Write EXACTLY 8 detailed cinematic prompts based on the visual plan.
        CRITICAL: You MUST return an array of exactly 8 strings. One for each spread.
            Plan: ${JSON.stringify(plan)}. JSON array output.`;
        const response = await ai().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
        });
        const prompts = JSON.parse(cleanJsonString(response.text));

        // Safety Fallback: Ensure 8 items
        if (prompts.length < 8) {
            console.warn(`Gemini returned ${prompts.length} prompts, padding to 8.`);
            while (prompts.length < 8) prompts.push(prompts[prompts.length - 1] || "A beautiful continuing scene.");
        }
        return prompts.slice(0, 8); // Ensure max 8
    });
}

export async function runPromptReviewer(prompts: string[]): Promise<string[]> {
    return withRetry(async () => {
        const prompt = `ROLE: Prompt QA.
            ${getContext()}
        Audit these prompts for "Series Consistency".
        Prompts: ${JSON.stringify(prompts)} `;
        const response = await ai().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

async function describeSubject(imageBase64: string): Promise<string> {
    return withRetry(async () => {
        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                { text: "Describe this person's physical appearance in significant detail. Focus on hair color/style, eye color, skin tone, facial structure, and age. Be concise but descriptive. Output ONLY the visual description." }
            ]
        });
        return response.text?.trim() || "A child";
    });
}

export async function generateMethod4Image(prompt: string, stylePrompt: string, referenceBase64: string, characterDescription: string, age: string, seed?: number, secondReferenceBase64?: string): Promise<{ imageBase64: string; fullPrompt: string }> {
    return withRetry(async () => {
        const bible = adminService.getSeriesBible();

        // Step 1: Get Visual Description of the Subject(s) from Gemini 1.5 Flash
        const subjectDescription = await describeSubject(referenceBase64);
        let secondSubjectDesc = "";
        if (secondReferenceBase64) {
            secondSubjectDesc = await describeSubject(secondReferenceBase64);
        }

        // STRATEGY: Structured Prompting (JSON-Logic equivalent for Image Models)
        let styleContext = `TASK: Create a ${stylePrompt || 'cinematic storybook'} illustration.
** VISUAL STYLE MANDATE (OVERRIDE DEFAULT):** ${stylePrompt}

** MASTER IDENTITY RULE(CRITICAL):**
            1. ** FACE / HEAD:** ${subjectDescription}
            2. ** AGE LOCK:** The character MUST be a child aged ${age}.
        3. ** CONSISTENCY:** Same person, same age, same face in every shot.

** CLOTHING LOCK:** The character MUST wear: "${characterDescription}".Do not change this outfit unless the prompt specifically requests a costume change.
            ${secondReferenceBase64 ? `**IDENTITY LOCK 2 (SECONDARY):** ${secondSubjectDesc}` : ''}

${bible.masterGuardrails}

${bible.compositionMandates}

** COMPOSITION:** Ultrawide - Angle Panoramic Shot.Use "Negative Space" on the sides(clean background) for text placement.`;

        // The "User Action" is distinct from the "System Context"
        const finalPrompt = `${styleContext}\n\nNOW GENERATE THIS SPECIFIC SCENE:\n${prompt}`;

        console.log("Generating Image (Imagen 4) with Prompt Length:", finalPrompt.length);

        // Attempt 2: Use Imagen 4 via direct Proxy Fetch
        console.log("Generating Image (Imagen 4) via Proxy...");

        const apiVersion = "v1beta";
        const actualModel = "imagen-4.0-generate-001";

        const baseUrl = typeof window !== 'undefined' ? '/api/gemini' : 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/${apiVersion}/models/${actualModel}:predict?key=${API_KEY}`;

        const payload = {
            instances: [
                { prompt: finalPrompt }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "16:9"
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const txt = await response.text();
            console.error("Imagen 4 Proxy Failed:", response.status, txt);
            throw new Error(`Imagen 4 Failed: ${response.status} ${txt}`);
        }

        const data = await response.json();
        let b64 = "";
        if (data.predictions && data.predictions.length > 0) {
            b64 = data.predictions[0].bytesBase64Encoded;
        }

        if (!b64) {
            console.error("Imagen 4 No Image Data:", JSON.stringify(data, null, 2));
            throw new Error("Image generation failed - No Data");
        }

        return { imageBase64: b64, fullPrompt: finalPrompt };
    });
}

export async function generateScriptDraft(blueprint: StoryBlueprint, language: Language, childName: string): Promise<{ text: string }[]> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const draftPrompt = `ROLE: Children's Book Author. 
${getContext()}
        TASK: Write ${settings.defaultSpreadCount} narrative beats (one per spread) in ${language}.
        Blueprint: ${JSON.stringify(blueprint)}. 

** STRICT STRUCTURE MANDATE:**
- ** BEAT 1 (INTRODUCTION):** You MUST start with an Introduction Phase. Establish the setting and the character's normal world BEFORE the adventure begins. Do not start "in media res".
- ** ONE BEAT PER SPREAD:** Write exactly ${settings.defaultSpreadCount} text blocks.

** STRICT CHARACTER RULE:**
            - The story must focus on the Child(and Sidekick if present). 
- ** CRITICAL NAME RULE:** The child's name is "${childName}". USE THIS NAME EXACTLY. DO NOT use "Reem", "Ahmed", "Sarah", or any other placeholder name.
            - ** FREQUENCY:** You MUST mention the child's name ("${childName}") at least once on EVERY single page.
                - ** DO NOT ** introduce parents, siblings, or family members unless they are explicitly mentioned in the "Customer Input". 
- Use fictional characters(wizards, animals, friends) for supporting roles if needed.

            OUTPUT: JSON array of ${settings.defaultSpreadCount} { "text": "string" }.`;

        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: draftPrompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function polishScript(draft: { text: string }[], blueprint: StoryBlueprint, language: Language): Promise<{ text: string }[]> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        const age = parseInt(blueprint.foundation.targetAge) || 5;
        const maxWords = age <= 3 ? 10 : (age <= 6 ? 20 : 35);

        const editorPrompt = `ROLE: Senior Editor & Stylist.
            ${getContext()}

        TASK: Polish the draft below to PERFECTION based on the "Stylistic Guidelines" above.
SPECIFIC CHECKS:
        0. ** Strict Word Count:** MAXIMUM ${maxWords} words per page.This is CRITICAL.
1. ** Rhythm:** Use the "Rule of Three"(e.g., "Thump! Thump! Shake!").Short sentences.
2. ** Sensory:** Ensure every page has Sound, Touch, or Smell.
3. ** Agency:** Ensure the child is the one solving the problem, not adults.
4. ** Formatting:** Keep it to ${language === 'ar' ? 'Arabic' : 'English'}.
        5. ** No Unrequested Family:** Ensure no parents / siblings appear in the text unless they were in the input.
6. ** Name Frequency:** Ensure the child's name appears at least once on every page.
        7. ** No Stage Directions:** ABSOLUTELY NO text in asterisks(e.g. * sigh *, * giggle *).Pure narrative text only.

DRAFT CONTENT:
${JSON.stringify(draft)}

        OUTPUT: JSON array of ${settings.defaultSpreadCount * 2} { "text": "string" } (Polished Version).`;

        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: editorPrompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function generateFinalScript(blueprint: StoryBlueprint, language: Language, childName: string): Promise<{ text: string }[]> {
    const draft = await generateScriptDraft(blueprint, language, childName);
    return polishScript(draft, blueprint, language);
}

export async function generateThemeStylePreview(mainCharacter: Character, secondCharacter: Character | undefined, theme: string, style: string, seed?: number): Promise<{ imageBase64: string; prompt: string }> {
    return withRetry(async () => {
        const bible = adminService.getSeriesBible();

        // Step 1: Describe the subject
        const subjectDescription = await describeSubject(mainCharacter.imageBases64[0]);
        let secondSubjectDesc = "";
        if (secondCharacter && secondCharacter.imageBases64 && secondCharacter.imageBases64[0]) {
            secondSubjectDesc = await describeSubject(secondCharacter.imageBases64[0]);
        }

        // Include Theme Context if provided
        const themeContext = theme ? `CONTEXT: The child is in a "${theme}" setting. (e.g.Space, Jungle, etc).` : '';

        const prompt = `TASK: CLOSE - UP PORTRAIT of Main Character.
        STYLE: ${style}.
    PROTAGONIST: ${subjectDescription}
    CAMERA: Medium - Close shot(Head & Shoulders).Focus heavily on FACE and EXPRESSION.
        ${themeContext}
    ${secondSubjectDesc ? `SECONDARY: ${secondSubjectDesc}` : ''}
${bible.masterGuardrails} `;

        // Attempt 2: Use Imagen 4 via generateImages
        // Attempt 2: Use Imagen 4 via direct Proxy Fetch (Bypassing SDK to ensure correct endpoint)
        console.log("Generating Image (Imagen 4) via Proxy...");

        let b64 = "";
        try {
            const apiVersion = "v1beta";
            const modelName = "imagen-3.0-generate-001";
            // Switched to 3.0 for stability
            const actualModel = "imagen-3.0-generate-001";

            const baseUrl = typeof window !== 'undefined' ? '/api/gemini' : 'https://generativelanguage.googleapis.com';
            const url = `${baseUrl}/${apiVersion}/models/${actualModel}:predict?key=${API_KEY}`;

            const payload = {
                instances: [
                    { prompt: prompt }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const txt = await response.text();
                console.error("Imagen 4 Proxy Failed:", response.status, txt);
                throw new Error(`Imagen 4 Failed: ${response.status} ${txt}`);
            }

            const data = await response.json();
            if (data.predictions && data.predictions.length > 0) {
                b64 = data.predictions[0].bytesBase64Encoded;
            }
        } catch (err) {
            console.error("Direct Proxy Fetch Error:", err);
            throw err;
        }

        if (!b64) {
            console.error("Image generation failed. No B64 Data.");
            throw new Error("Image generation failed");
        }
        return { imageBase64: b64, prompt };
    }, 0).catch(e => {
        console.error("generateThemeStylePreview ERROR:", e);
        throw e;
    });
}

export async function generateTechnicalStyleGuide(imageBase64: string, basePrompt: string): Promise<string> {
    return withRetry(async () => {
        const response = await ai().models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: `Describe palette. 50 words.` }]
        });
        return response.text || "";
    });
}
