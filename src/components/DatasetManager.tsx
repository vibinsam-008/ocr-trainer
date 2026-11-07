/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  FolderArchive,
  RotateCcw,
  Download,
  Edit3,
  CheckCircle2,
  XCircle,
  Play,
  Search,
  Plus,
  Trash2,
  Eye,
  X,
  FileText,
  Sliders,
  Check
} from 'lucide-react';
import { TrainingPair } from '../types/edraw';
import {
  saveTrainingPair,
  saveAllTrainingPairs,
  deleteTrainingPair,
  resetTrainingPairsToDefault
} from '../utils/storage';

interface DatasetManagerProps {
  pairs: TrainingPair[];
  setPairs: React.Dispatch<React.SetStateAction<TrainingPair[]>>;
  onSelectForInference: (pair: TrainingPair) => void;
}

export const DatasetManager: React.FC<DatasetManagerProps> = ({
  pairs,
  setPairs,
  onSelectForInference,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingPair, setEditingPair] = useState<TrainingPair | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Filter pairs
  const filteredPairs = pairs.filter((pair) => {
    const matchesSearch =
      pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.problemText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pair.shapesSummary && pair.shapesSummary.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterActive === 'active') return pair.isActiveFewShot;
    if (filterActive === 'inactive') return !pair.isActiveFewShot;
    return true;
  });

  const activeCount = pairs.filter((p) => p.isActiveFewShot).length;

  // Toggle active few shot
  const handleToggleActive = async (id: number) => {
    const updated = pairs.map((p) => (p.id === id ? { ...p, isActiveFewShot: !p.isActiveFewShot } : p));
    setPairs(updated);
    const target = updated.find((p) => p.id === id);
    if (target) {
      await saveTrainingPair(target);
    }
  };

  // Toggle all
  const handleToggleAll = async (enable: boolean) => {
    const updated = pairs.map((p) => ({ ...p, isActiveFewShot: enable }));
    setPairs(updated);
    await saveAllTrainingPairs(updated);
  };

  // Reset to default 14 pairs
  const handleResetToDefault = async () => {
    if (confirm('Reset training dataset to the 14 standard verified Edraw training pairs?')) {
      const restored = await resetTrainingPairsToDefault();
      setPairs(restored);
      setUploadMessage('Dataset successfully restored to the 14 standard pairs.');
      setTimeout(() => setUploadMessage(null), 4000);
    }
  };

  // Delete pair
  const handleDeletePair = async (id: number) => {
    if (confirm(`Delete Pair #${id}?`)) {
      await deleteTrainingPair(id);
      setPairs((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Save edited pair
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPair) return;

    await saveTrainingPair(editingPair);
    setPairs((prev) => prev.map((p) => (p.id === editingPair.id ? editingPair : p)));
    setEditingPair(null);
    setUploadMessage(`Saved changes for Pair #${editingPair.id}`);
    setTimeout(() => setUploadMessage(null), 3000);
  };

  // Auto-pairing algorithm for files: matches e{N} and s{N} by number
  const processFilesForPairs = async (files: File[]) => {
    setIsUploading(true);
    setUploadMessage('Analyzing filenames and pairing e{N} and s{N} components...');

    try {
      const eMap = new Map<number, { file: File; name: string }>();
      const sMap = new Map<number, { file: File; name: string }>();
      const gMap = new Map<number, { file: File; name: string }>();

      for (const file of files) {
        const fname = file.name;
        // Match e1.png, 1/e1.png, e1_hash.png, etc.
        const eMatch = fname.match(/(?:^|[\\/]|_)e(\d+)/i);
        if (eMatch) {
          eMap.set(parseInt(eMatch[1], 10), { file, name: fname });
          continue;
        }

        // Match s1.png, 1/s1.png, s1_hash.png
        const sMatch = fname.match(/(?:^|[\\/]|_)s(\d+)/i);
        if (sMatch) {
          sMap.set(parseInt(sMatch[1], 10), { file, name: fname });
          continue;
        }

        // Match g4.png hint/steps
        const gMatch = fname.match(/(?:^|[\\/]|_)g(\d+)/i);
        if (gMatch) {
          gMap.set(parseInt(gMatch[1], 10), { file, name: fname });
          continue;
        }
      }

      // Convert file to base64 data url
      const readFileAsDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const newPairs: TrainingPair[] = [];
      const allNumbers = new Set([...eMap.keys(), ...sMap.keys()]);

      for (const num of Array.from(allNumbers).sort((a, b) => a - b)) {
        const eEntry = eMap.get(num);
        const sEntry = sMap.get(num);
        const gEntry = gMap.get(num);

        const eUrl = eEntry ? await readFileAsDataUrl(eEntry.file) : '';
        const sUrl = sEntry ? await readFileAsDataUrl(sEntry.file) : '';
        const gUrl = gEntry ? await readFileAsDataUrl(gEntry.file) : undefined;

        // Check if existing pair exists to retain annotations
        const existing = pairs.find((p) => p.id === num);

        const pairObj: TrainingPair = {
          id: num,
          name: existing?.name || `Pair ${num}: Diagram & Reference ${num}`,
          eFileName: eEntry?.name || `e${num}.PNG`,
          sFileName: sEntry?.name || `s${num}.PNG`,
          gFileName: gEntry?.name,
          eUrl: eUrl || existing?.eUrl || '',
          sUrl: sUrl || existing?.sUrl || '',
          gUrl: gUrl || existing?.gUrl,
          problemText: existing?.problemText || `Training sample problem statement for Pair #${num}`,
          engineeringVariables: existing?.engineeringVariables || {},
          shapesSummary: existing?.shapesSummary || 'Edraw orthographic projection diagram elements',
          isActiveFewShot: true,
          isCustom: true,
          createdAt: Date.now(),
        };

        newPairs.push(pairObj);
      }

      if (newPairs.length > 0) {
        // Merge with existing pairs
        const updatedPairs = [...pairs];
        for (const np of newPairs) {
          const idx = updatedPairs.findIndex((p) => p.id === np.id);
          if (idx >= 0) {
            updatedPairs[idx] = { ...updatedPairs[idx], ...np };
          } else {
            updatedPairs.push(np);
          }
        }
        updatedPairs.sort((a, b) => a.id - b.id);
        await saveAllTrainingPairs(updatedPairs);
        setPairs(updatedPairs);
        setUploadMessage(`Successfully paired and loaded ${newPairs.length} training pair(s)!`);
      } else {
        setUploadMessage('No matching e{N} and s{N} files found. Files should be named like e1.png, s1.png, etc.');
      }
    } catch (err) {
      console.error(err);
      setUploadMessage('Error processing uploaded files.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  // Handle ZIP file upload
  const handleZipUpload = async (file: File) => {
    setIsUploading(true);
    setUploadMessage('Unpacking ZIP archive and extracting training pairs...');

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const extractedFiles: File[] = [];

      for (const [filename, fileObj] of Object.entries(contents.files)) {
        if (fileObj.dir) continue;
        const lower = filename.toLowerCase();
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
          const blob = await fileObj.async('blob');
          const f = new File([blob], filename, { type: 'image/png' });
          extractedFiles.push(f);
        }
      }

      await processFilesForPairs(extractedFiles);
    } catch (err) {
      console.error(err);
      setUploadMessage('Failed to extract ZIP archive.');
      setIsUploading(false);
    }
  };

  // Drag and drop handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find((f) => f.name.toLowerCase().endsWith('.zip'));

    if (zipFile) {
      await handleZipUpload(zipFile);
    } else {
      await processFilesForPairs(files);
    }
  };

  // Export dataset as JSON
  const handleExportDatasetJson = () => {
    const dataStr = JSON.stringify(pairs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edraw_training_dataset_${pairs.length}_pairs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            14-Pair Multimodal Few-Shot Training Dataset
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Each pair consists of an input Edraw diagram (<code className="text-blue-400">e{'{N}'}.PNG</code>) and its
            ground-truth problem statement/segmented solution (<code className="text-emerald-400">s{'{N}'}.PNG</code>).
            These pairs are permanently preserved in IndexedDB and passed into Gemini&apos;s prompt context to guide
            accurate character OCR, component separation (<code className="text-blue-300">e</code> diagram vs <code className="text-emerald-300">s</code> semantic), and engineering variable extraction.
          </p>
        </div>

        {/* Global Dataset Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/png,image/jpeg,.zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                const zip = files.find((f) => f.name.endsWith('.zip'));
                if (zip) handleZipUpload(zip);
                else processFilesForPairs(files);
              }
            }}
          />
          <input
            type="file"
            ref={zipInputRef}
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleZipUpload(e.target.files[0]);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Batch Upload Files</span>
          </button>

          <button
            onClick={() => zipInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload ZIP</span>
          </button>

          <button
            onClick={handleExportDatasetJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/60 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 14 Pairs</span>
          </button>
        </div>
      </div>

      {/* Upload Drag & Drop Notification */}
      {uploadMessage && (
        <div className="p-3 bg-blue-950/70 border border-blue-800/80 rounded-lg text-xs text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{uploadMessage}</span>
          </div>
          <button onClick={() => setUploadMessage(null)} className="text-blue-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-800 hover:border-blue-600/60 rounded-xl p-6 text-center bg-slate-900/30 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Drag & drop your 14 Edraw pairs (<code className="text-blue-400">e1.png</code> & <code className="text-emerald-400">s1.png</code>) or ZIP archive here
          </p>
          <p className="text-xs text-slate-400">
            Files matching <span className="font-mono text-slate-300">e{'{N}'}</span> and <span className="font-mono text-slate-300">s{'{N}'}</span> are automatically paired by their ID number.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by pair name, variable, or text..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400">Filter:</span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterActive === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({pairs.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterActive === 'active' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Few-Shot ({activeCount})
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterActive === 'inactive' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Excluded ({pairs.length - activeCount})
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={() => handleToggleAll(true)}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline px-2 py-1"
          >
            Activate All
          </button>
          <button
            onClick={() => handleToggleAll(false)}
            className="text-xs text-slate-400 hover:text-slate-200 hover:underline px-2 py-1"
          >
            Deactivate All
          </button>
        </div>
      </div>

      {/* Pairs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredPairs.map((pair) => (
          <div
            key={pair.id}
            className={`rounded-xl border transition-all ${
              pair.isActiveFewShot
                ? 'border-slate-800 bg-slate-900/70 hover:border-blue-600/50'
                : 'border-slate-800/60 bg-slate-950/40 opacity-70 hover:opacity-100'
            } p-4 flex flex-col justify-between`}
          >
            {/* Card Header */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                    Pair #{pair.id}
                  </span>
                  <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1" title={pair.name}>
                    {pair.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(pair.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      pair.isActiveFewShot
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title={pair.isActiveFewShot ? 'Included in few-shot prompt context' : 'Excluded from prompt context'}
                  >
                    {pair.isActiveFewShot ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>In-Context</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-slate-500" />
                        <span>Excluded</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Side-by-Side Images Thumbnail Previews */}
              <div className="grid grid-cols-2 gap-2 my-3">
                {/* Diagram e{N} thumbnail */}
                <div
                  className="group relative border border-slate-800 rounded-lg overflow-hidden bg-white/5 cursor-pointer h-36 flex items-center justify-center p-1"
                  onClick={() => setPreviewImage({ url: pair.eUrl, title: `${pair.name} - Input Diagram (e${pair.id})` })}
                >
                  <img
                    src={pair.eUrl}
                    alt={`Diagram e${pair.id}`}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-950/90 text-blue-300 border border-blue-800 text-[10px] font-mono rounded">
                    e{pair.id} (Diagram)
                  </div>
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-xs text-white">
                    <Eye className="w-4 h-4" />
                    <span>View Diagram</span>
                  </div>
                </div>

                {/* Reference Statement s{N} thumbnail */}
                <div
                  className="group relative border border-slate-800 rounded-lg overflow-hidden bg-white/5 cursor-pointer h-36 flex items-center justify-center p-1"
                  onClick={() => setPreviewImage({ url: pair.sUrl, title: `${pair.name} - Segmented Reference (s${pair.id})` })}
                >
                  <img
                    src={pair.sUrl}
                    alt={`Reference s${pair.id}`}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[10px] font-mono rounded">
                    s{pair.id} (Reference)
                  </div>
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-xs text-white">
                    <Eye className="w-4 h-4" />
                    <span>View Reference</span>
                  </div>
                </div>
              </div>

              {/* Problem statement transcription */}
              <div className="mb-3">
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/50 p-2 rounded border border-slate-800/80">
                  {pair.problemText}
                </p>
              </div>

              {/* Ground-truth variables pills */}
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-300 mb-2">
                {pair.engineeringVariables.TL && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    TL: <span className="text-blue-400 font-semibold">{pair.engineeringVariables.TL}mm</span>
                  </span>
                )}
                {pair.engineeringVariables.FV && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    FV: <span className="text-emerald-400 font-semibold">{pair.engineeringVariables.FV}mm</span>
                  </span>
                )}
                {pair.engineeringVariables.TV && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    TV: <span className="text-emerald-400 font-semibold">{pair.engineeringVariables.TV}mm</span>
                  </span>
                )}
                {pair.engineeringVariables.theta !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    θ: <span className="text-amber-400 font-semibold">{pair.engineeringVariables.theta}°</span>
                  </span>
                )}
                {pair.engineeringVariables.phi !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    Ø: <span className="text-amber-400 font-semibold">{pair.engineeringVariables.phi}°</span>
                  </span>
                )}
                {pair.engineeringVariables.DBEP !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    DBEP: <span className="text-purple-400 font-semibold">{pair.engineeringVariables.DBEP}mm</span>
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditingPair(pair)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  <span>Edit Ground Truth</span>
                </button>

                {pair.isCustom && (
                  <button
                    onClick={() => handleDeletePair(pair.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete pair"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => onSelectForInference(pair)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test OCR with Diagram</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Ground Truth Modal */}
      {editingPair && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Edit Ground-Truth Annotations: Pair #{editingPair.id}
                </h3>
              </div>
              <button
                onClick={() => setEditingPair(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pair Title
                </label>
                <input
                  type="text"
                  value={editingPair.name}
                  onChange={(e) => setEditingPair({ ...editingPair, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ground-Truth Problem Statement Text
                </label>
                <textarea
                  rows={3}
                  value={editingPair.problemText}
                  onChange={(e) => setEditingPair({ ...editingPair, problemText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Variables Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">True Length (TL, mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.TL ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          TL: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Front View (FV, mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.FV ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          FV: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Top View (TV, mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.TV ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          TV: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">DBEP (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.DBEP ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          DBEP: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">θ: True Angle with HP (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.theta ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          theta: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ø: True Angle with VP (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.phi ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          phi: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">α: FV Angle (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.alpha ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          alpha: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">β: TV Angle (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPair.engineeringVariables.beta ?? ''}
                    onChange={(e) =>
                      setEditingPair({
                        ...editingPair,
                        engineeringVariables: {
                          ...editingPair.engineeringVariables,
                          beta: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Shapes & Topology Summary
                </label>
                <textarea
                  rows={2}
                  value={editingPair.shapesSummary || ''}
                  onChange={(e) => setEditingPair({ ...editingPair, shapesSummary: e.target.value })}
                  placeholder="e.g. XY axis, vertical projectors, loci, rotation arcs, answer box..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingPair.isActiveFewShot}
                    onChange={(e) => setEditingPair({ ...editingPair, isActiveFewShot: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Active in Few-Shot In-Context Training Prompt</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPair(null)}
                    className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                  >
                    Save Changes to IndexedDB
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-slate-900 p-2 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-2 px-2 text-xs text-slate-300 border-b border-slate-800">
              <span className="font-semibold">{previewImage.title}</span>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
