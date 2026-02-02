
import React, { useState, useEffect, useRef } from 'react';
import type { Language, StoryTheme, Character } from '../types';
import * as adminService from '../services/adminService';
import * as geminiService from '../services/geminiService';
import { ART_STYLE_OPTIONS } from '../constants';
import { Button } from './Button';
import { Spinner } from './Spinner';

// @ts-ignore
const JSZip = window.JSZip;

interface GeneratedThumbnail {
    name: string;
    imageBase64: string;
    styleName: string;
    themeName: string;
}

export const BatchThumbnailGenerator: React.FC<{ language: Language }> = ({ language }) => {
    const [seedImage, setSeedImage] = useState<{ file: File, base64: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalTasks, setTotalTasks] = useState(0);
    const [currentTask, setCurrentTask] = useState(0);
    const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                setSeedImage({ file, base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const [themes, setThemes] = useState<StoryTheme[]>([]);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        adminService.getThemes().then(setThemes);
        adminService.getSettings().then(setSettings);
    }, []);

    const runGeneration = async (mode: 'allThemes' | 'allStylesMaster' | 'allStylesForOneTheme', targetThemeId?: string) => {
        if (!seedImage || !settings) return;
        setIsGenerating(true);
        setError('');
        setThumbnails([]);
        setProgress(0);

        const delay = settings.generationDelay;
        const mockCharacter: Character = {
            name: 'Hero',
            type: 'person',
            images: [seedImage.file],
            imageBases64: [seedImage.base64],
            description: 'A cheerful generic child hero.'
        };

        let tasks: { name: string; themeDesc: string; stylePrompt: string; fileName: string; styleName: string; themeName: string }[] = [];

        if (mode === 'allThemes') {
            // Generate one per theme using that theme's assigned style
            tasks = themes.map(theme => ({
                name: theme.title.en,
                themeDesc: theme.description[language],
                // Fixed: Access visualDNA as stylePrompt has been renamed in types.ts
                stylePrompt: theme.visualDNA,
                fileName: `theme_${theme.id}.jpeg`,
                styleName: 'Default',
                themeName: theme.title.en
            }));
        } else if (mode === 'allStylesMaster') {
            // Generate all 14 styles using a GENERIC scene (best for style picker menu)
            const genericScene = "A happy child sitting on a magical glowing cloud in a beautiful sunset sky, looking at the viewer and smiling.";
            tasks = ART_STYLE_OPTIONS.map(style => ({
                name: `Style: ${style.name}`,
                themeDesc: genericScene,
                stylePrompt: style.prompt,
                fileName: `style_${style.name.replace(/\s/g, '_')}.jpeg`,
                styleName: style.name,
                themeName: 'Master Gallery'
            }));
        } else if (mode === 'allStylesForOneTheme' && targetThemeId) {
            // Generate all 14 styles for one specific story theme
            const theme = themes.find(t => t.id === targetThemeId);
            if (!theme) return;
            tasks = ART_STYLE_OPTIONS.map(style => ({
                name: `${theme.title.en} (${style.name})`,
                themeDesc: theme.description[language],
                stylePrompt: style.prompt,
                fileName: `${theme.id}_${style.name.replace(/\s/g, '_')}.jpeg`,
                styleName: style.name,
                themeName: theme.title.en
            }));
        }

        setTotalTasks(tasks.length);
        setCurrentTask(0);

        for (let i = 0; i < tasks.length; i++) {
            setCurrentTask(i + 1);
            const task = tasks[i];

            try {
                // Rate limit spacing from Admin Settings
                if (i > 0 && delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

                const { imageBase64 } = await geminiService.generateThemeStylePreview(
                    mockCharacter,
                    undefined,
                    task.themeDesc,
                    task.stylePrompt,
                    "5" // Default age for batch generation
                );

                setThumbnails(prev => [...prev, {
                    name: task.fileName,
                    imageBase64,
                    styleName: task.styleName,
                    themeName: task.themeName
                }]);
                setProgress(Math.round(((i + 1) / tasks.length) * 100));
            } catch (err: any) {
                console.error(`Failed task: ${task.name}`, err);
                setError(`Stopped at ${task.name}: ${err.message || String(err)}`);
                break;
            }
        }

        setIsGenerating(false);
    };

    const downloadZip = async () => {
        if (thumbnails.length === 0) return;
        const zip = new JSZip();
        thumbnails.forEach(t => {
            zip.file(t.name, t.imageBase64, { base64: true });
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Rawy_Thumbnails_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
                <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold text-brand-navy">Batch Thumbnail Generator</h2>
                    <p className="text-gray-500 text-sm mt-1">Create consistent thumbnails for your menus. Upload one "seed" kid photo to keep the hero the same across all previews.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">1. Upload Seed Hero Photo</label>
                        <div
                            className="aspect-square w-full max-w-[300px] border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {seedImage ? (
                                <img src={`data:image/jpeg;base64,${seedImage.base64}`} alt="Seed" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-6">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p className="text-xs text-gray-400 font-bold uppercase mt-4">Pick generic kid photo</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">Change Seed Image</div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="space-y-6">
                        <label className="block text-sm font-bold text-gray-700">2. Select Generation Type</label>

                        <div className="space-y-3">
                            <Button
                                onClick={() => runGeneration('allStylesMaster')}
                                disabled={!seedImage || isGenerating || !settings}
                                className="w-full !py-4 shadow-lg shadow-brand-coral/20"
                            >
                                Generate Style Picker (14 Art Styles)
                            </Button>
                            <p className="text-[10px] text-gray-400 italic px-2">Creates thumbnails for the art style selection menu using a generic scene.</p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => runGeneration('allThemes')}
                                disabled={!seedImage || isGenerating || !settings}
                                variant="secondary"
                                className="w-full !py-4"
                            >
                                Generate Theme Picker (All Themes)
                            </Button>
                            <p className="text-[10px] text-gray-400 italic px-2">Creates one thumbnail per story theme using the default assigned art style.</p>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-400 font-bold">Advanced: Explore One Theme</span></div>
                        </div>

                        <div className="flex gap-2">
                            <select id="themeSelector" className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 border-gray-200">
                                {themes.map(t => <option key={t.id} value={t.id}>{t.title.en}</option>)}
                            </select>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const id = (document.getElementById('themeSelector') as HTMLSelectElement).value;
                                    runGeneration('allStylesForOneTheme', id);
                                }}
                                disabled={!seedImage || isGenerating || !settings}
                                className="!px-4 !py-2 text-xs"
                            >
                                Try All Styles
                            </Button>
                        </div>
                    </div>
                </div>

                {isGenerating && (
                    <div className="bg-brand-navy p-6 rounded-2xl text-white space-y-4 animate-fade-in ring-4 ring-brand-coral/20">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-brand-coral">AI Artist at Work</p>
                                <h3 className="text-xl font-bold">Painting {currentTask} of {totalTasks}</h3>
                            </div>
                            <p className="text-3xl font-black font-mono">{progress}%</p>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden shadow-inner">
                            <div className="bg-gradient-to-r from-brand-coral to-rawy-yellow h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/60">
                            <Spinner />
                            <p className="italic">Respecting Admin Speed Settings... Do not refresh.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                {thumbnails.length > 0 && (
                    <div className="space-y-6 pt-6 border-t animate-enter-forward">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-brand-navy">Batch Results Preview ({thumbnails.length})</h3>
                            <Button onClick={downloadZip} variant="outline" className="!py-2 !px-6 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white">Download All as ZIP</Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                            {thumbnails.map((thumb, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden shadow-md border-2 border-white transition-all hover:scale-105">
                                    <img src={`data:image/jpeg;base64,${thumb.imageBase64}`} alt={thumb.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                        <p className="text-[7px] text-brand-coral font-black uppercase tracking-tighter">{thumb.styleName}</p>
                                        <p className="text-[9px] text-white font-bold leading-tight truncate">{thumb.themeName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
