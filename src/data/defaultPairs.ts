/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainingPair } from '../types/edraw';

export const INITIAL_TRAINING_PAIRS: TrainingPair[] = [
  {
    id: 1,
    name: "Pair 1: Line PQ Parallel to HP, 35° to VP",
    eFileName: "e1.PNG",
    sFileName: "s1.PNG",
    eUrl: "/assets/aistudio/e1_7094dc03.PNG",
    sUrl: "/assets/aistudio/s1_6f1e88fa.PNG",
    problemText: "A line PQ of length 40mm is parallel to the HP and inclined at an angle of 35° to the VP. The end P is 20mm above the HP and 15mm in front of the VP. Draw its projections.",
    engineeringVariables: {
      TL: 40,
      FV: 32.77,
      TV: 40,
      theta: 0,
      phi: 35,
      alpha: 0,
      beta: 35,
      point1: { name: "P", aboveHP: 20, inFrontVP: 15 },
      point2: { name: "Q", aboveHP: 20, inFrontVP: 37.95 }
    },
    shapesSummary: "XY reference line, VP/HP marker, front view line p'q' parallel to XY, top view line pq at 35°, vertical projectors between p-p' and q-q', dimension lines (20mm, 15mm, 40mm)",
    isActiveFewShot: true,
    createdAt: 1731000000000,
    groundTruthJson: {
      metadata: {
        title: "Projections of Line PQ Parallel to HP and Inclined to VP",
        category: "Projection of Lines - First Angle",
        scale: "1:1",
        unit: "mm"
      },
      engineeringVariables: {
        TL: 40,
        FV: 32.77,
        TV: 40,
        theta: 0,
        phi: 35,
        alpha: 0,
        beta: 35,
        point1: { name: "P", aboveHP: 20, inFrontVP: 15 }
      }
    }
  },
  {
    id: 2,
    name: "Pair 2: Line AB Rotation Method with 4 Loci",
    eFileName: "e2.PNG",
    sFileName: "s2.PNG",
    eUrl: "/assets/aistudio/e2_3e4a063e.PNG",
    sUrl: "/assets/aistudio/s2_f9bb01ee.PNG",
    problemText: "The elevation of line AB, 80 mm long, measures 55 mm. The end A is 20 mm above H.P. and 10 mm in front of V.P. Draw the projections of the line and find its true inclinations with H.P. and V.P. If the end B is 25 mm below H.P. and is behind V.P.",
    engineeringVariables: {
      TL: 80,
      FV: 55,
      TV: 65,
      theta: 35,
      phi: 46,
      alpha: 55,
      beta: 62,
      point1: { name: "A", aboveHP: 20, inFrontVP: 10 },
      point2: { name: "B", belowHP: 25 }
    },
    shapesSummary: "Horizontal reference XY, 4 locus lines (locus of b, locus of a', locus of a, locus of b'), rotation arc in green, true length lines TL=80, FV=55, TV=65, angle arcs 55°, 35°, 62°, 46°",
    isActiveFewShot: true,
    createdAt: 1731000001000
  },
  {
    id: 3,
    name: "Pair 3: Line MN with Vertical Projectors & Locus Spacing",
    eFileName: "e3.PNG",
    sFileName: "s3.PNG",
    eUrl: "/assets/aistudio/e3_7d291a90.PNG",
    sUrl: "/assets/aistudio/s3_c95a667d.PNG",
    problemText: "Line MN has true length 100mm. Its front view FV=94mm and top view TV=70mm. End M is 15mm above HP and 25mm in front of VP. Determine true inclinations with HP and VP.",
    engineeringVariables: {
      TL: 100,
      FV: 94,
      TV: 70,
      theta: 50,
      phi: 30,
      alpha: 46,
      beta: 20,
      DBEP: 70,
      point1: { name: "M", aboveHP: 15, inFrontVP: 25 },
      point2: { name: "N", aboveHP: 60 }
    },
    shapesSummary: "Green coordinate axes XY, locus lines of m', m, n', n, vertical projection rays, angles 46°, 50°, 20°, 30°, dimension indicators (15, 25, 60, 70)",
    isActiveFewShot: true,
    createdAt: 1731000002000
  },
  {
    id: 4,
    name: "Pair 4: Q3.1 Line AB 60mm with θ=25° and φ=40°",
    eFileName: "e4.PNG",
    sFileName: "s4.PNG",
    gFileName: "g4.PNG",
    eUrl: "/assets/aistudio/e4_9d65bed8.PNG",
    sUrl: "/assets/aistudio/s4_0a48605c.PNG",
    gUrl: "/assets/aistudio/g4_c793f5eb.PNG",
    problemText: "3.1 A line AB 60mm long has one end 20mm in front of VP and 15mm above HP. The line is inclined at 25° to HP and 40° to VP. Draw the front view and the top view of the line.",
    engineeringVariables: {
      TL: 60,
      FV: 46,
      TV: 54.38,
      theta: 25,
      phi: 40,
      alpha: 33.48,
      beta: 45,
      DBEP: 38.34,
      point1: { name: "A", aboveHP: 15, inFrontVP: 20 }
    },
    shapesSummary: "XY axis, VP/HP indicators, true length lines ab1' and ab2 (60mm), rotation arcs for b' and b, DBEP projector span 38.34mm, locus of B in FV and TV, answers box",
    isActiveFewShot: true,
    createdAt: 1731000003000
  },
  {
    id: 5,
    name: "Pair 5: Q3.2 Line AB 70mm with Given End Coordinates",
    eFileName: "e5.PNG",
    sFileName: "s5.PNG",
    gFileName: "g5.PNG",
    eUrl: "/assets/aistudio/e5_9b17ed65.PNG",
    sUrl: "/assets/aistudio/s5_da2b7a4b.PNG",
    gUrl: "/assets/aistudio/g5_7770f642.PNG",
    problemText: "3.2 The line AB measuring 70mm has its end A 15mm in front of VP and 20mm above HP, the other end B is 60mm in front of VP and 50mm above HP. Draw the projections of the line and find the inclinations of the line with both the reference planes of projection.",
    engineeringVariables: {
      TL: 70,
      FV: 53.62,
      TV: 63.25,
      theta: 25.38,
      phi: 40,
      alpha: 34,
      beta: 45.36,
      DBEP: 44.44,
      point1: { name: "A", aboveHP: 20, inFrontVP: 15 },
      point2: { name: "B", aboveHP: 50, inFrontVP: 60 }
    },
    shapesSummary: "XY ground line, locus of B at 50mm above XY and 60mm below XY, DBEP = 44.44mm, rotation arcs, answers panel",
    isActiveFewShot: true,
    createdAt: 1731000004000
  },
  {
    id: 6,
    name: "Pair 6: Q3.3 Line AB 65mm with Inclination Extraction",
    eFileName: "e6.PNG",
    sFileName: "s6.PNG",
    eUrl: "/assets/aistudio/e6_840dd26d.PNG",
    sUrl: "/assets/aistudio/s6_3716e33d.PNG",
    problemText: "Q 3.3 A line AB, 65 mm long, has its end 20 mm above HP and 25 mm in front of VP. The end B is 40 mm above HP and 65 mm in front of VP. Draw the projections AB and show its inclinations with the HP and VP.",
    engineeringVariables: {
      TL: 65,
      FV: 51.23,
      TV: 61.85,
      theta: 18,
      phi: 38,
      alpha: 23,
      beta: 40.3,
      DBEP: 47.17,
      point1: { name: "A", aboveHP: 20, inFrontVP: 25 },
      point2: { name: "B", aboveHP: 40, inFrontVP: 65 }
    },
    shapesSummary: "Graphical solution similar to Q3.2 with answers: a'b'=51.23mm, ab=61.85mm, theta=18 deg, alpha=23 deg, phi=38 deg, beta=40.3 deg, DBEP=47.17mm",
    isActiveFewShot: true,
    createdAt: 1731000005000
  },
  {
    id: 7,
    name: "Pair 7: Q3.4 Line PQ with TV=70mm at 60° to XY",
    eFileName: "e7.PNG",
    sFileName: "s7.PNG",
    gFileName: "g7.PNG",
    eUrl: "/assets/aistudio/e7_c0fff573.PNG",
    sUrl: "/assets/aistudio/s7_e7709168.PNG",
    gUrl: "/assets/aistudio/g7_cc2c2759.PNG",
    problemText: "3.4 The top view pq of a straight line is 70mm and makes an angle of 60° to XY line. End P is 10 mm in front of VP and 30mm above HP. The difference between the distances of P and Q above HP is 45mm. Draw the projections and determine the true length and true inclinations with HP and VP.",
    engineeringVariables: {
      TL: 83.22,
      FV: 57,
      TV: 70,
      theta: 33,
      phi: 47,
      alpha: 52,
      beta: 60,
      DBEP: 35,
      point1: { name: "P", aboveHP: 30, inFrontVP: 10 }
    },
    shapesSummary: "Top view pq of 70mm inclined at 60°, difference in heights 45mm, front view p'q'=57, TL=83.22mm, theta=33 deg, alpha=52 deg, phi=47 deg, DBEP=35mm",
    isActiveFewShot: true,
    createdAt: 1731000006000
  },
  {
    id: 8,
    name: "Pair 8: Q3.5 Line AB with TV=50mm, θ=30° and φ=45°",
    eFileName: "e8.PNG",
    sFileName: "s8.PNG",
    gFileName: "g8.PNG",
    eUrl: "/assets/aistudio/e8_3b403f2f.PNG",
    sUrl: "/assets/aistudio/s8_305d5e22.PNG",
    gUrl: "/assets/aistudio/g8_3db520a6.PNG",
    problemText: "3.5 A line AB having one of its end 10mm above HP and 15mm of VP is inclined at 30° to HP and 45° to VP. Its top view is 50mm long. Draw the projections of the line and find out its true length.",
    engineeringVariables: {
      TL: 58,
      FV: 41,
      TV: 50,
      theta: 30,
      phi: 45,
      alpha: 45,
      beta: 55,
      DBEP: 29,
      point1: { name: "A", aboveHP: 10, inFrontVP: 15 }
    },
    shapesSummary: "End A 10mm above HP and 15mm in front of VP, TV 50mm parallel to XY, rotation arcs, TL=58mm, FV=41mm, DBEP=29mm",
    isActiveFewShot: true,
    createdAt: 1731000007000
  },
  {
    id: 9,
    name: "Pair 9: Q3.6 Line AB in HP and VP Reference Planes",
    eFileName: "e9.PNG",
    sFileName: "s9.PNG",
    gFileName: "g9.PNG",
    eUrl: "/assets/aistudio/e9_b0d7ee5d.PNG",
    sUrl: "/assets/aistudio/s9_70739e04.PNG",
    gUrl: "/assets/aistudio/g9_bb999e87.PNG",
    problemText: "3.6 Draw the projections of a straight line AB, 100mm long, inclined at 45° to HP and 30° VP. The end A is in HP and the end B is in VP.",
    engineeringVariables: {
      TL: 58,
      FV: 50,
      TV: 41,
      theta: 45,
      phi: 30,
      alpha: 55,
      beta: 45,
      DBEP: 50,
      point1: { name: "A", aboveHP: 15, inFrontVP: 0 }
    },
    shapesSummary: "Projections with end A in HP/VP, rotation projection steps, answers: TL=58mm, ab=41mm, alpha=55 deg, theta=45 deg, beta=45 deg, DBEP=50mm",
    isActiveFewShot: true,
    createdAt: 1731000008000
  },
  {
    id: 10,
    name: "Pair 10: Unit 2 Line AB Traces & Projectors",
    eFileName: "e10.PNG",
    sFileName: "s10.PNG",
    eUrl: "/assets/aistudio/e10_fe0dab78.PNG",
    sUrl: "/assets/aistudio/s10_c8598a8a.PNG",
    problemText: "UNIT 2 PROJECTION OF LINES / 1. End A of a line AB is 15mm above HP & 20mm in front of VP while its end B is 50mm above HP and 75mm in front of VP. The distances between end projectors of the line is 50mm. Draw projections of the line and find its true length and true inclination with the principal planes. Also mark its traces.",
    engineeringVariables: {
      TL: 75,
      theta: 24,
      phi: 41,
      DBEP: 50,
      point1: { name: "A", aboveHP: 15, inFrontVP: 20 },
      point2: { name: "B", aboveHP: 50, inFrontVP: 75 },
      traces: "HT and VT marked with intersection on XY"
    },
    shapesSummary: "Horizontal trace HT and vertical trace VT' extended to reference line XY, end projector distance 50mm, theta=24°, phi=41°",
    isActiveFewShot: true,
    createdAt: 1731000009000
  },
  {
    id: 11,
    name: "Pair 11: Line AB 70mm with Traces Marking",
    eFileName: "e11.PNG",
    sFileName: "s11.PNG",
    eUrl: "/assets/aistudio/e11_d9b29b0b.PNG",
    sUrl: "/assets/aistudio/s11_91bf6aed.PNG",
    problemText: "2. A line AB, 70mm long, has its end A 15mm above HP and 20mm in front of VP. It is inclined at 30° to HP and 45° to VP. Draw its projections and mark its traces",
    engineeringVariables: {
      TL: 70,
      theta: 30,
      phi: 45,
      point1: { name: "A", aboveHP: 15, inFrontVP: 20 },
      traces: "HT and VT' marked"
    },
    shapesSummary: "True length lines of 70mm at 30° to HP and 45° to VP, circular rotation arcs from b1' and b2, traces construction rays intersecting at h' and v",
    isActiveFewShot: true,
    createdAt: 1731000010000
  },
  {
    id: 12,
    name: "Pair 12: Given TL=75, TV=65, FV=50, A in HP & 12mm VP",
    eFileName: "e12.PNG",
    sFileName: "s12.PNG",
    eUrl: "/assets/aistudio/e12_097fee9f.PNG",
    sUrl: "/assets/aistudio/s12_e8ebbe1d.PNG",
    problemText: "3. The top view of a 75mm long line AB measures 65mm, while its front view measures 50mm. Its one end A is in HP and 12mm in front of VP. Draw the projections of AB and determine its inclination with HP and VP",
    engineeringVariables: {
      TL: 75,
      TV: 65,
      FV: 50,
      theta: 31,
      phi: 49,
      point1: { name: "A", aboveHP: 0, inFrontVP: 12 }
    },
    shapesSummary: "Given TL=75, TV=65, FV=50, A in HP and 12mm in front of VP. True inclinations theta=31 deg, phi=49 deg, projection arcs and vertical alignment",
    isActiveFewShot: true,
    createdAt: 1731000011000
  },
  {
    id: 13,
    name: "Pair 13: Given TL=65, A and B Coordinates in HP & VP",
    eFileName: "e13.PNG",
    sFileName: "s13.PNG",
    eUrl: "/assets/aistudio/e13_30553b27.PNG",
    sUrl: "/assets/aistudio/s13_1dc5a72e.PNG",
    problemText: "4. A line AB, 65mm long has its end A 20mm above H.P. and 25mm in front of VP. The end B is 40mm above H.P. and 65mm in front of V.P. Draw the projections of AB and shows its inclination with H.P. and V.P.",
    engineeringVariables: {
      TL: 65,
      theta: 18,
      phi: 38,
      point1: { name: "A", aboveHP: 20, inFrontVP: 25 },
      point2: { name: "B", aboveHP: 40, inFrontVP: 65 }
    },
    shapesSummary: "Loci at 40mm above XY and 65mm below XY, end A at 20mm above and 25mm below, true length arcs 65mm, Ans: theta=18°, phi=38°",
    isActiveFewShot: true,
    createdAt: 1731000012000
  },
  {
    id: 14,
    name: "Pair 14: Given TL=90, θ=45°, β=60°, A in HP & 12mm VP",
    eFileName: "e14.PNG",
    sFileName: "s14.PNG",
    eUrl: "/assets/aistudio/e14_d8b37235.PNG",
    sUrl: "/assets/aistudio/s14_69ca6a5d.PNG",
    problemText: "6. A line AB, 90mm long, is inclined at 45 to the H.P. and its top view makes an angle of 60 with the V.P. The end A is in the H.P. and 12mm in front of V.P. Draw its front view and finds its true inclination with the V.P.",
    engineeringVariables: {
      TL: 90,
      theta: 45,
      beta: 60,
      phi: 38,
      point1: { name: "A", aboveHP: 0, inFrontVP: 12 }
    },
    shapesSummary: "Given TL=90mm, theta=45°, beta=60°, A in HP and 12mm in front of VP. True inclination with VP: phi=38°. Top view line inclined at 60°, locus lines, rotation arcs",
    isActiveFewShot: true,
    createdAt: 1731000013000
  }
];
