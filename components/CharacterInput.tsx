
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Character, Language } from '../types';
import { Button } from './Button';

import { ImageCropModal } from './ImageCropModal';

interface CharacterInputProps {
  character: Character;
  onCharacterChange: (character: Character) => void;
  label: string;
  isMain: boolean;
  onManualEdit?: () => void;
  language: Language;
}

export const CharacterInput: React.FC<CharacterInputProps> = ({ character, onCharacterChange, label, isMain, onManualEdit, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ dataUrl: string; originalName: string; index?: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop({ dataUrl: reader.result as string, originalName: file.name });
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedImageBase64: string, croppedBlob: Blob) => {
    if (!imageToCrop) return;
    const croppedFile = new File([croppedBlob], imageToCrop.originalName, { type: 'image/jpeg' });
    if (isMain) {
      if (imageToCrop.index !== undefined) {
        const newImages = [...character.images];
        const newBase64s = [...character.imageBases64];
        newImages[imageToCrop.index] = croppedFile;
        newBase64s[imageToCrop.index] = croppedImageBase64;
        onCharacterChange({ ...character, images: newImages, imageBases64: newBase64s });
      } else {
        onCharacterChange({
          ...character,
          images: [...character.images, croppedFile].slice(0, 3),
          imageBases64: [...character.imageBases64, croppedImageBase64].slice(0, 3),
        });
      }
    } else {
      onCharacterChange({ ...character, images: [croppedFile], imageBases64: [croppedImageBase64] });
    }
    setIsCropperOpen(false);
    setImageToCrop(null);
  };

  const handleClearImage = (indexToRemove: number) => {
    const newImages = character.images.filter((_, i) => i !== indexToRemove);
    const newBase64s = character.imageBases64.filter((_, i) => i !== indexToRemove);
    onCharacterChange({ ...character, images: newImages, imageBases64: newBase64s });
  };

  const handleRecropImage = (index: number) => {
    const base64 = character.imageBases64[index];
    setImageToCrop({ dataUrl: `data:image/jpeg;base64,${base64}`, originalName: character.images[index]?.name || 'image.jpg', index });
    setIsCropperOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCharacterChange({ ...character, name: e.target.value });
    if (isMain && onManualEdit) onManualEdit();
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const nameLabel = character.type === 'person' ? t('اسم الشخصية', "Character's Name") : t('اسم الشيء (لعبة، بطانية..)', "Object's Name (toy, blanket..)");
  const uploadText = isMain ? t('اضغط لرفع صور البطل (حتى 3)', 'Upload hero photos (up to 3)') : t('ارفع صورة أو انقر للتغيير', 'Upload an image or click to change');

  return (
    <>
      {isCropperOpen && imageToCrop && (
        <ImageCropModal imageSrc={imageToCrop.dataUrl} onCropComplete={handleCropComplete} onClose={() => { setIsCropperOpen(false); setImageToCrop(null); }} language={language} />
      )}
      <div className="glass-panel p-6 rounded-[2rem] space-y-6 animate-enter-forward overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-brand-navy/5 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <span className="material-symbols-outlined">{isMain ? 'face' : 'toys'}</span>
             </div>
             <h3 className="text-xl font-bold text-brand-navy">{label}</h3>
          </div>
          {isMain && character.images.length > 0 && (
            <span className="text-[10px] font-black text-brand-teal uppercase bg-brand-teal/10 px-3 py-1 rounded-full">
              {character.images.length}/3 {t('صور', 'Photos')}
            </span>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor={`characterName-${label}`} className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.2em] mb-2">{nameLabel}</label>
            <input 
              type="text" 
              id={`characterName-${label}`} 
              value={character.name} 
              onChange={handleNameChange} 
              className="block w-full px-5 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white focus:border-brand-orange transition-all outline-none text-brand-navy font-bold text-lg" 
              placeholder={t('أدخل الاسم هنا...', 'Enter name here...')} 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-[0.2em] mb-3">{t('صورة الشخصية', "Character's Image")}</label>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {character.imageBases64.map((base64, index) => (
                <div key={index} className="relative aspect-square group cursor-pointer" onClick={() => handleRecropImage(index)}>
                  <div className="absolute inset-0 bg-brand-orange/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img src={`data:image/jpeg;base64,${base64}`} alt={`Preview ${index + 1}`} className="w-full h-full rounded-2xl object-cover border-2 border-white shadow-lg group-hover:scale-[1.02] transition-all relative z-10" />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleClearImage(index); }} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 transition-colors z-20"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(isMain ? character.images.length < 3 : character.images.length < 1) && (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-brand-navy/10 rounded-2xl bg-white/30 hover:bg-white hover:border-brand-orange hover:text-brand-orange transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="material-symbols-outlined text-3xl text-brand-navy/20 group-hover:text-brand-orange transition-colors">add_a_photo</span>
                  <span className="text-[10px] font-black uppercase mt-2 opacity-50 group-hover:opacity-100">{t('إضافة', 'Add')}</span>
                </button>
              )}
            </div>

            {character.images.length === 0 && (
              <div 
                className="flex flex-col items-center justify-center text-center p-10 border-2 border-brand-navy/5 border-dashed rounded-[2rem] cursor-pointer bg-white/20 hover:bg-white/40 hover:border-brand-orange/30 transition-all group" 
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-3xl text-brand-orange">upload</span>
                </div>
                <p className="text-sm font-bold text-brand-navy/80 group-hover:text-brand-orange transition-colors">{uploadText}</p>
                <p className="text-[11px] font-medium text-brand-navy/40 mt-2 max-w-[80%] leading-relaxed">
                  {t('يرجى التأكد من رفع صورة أمامية واضحة للوجه لضمان أفضل جودة.', 'Please ensure you upload a clear, front-facing photo for the best quality.')}
                </p>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
        </div>
      </div>
    </>
  );
};
