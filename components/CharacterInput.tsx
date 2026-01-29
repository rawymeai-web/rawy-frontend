
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
      <div className="space-y-6 p-6 border border-brand-navy/10 rounded-3xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <div className="w-1.5 h-6 bg-brand-orange rounded-full"></div>
            {label}
          </h3>
          {isMain && character.images.length > 0 && (
            <span className="text-[10px] font-black text-brand-orange uppercase bg-brand-orange/10 px-2 py-0.5 rounded-full">
              {character.images.length}/3 {t('صور', 'Photos')}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor={`characterName-${label}`} className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">{nameLabel}</label>
            <input type="text" id={`characterName-${label}`} value={character.name} onChange={handleNameChange} className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all outline-none text-brand-navy font-bold" placeholder={t('أدخل الاسم هنا...', 'Enter name here...')} required />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('صورة الشخصية', "Character's Image")}</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {character.imageBases64.map((base64, index) => (
                <div key={index} className="relative aspect-square group cursor-pointer" onClick={() => handleRecropImage(index)}>
                  <img src={`data:image/jpeg;base64,${base64}`} alt={`Preview ${index + 1}`} className="w-full h-full rounded-2xl object-cover border-2 border-white shadow-md group-hover:ring-2 group-hover:ring-brand-orange transition-all" />
                  <div className="absolute inset-0 bg-brand-navy/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleClearImage(index); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 transition-colors z-10">&times;</button>
                </div>
              ))}
              {(isMain ? character.images.length < 3 : character.images.length < 1) && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-white hover:border-brand-orange hover:text-brand-orange transition-all group">
                  <svg className="w-8 h-8 text-gray-300 group-hover:text-brand-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-[10px] font-black uppercase mt-2 opacity-50 group-hover:opacity-100">{t('إضافة', 'Add')}</span>
                </button>
              )}
            </div>
            {character.images.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-brand-navy/5 border-dashed rounded-2xl cursor-pointer hover:bg-brand-navy/[0.02] hover:border-brand-orange/30 transition-all group" onClick={() => fileInputRef.current?.click()}>
                <div className="w-14 h-14 bg-brand-navy/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-brand-navy/40 group-hover:text-brand-orange" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p className="text-sm font-bold text-brand-navy/60 group-hover:text-brand-navy transition-colors">{uploadText}</p>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
        </div>
      </div>
    </>
  );
};
