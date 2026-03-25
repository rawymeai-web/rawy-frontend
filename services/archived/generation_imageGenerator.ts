
import { API_KEY, ai, withRetry } from './modelGateway';
import { Character } from '../../types';

// Helper to describe subject (Visual Input)
export async function describeSubject(imageBase64: string): Promise<string> {
    try {
        const response = await ai().models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [
                { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                { text: "Describe this person's physical appearance in significant detail. Focus on hair color/style, eye color, skin tone, facial structure, and age. Be concise but descriptive. Output ONLY the visual description." }
            ]
        });
        return response.text?.trim() || "A child";
    } catch (e) {
        console.error("Describe Subject Failed", e);
        return "A child";
    }
}

// List of models to try in order of preference (Fast -> Standard -> Ultra -> Preview)
const MODEL_FALLBACKS = [
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-generate-001",
    "imagen-4.0-ultra-generate-001",
    "imagen-3.0-generate-001"
];

export async function generateImagenImage(
    prompt: string,
    aspectRatio: "1:1" | "16:9" | "9:16" = "1:1",
    sampleCount: number = 1
): Promise<{ imageBase64: string }> {
    return withRetry(async () => {
        const apiVersion = "v1beta";

        if (!API_KEY) throw new Error("Missing API Key");
        const baseUrl = typeof window !== 'undefined' ? '/api/gemini' : 'https://generativelanguage.googleapis.com';

        let lastError: any = null;

        // Loop through models until one works
        for (const model of MODEL_FALLBACKS) {
            console.log(`Trying Image Model: ${model}`);
            const url = `${baseUrl}/${apiVersion}/models/${model}:predict?key=${API_KEY}`;

            const payload = {
                instances: [{ prompt: prompt }],
                parameters: { sampleCount, aspectRatio }
            };

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    let b64 = "";
                    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
                        b64 = data.predictions[0].bytesBase64Encoded;
                    } else if (data.image && data.image.imageBytes) {
                        b64 = data.image.imageBytes;
                    } else {
                        throw new Error("Invalid Response Structure");
                    }
                    return { imageBase64: b64 };
                }

                // If not OK, check status
                const txt = await response.text();
                // 429 = Quota, 404 = Model Not Found. In both cases, TRY NEXT.
                // 500 = Server Error (maybe transient, but we can try next model too).
                if (response.status === 429 || response.status === 404 || response.status >= 500) {
                    console.warn(`Model ${model} failed (${response.status}): ${txt}`);
                    lastError = new Error(`Model ${model} failed: ${txt}`);
                    continue; // Try next model
                }

                // If 400 (Bad Request), prompt is likely bad, don't retry loop
                throw new Error(`API Error ${response.status}: ${txt}`);

            } catch (e: any) {
                console.warn(`Fetch error for ${model}:`, e);
                lastError = e;
                // If it's a network error, maybe retry? But loop handles fallbacks.
                // If we ran out of models, loop finishes.
            }
        }

        // If we get here, all models failed
        throw lastError || new Error("All image models failed.");
    });
}

// Hybrid Logic: Visual Input (Jan 30) + Super Prompt (Feb 1)
export async function generateThemeStylePreview(
    mainCharacter: Character,
    secondCharacter: Character | undefined,
    theme: string,
    style: string,
    age: string,
    seed?: number
): Promise<{ imageBase64: string; prompt: string }> {
    return withRetry(async () => {
        // Hardcoded guardrails from the "Bible"
        const masterGuardrails = "MANDATE: Output safe, G-rated content only. No nudity, violence, or gore.";

        // HYBRID PROMPT: "Mega Prompt" structure but referencing the Input Image
        const prompt = `**TASK:** Transform the reference Subject (Image 1) into the selected Art Style.
        
**REFERENCE INPUTS:**
- **Source:** See attached IMAGE 1 (The Child).
- **Style:** ${style}

**STRICT IDENTITY PRESERVATION:**
- **Likeness is Critical:** The output MUST look like the specific child in Image 1.
- **Retain:** Facial features, eye brightness, nose structure, and specific hair curl/pattern.
- **Change Only:** The rendering style (brushstrokes, lighting softness, shading logic).
- **Age Lock:** Keep them looking approx ${age || "Child"} years old.

**SCENE CONTEXT:**
- **Setting:** ${theme || "Neutral"} background.
- **Shot:** Medium-Close Up (Head & Shoulders).
- **Focus:** High-impact character portrait.

**TECHNICAL MANDATES:**
- 1:1 Aspect Ratio.
- No text, no frames.
- Perfect application of the '${style}' aesthetic.
${masterGuardrails}`;

        const contents: any[] = [{ inlineData: { mimeType: 'image/jpeg', data: mainCharacter.imageBases64[0] } }, { text: prompt }];

        if (secondCharacter && secondCharacter.imageBases64 && secondCharacter.imageBases64[0]) {
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: secondCharacter.imageBases64[0] } });
            contents[1].text += `\n**SECONDARY SUBJECT:** See IMAGE 2. Match their face as well.`;
        }

        try {
            console.log("Generating Preview via Hybrid Vision Logic (Primary)...");
            // Using the Vision-Capable Model
            const response = await ai().models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: contents,
                config: { seed, imageConfig: { aspectRatio: "1:1" } }
            });

            let b64 = "";
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) b64 = part.inlineData.data;
                }
            }

            if (!b64) throw new Error("Primary model returned no data");
            return { imageBase64: b64, prompt };

        } catch (error) {
            console.warn("Primary Vision Model Failed. Attempting Graceful Degradation (Description + Imagen)...", error);

            // FALLBACK STRATEGY: 
            // 1. Describe the face (Vision -> Text)
            // 2. Generate new image (Text -> Image)

            const description = await describeSubject(mainCharacter.imageBases64[0]);
            const fallbackPrompt = `Create a children's book illustration in the style of ${style}.
            Subject: ${description} (Approx ${age} years old).
            Context: ${theme} setting.
            Framing: Medium Close-up portrait.
            Aesthetic: High quality, consistent style, vibrant colors.`;

            const fallbackResult = await generateImagenImage(fallbackPrompt, "1:1");
            return { imageBase64: fallbackResult.imageBase64, prompt: fallbackPrompt };
        }
    });
}
