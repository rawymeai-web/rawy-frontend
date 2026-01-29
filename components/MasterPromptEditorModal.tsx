
import React, { useState, useEffect } from 'react';
import * as promptService from '../services/promptService';
import { Button } from './Button';

interface MasterPromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditorSection: React.FC<{
    title: string;
    description: string;
    version: string;
    onVersionChange: (version: string) => void;
    template: string;
    onTemplateChange: (template: string) => void;
    className?: string;
}> = ({ title, description, version, onVersionChange, template, onTemplateChange, className }) => (
    <div className={`flex flex-col h-[450px] bg-gray-50 rounded-xl p-4 border border-gray-200 ${className}`}>
        <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
            <div>
                <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-tight">{description}</p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2">
                <label htmlFor={`${title}-version`} className="text-[10px] font-bold text-gray-400 uppercase">Version</label>
                <input
                    id={`${title}-version`}
                    type="text"
                    value={version}
                    onChange={(e) => onVersionChange(e.target.value)}
                    className="w-16 px-2 py-1 font-mono text-xs bg-white text-gray-800 rounded border border-gray-300 focus:ring-brand-coral focus:border-brand-coral text-center"
                />
            </div>
        </div>
        <textarea
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="flex-grow w-full p-3 font-mono text-xs bg-white text-gray-800 rounded-md border border-gray-300 resize-none focus:ring-brand-coral focus:border-brand-coral leading-relaxed"
            aria-label={`${title} prompt editor`}
        />
    </div>
);


