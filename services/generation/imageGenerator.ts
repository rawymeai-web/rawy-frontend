
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

export async function generateImagenImage(
    prompt: string,
    aspectRatio: "1:1" | "16:9" | "9:16" = "1:1",
    sampleCount: number = 1
): Promise<{ imageBase64: string }> {
    return withRetry(async () => {
        const apiVersion = "v1beta";
        const actualModel = "imagen-4.0-fast-generate-001";

        if (!API_KEY) throw new Error("Missing API Key");

        const baseUrl = typeof window !== 'undefined' ? '/api/gemini' : 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/${apiVersion}/models/${actualModel}:predict?key=${API_KEY}`;

        const payload = {
            instances: [{ prompt: prompt }],
            parameters: { sampleCount, aspectRatio }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const txt = await response.text();
            const failedUrl = (response.url || url).replace(/key=([^&]+)/, 'key=REDACTED');

            if (response.status === 404) {
                try {
                    const listUrl = `${baseUrl}/${apiVersion}/models?key=${API_KEY}`;
                    console.log("DEBUG: Listing models from", listUrl);
                    const listRes = await fetch(listUrl);
                    if (!listRes.ok) throw new Error(`List Failed: ${listRes.status} ${await listRes.text()}`);
                    const listData = await listRes.json();
                    const modelNames = listData.models ? listData.models.map((m: any) => m.name.split('/').pop()).filter((n: string) => n.includes('image') || n.includes('gemini')) : [];
                    throw new Error(`Model 404. Available: ${modelNames.join(', ')}`);
                } catch (listErr: any) {
                    console.error("DEBUG: List Models Failed:", listErr);
                    throw new Error(`Proxy/Model 404 at ${failedUrl}. List Debug: ${listErr.message}`);
                }
            }
            throw new Error(`API Error ${response.status} at ${failedUrl}: ${txt}`);
        }

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
    });
}

export async function generateThemeStylePreview(
    mainCharacter: Character,
    secondCharacter: Character | undefined,
    theme: string,
    style: string,
    age: string,
    seed?: number
): Promise<{ imageBase64: string; prompt: string }> {

    // Step 1: Describe the subject
    const subjectDescription = await describeSubject(mainCharacter.imageBases64[0]);
    let secondSubjectDesc = "";
    if (secondCharacter && secondCharacter.imageBases64 && secondCharacter.imageBases64[0]) {
        secondSubjectDesc = await describeSubject(secondCharacter.imageBases64[0]);
    }

    // Include Theme Context if provided
    // Include Theme Context if provided
    // Using User's Strict "Transform/Replicate" Logic
    const prompt = `**TASK:** Transform the reference subject into the selected art style.
**STYLE:** ${style}

**STRICT PRESERVATION RULES:**
- **Replicate** the face, pose, lighting, and expression with **ultra-high fidelity**.
- **Apply** the rendering technique of the style (brushwork, lighting softness, shading logic, surface texture).
- **DO NOT** modify the pose or head angle. Maintain the exact orientation, eye gaze, and expression from the original description.
- **DO NOT** invent or adjust facial features. This is not a reinterpretation. It’s a stylization of what is already there.

**SUBJECT DATA:**
- **Visual Description:** ${subjectDescription} (Age: ${age || "Child"})
- **Context:** ${theme}
${secondSubjectDesc ? `- **Secondary Character:** ${secondSubjectDesc}` : ''}

**OUTPUT MANDATE:**
- 1:1 Portrait.
- No text.
- Perfect Art Style match.`;

    console.log("Generating Image via Proxy...");
    const { imageBase64 } = await generateImagenImage(prompt, "1:1");
    return { imageBase64, prompt };
}
