
import type { StoryData, ShippingDetails, Language, ProductSize, Page } from '../types';
import { getProductSizeById } from './adminService';
import * as imageStore from './imageStore';
import QRCode from 'qrcode';

// Access globals lazily to avoid "undefined" errors on early module execution
const getJsPDF = () => {
    // @ts-ignore
    const jspdf = window.jspdf;
    if (jspdf && jspdf.jsPDF) return jspdf.jsPDF;
    // @ts-ignore
    if (window.jsPDF) return window.jsPDF;
    console.error("jsPDF library not found in window scope.");
    return null;
};

// @ts-ignore
const getHtml2Canvas = () => window.html2canvas;
// @ts-ignore
const getJSZip = () => window.JSZip;

const blobBorderRadii = [
    '47% 53% 70% 30% / 30% 43% 57% 70%',
    '36% 64% 64% 36% / 64% 42% 58% 36%',
    '65% 35% 38% 62% / 61% 63% 37% 39%',
    '58% 42% 43% 57% / 41% 54% 46% 59%',
];

/**
 * Calculates dimensions to fit an image into a target area using "cover" logic (crop excess).
 */
function getCoverDimensions(imgW: number, imgH: number, targetW: number, targetH: number) {
    const imgRatio = imgW / imgH;
    const targetRatio = targetW / targetH;

    let renderW, renderH, renderX, renderY;

    if (imgRatio > targetRatio) {
        // Image is wider than target: Match Height, Crop Width
        renderH = targetH;
        renderW = renderH * imgRatio;
        renderX = (targetW - renderW) / 2; // Center horizontally (will be negative)
        renderY = 0;
    } else {
        // Image is taller than target: Match Width, Crop Height
        renderW = targetW;
        renderH = renderW / imgRatio;
        renderX = 0;
        renderY = (targetH - renderH) / 2; // Center vertically (will be negative)
    }

    return { x: renderX, y: renderY, w: renderW, h: renderH };
}

/**
 * Creates a high-res image of a text blob to be inserted into the PDF.
 * This ensures the PDF blobs look exactly like the UI blobs.
 */
async function renderTextBlobToImage(text: string, widthPx: number, heightPx: number, blobIndex: number, language: Language, fontSize: number = 42, childName: string = ''): Promise<string> {
    const html2canvas = getHtml2Canvas();
    const container = document.createElement('div');
    container.dir = language === 'ar' ? 'rtl' : 'ltr';
    // container.spellcheck = false; // Not needed on div

    // HIGHLIGHTING LOGIC (Match PreviewScreen)
    let finalHtml = text.split('\n\n').map(p => `<p style="margin-bottom: 24px; line-height: 1.6;">${p.trim()}</p>`).join('');

    if (childName) {
        const childFirstName = childName.trim().split(/\s+/)[0];
        const escapedName = childFirstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match name with word boundaries
        const nameRegex = new RegExp(`\\b(${escapedName})\\b`, 'gi');
        // Apply Bold + Brand Navy + Slight Size Bump (1.1em)
        finalHtml = finalHtml.replace(nameRegex, `<span style="font-weight: 900; color: #203A72; font-size: 1.1em;">$1</span>`);
    }

    // STYLING (Match PreviewScreen: bg-white/60, rounded-2xl, shadow-sm, border-white/50)
    container.style.cssText = `
        width: 1000px;
        min-height: 400px;
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 40px; /* rounded-2xl approximation for high-res */
        color: #203A72; /* text-brand-navy */
        padding: 80px;
        font-family: ${language === 'ar' ? 'Tajawal, sans-serif' : 'Nunito, sans-serif'};
        font-weight: 700;
        font-size: ${fontSize}px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
        border: 2px solid rgba(255,255,255,0.5);
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); /* shadow-sm */
    `;

    container.innerHTML = finalHtml;

    document.body.appendChild(container);
    // Use scale 2 for crisp text
    const canvas = await html2canvas(container, { backgroundColor: null, scale: 2 });
    document.body.removeChild(container);
    return canvas.toDataURL('image/png');
}

