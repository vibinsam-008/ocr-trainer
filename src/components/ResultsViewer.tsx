/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileCode,
  FileSpreadsheet,
  FileText,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Search,
  Maximize2,
  Share2,
  ShieldCheck,
  Compass,
  GitBranch,
  Terminal
} from 'lucide-react';
import { EdrawOcrResult, EdrawTextElement, EdrawShape, EdrawConnection } from '../types/edraw';
import {
  generateEdrawJson,
  generateEdrawCsv,
  generateEdrawXml,
  downloadFile,
  downloadZipBundle
} from '../utils/exporter';

interface ResultsViewerProps {
  result: EdrawOcrResult;
  processedImageDataUrl?: string;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  hoveredElementId: string | null;
  onHoverElement: (id: string | null) => void;
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
  result,
  processedImageDataUrl,
  selectedElementId,
  onSelectElement,
  hoveredElementId,
  onHoverElement,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'variables' | 'text' | 'shapes' | 'topology' | 'raw'>('variables');
  const [shapeFilter, setShapeFilter] = useState<'all' | 'e' | 's'>('all');
  const [textSearch, setTextSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Copy JSON
  const handleCopyJson = () => {
    const jsonStr = generateEdrawJson(result);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export handlers
  const handleExportJson = () => {
    const jsonStr = generateEdrawJson(result);
    const filename = `${(result.metadata.title || 'edraw_diagram').toLowerCase().replace(/[^a-z0-9]/g, '_')}.edx.json`;
    downloadFile(jsonStr, filename, 'application/json');
  };

  const handleExportCsv = () => {
    const csvStr = generateEdrawCsv(result);
    const filename = `${(result.metadata.title || 'edraw_diagram').toLowerCase().replace(/[^a-z0-9]/g, '_')}_elements.csv`;
    downloadFile(csvStr, filename, 'text/csv');
  };

  const handleExportXml = () => {
    const xmlStr = generateEdrawXml(result);
    const filename = `${(result.metadata.title || 'edraw_diagram').toLowerCase().replace(/[^a-z0-9]/g, '_')}_structure.xml`;
    downloadFile(xmlStr, filename, 'application/xml');
  };

  const handleExportZip = async () => {
    await downloadZipBundle(result, processedImageDataUrl);
  };

  // Filtered text elements
  const filteredTexts = result.textElements.filter((t) =>
    t.text.toLowerCase().includes(textSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(textSearch.toLowerCase())
  );

  // Filtered shapes
  const filteredShapes = result.shapes.filter((s) => {
    if (shapeFilter === 'e') return s.componentType === 'e';
    if (shapeFilter === 's') return s.componentType === 's';
    return true;
  });

  const vars = result.engineeringVariables;
  const confidencePercent = Math.round((result.verification.overallConfidence || 0.95) * 100);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Top Header & Export Actions */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                {result.metadata.title || 'Orthographic Projection of Line'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80 font-mono">
                {result.metadata.category || 'Projection of Lines'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Confidence: <strong className="text-emerald-400 font-mono">{confidencePercent}%</strong></span>
              {result.metadata.inferenceTimeMs && (
                <span>Speed: <strong className="text-slate-300 font-mono">{result.metadata.inferenceTimeMs}ms</strong></span>
              )}
              {result.metadata.fewShotExamplesCount !== undefined && (
                <span>Few-Shot Prompt: <strong className="text-blue-300 font-mono">{result.metadata.fewShotExamplesCount} Pairs</strong></span>
              )}
            </div>
          </div>

          {/* One-Click Export Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Download EdrawMax compatible JSON (.edx.json)"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Edraw JSON</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Download Tabular CSV with bounding boxes & classes"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportXml}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Download XML diagram interchange specification"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>XML</span>
            </button>

            <button
              onClick={handleExportZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition-colors"
              title="Download Complete Export Bundle (JSON, CSV, XML, Summary, Diagram Image)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All (ZIP)</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('variables')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'variables'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Engineering Variables & Math
          </button>

          <button
            onClick={() => setActiveSubTab('text')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'text'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OCR Text Elements ({result.textElements.length})
          </button>

          <button
            onClick={() => setActiveSubTab('shapes')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'shapes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Edraw Shapes: 'e' vs 's' ({result.shapes.length})
          </button>

          <button
            onClick={() => setActiveSubTab('topology')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'topology'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Topology & Connections ({result.connections.length})
          </button>

          <button
            onClick={() => setActiveSubTab('raw')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'raw'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Structured JSON
          </button>
        </div>
      </div>

      {/* Sub-Tab Content Viewport */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[560px]">
        {/* TAB 1: Variables & Verification */}
        {activeSubTab === 'variables' && (
          <div className="space-y-4">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">True Length (TL)</span>
                <span className="text-xl font-bold text-blue-400 font-mono tabular-nums">
                  {vars.TL !== undefined && vars.TL !== null ? `${vars.TL} mm` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">Front View Length (FV)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                  {vars.FV !== undefined && vars.FV !== null ? `${vars.FV} mm` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">Top View Length (TV)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                  {vars.TV !== undefined && vars.TV !== null ? `${vars.TV} mm` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">Projector Span (DBEP)</span>
                <span className="text-xl font-bold text-purple-400 font-mono tabular-nums">
                  {vars.DBEP !== undefined && vars.DBEP !== null ? `${vars.DBEP} mm` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Angles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">θ (True Angle with HP)</span>
                <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                  {vars.theta !== undefined && vars.theta !== null ? `${vars.theta}°` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">Ø / φ (True Angle with VP)</span>
                <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                  {vars.phi !== undefined && vars.phi !== null ? `${vars.phi}°` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">α (FV Apparent Angle)</span>
                <span className="text-lg font-bold text-amber-300 font-mono tabular-nums">
                  {vars.alpha !== undefined && vars.alpha !== null ? `${vars.alpha}°` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-1">β (TV Apparent Angle)</span>
                <span className="text-lg font-bold text-amber-300 font-mono tabular-nums">
                  {vars.beta !== undefined && vars.beta !== null ? `${vars.beta}°` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Geometric Validation & Mathematical Checks */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-semibold text-white">
                    Geometric & Trigonometric Orthographic Verification
                  </h4>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                    result.verification.mathematicalValid
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {result.verification.mathematicalValid ? 'GEOMETRY VERIFIED' : 'VARIANCE DETECTED'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                {result.verification.notes || 'Diagram verified against standard orthographic projection geometry.'}
              </p>

              {result.verification.geometricChecks && result.verification.geometricChecks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {result.verification.geometricChecks.map((check, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/40 border border-slate-800/60 font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {check.pass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="text-slate-200">{check.name}</span>
                        <span className="text-slate-500 text-[10px]">({check.formula})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">Obs: {check.observed}</span>
                        <span className="text-blue-400">Exp: {check.expected}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Problem Statement Summary */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <h4 className="text-xs font-semibold text-white mb-1.5">Problem Summary & Solution Context</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{result.summary}</p>

              {vars.traces && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">Traces: </span>
                  <span className="text-amber-400 font-mono font-medium">{vars.traces}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Extracted OCR Text */}
        {activeSubTab === 'text' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Search recognized text, dimension values, or categories..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                  <tr>
                    <th className="p-2.5">Text String</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Prime / View</th>
                    <th className="p-2.5">Confidence</th>
                    <th className="p-2.5">Bounding Box (0-1000)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                  {filteredTexts.map((txt) => {
                    const isSelected = selectedElementId === txt.id;
                    const isHovered = hoveredElementId === txt.id;

                    return (
                      <tr
                        key={txt.id}
                        onClick={() => onSelectElement(isSelected ? null : txt.id)}
                        onMouseEnter={() => onHoverElement(txt.id)}
                        onMouseLeave={() => onHoverElement(null)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-900/40 text-white'
                            : isHovered
                            ? 'bg-slate-800/60 text-white'
                            : 'hover:bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        <td className="p-2.5 font-semibold text-white flex items-center gap-1.5">
                          <span className="font-mono text-blue-400">{txt.text}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {txt.category}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {txt.isPrime ? (
                            <span className="text-amber-400 font-semibold">Front View (Prime &apos;)</span>
                          ) : (
                            <span className="text-slate-400">Top View</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-400">
                          {(txt.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-slate-400">
                          [{txt.bbox.join(', ')}]
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Edraw Shapes (e vs s) */}
        {activeSubTab === 'shapes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">Component Classification:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setShapeFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    shapeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  All ({result.shapes.length})
                </button>
                <button
                  onClick={() => setShapeFilter('e')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    shapeFilter === 'e' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  &apos;e&apos; Diagram Geometry ({result.shapes.filter((s) => s.componentType === 'e').length})
                </button>
                <button
                  onClick={() => setShapeFilter('s')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    shapeFilter === 's' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  &apos;s&apos; Semantic Annotations ({result.shapes.filter((s) => s.componentType === 's').length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredShapes.map((shape) => {
                const isSelected = selectedElementId === shape.id;
                const isHovered = hoveredElementId === shape.id;
                const isE = shape.componentType === 'e';

                return (
                  <div
                    key={shape.id}
                    onClick={() => onSelectElement(isSelected ? null : shape.id)}
                    onMouseEnter={() => onHoverElement(shape.id)}
                    onMouseLeave={() => onHoverElement(null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                        : isHovered
                        ? 'border-slate-700 bg-slate-800/60'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isE
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {shape.componentType.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-white">{shape.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Type: <span className="text-slate-200">{shape.shapeType}</span>
                      </span>
                    </div>

                    {shape.label && (
                      <p className="text-xs text-blue-300 font-mono mb-2">
                        Label: &quot;{shape.label}&quot;
                      </p>
                    )}

                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span>Coordinates: [{shape.coordinates.x1 ?? 0}, {shape.coordinates.y1 ?? 0}]</span>
                      <span className="text-emerald-400">{(shape.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Topology & Connections */}
        {activeSubTab === 'topology' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Topological relationship graph linking reference axes, projection rays, locus lines, and rotation arcs:
            </p>

            <div className="space-y-2">
              {result.connections.map((conn) => (
                <div
                  key={conn.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-mono text-white font-medium">{conn.fromId}</span>
                    <span className="text-slate-500">───&gt;</span>
                    <span className="font-mono text-white font-medium">{conn.toId}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 text-[10px]">
                      {conn.type}
                    </span>
                    {conn.label && <span className="text-slate-400">({conn.label})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Raw JSON */}
        {activeSubTab === 'raw' && (
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-200 overflow-x-auto leading-relaxed max-h-[500px]">
              {generateEdrawJson(result)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
