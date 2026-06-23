/**
 * PDF HTML Forge - PDF Conversion Logic
 * 
 * This module handles the conversion of PDF pages to images and text extraction.
 * It processes pages sequentially to reduce memory risk.
 */

import { 
  PDFDocumentProxy, 
  PDFPageProxy, 
  PageViewport,
  PDFDocumentInfo,
  renderTextLayer,
  TextItem as PdfjsTextItem,
  TextContent as PdfjsTextContent,
} from 'pdfjs-dist';
import { 
  ConversionMode, 
  RenderScale, 
  AppSettings, 
  PdfDocumentInfo, 
  PdfPageInfo,
  PageAsset,
  ConversionProgress,
} from '../types';
import { canvasToBlob, clearCanvas, createCanvas } from './canvasToBlob';
import { escapeHtml } from './escapeHtml';

/**
 * PDF conversion configuration
 */
export interface PdfConversionConfig {
  mode: ConversionMode;
  scale: RenderScale;
  includeTextLayer: boolean;
  maxCanvasPixels: number;
}

/**
 * Default PDF conversion configuration
 */
export const DEFAULT_CONVERSION_CONFIG: PdfConversionConfig = {
  mode: 'visual',
  scale: 2,
  includeTextLayer: true,
  maxCanvasPixels: 16777216, // 4096x4096
};

/**
 * Page rendering options for PDF.js
 */
interface RenderOptions {
  canvasContext: CanvasRenderingContext2D;
  viewport: PageViewport;
  transform?: number[];
  backgroundColor?: number;
}

/**
 * Convert a PDF document to page assets
 * @param pdfDocument - The PDF document to convert
 * @param settings - The conversion settings
 * @param onProgress - Callback for progress updates
 * @param onCancel - Callback to check if conversion should be cancelled
 * @returns Promise that resolves to the page assets
 */