export const generatePreviewPdf = async (storyData: StoryData, language: Language, highResImages?: imageStore.OrderImages, orderNumber?: string): Promise<Blob> => {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error("jsPDF not loaded");

    const sizeConfig = await getProductSizeById(storyData.size) || { page: { widthCm: 20, heightCm: 20 } };

    const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [sizeConfig.page.widthCm * 20, sizeConfig.page.heightCm * 10]
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    // Helper to normalize image data (Base64 or URL)
    const normalizeImage = async (input: string | undefined): Promise<string> => {
        if (!input) return "";
        if (input.startsWith('http')) {
            // It's a URL, fetch it
            try {
                const resp = await fetch(input);
                const blob = await resp.blob();
                return await blobToBase64(blob);
            } catch (e) {
                console.error("Failed to fetch image for PDF:", input, e);
                return "";
            }
        }
        return input;
    };

    // 1. Handle the Cover First
    let coverData = storyData.coverImageUrl;
    if (highResImages?.cover) {
        coverData = await blobToBase64(highResImages.cover);
    } else {
        coverData = await normalizeImage(coverData);
    }

    if (coverData && coverData.length > 50) {
        const cleanB64 = coverData.includes(',') ? coverData.split(',')[1] : coverData;

        // Use Cover Logic to prevent stretching
        // Assuming Source Image is 16:9 (approx 1.77)
        const dim = getCoverDimensions(1600, 900, pdfW, pdfH);
        try {
            pdf.addImage(`data:image/jpeg;base64,${cleanB64}`, 'JPEG', dim.x, dim.y, dim.w, dim.h);
        } catch (e) { console.warn("PDF Cover Add Failed", e); }

        // Add Title Overlay to Cover
        // LOGIC: Center title on the FRONT COVER half.
        // EN: Front is RIGHT half (50% to 100%)
        // AR: Front is LEFT half (0% to 50%)
        const isAr = language === 'ar';
        const titleB64 = await createTextImage({ title: storyData.title }, language);

        // Title Width: 40% of full PDF (80% of front cover)
        const tw = pdfW * 0.4;
        const titleAspect = 1000 / 200; // From createTextImage dimensions
        const th = tw / titleAspect;

        let tx;
        if (isAr) {
            // Front is LEFT: Center in 0-50% range
            // Center = 25% w - half title width
            tx = (pdfW * 0.25) - (tw / 2);
        } else {
            // Front is RIGHT: Center in 50-100% range
            // Center = 75% w - half title width
            tx = (pdfW * 0.75) - (tw / 2);
        }

        const ty = pdfH * 0.15; // Top positioning
        pdf.addImage(titleB64, 'PNG', tx, ty, tw, th);
    }

    // 2. Handle Spreads
    const spreads = storyData.pages.filter((_, i) => i % 2 === 0);

    for (let i = 0; i < spreads.length; i++) {
        pdf.addPage();
        const spread = spreads[i];

        // Get image source
        let illustration = spread.illustrationUrl;
        if (highResImages?.spreads[i]) {
            illustration = await blobToBase64(highResImages.spreads[i]);
        } else {
            illustration = await normalizeImage(illustration);
        }

        if (illustration && illustration.length > 50) {
            const cleanB64 = illustration.includes(',') ? illustration.split(',')[1] : illustration;
            // Use Cover Logic
            const dim = getCoverDimensions(1600, 900, pdfW, pdfH);
            try {
                pdf.addImage(`data:image/jpeg;base64,${cleanB64}`, 'JPEG', dim.x, dim.y, dim.w, dim.h);
            } catch (e) { console.warn("PDF Spread Add Failed", e); }
        }

        // Draw Text Blobs (Fix Stretching)
        const blocks = spread.textBlocks || [];
        for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
            const block = blocks[bIdx];
            const isLeft = spread.textSide === 'left';

            // Calculate dynamic font size based on age
            const ageNum = parseInt(storyData.childAge, 10) || 6;
            let fontSize = 42;
            if (ageNum >= 10) fontSize = 24;
            else if (ageNum >= 7) fontSize = 28;
            else if (ageNum >= 4) fontSize = 32;

            const blobImg = await renderTextBlobToImage(block.text, 800, 600, bIdx, language, fontSize, storyData.childName);

            // Layout Logic:
            // Box Width: 35% of PDF Width (approx 70% of a page)
            const rectW = pdfW * 0.35;
            // Calculate Height to maintain aspect ratio (prevent stretching)
            // Blob Canvas is 1000px wide. We need its height.
            // Since we don't know exact canvas height here easily without async load, 
            // We rely on renderTextBlobToImage returning an image. 
            // A better way for PDF is to fix the aspect ratio.
            // Let's assume the blob is approx 1000x500 (~2:1) but dynamic.

            // FIX: Use 'auto' height equivalent by just setting width and letting PDF engine handle? 
            // jsPDF addImage(img, format, x, y, w, h). If we know aspect ratio.
            // The blob image is generated at 1000px width.
            // We'll set a reasonable fixed height that isn't "stretched" looking, 
            // OR ideally we'd get image dimensions. 
            // For now, let's assume a slightly squarer ratio for text bubbles to avoid thin stretching.
            const rectH = rectW * 0.6; // 5:3 ratio (1.66) instead of 16:9 vertical stretch

            const rectX = isLeft ? pdfW * 0.05 : pdfW * 0.60;
            const rectY = (pdfH - rectH) / 2;
            pdf.addImage(blobImg, 'PNG', rectX, rectY, rectW, rectH);
        }

        // METADATA STRIP LOGIC (Only if orderNumber is provided)
        if (orderNumber) {
            const stripWidthMm = 6; // Wider for readability
            const stripHeightMm = pdfH;

            const stripPxW = 150;
            const stripPxH = 2000;

            const html2canvas = getHtml2Canvas();
            const metaContainer = createMetadataStripElement(orderNumber, i + 1, stripPxW, stripPxH);
            document.body.appendChild(metaContainer);
            const metaCanvas = await html2canvas(metaContainer, { backgroundColor: null, scale: 2 });
            document.body.removeChild(metaContainer);
            const metaImg = metaCanvas.toDataURL('image/png');

            pdf.addImage(metaImg, 'PNG', pdfW - stripWidthMm, 0, stripWidthMm, stripHeightMm);
        }
    }

    return pdf.output('blob');
};

