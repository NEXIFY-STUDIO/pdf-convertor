/**
 * PDF HTML Forge - PDF.js Worker Setup
 * 
 * This module handles the PDF.js worker setup and provides a singleton
 * worker instance for PDF processing.
 */

import { 
  getDocument, 
  GlobalWorkerOptions, 
  version as pdfjsVersion,
  PDFDocumentProxy,
} from 'pdfjs-dist';

// Use Vite's recommended way to resolve worker URL
const workerUrl = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// Initialize worker immediately to prevent PDF.js from falling back to CDN
GlobalWorkerOptions.workerSrc = workerUrl;

// Set the worker path
const CDN_WORKER_URL = workerUrl;

/**
 * PDF.js worker configuration
 */
export interface PdfWorkerConfig {
  workerUrl: string;
  useLocalWorker: boolean;
  maxCanvasPixels: number;
}

/**
 * Default PDF.js worker configuration
 */
export const DEFAULT_PDF_WORKER_CONFIG: PdfWorkerConfig = {
  workerUrl: CDN_WORKER_URL,
  useLocalWorker: false,
  maxCanvasPixels: 16777216, // 4096x4096 - default PDF.js limit
};

/**
 * Current worker configuration
 */
let currentConfig: PdfWorkerConfig = { ...DEFAULT_PDF_WORKER_CONFIG };

/**
 * Whether the worker has been initialized
 */
let isWorkerInitialized = false;

/**
 * Initialize the PDF.js worker
 * @param config - Optional worker configuration
 */
export function initializePdfWorker(config?: Partial<PdfWorkerConfig>): void {
  if (isWorkerInitialized) {
    console.warn('PDF.js worker is already initialized');
    return;
  }

  // Merge configuration
  currentConfig = {
    ...DEFAULT_PDF_WORKER_CONFIG,
    ...config,
  };

  // Set global worker options
  if (currentConfig.workerUrl) {
    GlobalWorkerOptions.workerSrc = currentConfig.workerUrl;
  }
  
  // Set max canvas pixels to prevent memory issues
  if ('maxCanvasPixels' in GlobalWorkerOptions) {
    (GlobalWorkerOptions as any).maxCanvasPixels = currentConfig.maxCanvasPixels;
  }

  isWorkerInitialized = true;
  
  console.log(`PDF.js worker initialized with version ${pdfjsVersion}`);
  console.log(`Worker URL: ${currentConfig.workerUrl}`);
  console.log(`Max canvas pixels: ${currentConfig.maxCanvasPixels}`);
}

/**
 * Get the current worker configuration
 * @returns The current worker configuration
 */
export function getWorkerConfig(): PdfWorkerConfig {
  return { ...currentConfig };
}

/**
 * Check if the worker is initialized
 * @returns True if the worker is initialized
 */
export function isWorkerReady(): boolean {
  return isWorkerInitialized;
}

/**
 * Get the PDF.js version
 * @returns The PDF.js version string
 */
export function getPdfJsVersion(): string {
  return pdfjsVersion;
}

/**
 * Load a PDF document from a file
 * @param file - The PDF file to load
 * @param password - Optional password for protected PDFs
 * @returns Promise that resolves to the PDF document proxy
 */
