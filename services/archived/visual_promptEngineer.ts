
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { GUIDEBOOK } from '../rules/guidebook';
import { SpreadDesignPlan, WorkflowLog } from '../../types';

export async function generatePrompts(
    plan: SpreadDesignPlan,
    visualDNA: string,
    childAge: string,
    childDescription: string,
    language: 'en' | 'ar' = 'en'
): Promise<{ result: string[], log: WorkflowLog }> {

    const startTime = Date.now();


    // COVER COMPOSITION LOGIC
    // STANDARD (English): Back(Left) | Spine | Front(Right). Hero on Front(Right). Open Space on Back(Left).
    // ARABIC HANDLING: We ALWAYS generate the English Standard (Hero Right).
    // The PDF Generator will FLIP (Mirror) the image for Arabic orders.
    // This solves the AI's inability to reliably follow "Left/Right" instructions.

    const focusSide = 'RIGHT SIDE (FRONT COVER)';
    const openSide = 'LEFT SIDE (BACK COVER/OPEN CANVAS)';

    try {
        const prompts = plan.spreads.map(spread => {
            // Special Case: COVER (Spread 0)
            if (spread.spreadNumber === 0) {
                return `Prompt for COVER (Index 0):
** GOAL:** Generate a 16: 9 panoramic illustration matching the internal style with ** high - impact commercial appeal **.

** REFERENCE INPUTS:**
- ** Character Photo(NDA Image):** Visual Anchor.
- ** Style:** ${visualDNA}

** STRICT CHARACTER LOCK:**
                    - Render the child with exact facial topology and hair pattern from the reference photo.
- ** Outfit:** Hero Outfit(Special / Magical if applicable).
- Description: ${childDescription}

** COMPOSITION RULES:**
                    - 16: 9 Full Bleed.
- ** EXTREME WIDE SHOT:** Use a very wide angle lens to create an epic scale.
- ** ${focusSide}:** Focus on the Child / Hero.
- ** NEGATIVE SPACE:** Ensure significant empty space(sky, landscape) around the subject to prevent clutter.Do not crowd the frame.
- ** ${openSide}:** This area must be completely empty and uncluttered(e.g.clear sky, blurred texture).

** SCENE DESCRIPTION:**
                    - Setting: ${spread.setting}
                - Action: ${spread.keyActions}

** EMOTIONAL & DESIGN NOTES:**
                    - Mood: Magical, Inviting, Wonder.
- Palette: Rich, saturated colors.

**MANDATORY OUTPUT RULES (GLOBAL STYLE LOCK):**
- **Cinematic Realism ONLY:** Natural exposure, no studio lighting, no illustrative glow.
- **Visual Noise:** Imperfection and occlusion are mandatory. Do not make it "clean".
- **Color Decay:** Saturation must NEVER increase after Spread 4. Muted, earthy tones only.
- **NO HERO FRAMING:** Do NOT Center the subject or isolate them. They must be embedded in the environment.
- No typography, no letters, no watermarks.
- No split screen line — continuous art.`;
            }

            // Normal Spreads (1-8)
            const opp = spread.mainContentSide.toLowerCase() === 'left' ? 'Right' : 'Left';

            // Determine the final description source
            // Priority: Blueprint Profile (Context-Aware) -> childDescription (Base)
            // But we must ensure the Blueprint profile actually HAS the outfit details.
            // Since we updated the Blueprint Agent to Respect Base Appearance, the heroProfile should be the "Master" source.
            // Priority: Combine Base Physical (childDescription) with Story Context (heroProfile)
            // This ensures the "Brown Eyes" / "Black Hair" from the User Input is NEVER lost,
            // while still allowing the Blueprint to define the "Space Suit" or "Wizard Robe".
            // Priority: Combine Base Physical (childDescription) with Story Context (heroProfile)
            // Fix: We separate them clearly so the AI doesn't think eye color is part of the "Outfit" field.
            const basePhysical = childDescription;
            const storyOutfit = (plan.characters && plan.characters.heroProfile) || "Standard seasonal wear";

            return `Prompt for spread ${spread.spreadNumber}:
** GOAL:** Generate a 16: 9 panoramic illustration with ** perfect likeness ** and ** cinematic charm **.

** REFERENCE INPUTS:**
- ** Character Photo(NDA Image):** This is the ** sole source of truth ** for the child’s identity.
- ** Style:** ${visualDNA}

** STRICT CHARACTER LOCK:**
                    - Render the child with exact facial topology and hair pattern from the reference photo.
- The face must match reference DNA image — no stylization of facial proportions.
- ** PHYSICAL DESCRIPTION:** ${basePhysical}
- ** OUTFIT:** You MUST depict the child wearing strictly: "${storyOutfit}".Do NOT change this outfit unless the scene explicitly requires special gear(e.g.swimming).Consistency is key.
- Apply the art style to rendering technique only(color, materials, brushwork).
- Summary Description: ${basePhysical}, Wearing: ${storyOutfit} (Age: ${childAge})

** COMPOSITION RULES:**
                    - 16: 9 Full Bleed panoramic.
- ** SUBJECT PLACEMENT:** Main character must be framed clearly on the ** ${spread.mainContentSide.toUpperCase()}**.
- ** OPEN CANVAS:** The ${opp.toUpperCase()} side must be ** OPEN AND UNCLUTTERED **.Use soft textures(e.g., smooth sky, blurred background, flat grass) to create a clean visual areas.
- ** CAMERA LENS:** Use a ** WIDE ANGLE / MEDIUM - WIDE SHOT ** to establish the scene.Avoid extreme close - ups unless specified.
- Camera angle: ${spread.cameraAngle || "Eye-level"}
                - Lighting: ${spread.lighting || "Natural"}

** SCENE DESCRIPTION:**
                    - Setting: ${spread.setting} (${spread.environmentType})
            - Action: ${spread.keyActions}.Ensure the action is readable from a distance.

** EMOTIONAL & DESIGN NOTES:**
            - Mood: ${spread.mood || spread.emotion || "Joyful"}
        - Palette: ${spread.colorPalette || "Vibrant"}
        - Energy: Use expressive poses and framing.

**MANDATORY OUTPUT RULES (GLOBAL STYLE LOCK):**
- **Cinematic Realism ONLY:** Natural exposure, no studio lighting, no illustrative glow.
- **Visual Noise:** Imperfection and occlusion are mandatory. Do not make it "clean".
- **Color Decay:** Saturation must NEVER increase after Spread 4. Muted, earthy tones only.
- **NO HERO FRAMING:** Do NOT Center the subject or isolate them. They must be embedded in the environment.
- **Lighting Logic:** 
    ${spread.spreadNumber > 3 ? `- Spread ${spread.spreadNumber} Constraint: Shadows must be DEEPER than Spread ${spread.spreadNumber - 1}.` : ''}
    ${spread.spreadNumber === 6 ? `- Spread 6 Specific: 45% Ambient, 55% Shadow. DO NOT BRIGHTEN.` : ''}
- No typography, no letters, no watermarks.
- No split screen line — continuous art.
- ** ANATOMY CHECK:** Ensure correct number of limbs(2 arms, 2 legs) and fingers.No extra limbs or hallucinations.
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
