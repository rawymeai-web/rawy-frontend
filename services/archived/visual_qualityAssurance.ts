
import { ai, cleanJsonString, withRetry } from '../generation/modelGateway';
import { WorkflowLog } from '../../types';

export async function runQualityAssurance(
    prompts: string[]
): Promise<{ result: string[], log: WorkflowLog }> {

    const startTime = Date.now();

    try {
        return await withRetry(async () => {
            const prompt = `
            ROLE: Safety & Quality Inspector.
            TASK: Review the following image prompts.
    
            RULES:
            1. No "Text", "Sign", "Label", "Book" keywords that imply written text.
            2. No "Split screen" or "Comic panel".
            3. No "Parents" (Mom/Dad) unless explicitly allowed (assume NO).
            
            PROMPTS:
            ${JSON.stringify(prompts)}
    
            ACTION:
            - If a prompt violates a rule, REWRITE it to be safe.
            - If safe, keep it.
    
            OUTPUT JSON:
            [ "Safe Prompt 1", ... ]
            `;

            const response = await ai().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const responseText = response.text;
            if (!responseText) throw new Error("QA response empty");

            let safePrompts = JSON.parse(cleanJsonString(responseText));

            // Safety: If AI wraps it in an object like { "prompts": [...] }
            if (!Array.isArray(safePrompts) && typeof safePrompts === 'object') {
                const possibleArray = Object.values(safePrompts).find(v => Array.isArray(v));
                if (possibleArray) safePrompts = possibleArray;
            }

            // Final fallback: if still not an array, throw to trigger catch-block logic
            if (!Array.isArray(safePrompts)) throw new Error("QA failed to return array");

            return {
                result: safePrompts,
                log: {
                    stage: 'QA',
                    timestamp: startTime,
                    inputs: { promptCount: prompts.length },
                    outputs: { safePromptCount: safePrompts.length },
                    status: 'Success',
                    durationMs: Date.now() - startTime
                }
            };
        });
    } catch (e: any) {
        return {
            result: prompts, // Return original prompts on fail to not block
            log: {
                stage: 'QA',
                timestamp: startTime,
                inputs: { promptCount: prompts.length },
                outputs: { error: e.message, warning: "Skipped QA due to error" },
                status: 'Failed',
                durationMs: Date.now() - startTime
            }
        };
    }
}
