
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
async function renderTextBlobToImage(
    text: string,
    widthPx: number,
    heightPx: number,
    blobIndex: number,
    language: Language,
    fontSize: number = 42,
    childName: string = '',
    style: 'clean' | 'box' = 'clean'
): Promise<{ dataUrl: string; width: number; height: number }> {
    const html2canvas = getHtml2Canvas();
    const container = document.createElement('div');
    const isAr = language === 'ar';
    container.dir = isAr ? 'rtl' : 'ltr';

    // HIGHLIGHTING LOGIC
    let finalHtml = text.split('\n\n').map(p => `<p style="margin-bottom: 24px; line-height: 1.6;">${p.trim()}</p>`).join('');

    if (childName) {
        const childFirstName = childName.trim().split(/\s+/)[0];
        const escapedName = childFirstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRegex = new RegExp(`\\b(${escapedName})\\b`, 'gi');
        finalHtml = finalHtml.replace(nameRegex, `<span style="font-weight: 900; color: ${style === 'clean' && !isAr ? 'white' : 'black'}; font-size: 1.1em;">$1</span>`);
    }

    // BASE CSS
    let css = `
        width: ${widthPx}px;
        min-height: 200px;
        font-family: ${isAr ? 'Tajawal, sans-serif' : 'Nunito, sans-serif'};
        font-weight: 700;
        font-size: ${fontSize}px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: ${style === 'clean' ? (isAr ? 'right' : 'left') : 'center'};
        box-sizing: border-box;
        padding: 40px;
    `;

    // STYLE SPECIFIC CSS
    if (style === 'box') {
        css += `
            background-color: rgba(255, 255, 255, 0.6);
            border-radius: 50px;
            color: #000000;
            border: 4px solid rgba(255,255,255,0.8);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1); 
        `;
    } else {
        // CLEAN STYLE
        css += `
            background-color: transparent;
            color: ${isAr ? '#000000' : '#FFFFFF'};
            text-shadow: ${isAr ? 'none' : '2px 2px 4px rgba(0,0,0,0.8)'};
        `;
    }

    container.style.cssText = css;
    container.innerHTML = finalHtml;

    document.body.appendChild(container);
    // Use scale 3 for crisp text
    const canvas = await html2canvas(container, { backgroundColor: null, scale: 3 });
    document.body.removeChild(container);
    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
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
            // ARABIC logic: 
            // User says "Hero should be on Right". 
            // So we place Title on LEFT (0.25) to avoid covering the Hero.
            tx = (pdfW * 0.25) - (tw / 2);
        } else {
            // ENGLISH logic (Unchanged):
            // Front is RIGHT (Standard). Title centered on Right side (0.75).
            tx = (pdfW * 0.75) - (tw / 2);
        }

        const ty = pdfH * 0.08; // Moved UP from 0.15 to 0.08 to avoid covering Hero
        pdf.addImage(titleB64, 'PNG', tx, ty, tw, th);

        // METADATA STRIP (COVER)
        if (orderNumber) {
            const stripWidthMm = 3; // FIXED: 3mm strictly as requested
            const stripHeightMm = pdfH;

            // Canvas Dimensions (300 DPI calculation)
            // 3mm = 0.118 inch. 0.118 * 300 = ~35 pixels.
            // Let's use 50px for sharpness, but keep it narrow.
            const stripPxW = 50;
            const stripPxH = 5000; // High enough for vertical text

            const html2canvas = getHtml2Canvas();
            // Spread Index 0 for Cover
            const metaContainer = createMetadataStripElement(orderNumber, 0, stripPxW, stripPxH);
            document.body.appendChild(metaContainer);
            const metaCanvas = await html2canvas(metaContainer, { backgroundColor: null, scale: 2 });
            document.body.removeChild(metaContainer);
            const metaImg = metaCanvas.toDataURL('image/png');

            pdf.addImage(metaImg, 'PNG', pdfW - stripWidthMm, 0, stripWidthMm, stripHeightMm);

            // 2. BACK COVER ELEMENTS
            // Dimensions
            const barcodeW = 50; // 5cm
            const barcodeH = 3;  // 3mm

            const logoW = 30; // 3cm width for Logo
            const logoH = 15; // 1.5cm height

            // Y Position: Both at bottom, aligned center-Y
            // Let's place them 15mm from bottom
            const bottomMargin = 15;
            const logoY = pdfH - bottomMargin - logoH;
            // Center barcode on the Logo's Y-midpoint
            // Logo Mid: logoY + logoH/2
            // Barcode Y: (logoY + logoH/2) - (barcodeH/2)
            const barcodeY = (logoY + (logoH / 2)) - (barcodeH / 2);

            let barcodeX, logoX;

            // Spacing from edges of the Back Cover page
            const sideMargin = 20;

            if (isAr) {
                // ARABIC (Back Cover = RIGHT Page: 50% to 100%)
                // Barcode: Right Side (Outer) -> pdfW - sideMargin - barcodeW
                // Logo: Left Side (Spine) -> (pdfW/2) + sideMargin
                barcodeX = pdfW - sideMargin - barcodeW;
                logoX = (pdfW / 2) + sideMargin;
            } else {
                // ENGLISH (Back Cover = LEFT Page: 0% to 50%)
                // Barcode: Left Side (Outer) -> sideMargin
                // Logo: Right Side (Spine) -> (pdfW/2) - sideMargin - logoW
                barcodeX = sideMargin;
                logoX = (pdfW / 2) - sideMargin - logoW;
            }

            // A. RENDER BARCODE
            const bcPxW = 600; // High res
            const bcPxH = 36;  // Proportionalish (actually just needs to be distinct)
            const bcEl = createBarcodeStripElement(orderNumber, bcPxW, bcPxH);
            document.body.appendChild(bcEl);
            const bcCanvas = await html2canvas(bcEl, { backgroundColor: null, scale: 2 });
            document.body.removeChild(bcEl);
            const bcImg = bcCanvas.toDataURL('image/png');
            pdf.addImage(bcImg, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH);

            // B. RENDER LOGO
            const logoPxW = 400;
            const logoPxH = 200;
            const logoEl = createRawyLogoElement(logoPxW, logoPxH);
            document.body.appendChild(logoEl);
            const logoCanvas = await html2canvas(logoEl, { backgroundColor: null, scale: 2 });
            document.body.removeChild(logoEl);
            const logoImg = logoCanvas.toDataURL('image/png');
            pdf.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH);
        }
    }

    // 2. Handle Spreads
    // 2. Handle Spreads (NOW 1:1 Mapping)
    const spreads = storyData.pages; // Use ALL pages, as we now generate 1 page = 1 spread

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

        // Draw Text Blobs (Fix Stretching & Positioning)
        const blocks = spread.textBlocks || [];
        for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
            const block = blocks[bIdx];
            const isLeft = spread.textSide === 'left';

            // Calculate dynamic font size based on age (UPDATED: Larger Fonts)
            const ageNum = parseInt(storyData.childAge, 10) || 6;
            let fontSize = 48; // Default Base
            if (ageNum >= 10) fontSize = 32; // Older kids -> Smaller (but bigger than before)
            else if (ageNum >= 7) fontSize = 40;
            else if (ageNum >= 4) fontSize = 48; // Young kids -> Huge font

            // Scale 3 for sharper text
            const blobImg = await renderTextBlobToImage(
                block.text,
                800,
                600,
                bIdx,
                language,
                fontSize,
                storyData.childName,
                'clean'
            );

            // Layout Logic:
            // Box Width: 35% of PDF Width (approx 70% of a page)
            const rectW = pdfW * 0.35;

            // DYNAMIC HEIGHT: Match blob aspect ratio exactly
            let rectH = rectW * 0.6; // Fallback
            if (blobImg && blobImg.width > 0) {
                rectH = rectW * (blobImg.height / blobImg.width);
            }

            // DYNAMIC POSITIONING (User Request: "Not centered 1 location")
            // Use 5% Margin from edge
            // ARABIC FIX: Mirror the text placement because the book flow is reversed?
            // Or if AI generates "text on left", does it mean "Left of Hero"?
            // If User says "Text covering hero", we should probably just SWAP the side for Arabic.
            let finalIsLeft = isLeft;
            if (language === 'ar') {
                finalIsLeft = !isLeft; // Swap sides for Arabic
            }

            const rectX = finalIsLeft ? pdfW * 0.05 : pdfW * 0.60;

            // VERTICAL POSITION: Top-Third / Golden Ratio (38%)
            // This prevents the "dead center" look and usually frames nicely above the ground
            const rectY = (pdfH * 0.382) - (rectH / 2);

            if (blobImg && blobImg.dataUrl) {
                pdf.addImage(blobImg.dataUrl, 'PNG', rectX, rectY, rectW, rectH);
            }
        }

        // METADATA STRIP (SPREADS)
        if (orderNumber) {
            const stripWidthMm = 3; // FIXED: Consistent 3mm
            const stripHeightMm = pdfH;
            const stripPxW = 50;
            const stripPxH = 5000;

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

export const generateStitchedPdf = async (
    coverBlob: Blob,
    spreadBlobs: Blob[],
    sizeConfig: ProductSize,
    storyDetails: { title: string, childName: string, childAge: string },
    pages: { text: string }[],
    language: 'en' | 'ar' = 'en',
    orderNumber?: string
): Promise<Blob> => {
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
    let cleanCover = '';
    if (typeof coverB64 === 'string') {
        cleanCover = coverB64.includes(',') ? coverB64.split(',')[1] : coverB64;
    }

    if (cleanCover) {
        const dim = getCoverDimensions(1600, 900, pdfW, pdfH);
        try {
            pdf.addImage(`data:image/jpeg;base64,${cleanCover}`, 'JPEG', dim.x, dim.y, dim.w, dim.h);
        } catch (e) { console.warn("PDF Cover Add Failed", e); }

        // Add Title Overlay to Cover
        const isAr = language === 'ar';
        const titleB64 = await createTextImage({ title: storyDetails.title }, language);

        const tw = pdfW * 0.4;
        const titleAspect = 1000 / 200;
        const th = tw / titleAspect;
        let tx;
        if (isAr) {
            tx = (pdfW * 0.25) - (tw / 2);
        } else {
            tx = (pdfW * 0.75) - (tw / 2);
        }
        const ty = pdfH * 0.08;
        pdf.addImage(titleB64, 'PNG', tx, ty, tw, th);

        // LOGO & BARCODE (COVER ONLY)
        if (orderNumber) {
            // METADATA STRIP (COVER)
            const stripWidthMm = 3;
            const stripHeightMm = pdfH;
            const stripPxW = 50;
            const stripPxH = 5000;
            const html2canvas = getHtml2Canvas();

            // Strip
            const metaContainer = createMetadataStripElement(orderNumber, 0, stripPxW, stripPxH);
            document.body.appendChild(metaContainer);
            const metaCanvas = await html2canvas(metaContainer, { backgroundColor: null, scale: 2 });
            document.body.removeChild(metaContainer);
            const metaImg = metaCanvas.toDataURL('image/png');
            pdf.addImage(metaImg, 'PNG', pdfW - stripWidthMm, 0, stripWidthMm, stripHeightMm);

            // BACK COVER ELEMENTS (Barcode + Logo)
            const backCoverW = pdfW / 2;
            const barcodeW = 50;
            const barcodeH = 3;
            const logoW = 30;
            const logoH = 15;
            const bottomMargin = 15;
            const logoY = pdfH - bottomMargin - logoH;
            const barcodeY = (logoY + (logoH / 2)) - (barcodeH / 2);

            let barcodeX, logoX;
            const sideMargin = 20;

            if (isAr) {
                // ARABIC (Back Cover = RIGHT Page 50-100%)
                // Barcode: Right Edge
                barcodeX = pdfW - sideMargin - barcodeW;
                // Logo: Spine (Left of Right Page)
                logoX = (pdfW / 2) + sideMargin;
            } else {
                // ENGLISH (Back Cover = LEFT Page 0-50%)
                // Barcode: Left Edge
                barcodeX = sideMargin;
                // Logo: Spine (Right of Left Page)
                logoX = (pdfW / 2) - sideMargin - logoW;
            }

            // Render Barcode
            const bcPxW = 600;
            const bcPxH = 36;
            const bcEl = createBarcodeStripElement(orderNumber, bcPxW, bcPxH);
            document.body.appendChild(bcEl);
            const bcCanvas = await html2canvas(bcEl, { backgroundColor: null, scale: 2 });
            document.body.removeChild(bcEl);
            const bcImg = bcCanvas.toDataURL('image/png');
            pdf.addImage(bcImg, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH);

            // Render Logo
            const logoPxW = 400;
            const logoPxH = 200;
            const logoEl = createRawyLogoElement(logoPxW, logoPxH);
            document.body.appendChild(logoEl);
            const logoCanvas = await html2canvas(logoEl, { backgroundColor: null, scale: 2 });
            document.body.removeChild(logoEl);
            const logoImg = logoCanvas.toDataURL('image/png');
            pdf.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH);
        }
    }

    // 2. Spreads
    for (let i = 0; i < spreadBlobs.length; i++) {
        pdf.addPage();
        const spreadB64 = await blobToBase64(spreadBlobs[i]);
        let cleanSpread = '';
        if (typeof spreadB64 === 'string') {
            cleanSpread = spreadB64.includes(',') ? spreadB64.split(',')[1] : spreadB64;
        }

        if (cleanSpread) {
            try {
                pdf.addImage(`data:image/jpeg;base64,${cleanSpread}`, 'JPEG', 0, 0, pdfW, pdfH);
            } catch (e) {
                console.error(`Failed to add spread ${i} to PDF`, e);
            }
        }

        // TEXT OVERLAY
        if (pages && pages[i] && pages[i].text) {
            const text = pages[i].text;
            const fontSize = 42;
            const blobImg = await renderTextBlobToImage(
                text,
                800,
                600,
                i,
                language,
                fontSize,
                storyDetails.childName,
                'box' // CHANGED: 'clean' -> 'box' for black text on white box
            );

            // Positioning (Same as before)
            const txtW = pdfW * 0.35;
            const ratio = blobImg.width / blobImg.height;
            const txtH = txtW / ratio;
            const marginX = pdfW * 0.05;
            const marginY = pdfH * 0.08;

            // Logic: Consistent side for text? Or per spread?
            // User requested "Not centered", "Usually frames nicely".
            // Defaulting to Left for English, Right for Arabic (via logic below)
            let isLeft = true; // Default
            if (language === 'ar') isLeft = false; // Swap

            const txtX = isLeft ? marginX : (pdfW - txtW - marginX);
            const txtY = pdfH - txtH - marginY;

            const cleanData = blobImg.dataUrl.includes(',') ? blobImg.dataUrl.split(',')[1] : blobImg.dataUrl;
            try {
                pdf.addImage(`data:image/png;base64,${cleanData}`, 'PNG', txtX, txtY, txtW, txtH);
            } catch (e) { console.warn("Text Add Failed", e); }
        }

        // METADATA STRIP (SPREADS)
        if (orderNumber) {
            const stripWidthMm = 3;
            const stripHeightMm = pdfH;
            const stripPxW = 50;
            const stripPxH = 5000;
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
        // 3. Raw Images (High Res)
        const imagesFolder = zip.folder("raw_images");

        // Helper to get Base64 from URL or Raw String
        const getBase64Data = async (input: string): Promise<string> => {
            if (input.startsWith('http')) {
                try {
                    const resp = await fetch(input);
                    const blob = await resp.blob();
                    return await blobToBase64(blob).then(res => res.split(',')[1]);
                } catch (e) {
                    console.error("Failed to fetch image for zip:", input);
                    return "";
                }
            }
            return input.includes(',') ? input.split(',')[1] : input;
        };

        if (storyData.coverImageUrl) {
            const coverB64 = await getBase64Data(storyData.coverImageUrl);
            if (coverB64) imagesFolder.file("cover.jpg", coverB64, { base64: true });
        }

        // Use Promise.all for parallel fetching with better error handling
        const pagePromises = storyData.pages.map(async (p, i) => {
            if (p.illustrationUrl) {
                const imgB64 = await getBase64Data(p.illustrationUrl);
                if (imgB64) {
                    imagesFolder.file(`page_${p.pageNumber}.jpg`, imgB64, { base64: true });
                } else {
                    console.warn(`Failed to package image for page ${p.pageNumber}`);
                }
            }
        });
        await Promise.all(pagePromises);

        // 4. Workflow Artifacts (Debug/Re-creation)
        const artifactsFolder = zip.folder("workflow_artifacts");
        if (storyData.blueprint) artifactsFolder.file("1_blueprint.json", JSON.stringify(storyData.blueprint, null, 2));
        if (storyData.spreadPlan) artifactsFolder.file("3_visual_plan.json", JSON.stringify(storyData.spreadPlan, null, 2));
        if (storyData.finalPrompts) artifactsFolder.file("5_prompts.json", JSON.stringify(storyData.finalPrompts, null, 2));

        // Also save the raw Story Data for full reconstruction
        artifactsFolder.file("full_story_data.json", JSON.stringify(storyData, null, 2));

        // 5. Detailed Creation Prompts (Debug)
        let detailedPrompts = `STORY GENERATION LOG\n--------------------------------\n`;

        // Add Cover Prompt
        if (storyData.actualCoverPrompt) {
            detailedPrompts += `COVER PROMPT\n`;
            detailedPrompts += `${storyData.actualCoverPrompt}\n`;
            detailedPrompts += `--------------------------------\n\n`;

            // Allow separate artifact for easy reading
            artifactsFolder.file("0_cover_prompt.txt", storyData.actualCoverPrompt);
        }

        storyData.pages.forEach(p => {
            detailedPrompts += `PAGE ${p.pageNumber}\n`;
            detailedPrompts += `TEXT: ${p.text}\n`;
            detailedPrompts += `PROMPT USED:\n${p.actualPrompt || 'N/A'}\n`;
            detailedPrompts += `--------------------------------\n\n`;
        });
        artifactsFolder.file("debug_creation_prompts.txt", detailedPrompts);

        // 5. Order Manifest
        const manifest = {
            orderNumber,
            date: new Date().toISOString(),
            shipping,
            storySummary: {
                title: storyData.title,
                theme: storyData.theme,
                childName: storyData.childName,
                childAge: storyData.childAge, // Added for Stitcher
                size: storyData.size,         // Added for Stitcher
                pageCount: storyData.pages.length
            },
            pages: storyData.pages.map(p => ({
                pageNumber: p.pageNumber,
                text: p.text
            }))
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
        font-size: 92px; /* INCREASED from 74px */
        font-weight: 900;
        color: black;
        letter-spacing: 16px; /* Increased spacing */
    `;
    topText.innerText = `ORDER #${orderNumber}`;
    container.appendChild(topText);

    // Bottom Info (Spread + Barcode)
    const bottomGroup = document.createElement('div');
    bottomGroup.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 100px; /* Increased gap */
        width: 100%;
        padding-bottom: 40px;
    `;

    const spreadText = document.createElement('div');
    spreadText.style.cssText = `
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-family: monospace;
        font-size: 72px; /* INCREASED from 60px */
        font-weight: bold;
        color: #333; /* Darker gray */
    `;
    spreadText.innerText = `SPREAD ${spreadIndex}`;
    bottomGroup.appendChild(spreadText);

    // Better Barcode Simulation (Fixed Height & High Contrast)
    const bcContainer = document.createElement('div');
    bcContainer.style.cssText = "display:flex; flex-direction:column; align-items:center; gap:16px; width: 100%; padding: 0 10px;"; // Increased gap to 16px

    // Explicit Bars for visibility
    for (let k = 0; k < 14; k++) { // Increased bar count slightly
        const bar = document.createElement('div');
        bar.style.width = Math.random() > 0.5 ? '100%' : '70%'; // Wide bars
        bar.style.height = Math.random() > 0.5 ? '80px' : '40px'; /* MUCH THICKER BARS (was 40/22) */
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
    // Load ALL necessary fonts: Luckiest Guy (En), Tajawal (Ar UI), Amiri (Ar Body)
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Tajawal:wght@400;700;900&family=Amiri:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    // Wait a moment for font to load (heuristic) - in real prod use document.fonts.ready
    await document.fonts.ready;

    const html2canvas = getHtml2Canvas();
    const container = document.createElement('div');

    // Typography Logic
    const isEn = lang !== 'ar';
    // Use Tajawal Black for Titles
    const fontFamily = isEn ? "'Luckiest Guy', cursive" : "'Tajawal', sans-serif";
    const letterSpacing = isEn ? '2px' : 'normal'; // standard spacing for Arabic

    // Arabic: Text-based (Simple, Black, No Shadow)
    // English: Logo-style (White, Shadow, Rotated)
    const color = isEn ? '#FFFFFF' : '#000000';
    const textShadow = isEn
        ? '4px 4px 0 #203A72, -2px -2px 0 #203A72, 2px -2px 0 #203A72, -2px 2px 0 #203A72, 2px 2px 0 #203A72, 0 8px 15px rgba(0,0,0,0.3)'
        : 'none';
    const transform = isEn ? 'rotate(-2deg)' : 'none';

    container.style.cssText = `position:absolute;left:-9999px;font-family:${fontFamily};color:${color};background:transparent;font-weight:900;text-shadow:${textShadow};padding:20px;text-align:center;width:1000px;line-height:1.1;font-size:90px;text-transform:uppercase;letter-spacing:${letterSpacing};transform:${transform};`;

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

export function createRawyLogoElement(width: number, height: number): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `width:${width}px;height:${height}px;background:transparent;display:flex;align-items:center;justify-content:center;`;

    // LOGO "RAWY"
    const logo = document.createElement('div');
    logo.style.cssText = "font-family:sans-serif;font-weight:900;font-size:62px;letter-spacing:6px;color:black;text-transform:uppercase;";
    logo.innerText = "RAWY";
    container.appendChild(logo);

    return container;
}

export function createBarcodeStripElement(orderNumber: string, width: number, height: number): HTMLElement {
    const container = document.createElement('div');
    // 3mm is very thin, so we need full height bars
    container.style.cssText = `width:${width}px;height:${height}px;background:white;display:flex;align-items:stretch;justify-content:center;gap:2px;overflow:hidden;`;

    // Barcode Lines (Dense)
    for (let k = 0; k < 60; k++) {
        const bar = document.createElement('div');
        const isThick = Math.random() > 0.6;
        bar.style.width = isThick ? '6px' : '2px';
        bar.style.height = '100%';
        bar.style.backgroundColor = 'black';
        // Add some spacing
        bar.style.marginLeft = Math.random() > 0.5 ? '2px' : '0';
        container.appendChild(bar);
    }

    return container;
}

// DEPRECATED: Old Back Cover Element (Kept for safety if referenced elsewhere, though unlikely)
export function createBackCoverElement(orderNumber: string, width: number, height: number): HTMLElement {
    return createRawyLogoElement(width, height);
}
