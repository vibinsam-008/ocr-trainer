/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { EdrawOcrResult } from '../types/edraw';

export function generateEdrawJson(result: EdrawOcrResult): string {
  const edrawStructure = {
    app: "EdrawMax Diagram OCR & Structure Trainer",
    formatVersion: "12.0.0",
    schema: "http://schemas.edrawsoft.com/edx/2026",
    document: {
      title: result.metadata.title || "Edraw Extracted Diagram",
      category: result.metadata.category || "Engineering Projection of Lines",
      unit: result.metadata.unit || "mm",
      scale: result.metadata.scale || "1:1",
      exportedAt: new Date().toISOString(),
      engineeringVariables: result.engineeringVariables,
      verification: result.verification,
      summary: result.summary,
      canvas: {
        width: 1440,
        height: 900,
        backgroundColor: "#FFFFFF",
        gridSize: 10,
        snapToGrid: true
      },
      layers: [
        { id: "layer_e_diagram", name: "e - Graphical Components & Geometry", visible: true, locked: false },
        { id: "layer_s_semantic", name: "s - Semantic Texts, Dimensions & Annotations", visible: true, locked: false }
      ],
      elements: [
        ...result.shapes.map((shape) => ({
          id: shape.id,
          name: shape.name,
          componentType: shape.componentType,
          layerId: shape.componentType === 'e' ? 'layer_e_diagram' : 'layer_s_semantic',
          shapeType: shape.shapeType,
          label: shape.label || "",
          coordinates: shape.coordinates,
          style: {
            stroke: shape.style?.stroke || (shape.componentType === 'e' ? '#0f172a' : '#2563eb'),
            strokeWidth: shape.style?.strokeWidth || (shape.shapeType === 'line' ? 2 : 1),
            strokeDasharray: shape.style?.strokeDasharray || (shape.shapeType === 'locus_line' ? '5,5' : 'none'),
            fill: shape.style?.fill || 'transparent',
            markerEnd: shape.style?.markerEnd || (shape.shapeType === 'dimension_arrow' ? 'arrow' : 'none')
          },
          confidence: shape.confidence
        })),
        ...result.textElements.map((txt) => ({
          id: txt.id,
          name: `Text: ${txt.text}`,
          componentType: 's',
          layerId: 'layer_s_semantic',
          shapeType: 'text_block',
          label: txt.text,
          category: txt.category,
          bbox: {
            ymin: txt.bbox[0],
            xmin: txt.bbox[1],
            ymax: txt.bbox[2],
            xmax: txt.bbox[3]
          },
          style: {
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontSize: txt.category === 'heading' ? 18 : 12,
            fontStyle: txt.isPrime ? "italic" : "normal",
            fill: "#0f172a"
          },
          confidence: txt.confidence
        }))
      ],
      connections: result.connections.map((conn) => ({
        id: conn.id,
        fromElement: conn.fromId,
        toElement: conn.toId,
        type: conn.type,
        label: conn.label || "",
        style: {
          stroke: "#64748b",
          strokeWidth: 1,
          dasharray: conn.type === 'projector_connect' ? '3,3' : 'none'
        }
      }))
    }
  };

  return JSON.stringify(edrawStructure, null, 2);
}

export function generateEdrawCsv(result: EdrawOcrResult): string {
  const headers = [
    "Element_ID",
    "Component_Type",
    "Kind",
    "Category_or_Shape",
    "Content_or_Label",
    "Confidence_Score",
    "BBox_YMin",
    "BBox_XMin",
    "BBox_YMax",
    "BBox_XMax",
    "Connected_Node_IDs"
  ];

  const rows: string[][] = [];

  // Text elements
  for (const t of result.textElements) {
    const connected = result.connections
      .filter((c) => c.fromId === t.id || c.toId === t.id)
      .map((c) => (c.fromId === t.id ? c.toId : c.fromId))
      .join(";");

    rows.push([
      t.id,
      "s (Semantic)",
      "Text Element",
      t.category,
      `"${t.text.replace(/"/g, '""')}"`,
      (t.confidence * 100).toFixed(1) + "%",
      t.bbox[0].toString(),
      t.bbox[1].toString(),
      t.bbox[2].toString(),
      t.bbox[3].toString(),
      `"${connected}"`
    ]);
  }

  // Shape elements
  for (const s of result.shapes) {
    const connected = result.connections
      .filter((c) => c.fromId === s.id || c.toId === s.id)
      .map((c) => (c.fromId === s.id ? c.toId : c.fromId))
      .join(";");

    rows.push([
      s.id,
      `${s.componentType} (${s.componentType === 'e' ? 'Diagram' : 'Semantic'})`,
      "Shape / Symbol",
      s.shapeType,
      `"${(s.label || s.name).replace(/"/g, '""')}"`,
      (s.confidence * 100).toFixed(1) + "%",
      s.coordinates.y1?.toString() || "",
      s.coordinates.x1?.toString() || "",
      s.coordinates.y2?.toString() || "",
      s.coordinates.x2?.toString() || "",
      `"${connected}"`
    ]);
  }

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return csvContent;
}

