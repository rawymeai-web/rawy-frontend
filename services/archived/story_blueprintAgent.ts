
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { Validator } from '../rules/validator';
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
            - Target Language: ${language === 'ar' ? 'Arabic (العربية)' : 'English'}
            - Child: ${storyData.childName} (${storyData.childAge} years old).
            - Base Appearance (MUST RESPECT): ${storyData.mainCharacter?.description || "Not provided"}.
            - Theme: ${storyData.theme}.
            - Moral/Goal: ${storyData.customGoal || "Standard theme goal"}.
            - Challenge: ${storyData.customChallenge || "Standard theme challenge"}.

            **LANGUAGE RULE:**
            - The "title", "storyCore", "moral", "heroDesire", and "mainChallenge" fields MUST be in **${language === 'ar' ? 'Arabic' : 'English'}**.
            - The "narrative" summaries in the spreads can be in English (for the illustrator) or Arabic, but the **Title** is critical for the cover.
            
            **IMMEDIATE FAMILY RESTRICTION (CRITICAL):**
            - Do NOT include real-life immediate family members: mother, father, siblings, grandparents, aunts, uncles, cousins.
            - *Reason:* These roles are personal to the child. We must not misrepresent them.
            - **Exceptions:** You MAY include generic adults (guides, shopkeepers, owls, neighbors) ONLY IF they are NOT presented as family and do NOT act as saviors.
            - **Rule:** Adults may guide or observe, but the **HERO MUST SOLVE THE PROBLEM**.

            **HERO VISUALS (CRITICAL):**
            - **SPECIES LOCK:** You MUST NOT change the biological species of the main character.
            - Use the "Base Appearance" as the immutable core.
            - You MAY add accessories if the Theme requires it.

            **VISUAL CONTINUITY RULES (NON-NEGOTIABLE):**
            1. **PRIMARY VISUAL ANCHOR:** Choose ONE object (e.g., backpack, kite, hat) that stays with the hero throughout. Everything else can change.
            2. **LOCATION PROGRESSION:** Do NOT redraw the same full background unless it's the final resolution.
               - *Good Flow:* Room -> Path -> Forest Edge -> Clearing -> Hill -> Home.
               - *Bad Flow:* Room -> Room -> Room -> Room.
            3. **CHARACTER CONTINUITY:** Supporting characters should appear in consecutive spreads. Avoid random appearing/disappearing.
            
            **NARRATIVE ARC REQUIREMENTS (8 SPREADS):**
            1. **Spread 1:** Normal World + Desire (Solitary Hero start).
            2. **Spread 2:** Catalyst (The Problem appears).
            3. **Spread 3:** First Attempt (Hero tries and fails/struggles).
            4. **Spread 4:** Complication (It gets harder; Support Char enters?).
            5. **Spread 5:** Lowest Point / Deepest location.
            6. **Spread 6:** Insight / Strategy Shift (The "Aha" moment).
            7. **Spread 7:** Final Attempt (Success through new method).
            8. **Spread 8:** Resolution + Moral (Return to new normal).

            **HERO DESIRE CONSISTENCY (REQUIRED):**
            - **Spread 1:** MUST clearly establish the hero's desire (Goal).
            - **Spread 3:** MUST show the hero ACTIVELY attempting to achieve that desire.
            - **Spread 7 or 8:** MUST resolve that same desire.
            - Do NOT change the hero's core goal mid-story. The "Moral" is what they learn, the "Desire" is what they want.

            **CHARACTER ROLE RULES:**
            - **Limit:** Max 1 Support Character introduced per spread.
            - **Constraint:** Max 2 Support Characters TOTAL for Age < 6.
            - **Function:** Must be Helper, Obstacle, or Companion.
            
            **SUPPORTING CHARACTER IMPACT RULE (REVISED):**
            - A supporting character does NOT need to appear visually in multiple spreads.
            - However, their influence MUST be felt across more than one phase of the story.
            - Their impact may be:
              - Direct (appearing in one spread)
              - Indirect (their advice, action, or effect carries forward)
            - The blueprint MUST specify:
              - The spread where the character appears (visual presence).
              - The spread(s) where their influence affects the hero's decisions or outcome.

            **COGNITIVE LOAD & PACING:**
            - **ONE ACTION PER SPREAD.**
            - **ONE EMOTION PER SPREAD.**
            - **TEXT BUDGET (Narrative Summary):** 
                - Age < 6: 1-2 short sentences.
                - Age 6-7: 2-3 sentences.
                - Age 8+: 3-4 sentences.

            **TIME CONTINUITY RULE (CRITICAL):**
            - The story must progress through continuous action and consequence.
            - Do NOT use time-skip framing such as "the next day", "later that week", or similar shortcuts.
            - Time may only pass if the waiting passage itself is part of the tension.
            - Progress must feel earned, not skipped.
            
            **TRANSITION QUALITY RULE (CRITICAL):**
            - A transition hook must create anticipation, tension, or curiosity.
            - Invalid hooks include time jumps ("The next day..."), summaries, or passive statements.
            - Each hook must answer: "Why must the reader turn the page?"

            OUTPUT JSON FORMAT:
            {
                "foundation": {
                    "title": "Story Title",
                    "targetAge": "${storyData.childAge}",
                    "storyCore": "1 sentence summary",
                    "heroDesire": "What they want",
                    "mainChallenge": "What stops them",
                    "primaryVisualAnchor": "The object that stays with hero (e.g. Red Scarf)",
                    "moral": "The lesson",
                    "failedAttemptSpread": 3,
                    "insightSpread": 6,
                    "finalSolutionMethod": "How they fixed it"
                },
                "characters": {
                    "heroProfile": "Visual description",
                    "supportingRoles": [
                        { "name": "Name", "role": "Helper/Obstacle/Companion", "functionType": "Why they exist", "appearanceSpreads": [4], "influenceSpreads": [4, 5, 8], "visualKey": "Visual traits" }
                    ]
                },
                "structure": {
                    "arcSummary": "3 sentence plot",
                    "spreads": [
                        { 
                            "spreadNumber": 1, 
                            "purpose": "Normal World",
                            "narrative": "Plot point summary (Age appropriate length)", 
                            "transitionHook": "What makes reader flip page? (e.g. 'But then a noise...')",
                            "visualFocus": "What is visually new? (e.g. 'The dark cave entrance')",
                            "emotionalBeat": "Curious", 
                            "specificLocation": "Bedroom", 
                            "environmentType": "Indoor", 
                            "timeOfDay": "Morning",
                            "newCharacters": ["None"]
                        },
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
