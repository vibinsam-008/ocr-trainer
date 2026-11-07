/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  RotateCw,
  Crop,
  Sun,
  Contrast,
  Check,
  RotateCcw,
  ZoomIn,
  SplitSquareVertical,
  Activity
} from 'lucide-react';
import { CanvasPreprocessorOptions } from '../types/edraw';
import { processImageOnCanvas, HistogramData } from '../utils/imageProcessing';

interface CanvasPreprocessorProps {
  sourceImageUrl: string;
  onProcessedChange: (dataUrl: string) => void;
  options: CanvasPreprocessorOptions;
  setOptions: React.Dispatch<React.SetStateAction<CanvasPreprocessorOptions>>;
}

export const CanvasPreprocessor: React.FC<CanvasPreprocessorProps> = ({
  sourceImageUrl,
  onProcessedChange,
  options,
  setOptions,
}) => {
  const [splitPosition, setSplitPosition] = useState(50); // percentage for before/after split slider
  const [isComparing, setIsComparing] = useState(true);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [currentCrop, setCurrentCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [histogram, setHistogram] = useState<HistogramData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Render processed image
  const updateProcessing = useCallback(() => {
    if (!imageElementRef.current) return;
    try {
      const { canvas, dataUrl, histogram: hist } = processImageOnCanvas(imageElementRef.current, options);
      setHistogram(hist);
      onProcessedChange(dataUrl);

      // Render to visible canvas
      if (canvasRef.current) {
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Image processing failed:', err);
    }
  }, [options, onProcessedChange]);

  // Load source image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      updateProcessing();
    };
    img.src = sourceImageUrl;
  }, [sourceImageUrl, updateProcessing]);

  // Re-run when options change
  useEffect(() => {
    if (imageElementRef.current) {
      updateProcessing();
    }
  }, [options, updateProcessing]);

  // Draw histogram
  useEffect(() => {
    if (!histogram || !histCanvasRef.current) return;
    const canvas = histCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxVal = Math.max(...histogram.luma, 1);
    const w = canvas.width;
    const h = canvas.height;
    const barWidth = w / 256;

    // Draw background grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    // Draw luminance bars
    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < 256; i++) {
      const barHeight = (histogram.luma[i] / maxVal) * (h - 2);
      ctx.fillRect(i * barWidth, h - barHeight, barWidth + 0.5, barHeight);
    }
  }, [histogram]);

  // Quick preset actions
  const handleAutoContrastToggle = () => {
    setOptions((prev) => ({
      ...prev,
      autoContrast: !prev.autoContrast,
      contrast: !prev.autoContrast ? 20 : 0,
    }));
  };

  const handleSharpenToggle = () => {
    setOptions((prev) => ({
      ...prev,
      // Cycle: 0 -> 2 (2x) -> 3 (3x) -> 0
      sharpening: prev.sharpening === 2 ? 3 : prev.sharpening === 3 ? 0 : 2,
    }));
  };

  const handleRotate = () => {
    setOptions((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleReset = () => {
    setOptions({
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
    setCurrentCrop(null);
    setIsCropping(false);
  };

  // Crop interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCropStart({ x, y });
    setCurrentCrop({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStart || !containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const x = Math.min(cropStart.x, currentX);
    const y = Math.min(cropStart.y, currentY);
    const width = Math.abs(currentX - cropStart.x);
    const height = Math.abs(currentY - cropStart.y);

    setCurrentCrop({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isCropping || !currentCrop) return;
    if (currentCrop.width > 20 && currentCrop.height > 20) {
      setOptions((prev) => ({ ...prev, crop: currentCrop }));
    }
    setCropStart(null);
    setIsCropping(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Control Toolbar */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950 border border-blue-800/80 text-blue-300 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Image Canvas Preprocessor</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Optimizes diagram contrast, line sharpness & edges for high-accuracy Gemini OCR
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Auto Contrast Button */}
          <button
            onClick={handleAutoContrastToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              options.autoContrast
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Auto-stretch luminance histogram to improve faint lines"
          >
            <Contrast className="w-3.5 h-3.5" />
            <span>Auto-Contrast: {options.autoContrast ? 'ON' : 'OFF'}</span>
          </button>

          {/* 2x Sharpening Button */}
          <button
            onClick={handleSharpenToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              options.sharpening > 0
                ? 'bg-emerald-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Apply 3x3 convolution unsharp mask kernel to enhance pencil lines & subscripts"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sharpening: {options.sharpening === 0 ? 'OFF' : `${options.sharpening}x`}</span>
          </button>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Rotate 90 degrees clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{options.rotation}°</span>
          </button>

          {/* Crop Mode */}
          <button
            onClick={() => setIsCropping(!isCropping)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              isCropping || options.crop
                ? 'bg-amber-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Interactive bounding-box crop tool"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{options.crop ? 'Cropped' : isCropping ? 'Drag Box' : 'Crop Area'}</span>
          </button>

          {/* Before / After Split Slider Toggle */}
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              isComparing
                ? 'bg-purple-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle interactive split slider to compare original scan vs preprocessed image"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
            title="Reset preprocessor sliders"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport with Split Comparison Slider */}
      <div className="relative bg-slate-950 flex items-center justify-center min-h-[380px] max-h-[500px] overflow-hidden p-4 select-none">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative max-w-full max-h-[460px] flex items-center justify-center cursor-crosshair overflow-hidden rounded-lg shadow-inner"
        >
          {/* Base Processed Canvas */}
          <canvas
            ref={canvasRef}
            className="max-h-[450px] max-w-full object-contain block bg-white"
          />

          {/* If Split Comparing: Render Original Image Overlay clipped to split percentage */}
          {isComparing && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ width: `${splitPosition}%` }}
            >
              <img
                src={sourceImageUrl}
                alt="Original"
                className="max-h-[450px] max-w-none object-contain block bg-white"
                style={{
                  width: canvasRef.current?.offsetWidth || '100%',
                  height: canvasRef.current?.offsetHeight || '100%',
                }}
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono border border-white/20">
                Original Scan
              </div>
            </div>
          )}

          {/* Split Slider Handle */}
          {isComparing && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${splitPosition}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startSplit = splitPosition;
                const containerW = containerRef.current?.clientWidth || 500;

                const handleDrag = (moveEv: MouseEvent) => {
                  const delta = moveEv.clientX - startX;
                  const newPercent = Math.min(95, Math.max(5, startSplit + (delta / containerW) * 100));
                  setSplitPosition(newPercent);
                };

                const handleStop = () => {
                  window.removeEventListener('mousemove', handleDrag);
                  window.removeEventListener('mouseup', handleStop);
                };

                window.addEventListener('mousemove', handleDrag);
                window.addEventListener('mouseup', handleStop);
              }}
            >
              <div className="w-5 h-5 -ml-2 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          )}

          {/* Processed Label */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-mono border border-blue-400/40 pointer-events-none">
            2x Enhanced Canvas
          </div>

          {/* Crop Rectangle Overlay */}
          {isCropping && currentCrop && (
            <div
              className="absolute border-2 border-amber-400 bg-amber-400/20 pointer-events-none"
              style={{
                left: `${(currentCrop.x / (canvasRef.current?.width || 1)) * 100}%`,
                top: `${(currentCrop.y / (canvasRef.current?.height || 1)) * 100}%`,
                width: `${(currentCrop.width / (canvasRef.current?.width || 1)) * 100}%`,
                height: `${(currentCrop.height / (canvasRef.current?.height || 1)) * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Advanced Tuners & Histogram Drawer */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Contrast Slider */}
        <div>
          <div className="flex items-center justify-between mb-1 text-slate-300">
            <span className="flex items-center gap-1">
              <Contrast className="w-3 h-3 text-blue-400" />
              Contrast
            </span>
            <span className="font-mono text-slate-400">{options.contrast}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            value={options.contrast}
            onChange={(e) => setOptions({ ...options, contrast: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Brightness Slider */}
        <div>
          <div className="flex items-center justify-between mb-1 text-slate-300">
            <span className="flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              Brightness
            </span>
            <span className="font-mono text-slate-400">{options.brightness}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={options.brightness}
            onChange={(e) => setOptions({ ...options, brightness: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600"
          />
        </div>

        {/* High-Contrast Thresholding */}
        <div>
          <div className="flex items-center justify-between mb-1 text-slate-300">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={options.thresholding}
                onChange={(e) => setOptions({ ...options, thresholding: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-blue-600"
              />
              <span>Binarize / Ink Threshold</span>
            </label>
            {options.thresholding && (
              <span className="font-mono text-slate-400">{options.thresholdValue}</span>
            )}
          </div>
          <input
            type="range"
            min="50"
            max="220"
            disabled={!options.thresholding}
            value={options.thresholdValue}
            onChange={(e) => setOptions({ ...options, thresholdValue: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600 disabled:opacity-40"
          />
        </div>

        {/* Histogram Mini Visualizer */}
        <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Luma Histogram
            </span>
            <span className="font-mono text-[10px]">0 - 255</span>
          </div>
          <canvas ref={histCanvasRef} width={256} height={32} className="w-full h-8 block rounded" />
        </div>
      </div>
    </div>
  );
};
