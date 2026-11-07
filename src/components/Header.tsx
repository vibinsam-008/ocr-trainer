/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Scan, History, Sparkles, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: 'manager' | 'inference' | 'history';
  setActiveTab: (tab: 'manager' | 'inference' | 'history') => void;
  activePairsCount: number;
  totalPairsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activePairsCount,
  totalPairsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                Edraw Diagram OCR & Trainer
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-mono">
                Gemini Multimodal Few-Shot
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-accuracy engineering graphics OCR, topology & structured export
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'manager'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dataset Manager ({totalPairsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('inference')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'inference'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>OCR & Canvas Inference</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Inference History</span>
          </button>
        </nav>

        {/* Status Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-xs">
            <span className="text-slate-400">Few-Shot Context:</span>{' '}
            <span className="font-semibold text-emerald-400 font-mono tabular-nums">
              {activePairsCount} / {totalPairsCount} Pairs Active
            </span>
          </div>
          <button
            onClick={() => setActiveTab('inference')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Diagram OCR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