export function generateEdrawXml(result: EdrawOcrResult): string {
  function escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<edraw:document xmlns:edraw="http://schemas.edrawsoft.com/edx/2026" version="12.0">\n`;
  xml += `  <edraw:metadata>\n`;
  xml += `    <edraw:title>${escapeXml(result.metadata.title)}</edraw:title>\n`;
  xml += `    <edraw:category>${escapeXml(result.metadata.category)}</edraw:category>\n`;
  xml += `    <edraw:unit>${escapeXml(result.metadata.unit)}</edraw:unit>\n`;
  xml += `    <edraw:scale>${escapeXml(result.metadata.scale)}</edraw:scale>\n`;
  xml += `    <edraw:exportedAt>${new Date().toISOString()}</edraw:exportedAt>\n`;
  xml += `  </edraw:metadata>\n`;

  xml += `  <edraw:variables>\n`;
  if (result.engineeringVariables.TL !== undefined) xml += `    <edraw:var name="TL" value="${result.engineeringVariables.TL}" unit="mm"/>\n`;
  if (result.engineeringVariables.FV !== undefined) xml += `    <edraw:var name="FV" value="${result.engineeringVariables.FV}" unit="mm"/>\n`;
  if (result.engineeringVariables.TV !== undefined) xml += `    <edraw:var name="TV" value="${result.engineeringVariables.TV}" unit="mm"/>\n`;
  if (result.engineeringVariables.theta !== undefined) xml += `    <edraw:var name="theta" value="${result.engineeringVariables.theta}" unit="deg"/>\n`;
  if (result.engineeringVariables.phi !== undefined) xml += `    <edraw:var name="phi" value="${result.engineeringVariables.phi}" unit="deg"/>\n`;
  if (result.engineeringVariables.alpha !== undefined) xml += `    <edraw:var name="alpha" value="${result.engineeringVariables.alpha}" unit="deg"/>\n`;
  if (result.engineeringVariables.beta !== undefined) xml += `    <edraw:var name="beta" value="${result.engineeringVariables.beta}" unit="deg"/>\n`;
  if (result.engineeringVariables.DBEP !== undefined) xml += `    <edraw:var name="DBEP" value="${result.engineeringVariables.DBEP}" unit="mm"/>\n`;
  xml += `  </edraw:variables>\n`;

  xml += `  <edraw:shapes count="${result.shapes.length}">\n`;
  for (const s of result.shapes) {
    xml += `    <edraw:shape id="${s.id}" component="${s.componentType}" type="${s.shapeType}" confidence="${s.confidence}">\n`;
    xml += `      <edraw:name>${escapeXml(s.name)}</edraw:name>\n`;
    if (s.label) xml += `      <edraw:label>${escapeXml(s.label)}</edraw:label>\n`;
    xml += `      <edraw:geometry x1="${s.coordinates.x1 ?? 0}" y1="${s.coordinates.y1 ?? 0}" x2="${s.coordinates.x2 ?? 0}" y2="${s.coordinates.y2 ?? 0}"/>\n`;
    xml += `    </edraw:shape>\n`;
  }
  xml += `  </edraw:shapes>\n`;

  xml += `  <edraw:texts count="${result.textElements.length}">\n`;
  for (const t of result.textElements) {
    xml += `    <edraw:text id="${t.id}" category="${t.category}" confidence="${t.confidence}">\n`;
    xml += `      <edraw:content>${escapeXml(t.text)}</edraw:content>\n`;
    xml += `      <edraw:bbox ymin="${t.bbox[0]}" xmin="${t.bbox[1]}" ymax="${t.bbox[2]}" xmax="${t.bbox[3]}"/>\n`;
    xml += `    </edraw:text>\n`;
  }
  xml += `  </edraw:texts>\n`;

  xml += `  <edraw:connections count="${result.connections.length}">\n`;
  for (const c of result.connections) {
    xml += `    <edraw:connection id="${c.id}" from="${c.fromId}" to="${c.toId}" type="${c.type}">\n`;
    if (c.label) xml += `      <edraw:label>${escapeXml(c.label)}</edraw:label>\n`;
    xml += `    </edraw:connection>\n`;
  }
  xml += `  </edraw:connections>\n`;

  xml += `</edraw:document>`;
  return xml;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadZipBundle(
  result: EdrawOcrResult,
  processedImageDataUrl?: string
): Promise<void> {
  const zip = new JSZip();

  const jsonContent = generateEdrawJson(result);
  const csvContent = generateEdrawCsv(result);
  const xmlContent = generateEdrawXml(result);

  zip.file("edraw_diagram.edx.json", jsonContent);
  zip.file("edraw_elements.csv", csvContent);
  zip.file("edraw_structure.xml", xmlContent);

  const summaryText = `EDRAW DIAGRAM OCR & STRUCTURE EXTRACTION REPORT
Title: ${result.metadata.title}
Category: ${result.metadata.category}
Generated: ${new Date().toISOString()}

ENGINEERING VARIABLES:
${JSON.stringify(result.engineeringVariables, null, 2)}

VERIFICATION CHECKS:
Mathematical Valid: ${result.verification.mathematicalValid ? 'PASS' : 'FLAGGED'}
Overall Confidence: ${(result.verification.overallConfidence * 100).toFixed(1)}%
Notes: ${result.verification.notes}

EXTRACTED SUMMARY:
${result.summary}
`;
  zip.file("extraction_summary.txt", summaryText);

  if (processedImageDataUrl && processedImageDataUrl.startsWith('data:image')) {
    const base64Data = processedImageDataUrl.split(',')[1];
    zip.file("preprocessed_diagram.png", base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  const safeTitle = (result.metadata.title || "edraw_diagram").toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.href = url;
  a.download = `${safeTitle}_ocr_bundle.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