export async function convertPdfDocument(
  pdfDocument: PDFDocumentProxy,
  settings: AppSettings,
  onProgress?: (progress: ConversionProgress) => void,
  onCancel?: () => boolean
): Promise<PageAsset[]> {
  const numPages = pdfDocument.numPages;
  const pageAssets: PageAsset[] = [];
  
  // Validate settings
  const config: PdfConversionConfig = {
    ...DEFAULT_CONVERSION_CONFIG,
    mode: settings.mode,
    scale: settings.scale,
    includeTextLayer: settings.includeTextLayer,
  };

  // Report initial progress
  if (onProgress) {
    onProgress({
      currentPage: 0,
      totalPages: numPages,
      percentage: 0,
      status: 'converting',
    });
  }

  // Process pages sequentially to reduce memory risk
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Check for cancellation
    if (onCancel && onCancel()) {
      if (onProgress) {
        onProgress({
          currentPage: pageNum - 1,
          totalPages: numPages,
          percentage: Math.round(((pageNum - 1) / numPages) * 100),
          status: 'cancelled',
        });
      }
      break;
    }

    try {
      // Load the page
      const page = await pdfDocument.getPage(pageNum);
      
      // Convert the page based on mode
      const pageAsset = await convertPdfPage(page, pageNum, config);
      pageAssets.push(pageAsset);
      
      // Clean up the page to free memory
      page.cleanup();
      page.destroy();

      // Report progress
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages: numPages,
          percentage: Math.round((pageNum / numPages) * 100),
          status: 'converting',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to convert page ${pageNum}:`, error);
      
      // Report error
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages: numPages,
          percentage: Math.round((pageNum / numPages) * 100),
          status: 'error',
          errorMessage: `Failed to convert page ${pageNum}: ${errorMessage}`,
        });
      }
      
      // Continue with remaining pages
      continue;
    }
  }

  // Report completion
  if (onProgress) {
    onProgress({
      currentPage: numPages,
      totalPages: numPages,
      percentage: 100,
      status: 'completed',
    });
  }

  return pageAssets;
}

/**
 * Convert a single PDF page to an asset
 * @param page - The PDF page to convert
 * @param pageNumber - The page number
 * @param config - The conversion configuration
 * @returns Promise that resolves to the page asset
 */
async function convertPdfPage(
  page: PDFPageProxy,
  pageNumber: number,
  config: PdfConversionConfig
): Promise<PageAsset> {
  // Get page dimensions
  const viewport = page.getViewport({ scale: config.scale });
  const width = Math.round(viewport.width);
  const height = Math.round(viewport.height);

  // Create canvas for rendering
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  try {
    // Render the page to canvas
    const renderContext: RenderOptions = {
      canvasContext: ctx,
      viewport: viewport,
      backgroundColor: 0xFFFFFF, // White background
    };

    await page.render(renderContext).promise;

    // Convert canvas to blob
    const imageBlob = await canvasToBlob(canvas, 'image/png', 1);
    const imageUrl = URL.createObjectURL(imageBlob);

    // Extract text if needed
    let textContent: string | undefined;
    
    if (config.mode === 'structured' || config.includeTextLayer) {
      textContent = await extractPageText(page);
    }

    // Create page asset
    const pageAsset: PageAsset = {
      pageNumber,
      imageBlob,
      imageUrl,
      textContent,
      width,
      height,
    };

    return pageAsset;
  } finally {
    // Clean up canvas to free memory
    clearCanvas(canvas);
  }
}

/**
 * Extract text from a PDF page
 * @param page - The PDF page to extract text from
 * @returns Promise that resolves to the extracted and escaped text
 */
async function extractPageText(page: PDFPageProxy): Promise<string> {
  try {
    // Get text content
    const textContent = await page.getTextContent();
    
    // Extract and concatenate all text items
    const textItems = textContent.items as PdfjsTextItem[];
    const textParts: string[] = [];
    
    for (const item of textItems) {
      if (item.str && item.str.trim()) {
        // Escape each text part to prevent XSS
        textParts.push(escapeHtml(item.str));
      }
    }
    
    // Join with spaces and clean up
    const fullText = textParts.join(' ');
    
    // Clean up multiple spaces and trim
    return fullText
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.warn('Failed to extract text from page:', error);
    return '';
  }
}

/**
 * Extract structured text content from a PDF page
 * @param page - The PDF page to extract text from
 * @returns Promise that resolves to the structured text content
 */
export async function extractStructuredText(
  page: PDFPageProxy
): Promise<PdfjsTextContent> {
  try {
    return await page.getTextContent();
  } catch (error) {
    console.warn('Failed to extract structured text:', error);
    return { items: [], styles: {} };
  }
}

/**
 * Get information about all pages in a PDF document
 * @param pdfDocument - The PDF document
 * @param scale - The scale to use for dimensions (default: 1)
 * @returns Promise that resolves to page information array
 */
export async function getPdfPageInfo(
  pdfDocument: PDFDocumentProxy,
  scale: RenderScale = 1
): Promise<PdfPageInfo[]> {
  const numPages = pdfDocument.numPages;
  const pageInfos: PdfPageInfo[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    pageInfos.push({
      number: pageNum,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      aspectRatio: viewport.width / viewport.height,
    });

    // Clean up
    page.cleanup();
    page.destroy();
  }

  return pageInfos;
}

/**
 * Get information about a PDF document
 * @param pdfDocument - The PDF document
 * @param file - The original file (for metadata)
 * @returns Promise that resolves to document information
 */
export async function getPdfDocumentInfo(
  pdfDocument: PDFDocumentProxy,
  file: File
): Promise<PdfDocumentInfo> {
  const numPages = pdfDocument.numPages;
  const pageInfos = await getPdfPageInfo(pdfDocument);

  return {
    numPages,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    pages: pageInfos,
  };
}

/**
 * Validate PDF conversion settings
 * @param settings - The settings to validate
 * @returns Validated settings
 */
export function validateConversionSettings(
  settings: Partial<AppSettings>
): AppSettings {
  return {
    mode: settings.mode || 'visual',
    scale: settings.scale || 2,
    includeTextLayer: settings.includeTextLayer ?? true,
    includeOriginalPdf: settings.includeOriginalPdf ?? false,
  };
}

/**
 * Estimate memory usage for PDF conversion
 * @param numPages - Number of pages
 * @param scale - Render scale
 * @param averagePageSize - Average page size in pixels (width * height)
 * @returns Estimated memory usage in bytes
 */
export function estimateMemoryUsage(
  numPages: number,
  scale: RenderScale,
  averagePageSize: number = 600 * 800 // A4 at 72 DPI
): number {
  // Estimate: each pixel uses 4 bytes (RGBA), plus overhead
  const bytesPerPixel = 4;
  const overheadFactor = 1.5; // Overhead for canvas, blobs, etc.
  
  const totalPixels = numPages * averagePageSize * (scale * scale);
  const memoryBytes = totalPixels * bytesPerPixel * overheadFactor;
  
  return Math.round(memoryBytes);
}

/**
 * Check if a PDF can be safely converted with current settings
 * @param numPages - Number of pages
 * @param scale - Render scale
 * @param maxMemory - Maximum available memory in bytes
 * @returns True if the conversion can proceed safely
 */
export function canConvertSafely(
  numPages: number,
  scale: RenderScale,
  maxMemory: number = 2 * 1024 * 1024 * 1024 // 2GB default
): boolean {
  const estimatedMemory = estimateMemoryUsage(numPages, scale);
  return estimatedMemory < maxMemory;
}

export default {
  convertPdfDocument,
  convertPdfPage,
  extractPageText,
  extractStructuredText,
  getPdfPageInfo,
  getPdfDocumentInfo,
  validateConversionSettings,
  estimateMemoryUsage,
  canConvertSafely,
};
