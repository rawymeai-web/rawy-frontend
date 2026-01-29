import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';
import { Button } from './Button';

interface ImageCropModalProps {
    imageSrc: string;
    onCropComplete: (croppedImageBase64: string, croppedBlob: Blob) => void;
    onClose: () => void;
    language: Language;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, onCropComplete, onClose, language }) => {
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [dragAction, setDragAction] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, boxX: 0, boxY: 0, boxWidth: 0, boxHeight: 0 });
    const [isMaximized, setIsMaximized] = useState(false); // Toggle for full view if needed

    const handleImageLoad = () => {
        if (imageRef.current && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;

            const img = imageRef.current;
            const containerAspect = containerWidth / containerHeight;
            const imgAspect = img.naturalWidth / img.naturalHeight;

            let displayW, displayH;
            if (imgAspect > containerAspect) {
                displayW = containerWidth;
                displayH = containerWidth / imgAspect;
            } else {
                displayH = containerHeight;
                displayW = containerHeight * imgAspect;
            }

            // Default crop box: Focus on center 80% initially
            const initialW = displayW * 0.8;
            const initialH = displayH * 0.8;
            setCropBox({
                width: initialW,
                height: initialH,
                x: (containerWidth - initialW) / 2,
                y: (containerHeight - initialH) / 2,
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, action: string) => {
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        setDragAction(action);
        setDragStart({
            clientX,
            clientY,
            boxX: cropBox.x,
            boxY: cropBox.y,
            boxWidth: cropBox.width,
            boxHeight: cropBox.height,
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragAction || !containerRef.current || !imageRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

        // Use refined logic to keep box inside image
        const containerRect = containerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();

        const imageOffsetX = imageRect.left - containerRect.left;
        const imageOffsetY = imageRect.top - containerRect.top;

        const dx = clientX - dragStart.clientX;
        const dy = clientY - dragStart.clientY;

        let { x: newX, y: newY, width: newWidth, height: newHeight } = cropBox; // Start from current (state-derived) or dragStart? 
        // Wait, standard drag logic uses dragStart base.

        if (dragAction === 'move') {
            newX = dragStart.boxX + dx;
            newY = dragStart.boxY + dy;
        } else {
            // Resizing logic
            if (dragAction.includes('e')) newWidth = dragStart.boxWidth + dx;
            if (dragAction.includes('w')) {
                newWidth = dragStart.boxWidth - dx;
                newX = dragStart.boxX + dx;
            }
            if (dragAction.includes('s')) newHeight = dragStart.boxHeight + dy;
            if (dragAction.includes('n')) {
                newHeight = dragStart.boxHeight - dy;
                newY = dragStart.boxY + dy;
            }
        }

        const minSize = 60;

        // Constrain to Image Bounds
        // 1. Constrain Position
        newX = Math.max(imageOffsetX, Math.min(newX, imageOffsetX + imageRect.width - newWidth));
        newY = Math.max(imageOffsetY, Math.min(newY, imageOffsetY + imageRect.height - newHeight));

        // 2. Constrain Size
        newWidth = Math.max(minSize, Math.min(newWidth, imageRect.width - (newX - imageOffsetX)));
        newHeight = Math.max(minSize, Math.min(newHeight, imageRect.height - (newY - imageOffsetY)));

        setCropBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    }, [dragAction, dragStart]);

    const handleMouseUp = useCallback(() => setDragAction(null), []);

    useEffect(() => {
        if (dragAction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [dragAction, handleMouseMove, handleMouseUp]);

    const handleCrop = () => {
        if (!imageRef.current || !containerRef.current) return;
        const image = imageRef.current;

        const imageRect = image.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const imageOffsetX = imageRect.left - containerRect.left;
        const imageOffsetY = imageRect.top - containerRect.top;

        // Calculate ratio of Natural Image to Displayed Image
        const scaleX = image.naturalWidth / imageRect.width;
        const scaleY = image.naturalHeight / imageRect.height;

        // Get crop coordinates relative to the image itself
        const cropX_onImage = cropBox.x - imageOffsetX;
        const cropY_onImage = cropBox.y - imageOffsetY;

        const sourceX = cropX_onImage * scaleX;
        const sourceY = cropY_onImage * scaleY;
        const sourceWidth = cropBox.width * scaleX;
        const sourceHeight = cropBox.height * scaleY;

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 1024, 1024);
        // Draw cropped portion
        ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 1024, 1024);

        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        canvas.toBlob((blob: Blob | null) => { if (blob) onCropComplete(base64, blob); }, 'image/jpeg', 0.9);
    };

    const handleTypes = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/10 shrink-0">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                    {t('تعديل ملامح البطل', 'Refine Hero Features')}
                </h2>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Main Content - Expanded to fit */}
            <div className="flex-grow relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div ref={containerRef} className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
                    <img
                        ref={imageRef}
                        src={imageSrc}
                        onLoad={handleImageLoad}
                        className="max-w-full max-h-full object-contain pointer-events-none shadow-2xl"
                        alt="Crop preview"
                    />

                    {/* Crop Box Overlay */}
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                        onTouchStart={(e) => handleMouseDown(e, 'move')}
                        className="absolute border-2 md:border-4 border-brand-orange shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] cursor-move"
                        style={{
                            left: cropBox.x,
                            top: cropBox.y,
                            width: cropBox.width,
                            height: cropBox.height,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' // Darkens outside area
                        }}
                    >
                        {/* Grid Lines Rule of Thirds */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                            <div className="border-r border-white/50 col-span-1"></div>
                            <div className="border-r border-white/50 col-span-1"></div>
                            <div className="absolute top-1/3 w-full border-t border-white/50"></div>
                            <div className="absolute top-2/3 w-full border-t border-white/50"></div>
                        </div>

                        {/* Handles */}
                        {handleTypes.map(type => (
                            <div
                                key={type}
                                onMouseDown={(e) => handleMouseDown(e, type)}
                                onTouchStart={(e) => handleMouseDown(e, type)}
                                className="absolute bg-white w-6 h-6 md:w-8 md:h-8 border-2 md:border-4 border-brand-orange rounded-full shadow-lg z-30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                style={{
                                    ...(type.includes('n') && { top: -12 }),
                                    ...(type.includes('s') && { bottom: -12 }),
                                    ...(type.includes('w') && { left: -12 }),
                                    ...(type.includes('e') && { right: -12 }),
                                    ...(type === 'n' || type === 's' ? { left: '50%', transform: 'translateX(-50%)' } : {}),
                                    ...(type === 'w' || type === 'e' ? { top: '50%', transform: 'translateY(-50%)' } : {}),
                                    ...(type === 'nw' && { left: -12, top: -12 }),
                                    ...(type === 'ne' && { right: -12, top: -12 }),
                                    ...(type === 'sw' && { left: -12, bottom: -12 }),
                                    ...(type === 'se' && { right: -12, bottom: -12 }),
                                }}
                            />
                        ))}
                    </div>
                </div>

                <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm md:text-base pointer-events-none drop-shadow-md">
                    {t('اسحب الزوايا لتحديد الوجه', 'Drag corners to crop. Focus on the face!')}
                </p>
            </div>

            {/* Footer Controls */}
            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 shrink-0 flex justify-center gap-4 border-t border-white/10">
                <Button onClick={onClose} variant="ghost" className="text-white hover:bg-white/10">
                    {t('إلغاء', 'Cancel')}
                </Button>
                <Button onClick={handleCrop} className="bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xl shadow-brand-orange/20 px-8 py-3 text-lg rounded-2xl">
                    {t('تأكيد وحفظ', 'Confirm & Save')}
                </Button>
            </div>
        </div>
    );
};
