
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { Validator } from '../rules/validator';
import { getWordCountForAge } from '../rules/guidebook';
import { StoryBlueprint, WorkflowLog } from '../../types';

export async function generateStoryDraft(
    blueprint: StoryBlueprint,
    language: 'en' | 'ar'
): Promise<{ result: { text: string }[], log: WorkflowLog }> {

    const startTime = Date.now();
    const age = parseInt(blueprint.foundation?.targetAge || "5");

    try {
        return await withRetry(async () => {
            const wordCountRule = getWordCountForAge(age);

            const prompt = `
            ROLE: Master Children's Book Author (Language: ${language}).
            TASK: Write the final manuscript for individual spreads.
            
            BLUEPRINT: ${JSON.stringify(blueprint)}
            
            MANDATES from Guidebook:
            - Age Group: ${age} Years Old.
            - Word Count Target: ${wordCountRule.min}-${wordCountRule.max} words per spread.
            - Tone: Whimsical, Rhythmic, Engaging.
            - Structure: STRICTLY follow the Blueprint 'spreads'. Do not invent new plot points.
            ${language === 'ar' ? '- Language: Arabic (Modern Standard but simple / Fusha). Diacritics (Harakat) are OPTIONAL but good for style.' : '- Language: English.'}
    
            **CRITICAL QUALITY GUIDELINES (Must Follow):**
            ${age < 8 ?
                    `1. **RHYTHM IS KING (RHYME MODE):** Use **Strict Anapestic Tetrameter** (da-da-DUM, da-da-DUM).
               - *Bad:* "The cat sat on the mat." (Flat).
               - *Good:* "And the *cat* in the *hat* came to *visit* the *brat*." (Bouncy).
               - If the rhythm stumbles, the page fails. Read it aloud mentally.
             ` :
                    `1. **RHYTHM IS KING (PROSE MODE):** Do NOT Rhyme. Use **Rhythmic Prose**.
               - Write like a Middle-Grade Novel (e.g. Roald Dahl).
               - Focus on flow, alliteration, and sentence variety.
               - *Bad:* "He went to the store. He bought milk." (Robotic).
               - *Good:* "He dashed to the store, his coins jingling in his pocket, focused on only one thing: milk." (Flowing).
             `}
            2. **ADJECTIVE BAN:** Do NOT use abstract adjectives (e.g. "magical", "wondrous", "beautiful").
               - Use ONLY Concrete Adjectives (Size, Color, Temperature, Texture).
               - *Bad:* "The magical flower."
               - *Good:* "The prickly purple flower."
            3. **CLARITY OVER CLEVERNESS:** If a child needs to pause to understand, simplify it.
            4. **COGNITIVE LOAD:** Introduce ONLY ONE new idea/action/emotion per page.
            5. **CHARACTER INTRODUCTIONS:** Check the Blueprint 'newCharacters' field.
               - If 'newCharacters' has a name, introduce them here with ONE visual trait.
               - If a character is NOT in 'newCharacters' and hasn't appeared yet, DO NOT MENTION THEM.
            6. **SHOW, DON'T TELL:** Do not explain the lesson. Show the character making a choice.
            7. **LOGIC:** Before writing the verse, ensure the logic holds: B must happen BECAUSE of A.

            **BAD EXAMPLES (AVOID):**
            - "Kind thoughts made the plant bloom." (Abstract).
            - "Zayn blew with focus." (Telling).
            
            **GOOD EXAMPLES (DO THIS):**
            - "Zayn sang a tune that was happy and loud!" (Concrete).
            - "He puffed up his cheeks and he blew out a cloud." (Action + Rhythm).

            OUTPUT JSON SCHEMA:
            [
                { "spreadNumber": 1, "text": "String" },
                ... (8 items)
            ]
            `;

            const response = await ai().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const draft = JSON.parse(cleanJsonString(response.text));

            if (!Validator.validateDraft(draft)) {
                throw new Error("Drafting generated insufficient pages.");
            }

            return {
                result: draft,
                log: {
                    stage: 'Drafting',
                    timestamp: startTime,
                    inputs: { title: blueprint.foundation.title },
                    outputs: { pageCount: draft.length },
                    status: 'Success',
                    durationMs: Date.now() - startTime
                }
            };
        });
    } catch (e: any) {
        return {
            result: [],
            log: {
                stage: 'Drafting',
                timestamp: startTime,
                inputs: {},
                outputs: { error: e.message },
                status: 'Failed',
                durationMs: Date.now() - startTime
            }
        };
    }
}
