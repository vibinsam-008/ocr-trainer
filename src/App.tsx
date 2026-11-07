/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DatasetManager } from './components/DatasetManager';
import { InferenceTab } from './components/InferenceTab';
import { HistoryTab } from './components/HistoryTab';
import { TrainingPair } from './types/edraw';
import { getStoredTrainingPairs, HistoryItem } from './utils/storage';
import { INITIAL_TRAINING_PAIRS } from './data/defaultPairs';

export default function App() {
  const [activeTab, setActiveTab] = useState<'manager' | 'inference' | 'history'>('manager');
  const [pairs, setPairs] = useState<TrainingPair[]>(INITIAL_TRAINING_PAIRS);
  const [selectedPairForInference, setSelectedPairForInference] = useState<TrainingPair | null>(null);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  // Initialize pairs from IndexedDB
  useEffect(() => {
    async function initPairs() {
      try {
        const stored = await getStoredTrainingPairs();
        if (stored && stored.length > 0) {
          setPairs(stored);
        }
      } catch (err) {
        console.error('Failed to load pairs from storage:', err);
      } finally {
        setLoadedFromStorage(true);
      }
    }
    initPairs();
  }, []);

  const handleSelectForInference = (pair: TrainingPair) => {
    setSelectedPairForInference(pair);
    setActiveTab('inference');
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    // Switch to inference with the historical image & result
    setActiveTab('inference');
  };

  const activePairsCount = pairs.filter((p) => p.isActiveFewShot).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePairsCount={activePairsCount}
        totalPairsCount={pairs.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {activeTab === 'manager' && (
          <DatasetManager
            pairs={pairs}
            setPairs={setPairs}
            onSelectForInference={handleSelectForInference}
          />
        )}

        {activeTab === 'inference' && (
          <InferenceTab
            pairs={pairs}
            selectedPairForInference={selectedPairForInference}
            onClearSelectedPair={() => setSelectedPairForInference(null)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab onLoadHistoryItem={handleLoadHistoryItem} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Edraw Diagram OCR &amp; Structure Trainer</span>
            <span>·</span>
            <span>Multimodal Few-Shot Context Engine</span>
            <span>·</span>
            <span>Zero-Temperature Deterministic OCR</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>EdrawMax .edx.json</span>
            <span>·</span>
            <span>Tabular CSV</span>
            <span>·</span>
            <span>XML Topology</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