// ... generateStitchedPdf ...

export const generateStitchedPdf = async (coverBlob: Blob, spreadBlobs: Blob[], sizeConfig: ProductSize): Promise<Blob> => {
    // ... same fix for stitched pdf images ...
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error("jsPDF not loaded");

    const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [sizeConfig.page.widthCm * 20, sizeConfig.page.heightCm * 10]
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    // 1. Cover
    const coverB64 = await blobToBase64(coverBlob);
    const cleanCover = coverB64.includes(',') ? coverB64.split(',')[1] : coverB64;
    const cDim = getCoverDimensions(1600, 900, pdfW, pdfH);
    pdf.addImage(`data:image/jpeg;base64,${cleanCover}`, 'JPEG', cDim.x, cDim.y, cDim.w, cDim.h);

    // 2. Spreads
    for (let i = 0; i < spreadBlobs.length; i++) {
        pdf.addPage();
        const spreadB64 = await blobToBase64(spreadBlobs[i]);
        const cleanSpread = spreadB64.includes(',') ? spreadB64.split(',')[1] : spreadB64;
        const sDim = getCoverDimensions(1600, 900, pdfW, pdfH);
        pdf.addImage(`data:image/jpeg;base64,${cleanSpread}`, 'JPEG', sDim.x, sDim.y, sDim.w, sDim.h);
    }

    return pdf.output('blob');
};


export const uploadOrderFiles = async (orderNumber: string, zipBlob: Blob): Promise<string | null> => {
    try {
        const { supabase } = await import('../utils/supabaseClient');
        const filename = `${orderNumber}_Package.zip`;
        const { data, error } = await supabase.storage
            .from('order-files')
            .upload(filename, zipBlob, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error("Supabase Storage Upload Error:", error);
            // Fallback: try creating bucket if it doesn't exist? (Usually admin task, but good to know)
            return null;
        }

        const { data: publicData } = supabase.storage.from('order-files').getPublicUrl(filename);
        return publicData.publicUrl;
    } catch (e) {
        console.error("Upload failed exception:", e);
        return null;
    }
};

