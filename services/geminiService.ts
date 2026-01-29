
import { GoogleGenAI, Type } from "@google/genai";
import type { Character, StoryData, Language, StoryBlueprint, SpreadDesignPlan, StoryTheme } from '../types';
import * as adminService from './adminService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = () => new GoogleGenAI({ apiKey: API_KEY });

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

export async function runJuniorWriter(storyData: StoryData, selectedTheme: StoryTheme | undefined): Promise<StoryBlueprint> {
    const settings = adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));

        const inputContext = `
CHILD DETAILS:
- Name: ${storyData.childName}
- Age: ${storyData.childAge}
- Gender: ${storyData.mainCharacter.type === 'person' ? 'Child' : 'Object/Toy'}
- Description: ${storyData.mainCharacter.description}

${storyData.useSecondCharacter && storyData.secondCharacter ? `SIDEKICK/COMPANION:
- Name: ${storyData.secondCharacter.name}
- Type: ${storyData.secondCharacter.type === 'object' ? 'Magical Object/Toy' : 'Person/Sibling'}
- Age: ${storyData.secondCharacter.age || 'N/A'}` : ''}

STORY PARAMETERS:
- Theme: ${selectedTheme ? selectedTheme.title.en : storyData.theme}
- Core Value: ${selectedTheme?.skeleton.storyCores[0] || 'Discovery'}
- User's Custom Goal: ${storyData.customGoal || 'None Provided'}
- User's Custom Challenge: ${storyData.customChallenge || 'None Provided'}
`;

        const prompt = `ROLE: Creative Story Architect.
${getContext()}

CUSTOMER INPUT:
${inputContext}

TASK: Create ${settings.defaultSpreadCount}-spread blueprint for ${storyData.childName}.
- Incorporate the "User's Custom Goal" if provided.
- Adhere strictly to the "Master Production Rules" in the context above.

OUTPUT: JSON blueprint.`;

        const response = await ai().models.generateContent({
            model: settings.targetModel,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: blueprintSchema } // Removed thinkingConfig for broader compatibility
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runSeniorWriter(blueprint: StoryBlueprint): Promise<StoryBlueprint> {
    const settings = adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const prompt = `ROLE: Senior Editor. 
${getContext()}
AUDIT: Validate the narrative arc against the Story Flow logic. Ensure failure leads to internal growth.
Blueprint: ${JSON.stringify(blueprint)}`;
        const response = await ai().models.generateContent({
            model: settings.targetModel,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: blueprintSchema }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runVisualDesigner(blueprint: StoryBlueprint): Promise<SpreadDesignPlan> {
    const settings = adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const prompt = `ROLE: Art Director. Plan ${settings.defaultSpreadCount} panoramic layouts. 
${getContext()}
Blueprint: ${JSON.stringify(blueprint)}`;
        const response = await ai().models.generateContent({
            model: settings.targetModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        spreads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { spreadNumber: { type: Type.INTEGER }, keyActions: { type: Type.STRING }, mainContentSide: { type: Type.STRING } }, required: ['spreadNumber', 'keyActions', 'mainContentSide'] } }
                    },
                    required: ['spreads']
                }
            }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runCreativeDirector(blueprint: StoryBlueprint, plan: SpreadDesignPlan): Promise<SpreadDesignPlan> {
    const settings = adminService.getSettings();
    return withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const prompt = `ROLE: Executive Creative Director. 
${getContext()}
Plan: ${JSON.stringify(plan)}`;
        const response = await ai().models.generateContent({
            model: settings.targetModel,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { spreads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { spreadNumber: { type: Type.INTEGER }, keyActions: { type: Type.STRING }, mainContentSide: { type: Type.STRING } }, required: ['spreadNumber', 'keyActions', 'mainContentSide'] } } }, required: ['spreads'] } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runPromptEngineer(plan: SpreadDesignPlan, technicalStyleGuide: string, stylePrompt: string, blueprint: StoryBlueprint): Promise<string[]> {
    return withRetry(async () => {
        const prompt = `ROLE: Lead Illustrator. 
${getContext()}
TASK: Write 8 cinematic prompts based on the visual plan.
Plan: ${JSON.stringify(plan)}. JSON array output.`;
        const response = await ai().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function runPromptReviewer(prompts: string[]): Promise<string[]> {
    return withRetry(async () => {
        const prompt = `ROLE: Prompt QA. 
${getContext()}
Prompts: ${JSON.stringify(prompts)}`;
        const response = await ai().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function generateMethod4Image(prompt: string, referenceBase64: string, seed?: number, secondReferenceBase64?: string): Promise<{ imageBase64: string; fullPrompt: string }> {
    return withRetry(async () => {
        const bible = adminService.getSeriesBible();

        let systemInstructions = `TASK: Create a cinematic storybook illustration.

**IDENTITY LOCK 1 (PRIMARY):** Match face structure exactly from REFERENCE 1.
${secondReferenceBase64 ? '**IDENTITY LOCK 2 (SECONDARY):** Match face structure exactly from REFERENCE 2.' : ''}

${bible.masterGuardrails}

${bible.compositionMandates}

**SCENE:** ${prompt}`;

        const contents: any[] = [{ text: systemInstructions }, { inlineData: { mimeType: 'image/jpeg', data: referenceBase64 } }];

        if (secondReferenceBase64) {
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: secondReferenceBase64 } });
        }

        const response = await ai().models.generateContent({
            model: 'gemini-3-pro-image-preview', // Or whatever model you are using that supports multi-image
            contents: contents,
            config: { seed, imageConfig: { aspectRatio: "16:9" } }
        });

        let b64 = "";
        for (const part of response.candidates[0].content.parts) if (part.inlineData) b64 = part.inlineData.data;
        if (!b64) throw new Error("Image generation failed");
        return { imageBase64: b64, fullPrompt: systemInstructions };
    });
}

export async function generateFinalScript(blueprint: StoryBlueprint, language: Language): Promise<{ text: string }[]> {
    const settings = adminService.getSettings();

    // STEP 1: THE AUTHOR (Drafting)
    const draft = await withRetry(async () => {
        if (settings.generationDelay > 0) await new Promise(r => setTimeout(r, settings.generationDelay));
        const draftPrompt = `ROLE: Children's Book Author. 
${getContext()}
TASK: Write ${settings.defaultSpreadCount * 2} pages of narrative text in ${language}. 
Blueprint: ${JSON.stringify(blueprint)}. 
OUTPUT: JSON array of ${settings.defaultSpreadCount * 2} { "text": "string" }.`;

        const response = await ai().models.generateContent({
            model: settings.targetModel,
            contents: draftPrompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });

    // STEP 2: THE SENIOR EDITOR (Polishing)
    return withRetry(async () => {
        const editorPrompt = `ROLE: Senior Editor & Stylist.
${getContext()}

TASK: Polish the draft below to PERFECTION based on the "Stylistic Guidelines" above.
SPECIFIC CHECKS:
1. **Rhythm:** Use the "Rule of Three" (e.g., "Thump! Thump! Shake!"). Short sentences.
2. **Sensory:** Ensure every page has Sound, Touch, or Smell.
3. **Agency:** Ensure the child is the one solving the problem, not adults.
4. **Formatting:** Keep it to ${language === 'ar' ? 'Arabic' : 'English'}.

DRAFT CONTENT:
${JSON.stringify(draft)}

OUTPUT: JSON array of ${settings.defaultSpreadCount * 2} { "text": "string" } (Polished Version).`;

        const response = await ai().models.generateContent({
            model: settings.targetModel,
            contents: editorPrompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }
        });
        return JSON.parse(cleanJsonString(response.text));
    });
}

export async function generateThemeStylePreview(mainCharacter: Character, secondCharacter: Character | undefined, theme: string, style: string, seed?: number): Promise<{ imageBase64: string; prompt: string }> {
    return withRetry(async () => {
        const bible = adminService.getSeriesBible();

        // Include Theme Context if provided
        const themeContext = theme ? `CONTEXT: The child is in a "${theme}" setting. (e.g. Space, Jungle, etc).` : '';

        const prompt = `TASK: CLOSE-UP PORTRAIT of Main Character. 
STYLE: ${style}. 
PROTAGONIST: Child from IMAGE 1. 
CAMERA: Medium-Close shot (Head & Shoulders). Focus heavily on FACE and EXPRESSION matching.
${themeContext}
${bible.masterGuardrails}`;

        const contents: any[] = [{ inlineData: { mimeType: 'image/jpeg', data: mainCharacter.imageBases64[0] } }, { text: prompt }];

        if (secondCharacter && secondCharacter.imageBases64 && secondCharacter.imageBases64[0]) {
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: secondCharacter.imageBases64[0] } });
            contents[1].text += `\nSECONDARY CHARACTER: Match face from IMAGE 2.`;
        }

        const response = await ai().models.generateContent({
            model: 'gemini-3-pro-image-preview', // Use capable model
            contents: contents,
            config: { seed, imageConfig: { aspectRatio: "1:1" } }
        });

        let b64 = "";
        for (const part of response.candidates[0].content.parts) if (part.inlineData) b64 = part.inlineData.data;
        if (!b64) throw new Error("Image generation failed");
        return { imageBase64: b64, prompt };
    });
}

export async function generateTechnicalStyleGuide(imageBase64: string, basePrompt: string): Promise<string> {
    return withRetry(async () => {
        const response = await ai().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: `Describe palette. 50 words.` }]
        });
        return response.text || "";
    });
}
