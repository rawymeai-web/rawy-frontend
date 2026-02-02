
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { GUIDEBOOK } from '../rules/guidebook';
import { SpreadDesignPlan, WorkflowLog } from '../../types';

export async function generatePrompts(
    plan: SpreadDesignPlan,
    visualDNA: string,
    childAge: string,
    childDescription: string
): Promise<{ result: string[], log: WorkflowLog }> {

    const startTime = Date.now();

    try {
        const prompts = plan.spreads.map(spread => {
            const opp = spread.mainContentSide.toLowerCase() === 'left' ? 'Right' : 'Left';

            return `Prompt for spread ${spread.spreadNumber}:
**GOAL:** Generate a 16:9 panoramic illustration with **perfect likeness** and **cinematic charm**.

**REFERENCE INPUTS:**
- **Character Photo (NDA Image):** This is the **sole source of truth** for the child’s identity.
- **Style:** ${visualDNA}

**STRICT CHARACTER LOCK:**
- Render the child with exact facial topology and hair pattern from the reference photo.
- The face must match reference DNA image — no stylization of facial proportions.
- **Outfit:** Outfit should suit the scene context (e.g. pajamas, spacesuit, winter gear) if described, otherwise neutral.
- Apply the art style to rendering technique only (color, materials, brushwork).
- Description: ${childDescription} (Age: ${childAge})

**COMPOSITION RULES:**
- 16:9 Full Bleed panoramic.
- Main character and action must be on the **${spread.mainContentSide.toUpperCase()}**.
- Opposite side (${opp.toUpperCase()}) should be clean and balanced, supporting the layout but not visually dominant.
- Camera angle: ${spread.cameraAngle || "Eye-level"}
- Lighting: ${spread.lighting || "Natural"}

**SCENE DESCRIPTION:**
- Setting: ${spread.setting} (${spread.environmentType})
- Action: ${spread.keyActions}

**EMOTIONAL & DESIGN NOTES:**
- Mood: ${spread.mood || spread.emotion || "Joyful"}
- Palette: ${spread.colorPalette || "Vibrant"}
- Energy: Use expressive poses and framing.

**MANDATORY OUTPUT RULES:**
- No text, no watermarks, no book artifacts.
- Character must be integrated into the environment — not pasted or floating.
- Match style fidelity from earlier spreads for visual consistency.`;
        });

        return {
            result: prompts,
            log: {
                stage: 'Prompt Engineering',
                timestamp: startTime,
                inputs: { planSize: plan.spreads.length },
                outputs: { promptCount: prompts.length, method: 'Structured Template' },
                status: 'Success',
                durationMs: Date.now() - startTime
            }
        };
    } catch (e: any) {
        return {
            result: [],
            log: {
                stage: 'Prompt Engineering',
                timestamp: startTime,
                inputs: { planSize: plan?.spreads?.length || 0 },
                outputs: { error: e.message },
                status: 'Failed',
                durationMs: Date.now() - startTime
            }
        };
    }
}
