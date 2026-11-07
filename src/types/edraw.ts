/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EngineeringPoint {
  name: string;
  aboveHP?: number | string;
  inFrontVP?: number | string;
  behindVP?: number | string;
  belowHP?: number | string;
}

export interface EngineeringVariables {
  TL?: number | string; // True Length in mm
  FV?: number | string; // Front View apparent length in mm
  TV?: number | string; // Top View apparent length in mm
  theta?: number | string; // θ: True inclination with HP (deg)
  phi?: number | string; // Ø / φ: True inclination with VP (deg)
  alpha?: number | string; // α: Apparent inclination of FV (deg)
  beta?: number | string; // β: Apparent inclination of TV (deg)
  DBEP?: number | string; // Distance between end projectors (mm)
  point1?: EngineeringPoint;
  point2?: EngineeringPoint;
  traces?: string; // HT, VT
  otherAnswers?: Record<string, string | number>;
}

export interface EdrawTextElement {
  id: string;
  text: string;
  category: 'label' | 'dimension' | 'variable' | 'angle' | 'plane' | 'locus' | 'heading' | 'note' | 'answer';
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  confidence: number;
  isPrime?: boolean;
  isSubscript?: boolean;
  notes?: string;
}

export interface EdrawShape {
  id: string;
  name: string;
  componentType: 'e' | 's'; // 'e' = graphical/diagrammatic, 's' = semantic/textual
  shapeType: 
    | 'line'
    | 'axis_xy'
    | 'reference_plane'
    | 'locus_line'
    | 'projector'
    | 'arc_rotation'
    | 'dimension_arrow'
    | 'callout_box'
    | 'text_block';
  coordinates: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    cx?: number;
    cy?: number;
    r?: number;
    points?: [number, number][];
  };
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    fill?: string;
    markerEnd?: string;
  };
  label?: string;
  confidence: number;
}

export interface EdrawConnection {
  id: string;
  fromId: string;
  toId: string;
  type: 'projector_connect' | 'locus_intersect' | 'rotation_arc' | 'dimension_referencing' | 'view_alignment';
  label?: string;
}

export interface GeometricCheck {
  name: string;
  expected: string;
  observed: string;
  pass: boolean;
  formula: string;
}

export interface EdrawOcrResult {
  metadata: {
    title: string;
    category: string;
    scale: string;
    unit: string;
    timestamp?: string;
    inferenceTimeMs?: number;
    fewShotExamplesCount?: number;
  };
  engineeringVariables: EngineeringVariables;
  textElements: EdrawTextElement[];
  shapes: EdrawShape[];
  connections: EdrawConnection[];
  verification: {
    mathematicalValid: boolean;
    geometricChecks: GeometricCheck[];
    overallConfidence: number;
    notes: string;
  };
  summary: string;
  rawJson?: string;
}

export interface TrainingPair {
  id: number;
  name: string;
  eFileName: string;
  sFileName: string;
  gFileName?: string;
  eUrl: string;
  sUrl: string;
  gUrl?: string;
  problemText: string;
  engineeringVariables: EngineeringVariables;
  shapesSummary?: string;
  isActiveFewShot: boolean;
  isCustom?: boolean;
  createdAt: number;
  groundTruthJson?: Partial<EdrawOcrResult>;
}

export interface CanvasPreprocessorOptions {
  contrast: number; // -50 to 100, default 15
  brightness: number; // -50 to 50, default 0
  sharpening: number; // 0, 1 (1x), 2 (2x), 3 (3x), default 2
  autoContrast: boolean; // histogram stretch
  invertColors: boolean;
  thresholding: boolean; // binarize high-contrast
  thresholdValue: number; // 0-255
  zoom: number; // 1.0 to 3.0
  rotation: number; // 0, 90, 180, 270
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}
