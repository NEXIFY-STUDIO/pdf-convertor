// PDF HTML Forge - Type Definitions

export type ConversionMode = 'visual' | 'structured';

export type RenderScale = 1 | 2 | 3 | 4;

export interface AppSettings {
  mode: ConversionMode;
  scale: RenderScale;
  includeTextLayer: boolean;
  includeOriginalPdf: boolean;
}

export interface PdfPageInfo {
  number: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface PdfDocumentInfo {
  numPages: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  pages: PdfPageInfo[];
}

export interface ConversionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  status: 'idle' | 'converting' | 'completed' | 'error' | 'cancelled';
  errorMessage?: string;
}

export interface PageAsset {
  pageNumber: number;
  imageBlob: Blob;
  imageUrl: string;
  textContent?: string;
  width: number;
  height: number;
}

export interface ExportResult {
  zipBlob: Blob;
  fileName: string;
}

export interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  numPages: number;
  fileName: string;
  fileSize: number;
  exportDate: string;
  mode: ConversionMode;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  fontSize: number;
}

export interface TextContent {
  items: TextItem[];
  styles: Record<string, unknown>;
}

export interface PageText {
  pageNumber: number;
  content: TextContent;
}
