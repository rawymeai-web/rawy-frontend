
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
            // Special Case: COVER (Spread 0)
            if (spread.spreadNumber === 0) {
                return `Prompt for COVER (Index 0):
**GOAL:** Generate a 16:9 panoramic illustration matching the internal style with **high-impact commercial appeal**.

**REFERENCE INPUTS:**
- **Character Photo (NDA Image):** Visual Anchor.
- **Style:** ${visualDNA}

**STRICT CHARACTER LOCK:**
- Render the child with exact facial topology and hair pattern from the reference photo.
- **Outfit:** Hero Outfit (Special/Magical if applicable).
- Description: ${childDescription}

**COMPOSITION RULES:**
- 16:9 Full Bleed.
- **RIGHT SIDE (FRONT COVER):** Focus on the Child / Hero. Frame them clearly.
- **OPEN CANVAS (LEFT SIDE):** This area must be **OPEN AND UNCLUTTERED** (e.g. Sky, Landscape). Use soft textures.
- **CAMERA LENS:** Use a **WIDE ANGLE / MEDIUM-WIDE SHOT** to make the cover feel epic.

**SCENE DESCRIPTION:**
- Setting: ${spread.setting}
- Action: ${spread.keyActions}

**EMOTIONAL & DESIGN NOTES:**
- Mood: Magical, Inviting, Wonder.
- Palette: Rich, saturated colors.

**MANDATORY OUTPUT RULES:**
- No text, no watermarks.
- No split screen line — continuous art.`;
            }

            // Normal Spreads (1-8)
            const opp = spread.mainContentSide.toLowerCase() === 'left' ? 'Right' : 'Left';

            // Determine the final description source
            // Priority: Blueprint Profile (Context-Aware) -> childDescription (Base)
            // But we must ensure the Blueprint profile actually HAS the outfit details.
            // Since we updated the Blueprint Agent to Respect Base Appearance, the heroProfile should be the "Master" source.
            const finalDescription = (plan.characters && plan.characters.heroProfile)
                ? plan.characters.heroProfile
                : childDescription;

            return `Prompt for spread ${spread.spreadNumber}:
**GOAL:** Generate a 16:9 panoramic illustration with **perfect likeness** and **cinematic charm**.

**REFERENCE INPUTS:**
- **Character Photo (NDA Image):** This is the **sole source of truth** for the child’s identity.
- **Style:** ${visualDNA}

**STRICT CHARACTER LOCK:**
- Render the child with exact facial topology and hair pattern from the reference photo.
- The face must match reference DNA image — no stylization of facial proportions.
- **Outfit:** You MUST depict the child wearing strictly: "${finalDescription}". Do NOT change this outfit unless the scene explicitly requires special gear (e.g. swimming). Consistency is key.
- Apply the art style to rendering technique only (color, materials, brushwork).
- Description: ${finalDescription} (Age: ${childAge})

**COMPOSITION RULES:**
- 16:9 Full Bleed panoramic.
- **SUBJECT PLACEMENT:** Main character must be framed clearly on the **${spread.mainContentSide.toUpperCase()}**.
- **OPEN CANVAS:** The ${opp.toUpperCase()} side must be **OPEN AND UNCLUTTERED**. Use soft textures (e.g., smooth sky, blurred background, flat grass) to create a clean visual areas.
- **CAMERA LENS:** Use a **WIDE ANGLE / MEDIUM-WIDE SHOT** to establish the scene. Avoid extreme close-ups unless specified.
- Camera angle: ${spread.cameraAngle || "Eye-level"}
- Lighting: ${spread.lighting || "Natural"}

**SCENE DESCRIPTION:**
- Setting: ${spread.setting} (${spread.environmentType})
- Action: ${spread.keyActions}. Ensure the action is readable from a distance.

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
