
// --- RAWY MODULAR SERVICE FACADE ---
// This file aggregates the new modular services for backward compatibility
// and ease of import in the UI hooks.

import { generateBlueprint as agentBlueprint } from './story/blueprintAgent';
import { generateStoryDraft as agentDraft } from './story/narrativeAgent';
import { generateVisualPlan } from './visual/director';
import { generatePrompts } from './visual/promptEngineer';
import { runQualityAssurance } from './visual/qualityAssurance';
import { generateThemeStylePreview, describeSubject, generateImagenImage } from './generation/imageGenerator';

// Re-export specific unchanged ones
export { generateVisualPlan, generatePrompts, runQualityAssurance, generateThemeStylePreview, describeSubject };

import { StoryBlueprint, Language, StoryTheme, StoryData, WorkflowLog } from '../types';
import * as adminService from './adminService';
import { cleanJsonString, withRetry, ai } from './generation/modelGateway';
import { Type } from '@google/genai';

// --- ADAPTERS FOR BACKWARD COMPATIBILITY ---

export async function generateBlueprint(
    contextPayload: {
        childName: string,
        childAge: number,
        themeId: string,
        themeTitle: string,
        themeData: StoryTheme,
        childDescription?: string // ADDED THIS
    },
    language: 'en' | 'ar' = 'en'
): Promise<{ result: StoryBlueprint, log: WorkflowLog }> {
    // Adapter: Convert contextPayload to StoryData-like object for the agent
    // The agent expects StoryData, but mainly needs name, age, theme.
    const mockStoryData: any = {
        childName: contextPayload.childName,
        childAge: contextPayload.childAge,
        // PASS THE DESCRIPTION IF AVAILABLE (It might be in themeData or we need to expand the input)
        // Wait, the input `contextPayload` needs to have it.
        // We will assume `contextPayload.themeData` might contain character info or we need to update the interface.
        // Actually, let's check where `generateBlueprint` is CALLED. It's called from `useStoryWorkflow.ts`.
        // We might need to update the signature of `generateBlueprint` too.
        mainCharacter: { description: (contextPayload as any).childDescription || "" },
        theme: contextPayload.themeTitle,
        customGoal: "",
        customChallenge: ""
    };

    // Explicitly pass 'en' as default or infer? The old one didn't take language here, 
    // but the Prompt inside depended on it? 
    // Actually the old prompt: "Language: English" (hardcoded to English unless implicit?)
    // Wait, the old prompt had: "Ensure specific vocab... for Age X". 
    // The new agent requires language. Let's assume 'en' for now as blueprint is structural.
    return agentBlueprint(mockStoryData, language);
}

export async function generateScript(
    blueprint: StoryBlueprint,
    language: Language,
    childAge: number,
    childName: string
): Promise<{ result: { text: string }[], log: WorkflowLog }> {
    // Adapter: Ignore childAge as the agent extracts it from blueprint
    return agentDraft(blueprint, language, childName);
}

// --- LEGACY/HELPER FUNCTIONS (Kept for compatibility/utility) ---
// These were less critical to move immediately but can be refactored later
// or are specific compount functions.

export async function generateScriptDraft(blueprint: StoryBlueprint, language: Language, childName: string): Promise<{ text: string }[]> {
    const settings = await adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const draftPrompt = `ROLE: Children's Book Author. 
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

        // Leveraging the new narrative agent logic conceptually, but sticking to this specific prompt structure for now
        // to minimize drift. 
            OUTPUT: JSON array of ${settings.defaultSpreadCount} { "text": "string" }.`;

        const response = await ai().models.generateContent({
            model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-flash',
            contents: editorPrompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function generateTechnicalStyleGuide(imageBase64: string, basePrompt: string): Promise<string> {
    return withRetry(async () => {
        const response = await ai().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: `Describe this art style palette and texture in 50 words.` }]
        });
        return response.text || "";
    });
}

// UPGRADED: Hybrid Vision Strategy for Pages (Feb 2)
export async function generateMethod4Image(
    prompt: string,
    stylePrompt: string,
    referenceBase64: string,
    characterDescription: string,
    age: string,
    seed?: number
): Promise<{ imageBase64: string; fullPrompt: string }> {
    return withRetry(async () => {
        // We use the "Verify Hero" result (referenceBase64) as the Visual Anchor.
        // This ensures the page illustrations look exactly like the approved hero.

        // 1. Construct the Multi-Modal Input
        const contents: any[] = [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: referenceBase64
                }
            },
            {
                text: `${prompt}\n\n**VISUAL INSTRUCTION:**\nThe IMAGE attached is the **Verified Hero Design**. You MUST use this exact character in the scene described above. Maintain strict consistency with their face, hair, and costume styles.\n\n**GLOBAL ART STYLE:** ${stylePrompt}`
            }
        ];

        console.log("Generating Page via Hybrid Vision Logic...");

        // 2. Call Gemini 3 Vision (Same model as Verify Hero)
        const response = await ai().models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: contents,
            config: {
                seed,
                imageConfig: { aspectRatio: "16:9" }
            }
        });

        // 3. Extract Image
        let b64 = "";
        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) b64 = part.inlineData.data;
            }
        }

        if (!b64) throw new Error("Image generation failed (No data returned)");

        return { imageBase64: b64, fullPrompt: prompt };
    });
}