export async function loadPdfDocument(
  file: File | ArrayBuffer | Uint8Array | string,
  password: string = ''
): Promise<PDFDocumentProxy> {
  // Ensure worker is initialized
  if (!isWorkerInitialized) {
    initializePdfWorker();
  }

  try {
    // Handle different input types
    if (typeof file === 'string') {
      // URL or base64 string
      const response = await fetch(file);
      const arrayBuffer = await response.arrayBuffer();
      return await getDocument({ data: arrayBuffer, password }).promise;
    } else if (file instanceof File) {
      // File object
      const arrayBuffer = await file.arrayBuffer();
      return await getDocument({ data: arrayBuffer, password }).promise;
    } else if (file instanceof ArrayBuffer) {
      // ArrayBuffer
      return await getDocument({ data: file, password }).promise;
    } else if (file instanceof Uint8Array) {
      // Uint8Array
      return await getDocument({ data: file, password }).promise;
    } else {
      throw new Error('Unsupported file type for PDF loading');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle specific PDF.js errors
    if (errorMessage.includes('password')) {
      throw new Error('PDF is password protected. Please provide the correct password.');
    } else if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
      throw new Error('The PDF file appears to be corrupt or invalid.');
    } else if (errorMessage.includes('maxCanvasPixels')) {
      throw new Error('PDF page is too large to render. Try a smaller PDF or reduce the render scale.');
    }
    
    throw new Error(`Failed to load PDF document: ${errorMessage}`);
  }
}

/**
 * Load a PDF document from a URL
 * @param url - The URL of the PDF file
 * @param password - Optional password for protected PDFs
 * @returns Promise that resolves to the PDF document proxy
 */
export async function loadPdfFromUrl(
  url: string,
  password: string = ''
): Promise<PDFDocumentProxy> {
  // Ensure worker is initialized
  if (!isWorkerInitialized) {
    initializePdfWorker();
  }

  try {
    // Add CORS mode for cross-origin requests
    const loadingTask = getDocument({
      url,
      password,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/cmaps/`,
      cMapPacked: true,
    });
    
    return await loadingTask.promise;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load PDF from URL: ${errorMessage}`);
  }
}

/**
 * Validate that a file is a PDF
 * @param file - The file to validate
 * @returns Promise that resolves to true if the file is a valid PDF
 */
export async function validatePdfFile(file: File): Promise<boolean> {
  if (!file) return false;
  
  // Check file type by extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return false;
  }
  
  // Check MIME type
  if (file.type !== 'application/pdf' && file.type !== '') {
    // Some browsers don't set the type for PDFs, so we need to check the content
    const buffer = await file.slice(0, 4).arrayBuffer();
    const view = new Uint8Array(buffer);
    
    // PDF magic number: %PDF
    if (view.length >= 4 && 
        view[0] === 0x25 && // %
        view[1] === 0x50 && // P
        view[2] === 0x44 && // D
        view[3] === 0x46) { // F
      return true;
    }
    
    return false;
  }
  
  return true;
}

/**
 * Get PDF document metadata
 * @param pdfDocument - The PDF document proxy
 * @returns Promise that resolves to the document metadata
 */
export async function getPdfMetadata(pdfDocument: PDFDocumentProxy): Promise<any> {
  try {
    return await pdfDocument.getMetadata();
  } catch (error) {
    console.warn('Failed to get PDF metadata:', error);
    // Return empty metadata
    return {
      info: {},
      metadata: new Map(),
    };
  }
}

/**
 * Destroy a PDF document and release resources
 * @param pdfDocument - The PDF document to destroy
 */
export function destroyPdfDocument(pdfDocument: PDFDocumentProxy): void {
  try {
    pdfDocument.destroy();
    console.log('PDF document destroyed');
  } catch (error) {
    console.warn('Failed to destroy PDF document:', error);
  }
}

/**
 * Reset the PDF worker (useful for testing or cleanup)
 */
export function resetPdfWorker(): void {
  isWorkerInitialized = false;
  currentConfig = { ...DEFAULT_PDF_WORKER_CONFIG };
  
  // Reset global worker options
  GlobalWorkerOptions.workerSrc = '';
  if ('maxCanvasPixels' in GlobalWorkerOptions) {
    (GlobalWorkerOptions as any).maxCanvasPixels = 16777216;
  }
  
  console.log('PDF.js worker reset');
}

export default {
  initializePdfWorker,
  getWorkerConfig,
  isWorkerReady,
  getPdfJsVersion,
  loadPdfDocument,
  loadPdfFromUrl,
  validatePdfFile,
  getPdfMetadata,
  destroyPdfDocument,
  resetPdfWorker,
};