export const generatePrintPackage = async (storyData: StoryData, shipping: ShippingDetails, language: Language, orderNumber: string) => {
    try {
        const zip = new (window as any).JSZip();

        // 1. Generate PDF
        const pdfBlob = await generatePreviewPdf(storyData, language, undefined, orderNumber);
        zip.file(`${orderNumber}_Preview.pdf`, pdfBlob);

        // 2. Full Written Story
        let storyText = `Title: ${storyData.title}\nAuthor: ${storyData.childName}\n\n`;
        storyData.pages.forEach(p => {
            storyText += `[Page ${p.pageNumber}]\n${p.text}\n\n`;
        });
        zip.file('story_narrative.txt', storyText);

        // 3. Raw Images (High Res)
        const imagesFolder = zip.folder("raw_images");
        if (storyData.coverImageUrl) {
            const coverB64 = storyData.coverImageUrl.split(',')[1] || storyData.coverImageUrl;
            imagesFolder.file("cover.jpg", coverB64, { base64: true });
        }
        storyData.pages.forEach((p, i) => {
            if (p.illustrationUrl) {
                const imgB64 = p.illustrationUrl.split(',')[1] || p.illustrationUrl;
                imagesFolder.file(`page_${p.pageNumber}.jpg`, imgB64, { base64: true });
            }
        });

        // 4. Workflow Artifacts (Debug/Re-creation)
        const artifactsFolder = zip.folder("workflow_artifacts");
        if (storyData.blueprint) artifactsFolder.file("1_blueprint.json", JSON.stringify(storyData.blueprint, null, 2));
        if (storyData.spreadPlan) artifactsFolder.file("3_visual_plan.json", JSON.stringify(storyData.spreadPlan, null, 2));
        if (storyData.finalPrompts) artifactsFolder.file("5_prompts.json", JSON.stringify(storyData.finalPrompts, null, 2));

        // 5. Order Manifest
        const manifest = {
            orderNumber,
            date: new Date().toISOString(),
            shipping,
            storySummary: {
                title: storyData.title,
                theme: storyData.theme,
                childName: storyData.childName,
                pageCount: storyData.pages.length
            }
        };
        zip.file('order_manifest.json', JSON.stringify(manifest, null, 2));

        // 6. Generate Zip
        const content = await zip.generateAsync({ type: 'blob' });

        return content; // Return Blob for upload

    } catch (e) {
        console.error("Error generating print package:", e);
        throw e;
    }
};

export const downloadCoverImage = async (storyData: StoryData, language: Language) => {
    try {
        const link = document.createElement('a');
        link.href = storyData.coverImageUrl;
        link.download = `Rawy_Cover_${storyData.childName}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Error downloading cover:", e);
    }
};

// Updated createMetadataStripElement to be simpler and use vertical layout
export function createMetadataStripElement(orderNumber: string, spreadIndex: number, width: number, height: number): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 40px 0;
        box-sizing: border-box;
        border-left: 2px solid #ddd;
    `;

    // Top Info (Vertical Text)
    const topText = document.createElement('div');
    topText.style.cssText = `
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-family: monospace;
        font-size: 48px; /* INCREASED SIZE */
        font-weight: 900;
        color: black;
        letter-spacing: 4px;
    `;
    topText.innerText = `ORDER #${orderNumber}`;
    container.appendChild(topText);

    // Bottom Info (Spread + Barcode)
    const bottomGroup = document.createElement('div');
    bottomGroup.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 40px;
    `;

    const spreadText = document.createElement('div');
    spreadText.style.cssText = `
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-family: monospace;
        font-size: 32px; /* INCREASED SIZE */
        font-weight: bold;
        color: #555;
    `;
    spreadText.innerText = `SPREAD ${spreadIndex}`;
    bottomGroup.appendChild(spreadText);

    // Better Barcode Simulation
    const bcContainer = document.createElement('div');
    bcContainer.style.cssText = "display:flex; flex-direction:column; align-items:center; gap:4px;";
    // Random bars
    for (let k = 0; k < 15; k++) {
        const bar = document.createElement('div');
        bar.style.width = Math.random() > 0.5 ? '80%' : '60%';
        bar.style.height = Math.random() > 0.5 ? '8px' : '4px'; /* Thicker bars */
        bar.style.backgroundColor = 'black';
        bcContainer.appendChild(bar);
    }
    bottomGroup.appendChild(bcContainer);

    container.appendChild(bottomGroup);
    return container;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
};

export async function createTextImage(titleData: { title: string }, lang: Language): Promise<string> {
    // Ensure font is loaded for High-Res Capture
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    // Wait a moment for font to load (heuristic) - in real prod use document.fonts.ready
    await document.fonts.ready;

    const html2canvas = getHtml2Canvas();
    const container = document.createElement('div');

    // Typography Logic
    const isEn = lang !== 'ar';
    const fontFamily = isEn ? "'Luckiest Guy', cursive" : "'Tajawal', sans-serif";
    const letterSpacing = isEn ? '2px' : '0';
    // Heavier stroke for English "Logo" look
    const textShadow = isEn
        ? '4px 4px 0 #203A72, -2px -2px 0 #203A72, 2px -2px 0 #203A72, -2px 2px 0 #203A72, 2px 2px 0 #203A72, 0 8px 15px rgba(0,0,0,0.3)'
        : '2px 2px 0 #203A72, -1px -1px 0 #203A72, 1px -1px 0 #203A72, -1px 1px 0 #203A72, 1px 1px 0 #203A72';

    container.style.cssText = `position:absolute;left:-9999px;font-family:${fontFamily};color:#FFFFFF;background:transparent;font-weight:900;text-shadow:${textShadow};padding:20px;text-align:center;width:1000px;line-height:1.1;font-size:90px;text-transform:uppercase;letter-spacing:${letterSpacing};transform: rotate(-2deg);`; // Added slight rotation for "Fun" feel

    container.dir = lang === 'ar' ? 'rtl' : 'ltr';
    container.innerHTML = titleData.title;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { backgroundColor: null, scale: 2 });
    document.body.removeChild(container);
    return canvas.toDataURL('image/png');
}

