
import React, { useState, useEffect } from 'react';
import type { Language, ProductSize } from '../types';
import * as adminService from '../services/adminService';
import * as stitchingService from '../services/stitchingService';
import * as fileService from '../services/fileService';
import { cropImageToSize } from '../utils/imageUtils';
import { Button } from './Button';
import { Spinner } from './Spinner';

// @ts-ignore
const JSZip = window.JSZip;

interface LoadedImage {
    file: File;
    dataUrl: string;
    width: number;
    height: number;
}

interface StitchedResults {
    coverUrl: string;
    spreadUrls: string[];
    coverBlob: Blob;
    spreadBlobs: Blob[];
    pdfBlob: Blob;
}

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h3 className="text-xl font-bold text-brand-coral border-b pb-2">{title}</h3>
        {children}
    </div>
);

const StitchingScreen: React.FC<{ onExit: () => void; language: Language; }> = ({ onExit, language }) => {
    const [orderNumber, setOrderNumber] = useState('');
    const [bookTitle, setBookTitle] = useState('');
    const [childAge, setChildAge] = useState('');
    const [childName, setChildName] = useState('');
    const [selectedSizeId, setSelectedSizeId] = useState<string>('');
    const [allSizes, setAllSizes] = useState<ProductSize[]>([]);

    const [coverImage, setCoverImage] = useState<LoadedImage | null>(null);
    const [spreadImages, setSpreadImages] = useState<LoadedImage[]>([]);
    const [storyTexts, setStoryTexts] = useState<string[]>([]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [error, setError] = useState('');
    const [stitchedResults, setStitchedResults] = useState<StitchedResults | null>(null);

    useEffect(() => {
        adminService.getProductSizes().then(sizes => {
            setAllSizes(sizes);
            if (sizes.length > 0) setSelectedSizeId(sizes[0].id);
        });
    }, []);

    useEffect(() => {
        return () => {
            if (stitchedResults) {
                URL.revokeObjectURL(stitchedResults.coverUrl);
                stitchedResults.spreadUrls.forEach(url => URL.revokeObjectURL(url));
            }
        };
    }, [stitchedResults]);

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const loadImage = (file: File): Promise<LoadedImage> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const img = new Image();
                img.onload = () => resolve({ file, dataUrl, width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = reject;
                img.src = dataUrl;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const id = e.target.id;
        setError('');
        try {
            if (id === 'cover-upload' && files[0]) {
                setCoverImage(await loadImage(files[0]));
            } else if (id === 'spreads-upload') {
                const loaded = await Promise.all(Array.from(files).map(loadImage));
                loaded.sort((a, b) => a.file.name.localeCompare(b.file.name));
                setSpreadImages(loaded);
            } else if (id === 'text-upload' && files[0]) {
                const content = await files[0].text();
                const parts = content.split('\n---\n');
                const metadataPart = parts[0];
                const storyPart = parts.length > 1 ? parts[1] : '';
                const metadata: { [key: string]: string } = {};
                metadataPart.split('\n').forEach(line => {
                    const [key, ...v] = line.split(':');
                    if (key && v.length > 0) metadata[key.trim()] = v.join(':').trim();
                });
                if (metadata['Order Number']) setOrderNumber(metadata['Order Number']);
                if (metadata['Book Title']) setBookTitle(metadata['Book Title']);
                if (metadata['Child Name']) setChildName(metadata['Child Name']);
                if (metadata['Child Age']) setChildAge(metadata['Child Age']);
                if (metadata['Book Size']) {
                    const sid = metadata['Book Size'];
                    if (allSizes.some(s => s.id === sid)) setSelectedSizeId(sid);
                }
                setStoryTexts(storyPart.split(/\n\s*\n/).map(t => t.trim().replace(/^Page \d+:\s*/i, '')).filter(Boolean));
            }
        } catch (err) { setError(`Error loading file.`); }
        e.target.value = '';
    };

    const handleGenerate = async () => {
        const sizeConfig = allSizes.find(s => s.id === selectedSizeId);
        if (!coverImage || spreadImages.length === 0 || storyTexts.length === 0 || !orderNumber || !bookTitle || !sizeConfig || !childAge) {
            setError("Missing files or details."); return;
        }
        setIsProcessing(true);
        const DPI = 300;
        const PX_PER_CM = DPI / 2.54;

        // Load Logo for Back Cover
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load logo'));
            img.src = '/logo-icon.png';
        }).catch(e => null); // Fail silently if logo missing, but ideally should warn

        try {
            setProcessingStatus("Stitching cover...");
            const cw = Math.round(sizeConfig.cover.totalWidthCm * PX_PER_CM);
            const ch = Math.round(sizeConfig.cover.totalHeightCm * PX_PER_CM);
            const croppedCover = await cropImageToSize(coverImage.dataUrl, cw, ch);
            const coverBase = await new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = croppedCover; });

            const { cover, coverContent } = sizeConfig;
            const overlays: any[] = [];

            // Front Cover Title
            const titleB64 = await fileService.createTextImage({ title: bookTitle }, language);
            const titleImg = await new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = titleB64; });
            const scw = (cover.totalWidthCm - cover.spineWidthCm) / 2 * PX_PER_CM;
            const spw = cover.spineWidthCm * PX_PER_CM;
            const ttop = coverContent.title.fromTopCm * PX_PER_CM;
            const tw = coverContent.title.widthCm * PX_PER_CM;
            const th = titleImg.naturalHeight * (tw / titleImg.naturalWidth);
            const tx = language === 'ar' ? (scw - tw) / 2 : scw + spw + (scw - tw) / 2;
            overlays.push({ element: titleImg, styles: { position: 'absolute', top: `${ttop}px`, left: `${tx}px`, width: `${tw}px`, height: `${th}px` } });

            // Barcode (existing logic seems to be for standard barcode, possibly ISBN or specific order barcode on cover?)
            // Requirement: "barcode with the order no. on the side" -> This is for spreads?
            // "cover backside... should have Rawy logo QR code with the order no."
            // Existing barcode logic:
            const bcl = language === 'ar' ? (sizeConfig.cover.totalWidthCm * PX_PER_CM) - (coverContent.barcode.fromRightCm * PX_PER_CM) - (coverContent.barcode.widthCm * PX_PER_CM) : scw - (coverContent.barcode.fromRightCm * PX_PER_CM) - (coverContent.barcode.widthCm * PX_PER_CM);
            // Leaving existing barcode as is if it's required, assuming it's different from the new Back Cover requirements?
            // User said: "cover backside... should have Rawy logo QR code"
            // If the existing barcode is on the back cover, we might need to remove/replace it or check location.
            // Existing barcode is placed at `bcl`.
            // AR: `totalWidth - fromRight`. This puts it on the far LEFT of the unfolded image (Back Cover is Right in AR? Wait.)
            // Let's re-verify Layout.
            // Image: [ Back | Spine | Front ] (Arabic) or [ Front | Spine | Back ] (English)?
            // Usually:
            // English LTR: Open book. Spine in middle. Front is Right. Back is Left.
            // Image Layout LTR: [ Back (Left) | Spine | Front (Right) ]
            // Arabic RTL: Open book. Spine in middle. Front is Left. Back is Right.
            // Image Layout RTL: [ Front (Left) | Spine | Back (Right) ]
            //
            // Current Title Logic:
            // AR: `tx = (scw - tw) / 2`. `scw` is single cover width. `tx` is on the Left panel.
            // implies Front is Left in AR. Matches [ Front | Spine | Back ].
            // EN: `tx = scw + spw + ...`. `tx` is on the Right panel. Matches [ Back | Spine | Front ]. This seems inverted for standard English flat cover?
            // Standard English Flat Cover: [ Back | Spine | Front ].
            // If Title is on Right, then Front is Right. This matches English.
            //
            // So:
            // AR: [ Front | Spine | Back ]
            // EN: [ Back | Spine | Front ]
            //
            // Back Cover Location:
            // AR: Right Panel. Start X = `scw + spw`.
            // EN: Left Panel. Start X = `0`.

            // Existing barcode logic:
            // AR: `totalWidth - fromRight`. Puts it on the Right Panel (Back). Correct.
            // EN: `scw - fromRight`. Puts it on the Left Panel (Back). Correct.
            // So existing barcode is on the Back Cover.
            overlays.push({ element: fileService.createBarcodeHtmlElement(orderNumber, coverContent.barcode.widthCm * PX_PER_CM, coverContent.barcode.heightCm * PX_PER_CM), styles: { position: 'absolute', top: `${coverContent.barcode.fromTopCm * PX_PER_CM}px`, left: `${bcl}px` } });

            // ADDING LOGO AND QR CODE TO BACK COVER
            // Position: Centered horizontally on the Back Cover panel?
            // Let's place Logo at top-ish and QR below it.
            const backCoverX = language === 'ar' ? scw + spw : 0;
            const backCoverWidth = scw;

            const qrSize = 2.5 * PX_PER_CM; // 2.5cm QR
            const qrX = backCoverX + (backCoverWidth - qrSize) / 2;
            const qrY = ch * 0.8; // Near bottom

            const qrImg = await fileService.createQrCodeElement(orderNumber, qrSize, qrSize);
            overlays.push({ element: qrImg, styles: { position: 'absolute', top: `${qrY}px`, left: `${qrX}px`, width: `${qrSize}px`, height: `${qrSize}px` } });

            if (logoImg) {
                const logoW = 3 * PX_PER_CM; // 3cm wide
                const logoH = logoImg.naturalHeight * (logoW / logoImg.naturalWidth);
                const logoX = backCoverX + (backCoverWidth - logoW) / 2;
                const logoY = qrY - logoH - (0.5 * PX_PER_CM); // 0.5cm above QR
                overlays.push({ element: logoImg, styles: { position: 'absolute', top: `${logoY}px`, left: `${logoX}px`, width: `${logoW}px`, height: `${logoH}px` } });
            }

            const coverBlob = await stitchingService.stitchImageWithOverlays(coverBase, overlays);

            const spreadBlobs: Blob[] = [];
            const sw = Math.round(sizeConfig.page.widthCm * 2 * PX_PER_CM);
            const sh = Math.round(sizeConfig.page.heightCm * PX_PER_CM);

            // 3mm Strip Logic
            const stripWidthCm = 0.3; // 3mm
            const stripWidthPx = Math.round(stripWidthCm * PX_PER_CM);
            const totalSpreadWidthPx = sw + stripWidthPx;

            for (let i = 0; i < spreadImages.length; i++) {
                setProcessingStatus(`Stitching spread ${i + 1}...`);
                const cropped = await cropImageToSize(spreadImages[i].dataUrl, sw, sh);
                const sbase = await new Promise<HTMLImageElement>((res) => { const img = new Image(); img.onload = () => res(img); img.src = cropped; });
                const txt = [storyTexts[i * 2], storyTexts[i * 2 + 1]].filter(Boolean).join('\n\n');
                const overlays: any[] = [];
                if (txt) {
                    const el = fileService.createPrintableTextBlockElement(txt, language, i, childAge, childName, true);
                    overlays.push({ element: el, styles: { position: 'absolute', top: '50%', left: '25%', transform: 'translate(-50%, -50%)', maxWidth: '40%' } });
                }

                // Add Metadata Strip
                const stripEl = fileService.createMetadataStripElement(orderNumber, i, stripWidthPx, sh);
                // Position on the far right
                overlays.push({ element: stripEl, styles: { position: 'absolute', top: '0', right: '0' } });

                // Pass targetWidth to include the strip
                spreadBlobs.push(await stitchingService.stitchImageWithOverlays(sbase, overlays, totalSpreadWidthPx, sh));
            }

            setProcessingStatus("Generating PDF...");
            // Adjust sizeConfig for PDF to include the 3mm strip in the spread width
            // The PDF generator takes `widthCm` which is single page width.
            // We added 0.3cm to the TOTAL spread.
            // So we need to increase the spread width in PDF config.
            // Effectively we can lie about the page width or just modify the config.
            // New Spread Width = (WidthCm * 2) + 0.3
            // New 'Page' Width = WidthCm + 0.15
            const pdfSizeConfig = {
                ...sizeConfig,
                page: {
                    ...sizeConfig.page,
                    widthCm: sizeConfig.page.widthCm + (stripWidthCm / 2)
                }
            };

            const pdfBlob = await fileService.generateStitchedPdf(coverBlob, spreadBlobs, pdfSizeConfig);
            setStitchedResults({
                coverUrl: URL.createObjectURL(coverBlob),
                spreadUrls: spreadBlobs.map(b => URL.createObjectURL(b)),
                coverBlob, spreadBlobs, pdfBlob
            });
        } catch (err) { console.error(err); setError("An error occurred during stitching."); } finally { setIsProcessing(false); setProcessingStatus(''); }
    };

    const handleDownloadPackage = async () => {
        if (!stitchedResults) return;
        setIsProcessing(true);
        setProcessingStatus("Zipping...");
        try {
            const zip = new JSZip();
            zip.file('00_cover_stitched.jpeg', stitchedResults.coverBlob);
            stitchedResults.spreadBlobs.forEach((b, i) => zip.file(`spread_${String(i + 1).padStart(2, '0')}.jpeg`, b));
            zip.file('full_book.pdf', stitchedResults.pdfBlob);
            const content = await zip.generateAsync({ type: 'blob' });

            const link = document.createElement('a');
            const url = URL.createObjectURL(content);
            link.href = url;
            link.download = `${orderNumber}_Rawy_Production.zip`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) { setError('Failed to create ZIP.'); } finally { setIsProcessing(false); setProcessingStatus(''); }
    };

    if (stitchedResults) return (
        <div className="max-w-4xl mx-auto space-y-8 animate-enter-forward">
            <h2 className="text-3xl font-bold text-brand-navy text-center">✅ Ready!</h2>
            <Section title="Final Preview"><img src={stitchedResults.coverUrl} className="w-full rounded-lg shadow-lg" /></Section>
            <div className="flex gap-4 justify-center">
                <Button onClick={() => setStitchedResults(null)} variant="outline">Back</Button>
                <Button onClick={handleDownloadPackage} className="px-12 py-4" disabled={isProcessing}>
                    {isProcessing ? processingStatus : "Download ZIP Package"}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-brand-navy text-center">🧵 Stitching Module</h2>
            <Section title="Upload Assets">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input id="cover-upload" type="file" onChange={handleFileUpload} className="block w-full text-sm border p-2 rounded" />
                    <input id="spreads-upload" type="file" multiple onChange={handleFileUpload} className="block w-full text-sm border p-2 rounded" />
                    <input id="text-upload" type="file" onChange={handleFileUpload} className="block w-full text-sm border p-2 rounded" />
                </div>
            </Section>
            <Button onClick={handleGenerate} className="w-full py-4" disabled={isProcessing}>
                {isProcessing ? <><Spinner /> {processingStatus}</> : "Generate Production Package"}
            </Button>
            {error && <p className="text-red-500 text-center font-bold">{error}</p>}
        </div>
    );
};
export default StitchingScreen;
