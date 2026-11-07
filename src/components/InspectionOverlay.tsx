/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Eye,
  EyeOff,
  Crosshair,
  Info
} from 'lucide-react';
import { EdrawOcrResult, EdrawTextElement, EdrawShape } from '../types/edraw';

interface InspectionOverlayProps {
  imageUrl: string;
  result: EdrawOcrResult | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  hoveredElementId: string | null;
  onHoverElement: (id: string | null) => void;
}

export const InspectionOverlay: React.FC<InspectionOverlayProps> = ({
  imageUrl,
  result,
  selectedElementId,
  onSelectElement,
  hoveredElementId,
  onHoverElement,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Layer visibility toggles
  const [showTextBBoxes, setShowTextBBoxes] = useState(true);
  const [showEShapes, setShowEShapes] = useState(true);
  const [showSShapes, setShowSShapes] = useState(true);
  const [showConnections, setShowConnections] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(4, Math.max(0.5, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Convert 0-1000 normalized bbox to percentages
  const getBBoxStyle = (bbox: [number, number, number, number]) => {
    const ymin = bbox[0] / 10;
    const xmin = bbox[1] / 10;
    const ymax = bbox[2] / 10;
    const xmax = bbox[3] / 10;

    return {
      top: `${ymin}%`,
      left: `${xmin}%`,
      width: `${Math.max(1, xmax - xmin)}%`,
      height: `${Math.max(1, ymax - ymin)}%`,
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Canvas Header / Layer Toolbar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Interactive Diagram Overlay
          </span>
          <span className="text-[11px] text-slate-400">
            Hover or click boxes to inspect extracted elements
          </span>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
          <button
            onClick={() => setShowTextBBoxes(!showTextBBoxes)}
            className={`px-2 py-0.5 rounded border transition-colors ${
              showTextBBoxes
                ? 'bg-blue-950/80 border-blue-700 text-blue-300 font-medium'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showTextBBoxes ? '✓' : '✗'} Text OCR
          </button>

          <button
            onClick={() => setShowEShapes(!showEShapes)}
            className={`px-2 py-0.5 rounded border transition-colors ${
              showEShapes
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 font-medium'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showEShapes ? '✓' : '✗'} 'e' Diagram
          </button>

          <button
            onClick={() => setShowSShapes(!showSShapes)}
            className={`px-2 py-0.5 rounded border transition-colors ${
              showSShapes
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-medium'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showSShapes ? '✓' : '✗'} 's' Semantic
          </button>

          <div className="h-3 w-px bg-slate-800 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white font-mono"
            title="Reset Pan & Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing min-h-[450px]"
      >
        <div
          className="relative transition-transform duration-75 select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Base Diagram Image */}
          <img
            src={imageUrl}
            alt="Analyzed Diagram"
            className="max-h-[550px] max-w-full object-contain block bg-white rounded shadow-md pointer-events-none"
            draggable={false}
          />

          {/* SVG / HTML Overlay Layer */}
          {result && (
            <div className="absolute inset-0 pointer-events-auto">
              {/* Text Bounding Boxes */}
              {showTextBBoxes &&
                result.textElements.map((txt) => {
                  const isSelected = selectedElementId === txt.id;
                  const isHovered = hoveredElementId === txt.id;

                  return (
                    <div
                      key={txt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(isSelected ? null : txt.id);
                      }}
                      onMouseEnter={() => onHoverElement(txt.id)}
                      onMouseLeave={() => onHoverElement(null)}
                      style={getBBoxStyle(txt.bbox)}
                      className={`absolute cursor-pointer border rounded-sm transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400/30 ring-2 ring-yellow-400/80 z-30'
                          : isHovered
                          ? 'border-blue-400 bg-blue-400/25 ring-2 ring-blue-400/60 z-20'
                          : 'border-blue-500/50 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-400/20 z-10'
                      }`}
                    >
                      {/* Floating tooltip on hover */}
                      {(isHovered || isSelected) && (
                        <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-slate-900/95 text-white text-[10px] font-mono whitespace-nowrap border border-slate-700 shadow-xl pointer-events-none z-40 flex items-center gap-1.5">
                          <span className="text-blue-400 font-semibold">{txt.text}</span>
                          <span className="text-slate-400">({txt.category})</span>
                          <span className="text-emerald-400">{(txt.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Shapes & Graphical components */}
              {result.shapes.map((shape) => {
                const isE = shape.componentType === 'e';
                if (isE && !showEShapes) return null;
                if (!isE && !showSShapes) return null;

                const isSelected = selectedElementId === shape.id;
                const isHovered = hoveredElementId === shape.id;

                // If coordinates have x1, y1, x2, y2 (normalized 0-1000 or px)
                const c = shape.coordinates;
                if (c.x1 === undefined || c.y1 === undefined) return null;

                const x1 = (c.x1 / 10).toFixed(1);
                const y1 = (c.y1 / 10).toFixed(1);
                const x2 = ((c.x2 ?? c.x1 + 50) / 10).toFixed(1);
                const y2 = ((c.y2 ?? c.y1 + 20) / 10).toFixed(1);

                return (
                  <div
                    key={shape.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(isSelected ? null : shape.id);
                    }}
                    onMouseEnter={() => onHoverElement(shape.id)}
                    onMouseLeave={() => onHoverElement(null)}
                    style={{
                      left: `${Math.min(parseFloat(x1), parseFloat(x2))}%`,
                      top: `${Math.min(parseFloat(y1), parseFloat(y2))}%`,
                      width: `${Math.max(2, Math.abs(parseFloat(x2) - parseFloat(x1)))}%`,
                      height: `${Math.max(2, Math.abs(parseFloat(y2) - parseFloat(y1)))}%`,
                    }}
                    className={`absolute cursor-pointer border rounded-sm transition-all pointer-events-auto ${
                      isE
                        ? isSelected
                          ? 'border-cyan-400 bg-cyan-400/30 ring-2 ring-cyan-400 z-30'
                          : isHovered
                          ? 'border-cyan-400 bg-cyan-400/20 z-20'
                          : 'border-cyan-500/40 bg-cyan-500/5 hover:border-cyan-400 z-10'
                        : isSelected
                        ? 'border-emerald-400 bg-emerald-400/30 ring-2 ring-emerald-400 z-30'
                        : isHovered
                        ? 'border-emerald-400 bg-emerald-400/20 z-20'
                        : 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400 z-10'
                    }`}
                  >
                    {(isHovered || isSelected) && (
                      <div className="absolute -bottom-6 left-0 px-2 py-0.5 rounded bg-slate-900/95 text-white text-[10px] font-mono whitespace-nowrap border border-slate-700 shadow-xl pointer-events-none z-40 flex items-center gap-1.5">
                        <span className={isE ? 'text-cyan-400' : 'text-emerald-400'}>
                          [{shape.componentType}] {shape.shapeType}
                        </span>
                        {shape.label && <span className="text-slate-300">({shape.label})</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Canvas Footer Status */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/80 inline-block" />
            <span>OCR Text Elements ({result?.textElements.length ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/80 inline-block" />
            <span>'e' Diagram Geometry ({result?.shapes.filter((s) => s.componentType === 'e').length ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 inline-block" />
            <span>'s' Semantic Objects ({result?.shapes.filter((s) => s.componentType === 's').length ?? 0})</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Scroll to zoom • Click & drag to pan
        </div>
      </div>
    </div>
  );
};
