/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Play,
  FileCode,
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { HistoryItem, getOcrHistory, clearOcrHistory } from '../utils/storage';
import { EdrawOcrResult } from '../types/edraw';
import { generateEdrawJson, generateEdrawCsv, downloadFile } from '../utils/exporter';

interface HistoryTabProps {
  onLoadHistoryItem: (item: HistoryItem) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onLoadHistoryItem }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const items = await getOcrHistory();
    setHistoryItems(items);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (confirm('Clear all OCR history records?')) {
      await clearOcrHistory();
      setHistoryItems([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Inference History & Verification Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Past diagrams extracted with few-shot context, stored permanently in IndexedDB.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading history records...</div>
      ) : historyItems.length === 0 ? (
        <div className="p-12 border border-slate-800 rounded-xl bg-slate-900/40 text-center flex flex-col items-center justify-center">
          <History className="w-8 h-8 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300 mb-1">No OCR History Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Diagrams processed in the &quot;OCR &amp; Canvas Inference&quot; tab will automatically appear here with their
            full extracted variables, confidence scores, and export files.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyItems.map((item) => {
            const res = item.result;
            const vars = res.engineeringVariables;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono text-[10px]">
                      {Math.round((res.verification?.overallConfidence || 0.95) * 100)}% Conf
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-1">
                    {res.metadata?.title || item.imageName}
                  </h3>

                  {/* Image Thumbnail */}
                  <div className="h-32 rounded-lg bg-white/5 border border-slate-800 overflow-hidden mb-3 flex items-center justify-center p-1">
                    <img
                      src={item.imageUrl}
                      alt={item.imageName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Variables */}
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-300 mb-3 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[9px]">TL:</span>
                      <strong className="text-blue-400">{vars.TL ?? '—'}mm</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FV:</span>
                      <strong className="text-emerald-400">{vars.FV ?? '—'}mm</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">TV:</span>
                      <strong className="text-emerald-400">{vars.TV ?? '—'}mm</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">θ:</span>
                      <strong className="text-amber-400">{vars.theta ?? '—'}°</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Ø:</span>
                      <strong className="text-amber-400">{vars.phi ?? '—'}°</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">DBEP:</span>
                      <strong className="text-purple-400">{vars.DBEP ?? '—'}mm</strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const jsonStr = generateEdrawJson(res);
                        downloadFile(jsonStr, `${item.imageName}_edraw.json`, 'application/json');
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Export JSON"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => {
                        const csvStr = generateEdrawCsv(res);
                        downloadFile(csvStr, `${item.imageName}_elements.csv`, 'text/csv');
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Export CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>

                  <button
                    onClick={() => onLoadHistoryItem(item)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Open in Inspector</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
