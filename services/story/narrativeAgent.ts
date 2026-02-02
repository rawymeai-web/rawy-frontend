
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
