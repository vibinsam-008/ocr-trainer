/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Layers,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import { TrainingPair, EdrawOcrResult, CanvasPreprocessorOptions } from '../types/edraw';
import { CanvasPreprocessor } from './CanvasPreprocessor';
import { InspectionOverlay } from './InspectionOverlay';
import { ResultsViewer } from './ResultsViewer';
import { saveOcrHistory } from '../utils/storage';

interface InferenceTabProps {
  pairs: TrainingPair[];
  selectedPairForInference: TrainingPair | null;
  onClearSelectedPair: () => void;
}

export const InferenceTab: React.FC<InferenceTabProps> = ({
  pairs,
  selectedPairForInference,
  onClearSelectedPair,
}) => {
  // Source image
  const [sourceImage, setSourceImage] = useState<string | null>(
    selectedPairForInference?.eUrl || pairs[3]?.eUrl || '/assets/aistudio/e4_9d65bed8.PNG'
  );
  const [imageName, setImageName] = useState<string>(
    selectedPairForInference?.name || pairs[3]?.name || 'Sample Q3.1 Line AB'
  );

  // Preprocessor options
  const [preprocessorOptions, setPreprocessorOptions] = useState<CanvasPreprocessorOptions>({
    contrast: 15,
    brightness: 0,
    sharpening: 2,
    autoContrast: true,
    invertColors: false,
    thresholding: false,
    thresholdValue: 128,
    zoom: 1.0,
    rotation: 0,
    crop: null,
  });

  const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null);
  const [usePreprocessor, setUsePreprocessor] = useState(true);
  const [showPreprocessorPanel, setShowPreprocessorPanel] = useState(true);

  // Model & Execution state
  const [selectedModel, setSelectedModel] = useState<'gemini-flash-latest' | 'gemini-3.8-flash'>('gemini-flash-latest');
  const [promptAddition, setPromptAddition] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<EdrawOcrResult | null>(null);

  // Selected & Hovered element IDs for overlay-inspector sync
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active few-shot pairs
  const activePairs = pairs.filter((p) => p.isActiveFewShot);

  // Handle image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setSourceImage(reader.result as string);
        setOcrResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Inference
  const handleRunOcr = async () => {
    const targetImage = usePreprocessor && processedImageDataUrl ? processedImageDataUrl : sourceImage;
    if (!targetImage) {
      setError('Please select or upload a diagram image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep('Assembling 14-pair multimodal few-shot training context...');

    try {
      setLoadingStep('Transmitting 2x preprocessed canvas to Gemini API...');

      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: targetImage,
          fewShotPairs: activePairs,
          model: selectedModel,
          promptAddition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      setLoadingStep('Parsing structured JSON & verifying trigonometric relations...');
      const data: EdrawOcrResult = await response.json();
      setOcrResult(data);

      // Save to history
      await saveOcrHistory({
        id: `ocr_${Date.now()}`,
        timestamp: Date.now(),
        imageName: imageName || 'Diagram',
        imageUrl: targetImage,
        result: data,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'OCR Analysis encountered an error.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight">
              High-Accuracy Edraw OCR & Structural Inference
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono">
              Temperature: 0.0 (Deterministic)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Preprocesses image canvas (2x sharpening, auto-contrast, crop) and calls Gemini with active few-shot
            pairs in prompt context.
          </p>
        </div>

        {/* Quick Sample Diagram Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400">Quick Samples:</span>
          {pairs.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSourceImage(p.eUrl);
                setImageName(p.name);
                setOcrResult(null);
                setError(null);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                sourceImage === p.eUrl
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Pair #{p.id}
            </button>
          ))}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Upload Diagram</span>
          </button>
        </div>
      </div>

      {/* Canvas Preprocessor Collapsible Section */}
      {sourceImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setShowPreprocessorPanel(!showPreprocessorPanel)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Canvas Preprocessor & 2x Sharpening Engine</span>
              {showPreprocessorPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={usePreprocessor}
                onChange={(e) => setUsePreprocessor(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600"
              />
              <span>Send 2x Preprocessed Canvas to Gemini</span>
            </label>
          </div>

          {showPreprocessorPanel && (
            <CanvasPreprocessor
              sourceImageUrl={sourceImage}
              onProcessedChange={(url) => setProcessedImageDataUrl(url)}
              options={preprocessorOptions}
              setOptions={setPreprocessorOptions}
            />
          )}
        </div>
      )}

      {/* Inference Controls Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Model selector */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Gemini Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'gemini-flash-latest' | 'gemini-3.8-flash')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="gemini-flash-latest">gemini-flash-latest (Temp: 0.0)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Reasoning)</option>
            </select>
          </div>

          {/* Few-Shot Context status */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Few-Shot Context</label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">{activePairs.length} Pairs</span>
              <span className="text-slate-500">In-Prompt</span>
            </div>
          </div>

          {/* Prompt addition */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] text-slate-400 mb-1">Extra Focus Notes (Optional)</label>
            <input
              type="text"
              value={promptAddition}
              onChange={(e) => setPromptAddition(e.target.value)}
              placeholder="e.g. Focus on end projector distance DBEP or locus lines..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleRunOcr}
          disabled={isLoading || !sourceImage}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{loadingStep || 'Processing OCR...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run High-Accuracy Edraw OCR</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Inference Error:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Side-by-Side Output & Inspection View */}
      {sourceImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left / Center: Interactive Diagram Overlay */}
          <div className="h-[640px]">
            <InspectionOverlay
              imageUrl={usePreprocessor && processedImageDataUrl ? processedImageDataUrl : sourceImage}
              result={ocrResult}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              hoveredElementId={hoveredElementId}
              onHoverElement={setHoveredElementId}
            />
          </div>

          {/* Right: Structured Inspector & Export */}
          <div className="h-[640px]">
            {ocrResult ? (
              <ResultsViewer
                result={ocrResult}
                processedImageDataUrl={processedImageDataUrl || undefined}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                hoveredElementId={hoveredElementId}
                onHoverElement={setHoveredElementId}
              />
            ) : (
              <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400 mb-4">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ready for High-Accuracy OCR</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Click &quot;Run High-Accuracy Edraw OCR&quot; above to extract character-accurate text, separate &apos;e&apos; diagram
                  shapes from &apos;s&apos; annotations, verify trigonometric geometry, and export to Edraw JSON, CSV, or XML.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Multimodal Few-Shot Context:</span>
                  <span className="text-emerald-400 font-semibold">{activePairs.length} Pairs Ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
