
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { Validator } from '../rules/validator';
import { getWordCountForAge } from '../rules/guidebook';
import { StoryBlueprint, WorkflowLog } from '../../types';

export async function generateStoryDraft(
    blueprint: StoryBlueprint,
    language: 'en' | 'ar',
    childName: string
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
            
            **CRITICAL IDENTITY RULE:**
            - The Hero's Name is: **${childName}**.
            - You MUST use the name "${childName}" in the story.
            - DO NOT use placeholders like "Rayan", "Ahmed", "Sarah", or "The Boy". Use "${childName}".
            
            MANDATES from Guidebook:
            - Age Group: ${age} Years Old.
            - Word Count Target: ${wordCountRule.min}-${wordCountRule.max} words per spread.
            - Tone: Whimsical, Rhythmic, Engaging.
            - Structure: STRICTLY follow the Blueprint 'spreads'. Do not invent new plot points.
            ${language === 'ar' ? '- Language: Arabic (Modern Standard but simple / Fusha). Diacritics (Harakat) are OPTIONAL but good for style.' : '- Language: English.'}
    
            **CRITICAL QUALITY GUIDELINES (Must Follow):**
            ${age < 6 ?
                    `1. **RHYTHM IS KING (SIMPLE RHYME MODE):** 
               - Use **Strict Anapestic Tetrameter** (da-da-DUM, da-da-DUM).
               - **CLARITY FIRST:** If a rhyme makes the sentence weird, DROP THE RHYME.
                   - *Bad:* "To the forest did he quickly go." (Inverted/Weird).
                   - *Good:* "He ran to the woods with a smile on his face." (Natural).
               - **VOCABULARY CAP:** Use words a 4-year-old knows. No abstract concepts.`
                    : age < 8 ?
                        `1. **RHYTHM IS KING (STANDARD RHYME MODE):** Use **Strict Anapestic Tetrameter** (da-da-DUM, da-da-DUM).
               - *Bad:* "The cat sat on the mat." (Flat).
               - *Good:* "And the *cat* in the *hat* came to *visit* the *brat*." (Bouncy).`
                        :
                        `1. **RHYTHM IS KING (PROSE MODE):** Do NOT Rhyme. Use **Rhythmic Prose**.
               - Write like a Middle-Grade Novel (e.g. Roald Dahl).
               - Focus on flow, alliteration, and sentence variety.`}
            2. **ADJECTIVE BAN:** Do NOT use abstract adjectives (e.g. "magical", "wondrous").
               - Use ONLY Concrete Adjectives (Size, Color, Texture).
            3. **COGNITIVE LOAD (CRITICAL):** 
               - **ONE NEW THING PER PAGE:** A page can have a new location OR a new character, NOT BOTH.
               - Keep the action simple linear: A -> B.
            4. **CHARACTER ROLES:** Characters must ACT, not just look. They must help solve the specific page's problem.
            5. **SHOW, DON'T TELL:** Do not explain the lesson. Show the character making a choice.
            6. **LOGIC:** Before writing the verse, ensure the logic holds: B must happen BECAUSE of A.
            
            ${age <= 5 ? `
            **AGE ${age} SPECIAL CONSTRAINTS (STRICT):**
            A. **NO PRONOUNS:** NEVER use "He" or "She". Always use the character's Name (e.g. "Zayn runs").
               - *Reason:* Young kids get confused by pronouns.
            ` : `
            **AGE ${age} PRONOUN GUIDANCE:**
            - You MAY use "He" or "She" to avoid robotic repetition, but ensure it's clear who is acting.
            `}

            **EMOTIONAL & CAUSALITY RULES (CRITICAL):**
            1. **EMOTIONAL CLARITY (SHOW PHYSICALITY):**
               - Do NOT just name the emotion (e.g. "He was sad").
               - **DESCRIBE THE PHYSICAL SENSATION:** "His tummy flipped," "Her face felt hot," "His shoulders dropped."
            2. **CAUSE & EFFECT:** No coincidences. 
               - Success MUST come from the Hero's choice/action foundation.
            3. **INSIGHT MOMENT (TWO BEATS):** 
               - The "Insight" must be split into:
                 1. **Observation:** The Hero notices a specific detail.
                 2. **Realization:** The Hero understands what it means.
               - *Do not rush this.*
            4. **RESOLUTION PAYOFF (CALLBACK):** 
               - The ending MUST explicitly mention or reference the **initial obstacle** to show how far they've come.
            5. **LANGUAGE DENSITY (STRICT):** 
               - **MAX 1 ADJECTIVE PER NOUN:** Never stack them.
                 - *Bad:* "The big, red, shiny ball."
                 - *Good:* "The shiny red ball" (Limit) or just "The red ball."
               - Avoid abstract phrasing. Keep it concrete.

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