export const MasterPromptEditorModal: React.FC<MasterPromptEditorModalProps> = ({ isOpen, onClose }) => {
  const [prompts, setPrompts] = useState<promptService.PromptTemplates>(promptService.defaultPrompts);
  
  useEffect(() => {
    if (isOpen) {
      setPrompts(promptService.getPrompts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    promptService.savePrompts(prompts);
    alert('Master prompts saved!');
    onClose();
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Are you sure you want to restore all prompts to their default values?')) {
      promptService.savePrompts(promptService.defaultPrompts);
      setPrompts(promptService.defaultPrompts);
    }
  };

  const handleDownload = () => {
    // Add UI labels to the export so the user knows which prompt is which
    const exportData = {
        metadata: {
            description: "Rawy Master Prompts Export",
            exportedAt: new Date().toISOString(),
        },
        prompts: {
            characterExtractionPrompt: { 
                ...prompts.characterExtractionPrompt, 
                _uiLabel: "Analysis: Character Extraction (Vision)" 
            },
            coverSuperPrompt: { 
                ...prompts.coverSuperPrompt, 
                _uiLabel: "Method 1: Cover Prompt (Reference Sheet)" 
            },
            insideSuperPrompt: { 
                ...prompts.insideSuperPrompt, 
                _uiLabel: "Method 1: Spread Prompt (Reference Sheet)" 
            },
            directMethodCoverPrompt: { 
                ...prompts.directMethodCoverPrompt, 
                _uiLabel: "Method 2: Cover Prompt (Direct Structured)" 
            },
            directMethodSpreadPrompt: { 
                ...prompts.directMethodSpreadPrompt, 
                _uiLabel: "Method 2: Spread Prompt (Direct Structured)" 
            },
            directMethodSimplePrompt: { 
                ...prompts.directMethodSimplePrompt, 
                _uiLabel: "Method 3: Simple Prompt (Direct Simple)" 
            },
            method4CoverPrompt: {
                ...prompts.method4CoverPrompt,
                _uiLabel: "Method 4: Cover Prompt (Direct Style Transformation)"
            },
            method4SpreadPrompt: {
                ...prompts.method4SpreadPrompt,
                _uiLabel: "Method 4: Spread Prompt (Direct Style Transformation)"
            }
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rawy_prompts_v${prompts.coverSuperPrompt.version}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[95vw] h-[95vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">Master Generation Prompts</h2>
            <p className="text-sm text-gray-500 mt-1">
                Edit the core "super prompts". Variables like <strong>{'{style_prompt}'}</strong> are dynamically replaced.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-4xl leading-none">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                
                {/* Column 1: Analysis */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-brand-navy/10">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <h3 className="text-lg font-bold text-brand-navy">Analysis Phase</h3>
                    </div>
                    <EditorSection
                        title="Character Extraction"
                        description="Analyzes source photo to build text description."
                        version={prompts.characterExtractionPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, characterExtractionPrompt: { ...p.characterExtractionPrompt, version: v } }))}
                        template={prompts.characterExtractionPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, characterExtractionPrompt: { ...p.characterExtractionPrompt, template: v } }))}
                    />
                </div>

                {/* Column 2: Method 1 */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-brand-navy/10">
                        <div className="w-3 h-3 rounded-full bg-brand-coral"></div>
                        <h3 className="text-lg font-bold text-brand-navy">Method 1 (Ref Sheet)</h3>
                    </div>
                    <EditorSection
                        title="Method 1: Cover"
                        description="Uses generated Character Sheet."
                        version={prompts.coverSuperPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, coverSuperPrompt: { ...p.coverSuperPrompt, version: v } }))}
                        template={prompts.coverSuperPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, coverSuperPrompt: { ...p.coverSuperPrompt, template: v } }))}
                    />
                    <EditorSection
                        title="Method 1: Spread"
                        description="Uses generated Character Sheet."
                        version={prompts.insideSuperPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, insideSuperPrompt: { ...p.insideSuperPrompt, version: v } }))}
                        template={prompts.insideSuperPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, insideSuperPrompt: { ...p.insideSuperPrompt, template: v } }))}
                    />
                </div>

                {/* Column 3: Method 2 */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-brand-navy/10">
                        <div className="w-3 h-3 rounded-full bg-brand-teal"></div>
                        <h3 className="text-lg font-bold text-brand-navy">Method 2 (Structured)</h3>
                    </div>
                    <EditorSection
                        title="Method 2: Cover"
                        description="Direct photo + detailed structure."
                        version={prompts.directMethodCoverPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, directMethodCoverPrompt: { ...p.directMethodCoverPrompt, version: v } }))}
                        template={prompts.directMethodCoverPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, directMethodCoverPrompt: { ...p.directMethodCoverPrompt, template: v } }))}
                    />
                    <EditorSection
                        title="Method 2: Spread"
                        description="Direct photo + detailed structure."
                        version={prompts.directMethodSpreadPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, directMethodSpreadPrompt: { ...p.directMethodSpreadPrompt, version: v } }))}
                        template={prompts.directMethodSpreadPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, directMethodSpreadPrompt: { ...p.directMethodSpreadPrompt, template: v } }))}
                    />
                </div>

                {/* Column 4: Method 3 */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-brand-navy/10">
                        <div className="w-3 h-3 rounded-full bg-brand-yellow"></div>
                        <h3 className="text-lg font-bold text-brand-navy">Method 3 (Simple)</h3>
                    </div>
                    <EditorSection
                        title="Method 3: Universal"
                        description="Direct photo + creative freedom."
                        version={prompts.directMethodSimplePrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, directMethodSimplePrompt: { ...p.directMethodSimplePrompt, version: v } }))}
                        template={prompts.directMethodSimplePrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, directMethodSimplePrompt: { ...p.directMethodSimplePrompt, template: v } }))}
                    />
                </div>

                {/* Column 5: Method 4 */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-brand-navy/10">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <h3 className="text-lg font-bold text-brand-navy">Method 4 (Style Trans)</h3>
                    </div>
                    <EditorSection
                        title="Method 4: Cover"
                        description="Direct Photo + Strict Style Integration."
                        version={prompts.method4CoverPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, method4CoverPrompt: { ...p.method4CoverPrompt, version: v } }))}
                        template={prompts.method4CoverPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, method4CoverPrompt: { ...p.method4CoverPrompt, template: v } }))}
                    />
                    <EditorSection
                        title="Method 4: Spread"
                        description="Direct Photo + Strict Style Integration."
                        version={prompts.method4SpreadPrompt.version}
                        onVersionChange={(v) => setPrompts(p => ({ ...p, method4SpreadPrompt: { ...p.method4SpreadPrompt, version: v } }))}
                        template={prompts.method4SpreadPrompt.template}
                        onTemplateChange={(v) => setPrompts(p => ({ ...p, method4SpreadPrompt: { ...p.method4SpreadPrompt, template: v } }))}
                    />
                </div>

            </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center flex-shrink-0 pt-4 border-t border-gray-200">
          <div className="flex gap-4">
             <Button type="button" variant="outline" onClick={handleRestoreDefaults}>
                Restore Defaults
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload} className="text-brand-navy border-brand-navy hover:bg-brand-navy hover:text-white">
                Download JSON
            </Button>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Prompts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
