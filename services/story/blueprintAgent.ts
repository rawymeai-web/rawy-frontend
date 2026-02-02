
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { Validator } from '../rules/validator';
import { GUIDEBOOK } from '../rules/guidebook';
import { StoryData, StoryBlueprint, WorkflowLog } from '../../types';

// Helper to accumulate logs if passed (optional, or we return the log)
// For pure functions, we return the log and let the caller handle it.

export async function generateBlueprint(
    storyData: StoryData,
    language: 'en' | 'ar'
): Promise<{ result: StoryBlueprint, log: WorkflowLog }> {

    const startTime = Date.now();
    let status: 'Success' | 'Failed' = 'Success';
    let outputData: any = {};

    try {
        return await withRetry(async () => {
            const prompt = `
            ROLE: Master Children's Book Architect.
            TASK: Create a structural BLUEPRINT for a story.
            
            INPUT DATA:
            - Child: ${storyData.childName} (${storyData.childAge} years old).
            - Theme: ${storyData.theme}.
            - Moral/Goal: ${storyData.customGoal || "Standard theme goal"}.
            - Challenge: ${storyData.customChallenge || "Standard theme challenge"}.
            
            GUIDEBOOK RULES:
            - Characters: STRICTLY No parents (${GUIDEBOOK.narrative.forbiddenCharacters.join(', ')}).
            - Structure: ${JSON.stringify(GUIDEBOOK.narrative.structure)}
            - Language: ${language === 'ar' ? 'Arabic (Fusha)' : 'English'}
            
            OUTPUT JSON FORMAT:
            {
                "foundation": {
                    "title": "Story Title",
                    "targetAge": "${storyData.childAge}",
                    "storyCore": "1 sentence summary",
                    "masterSetting": "Where it happens",
                    "heroDesire": "What they want",
                    "mainChallenge": "What stops them",
                    "catalyst": "The incicting incident",
                    "limiter": "The ticking clock/constraint",
                    "moral": "The lesson",
                    "signatureAccessory": "Visual prop"
                },
                "characters": {
                    "heroProfile": "Visual description",
                    "supportingRoles": [
                        { "name": "Name", "role": "Role", "visualKey": "Visual traits" }
                    ]
                },
                "structure": {
                    "arcSummary": "3 sentence plot",
                    "spreads": [
                        { "spreadNumber": 1, "narrative": "Plot point", "emotionalBeat": "Happy/Sad", "specificLocation": "Kitchen", "environmentType": "Indoor", "timeOfDay": "Morning" },
                        ... (8 spreads total)
                    ]
                }
            }
            `;

            const response = await ai().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const text = response.text;
            if (!text) throw new Error("No response from AI");

            const blueprint = JSON.parse(cleanJsonString(text));

            if (!Validator.validateBlueprint(blueprint)) {
                throw new Error("Invalid Blueprint Structure generated.");
            }

            outputData = blueprint;

            return {
                result: blueprint,
                log: {
                    stage: 'Blueprint',
                    timestamp: startTime,
                    inputs: { theme: storyData.theme, age: storyData.childAge },
                    outputs: { title: blueprint.foundation.title },
                    status: 'Success',
                    durationMs: Date.now() - startTime
                }
            };
        });
    } catch (e: any) {
        status = 'Failed';
        return {
            result: {} as StoryBlueprint, // Empty on fail
            log: {
                stage: 'Blueprint',
                timestamp: startTime,
                inputs: { theme: storyData.theme },
                outputs: { error: e.message },
                status: 'Failed',
                durationMs: Date.now() - startTime
            }
        };
    }
}
