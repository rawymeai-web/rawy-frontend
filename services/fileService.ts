
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
 * Creates a high-res image of a text blob to be inserted into the PDF.
 * This ensures the PDF blobs look exactly like the UI blobs.
 */
async function renderTextBlobToImage(text: string, widthPx: number, heightPx: number, blobIndex: number, language: Language): Promise<string> {
    const html2canvas = getHtml2Canvas();
    const container = document.createElement('div');
    container.dir = language === 'ar' ? 'rtl' : 'ltr';
    container.style.cssText = `
        width: fit-content;
        max-width: ${widthPx}px;
        background-color: rgba(255, 255, 255, 0.45);
        border-radius: ${blobBorderRadii[blobIndex % blobBorderRadii.length]};
        color: #203A72;
        padding: 50px;
        font-family: ${language === 'ar' ? 'Tajawal, sans-serif' : 'Nunito, sans-serif'};
        font-weight: 700;
        font-size: 32px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        line-height: 1.4;
        box-sizing: border-box;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    `;

    // Simple text formatting
    container.innerText = text.replace(/<[^>]*>?/gm, '');

    document.body.appendChild(container);
    const canvas = await html2canvas(container, { backgroundColor: null, scale: 1 });
    document.body.removeChild(container);
    return canvas.toDataURL('image/png');
}

export const generatePreviewPdf = async (storyData: StoryData, language: Language, highResImages?: imageStore.OrderImages): Promise<Blob> => {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error("jsPDF not loaded");

    const sizeConfig = getProductSizeById(storyData.size) || { page: { widthCm: 20, heightCm: 20 } };

    const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [sizeConfig.page.widthCm * 20, sizeConfig.page.heightCm * 10]
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    // 1. Handle the Cover First
    let coverData = storyData.coverImageUrl;
    if (highResImages?.cover) {
        coverData = await blobToBase64(highResImages.cover);
    }

    if (coverData && coverData.length > 50) {
        const cleanB64 = coverData.includes(',') ? coverData.split(',')[1] : coverData;
        pdf.addImage(`data:image/jpeg;base64,${cleanB64}`, 'JPEG', 0, 0, pdfW, pdfH);

        // Add Title Overlay to Cover
        const titleB64 = await createTextImage({ title: storyData.title }, language);
        const tw = pdfW * 0.6;
        const th = pdfH * 0.2;
        const tx = (pdfW - tw) / 2;
        const ty = pdfH * 0.15;
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
        }

        if (illustration && illustration.length > 50) {
            const cleanB64 = illustration.includes(',') ? illustration.split(',')[1] : illustration;
            pdf.addImage(`data:image/jpeg;base64,${cleanB64}`, 'JPEG', 0, 0, pdfW, pdfH);
        }

        // Draw Text Blobs
        const blocks = spread.textBlocks || [];
        for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
            const block = blocks[bIdx];
            const isLeft = spread.textSide === 'left';

            // Render the UI-style blob to an image
            const blobImg = await renderTextBlobToImage(block.text, 800, 600, bIdx, language);

            const rectW = pdfW * 0.35;
            const rectH = pdfH * 0.5;
            const rectX = isLeft ? pdfW * 0.08 : pdfW * 0.57;
            const rectY = (pdfH - rectH) / 2;

            pdf.addImage(blobImg, 'PNG', rectX, rectY, rectW, rectH);
        }
    }

    return pdf.output('blob');
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
};