export function createBarcodeHtmlElement(orderNumber: string, width: number, height: number): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `width:${width}px;height:${height}px;background:white;border:1px solid #ccc;display:flex;align-items:stretch;justify-content:space-between;padding:2px;box-sizing:border-box;`;
    for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.style.cssText = `background:black;width:${Math.random() * 4 + 1}%;`;
        container.appendChild(bar);
    }
    return container;
}

export async function createQrCodeElement(text: string, width: number, height: number): Promise<HTMLImageElement> {
    const dataUrl = await QRCode.toDataURL(text, { width: width, margin: 0 });
    const img = new Image();
    img.src = dataUrl;
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    return img;
}

export function createPrintableTextBlockElement(text: string, language: Language, index: number, age: string, childName: string, isStitched: boolean = false): HTMLElement {
    const container = document.createElement('div');
    container.dir = language === 'ar' ? 'rtl' : 'ltr';

    const childFirstName = childName.split(' ')[0];
    const nameRegex = new RegExp(`(\\b${childFirstName}\\b!?)`, 'gi');
    let formattedText = text.split('\n\n').map(p => `<p style="margin-bottom: 0.75rem;">${p.trim()}</p>`).join('');
    if (childFirstName) {
        formattedText = formattedText.replace(nameRegex, `<span style="font-weight: 900; text-transform: uppercase;">$1</span>`);
    }

    const ageNum = parseInt(age, 10) || 8;
    let fontSize = '24px'; // Default for older/general

    // Updated logic per new word count rules
    if (ageNum <= 3) fontSize = '42px'; // Minimal text (5-10 words) -> Big font
    else if (ageNum <= 6) fontSize = '32px'; // Short text (10-25 words) -> Medium-Big
    else if (ageNum <= 9) fontSize = '28px'; // Medium text (20-35 words) -> Medium
    else fontSize = '24px'; // Longer text (35-45 words) -> Normal

    container.style.cssText = `
        background-color: rgba(255, 255, 255, 0.45);
        border-radius: ${blobBorderRadii[index % blobBorderRadii.length]};
        color: #203A72;
        padding: 60px;
        font-family: sans-serif;
        font-weight: 700;
        font-size: ${fontSize};
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        line-height: 1.4;
        box-sizing: border-box;
        text-shadow: 0 1px 0 rgba(255,255,255,0.5);
    `;

    container.innerHTML = formattedText;
    return container;
}
