
import React, { useState } from 'react';
import type { WorkflowLog } from '../types';

interface WorkflowDebuggerProps {
    logs: WorkflowLog[];
    onClose: () => void;
}

export const WorkflowDebugger: React.FC<WorkflowDebuggerProps> = ({ logs, onClose }) => {
    const [selectedLog, setSelectedLog] = useState<WorkflowLog | null>(null);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-slate-900 w-full h-full max-w-6xl rounded-xl border border-slate-700 flex overflow-hidden shadow-2xl">

                {/* Sidebar List */}
                <div className="w-1/3 border-r border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                        <h2 className="text-white font-bold text-lg">Workflow Stages</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {logs.map((log, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedLog(log)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedLog === log
                                        ? 'bg-blue-600 border-blue-400 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm uppercase">{log.stage}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {log.status}
                                    </span>
                                </div>
                                <div className="text-xs opacity-60 font-mono">
                                    {log.durationMs}ms
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content (JSON Viewer) */}
                <div className="w-2/3 flex flex-col bg-slate-950">
                    {selectedLog ? (
                        <>
                            <div className="p-4 border-b border-slate-800 bg-slate-900">
                                <h3 className="text-white font-bold">{selectedLog.stage} Output</h3>
                            </div>
                            <div className="flex-1 p-4 overflow-auto">
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    <div className="flex flex-col h-full">
                                        <span className="text-xs text-slate-500 mb-2 font-mono">INPUTS</span>
                                        <pre className="flex-1 bg-black/50 p-4 rounded-lg text-xs text-green-400 font-mono overflow-auto border border-green-900/30">
                                            {JSON.stringify(selectedLog.inputs, null, 2)}
                                        </pre>
                                    </div>
                                    <div className="flex flex-col h-full">
                                        <span className="text-xs text-slate-500 mb-2 font-mono">OUTPUTS</span>
                                        <pre className="flex-1 bg-black/50 p-4 rounded-lg text-xs text-blue-400 font-mono overflow-auto border border-blue-900/30">
                                            {JSON.stringify(selectedLog.outputs, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600">
                            Select a stage to view details
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
