# GOLDEN PROMPTS VAULT
> "Locked in a safety box" - Feb 2, 2026.

## 1. Verify The Hero (Hybrid Strategy)
**Status:** VERIFIED PERFECT
**Model:** `gemini-3-pro-image-preview` (Via SDK `generateContent` with `inlineData`)
**Key Feature:** Uses ACTUAL IMAGE input (Vision) + Structured Text Rules.

### The Logic (TypeScript)
```typescript
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
```

### Implementation Details
- **Visual Input:** Must pass `contents: [{ inlineData: { mimeType: 'image/jpeg', data: ... } }, { text: prompt }]`.
- **Secondary Character:** If present, add 2nd image and append `\n**SECONDARY SUBJECT:** See IMAGE 2. Match their face as well.` to text.

---
