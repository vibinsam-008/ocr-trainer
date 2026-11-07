/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CanvasPreprocessorOptions } from '../types/edraw';

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  luma: number[];
}

export function computeHistogram(imageData: ImageData): HistogramData {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const luma = new Array(256).fill(0);

  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const lum = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

    r[red]++;
    g[green]++;
    b[blue]++;
    luma[lum]++;
  }

  return { r, g, b, luma };
}

export function processImageOnCanvas(
  sourceImage: HTMLImageElement,
  options: CanvasPreprocessorOptions
): { canvas: HTMLCanvasElement; dataUrl: string; histogram: HistogramData } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Determine base dimensions with rotation
  const isRotated90or270 = options.rotation === 90 || options.rotation === 270;
  let baseWidth = isRotated90or270 ? sourceImage.naturalHeight : sourceImage.naturalWidth;
  let baseHeight = isRotated90or270 ? sourceImage.naturalWidth : sourceImage.naturalHeight;

  // Handle crop
  let sx = 0;
  let sy = 0;
  let sWidth = sourceImage.naturalWidth;
  let sHeight = sourceImage.naturalHeight;

  if (options.crop) {
    sx = Math.max(0, options.crop.x);
    sy = Math.max(0, options.crop.y);
    sWidth = Math.min(sourceImage.naturalWidth - sx, options.crop.width);
    sHeight = Math.min(sourceImage.naturalHeight - sy, options.crop.height);
    baseWidth = isRotated90or270 ? sHeight : sWidth;
    baseHeight = isRotated90or270 ? sWidth : sHeight;
  }

  canvas.width = baseWidth;
  canvas.height = baseHeight;

  // Draw source image with rotation and crop
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((options.rotation * Math.PI) / 180);

  const drawW = isRotated90or270 ? canvas.height : canvas.width;
  const drawH = isRotated90or270 ? canvas.width : canvas.height;

  ctx.drawImage(
    sourceImage,
    sx,
    sy,
    sWidth,
    sHeight,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
  );
  ctx.restore();

  // Pixel manipulation
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const pixelCount = canvas.width * canvas.height;

  // 1. Auto-contrast (percentile histogram stretching)
  let minLuma = 0;
  let maxLuma = 255;

  if (options.autoContrast) {
    const lumaCounts = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      lumaCounts[lum]++;
    }

    const lowCutoff = pixelCount * 0.02; // 2% cutoff
    const highCutoff = pixelCount * 0.98; // 98% cutoff
    let accum = 0;

    for (let i = 0; i < 256; i++) {
      accum += lumaCounts[i];
      if (accum >= lowCutoff && minLuma === 0) {
        minLuma = i;
      }
      if (accum >= highCutoff) {
        maxLuma = i;
        break;
      }
    }
    if (maxLuma <= minLuma) {
      minLuma = 0;
      maxLuma = 255;
    }
  }

  // 2. Brightness & Contrast factor
  const contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
  const brightnessOffset = options.brightness * 1.5;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Auto-contrast stretch
    if (options.autoContrast && maxLuma > minLuma) {
      r = Math.min(255, Math.max(0, ((r - minLuma) / (maxLuma - minLuma)) * 255));
      g = Math.min(255, Math.max(0, ((g - minLuma) / (maxLuma - minLuma)) * 255));
      b = Math.min(255, Math.max(0, ((b - minLuma) / (maxLuma - minLuma)) * 255));
    }

    // Manual Contrast & Brightness
    r = contrastFactor * (r - 128) + 128 + brightnessOffset;
    g = contrastFactor * (g - 128) + 128 + brightnessOffset;
    b = contrastFactor * (b - 128) + 128 + brightnessOffset;

    // Invert
    if (options.invertColors) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    // High-contrast Thresholding
    if (options.thresholding) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const val = lum >= options.thresholdValue ? 255 : 0;
      r = val;
      g = val;
      b = val;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  // 3. Sharpening filter (Convolution kernel)
  if (options.sharpening > 0) {
    applySharpenKernel(data, canvas.width, canvas.height, options.sharpening);
  }

  ctx.putImageData(imageData, 0, 0);

  const histogram = computeHistogram(imageData);
  const dataUrl = canvas.toDataURL('image/png', 0.95);

  return { canvas, dataUrl, histogram };
}

function applySharpenKernel(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  level: number
): void {
  // Level 1 = 1x sharpening, Level 2 = 2x sharpening, Level 3 = 3x sharpening
  // Unsharp mask kernel: center weight = 1 + 4*factor, neighbors = -factor
  const factor = level * 0.35;
  const centerWeight = 1 + 4 * factor;
  const edgeWeight = -factor;

  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * w + x) * 4 + c];
        const bottom = copy[((y + 1) * w + x) * 4 + c];
        const left = copy[(y * w + (x - 1)) * 4 + c];
        const right = copy[(y * w + (x + 1)) * 4 + c];
        const center = copy[idx + c];

        const val =
          center * centerWeight +
          (top + bottom + left + right) * edgeWeight;

        data[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
}
