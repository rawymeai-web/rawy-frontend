
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { Validator } from '../rules/validator';
import { GUIDEBOOK } from '../rules/guidebook';
import { StoryBlueprint, SpreadDesignPlan, WorkflowLog } from '../../types';

export async function generateVisualPlan(
    script: { text: string }[],
    blueprint: StoryBlueprint,
    visualDNA: string
): Promise<{ result: SpreadDesignPlan, log: WorkflowLog }> {

    const startTime = Date.now();

    try {
        return await withRetry(async () => {
            const prompt = `
            ROLE: Cinematographer / Art Director.
            TASK: Translate Story Text into Visual Scene Descriptions.
    
            INPUTS:
            - Story Script: ${JSON.stringify(script)}
            - Visual DNA (The Global Style): "${visualDNA}"
            - Blueprint Settings: ${JSON.stringify(blueprint.foundation)}
            - Rules: ${JSON.stringify(GUIDEBOOK.visual)}
    
            INSTRUCTIONS:
            1. **DESIGN THE COVER (Spread 0):** This is the most critical art. It must be 16:9 panoramic. Front Half (Right) = Hero. Back Half (Left) = Open Scenic Space.
            2. **DESIGN THE SPREADS (1-${script.length}):** Sequential visual storytelling.
            3. **INJECT Visual DNA:** If DNA says "Space/Neon", the scene MUST be "Space/Neon".
            4. **NO TEXT:** Description is for IMAGES only.

            OUTPUT JSON:
            {
                "visualAnchors": {
                    "heroTraits": "...",
                    "signatureItems": "...",
                    "recurringLocations": "...",
                    "persistentProps": "...",
                    "spatialLogic": "..."
                },
                "spreads": [
                    { 
                        "spreadNumber": 0,
                        "setting": "Cover Scene (Epic)",
                        "environmentType": "Cover Art",
                        "timeOfDay": "...", 
                        "lighting": "Cinematic/High-Key",
                        "mainContentSide": "Right", 
                        "keyActions": "Hero looking confident...",
                        "mood": "Magical/Inviting",
                        "emotion": "Wonder",
                        "cameraAngle": "Wide/Epic",
                        "colorPalette": "Rich/Saturated",
                        "props": "...",
                        "continuityNotes": "Title placed on Left (Empty Space)" 
                    },
                    { 
                        "spreadNumber": 1, 
                        // ... normal spread fields
                        "setting": "Specific location name",
                        "environmentType": "Indoor/Outdoor/Abstract",
                        "timeOfDay": "Day/Night/Golden Hour",
                        "lighting": "Soft/Harsh/Magical",
                        "mainContentSide": "Left or Right",
                        "keyActions": "Detailed visual description of action...",
                        "mood": "Atmospheric feeling",
                        "emotion": "Specific emotional resonance",
                        "cameraAngle": "Eye-level/High/Low/Wide",
                        "colorPalette": "Dominant colors",
                        "props": "Key items",
                        "continuityNotes": "Notes for consistency"
                    }
                    // ... up to spread 8
                ]
            }
            `;

            const response = await ai().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const plan = JSON.parse(cleanJsonString(response.text));

            if (!Validator.validateVisualPlan(plan, script.length)) {
                throw new Error("Visual Plan has insufficient spreads.");
            }

            return {
                result: { ...plan, characters: blueprint.characters }, // Pass through characters for PromptEngineer
                log: {
                    stage: 'Visual Plan',
                    timestamp: startTime,
                    inputs: { scriptLength: script.length, dna: visualDNA },
                    outputs: { spreadCount: plan.spreads.length },
                    status: 'Success',
                    durationMs: Date.now() - startTime
                }
            };
        });
    } catch (e: any) {
        return {
            result: {} as SpreadDesignPlan,
            log: {
                stage: 'Visual Plan',
                timestamp: startTime,
                inputs: { scriptLength: script.length },
                outputs: { error: e.message },
                status: 'Failed',
                durationMs: Date.now() - startTime
            }
        };
    }
}