export async function createTextImage(titleData: { title: string }, lang: Language): Promise<string> {
    const html2canvas = getHtml2Canvas();
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;font-family:sans-serif;color:white;background:rgba(0,0,0,0.4);border-radius:15px;font-weight:900;text-shadow:0 2px 10px rgba(0,0,0,0.8);padding:20px 30px;text-align:center;max-width:1000px;line-height:1.3;font-size:65px;';
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
        padding: 50px 0;
        box-sizing: border-box;
        font-family: 'Courier New', monospace;
        font-size: 24px;
        color: black;
    `;

    // Metadata Text (Rotated)
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
        writing-mode: vertical-rl;
        text-orientation: mixed;
        display: flex;
        gap: 20px;
        align-items: center;
    `;

    const orderSpan = document.createElement('span');
    orderSpan.innerText = `ORDER: ${orderNumber}`;
    const spreadSpan = document.createElement('span');
    spreadSpan.innerText = `SPREAD: ${spreadIndex + 1}`;

    textContainer.appendChild(orderSpan);
    textContainer.appendChild(spreadSpan);
    container.appendChild(textContainer);

    // Barcode (Vertical)
    const barcodeBox = document.createElement('div');
    // Barcode should be vertical too? Or just placed at bottom.
    // "barcode with the order no. on the side"
    // Let's make a small barcode and rotate it or just place it.
    // Since width is small (3mm ~ 35px at 300DPI), standard barcode might be too wide if horizontal.
    // Let's rotate it 90deg.

    // We reuse createBarcodeHtmlElement but wrapper needs to rotate it.
    // 3mm is very narrow. 3mm * 118 px/cm = 35px.
    // A barcode needs length. So it must be vertical.

    const bcWidth = height * 0.2; // Use 20% of height for barcode length
    const bcHeight = width * 0.8; // Fit within the strip width

    const barcode = createBarcodeHtmlElement(orderNumber, bcWidth, bcHeight);
    barcode.style.transform = 'rotate(90deg)';
    barcode.style.transformOrigin = 'center';

    // Wrap it to avoid layout issues with transform
    const bcWrapper = document.createElement('div');
    bcWrapper.style.cssText = `
        width: ${width}px;
        height: ${bcWidth}px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    `;
    bcWrapper.appendChild(barcode);

    container.appendChild(bcWrapper);

    return container;
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
    let fontSize = '24px';
    if (ageNum <= 2) fontSize = '48px';
    else if (ageNum <= 5) fontSize = '36px';

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

export const generateStitchedPdf = async (coverBlob: Blob, spreadBlobs: Blob[], sizeConfig: ProductSize): Promise<Blob> => {
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
    pdf.addImage(`data:image/jpeg;base64,${cleanCover}`, 'JPEG', 0, 0, pdfW, pdfH);

    // 2. Spreads
    for (let i = 0; i < spreadBlobs.length; i++) {
        pdf.addPage();
        const spreadB64 = await blobToBase64(spreadBlobs[i]);
        const cleanSpread = spreadB64.includes(',') ? spreadB64.split(',')[1] : spreadB64;
        pdf.addImage(`data:image/jpeg;base64,${cleanSpread}`, 'JPEG', 0, 0, pdfW, pdfH);
    }

    return pdf.output('blob');
};

export async function generatePrintPackage(storyData: StoryData, shippingDetails: ShippingDetails, language: Language, orderNumber: string): Promise<void> {
    const JSZip = getJSZip();
    const zip = new JSZip();

    let highResAssets: imageStore.OrderImages | null = null;
    try {
        highResAssets = await imageStore.getImagesForOrder(orderNumber);
    } catch (e) { console.warn("IDB fetch failed, using memory state."); }

    const manifest = `ORDER ID: ${orderNumber}
CUSTOMER: ${shippingDetails.name} (${shippingDetails.phone})
BOOK: "${storyData.title}" for ${storyData.childName}
LANGUAGE: ${language.toUpperCase()}
SIZE: ${storyData.size}

STORY SCRIPT:
${storyData.pages.map(p => `PAGE ${p.pageNumber}:\n${p.text}`).join('\n\n')}
`;
    zip.file('PRODUCTION_MANIFEST.txt', manifest);

    // Add Workflow Logs (User Request)
    const logsFolder = zip.folder('workflow_logs');
    if (storyData.blueprint) {
        logsFolder?.file('01_blueprint.json', JSON.stringify(storyData.blueprint, null, 2));
    }
    if (storyData.finalPrompts) {
        logsFolder?.file('02_prompts.json', JSON.stringify(storyData.finalPrompts, null, 2));
    }
    logsFolder?.file('00_full_story_data.json', JSON.stringify(storyData, null, 2));

    const rawFolder = zip.folder('01_Raw_Illustrations');

    let coverB64 = storyData.coverImageUrl;
    if (highResAssets?.cover) {
        const b64 = await blobToBase64(highResAssets.cover);
        coverB64 = b64.includes(',') ? b64.split(',')[1] : b64;
    }
    if (coverB64 && coverB64.length > 50) {
        rawFolder?.file('00_cover_raw.jpeg', coverB64, { base64: true });
    }

    const spreadPages = storyData.pages.filter((_, i) => i % 2 === 0);
    for (let i = 0; i < spreadPages.length; i++) {
        let spreadB64 = spreadPages[i].illustrationUrl;
        if (highResAssets?.spreads[i]) {
            const b64 = await blobToBase64(highResAssets.spreads[i]);
            spreadB64 = b64.includes(',') ? b64.split(',')[1] : b64;
        }
        if (spreadB64 && spreadB64.length > 50) {
            rawFolder?.file(`spread_${String(i + 1).padStart(2, '0')}_raw.jpeg`, spreadB64, { base64: true });
        }
    }

    try {
        const pdfBlob = await generatePreviewPdf(storyData, language, highResAssets || undefined);
        zip.file(`02_${orderNumber}_Ready_To_Print.pdf`, pdfBlob);
    } catch (pdfErr) {
        console.error("PDF generation failed in ZIP package", pdfErr);
    }

    const finalZip = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(finalZip);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${orderNumber}_Rawy_Print_Pack.zip`;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    }, 2000);
}

export const downloadCoverImage = (base64Data: string, fileName: string) => {
    const cleanB64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${cleanB64}`;
    link.download = `${fileName}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
