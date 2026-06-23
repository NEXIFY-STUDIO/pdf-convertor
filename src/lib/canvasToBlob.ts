/**
 * PDF HTML Forge - Canvas to Blob Conversion Utilities
 */

/**
 * Convert a canvas element to a Blob
 * @param canvas - The canvas element to convert
 * @param type - The MIME type for the image (default: 'image/png')
 * @param quality - The quality for image formats that support it (0-1, default: 1)
 * @returns Promise that resolves to the Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!canvas) {
      reject(new Error('Canvas element is required'));
      return;
    }

    if (quality < 0 || quality > 1) {
      reject(new Error('Quality must be between 0 and 1'));
      return;
    }

    // Check if canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      reject(new Error('Canvas has no content (width or height is 0)'));
      return;
    }

    // Use toBlob if available (preferred method)
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        type,
        quality
      );
      return;
    }

    // Fallback: convert to data URL and then to blob
    try {
      const dataUrl = canvas.toDataURL(type, quality);
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uintArray = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: mimeString });
      resolve(blob);
    } catch (error) {
      reject(new Error(`Failed to convert canvas to blob: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

/**
 * Convert a canvas element to a Blob URL
 * @param canvas - The canvas element to convert
 * @param type - The MIME type for the image (default: 'image/png')
 * @param quality - The quality for image formats that support it (0-1, default: 1)
 * @returns Promise that resolves to the Blob URL
 */
export function canvasToBlobUrl(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 1
): Promise<string> {
  return canvasToBlob(canvas, type, quality).then((blob) => {
    return URL.createObjectURL(blob);
  });
}

/**
 * Convert a canvas element to a data URL
 * @param canvas - The canvas element to convert
 * @param type - The MIME type for the image (default: 'image/png')
 * @param quality - The quality for image formats that support it (0-1, default: 1)
 * @returns The data URL string
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 1
): string {
  // Validate inputs
  if (!canvas) {
    throw new Error('Canvas element is required');
  }

  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be between 0 and 1');
  }

  // Check if canvas has content
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas has no content (width or height is 0)');
  }

  return canvas.toDataURL(type, quality);
}

/**
 * Get the dimensions of a canvas
 * @param canvas - The canvas element
 * @returns Object with width and height
 */
export function getCanvasDimensions(canvas: HTMLCanvasElement): { width: number; height: number } {
  return {
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Clear a canvas and release memory
 * @param canvas - The canvas element to clear
 */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  if (!canvas) return;
  
  // Clear the canvas
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Reset dimensions to free memory
  canvas.width = 1;
  canvas.height = 1;
}

/**
 * Create a new canvas with specified dimensions
 * @param width - The width of the canvas
 * @param height - The height of the canvas
 * @returns The new canvas element
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Resize a canvas
 * @param canvas - The canvas to resize
 * @param width - The new width
 * @param height - The new height
 * @param clear - Whether to clear the canvas after resizing (default: true)
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  clear: boolean = true
): void {
  canvas.width = width;
  canvas.height = height;
  
  if (clear) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
  }
}

export default {
  canvasToBlob,
  canvasToBlobUrl,
  canvasToDataUrl,
  getCanvasDimensions,
  clearCanvas,
  createCanvas,
  resizeCanvas,
};
