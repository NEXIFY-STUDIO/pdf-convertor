/**
 * PDF HTML Forge - Main Application Component
 * 
 * This is the main React component that orchestrates the PDF conversion workflow.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ConversionMode, 
  RenderScale, 
  AppSettings, 
  PdfDocumentInfo, 
  PageAsset, 
  ConversionProgress,
  ExportResult,
} from './types';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { 
  initializePdfWorker, 
  loadPdfDocument, 
  validatePdfFile,
  destroyPdfDocument,
} from './lib/pdfWorker';
import { isPdfFile } from './lib/fileSize';
import { 
  convertPdfDocument,
  getPdfDocumentInfo,
  validateConversionSettings,
  canConvertSafely,
} from './lib/pdfConverter';
import { 
  generateHtmlExport,
  downloadExport,
  cleanupExportResources,
} from './lib/htmlExport';
import UploadZone from './components/UploadZone';
import SettingsPanel from './components/SettingsPanel';
import ProgressPanel from './components/ProgressPanel';
import PreviewGrid from './components/PreviewGrid';
import ModeExplainer from './components/ModeExplainer';

/**
 * Maximum file size in bytes (100MB)
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Main application component
 */
const App: React.FC = () => {
  // State for PDF file
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // State for PDF document
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  
  // State for document information
  const [documentInfo, setDocumentInfo] = useState<PdfDocumentInfo | null>(null);
  
  // State for page assets
  const [pageAssets, setPageAssets] = useState<PageAsset[]>([]);
  
  // State for conversion settings
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'visual',
    scale: 2,
    includeTextLayer: true,
    includeOriginalPdf: false,
  });
  
  // State for conversion progress
  const [progress, setProgress] = useState<ConversionProgress>({
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    status: 'idle',
  });
  
  // State for errors
  const [error, setError] = useState<string | null>(null);
  
  // State for export result
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  
  // Ref for cancellation
  const cancelRef = useRef<boolean>(false);
  
  // Initialize PDF.js worker on mount
  useEffect(() => {
    initializePdfWorker();
    
    // Cleanup on unmount
    return () => {
      // Clean up any resources
      if (pdfDocument) {
        destroyPdfDocument(pdfDocument);
      }
      cleanupExportResources(pageAssets);
    };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    // Clear previous state
    clearState();
    
    // Validate file
    if (!isPdfFile(file.name) && !file.type.includes('pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    // Validate it's actually a PDF
    const isValid = await validatePdfFile(file);
    if (!isValid) {
      setError('The selected file is not a valid PDF.');
      return;
    }
    
    // Store the file
    setPdfFile(file);
    setError(null);
    
    // Load the PDF document
    try {
      setProgress({ ...progress, status: 'converting', percentage: 0 });
      
      const pdfDoc = await loadPdfDocument(file);
      setPdfDocument(pdfDoc);
      
      // Get document info
      const docInfo = await getPdfDocumentInfo(pdfDoc, file);
      setDocumentInfo(docInfo);
      
      // Check if we can convert safely
      const canConvert = canConvertSafely(docInfo.numPages, settings.scale);
      if (!canConvert) {
        setError('This PDF may be too large to convert with the current settings. Try reducing the scale.');
        destroyPdfDocument(pdfDoc);
        setPdfDocument(null);
        return;
      }
      
      // Set total pages for progress
      setProgress({
        currentPage: 0,
        totalPages: docInfo.numPages,
        percentage: 0,
        status: 'idle',
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load PDF: ${errorMessage}`);
      clearState();
    }
  }, [settings.scale, progress]);

  // Handle conversion start
  const handleConvert = useCallback(async () => {
    if (!pdfDocument || !pdfFile) {
      setError('No PDF file loaded for conversion.');
      return;
    }
    
    // Reset cancellation flag
    cancelRef.current = false;
    
    // Validate settings
    const validatedSettings = validateConversionSettings(settings);
    setSettings(validatedSettings);
    
    // Clear previous page assets
    cleanupExportResources(pageAssets);
    setPageAssets([]);
    
    // Set converting status
    setProgress({
      currentPage: 0,
      totalPages: pdfDocument.numPages,
      percentage: 0,
      status: 'converting',
    });
    
    setError(null);
    
    try {
      // Convert the PDF document
      const assets = await convertPdfDocument(
        pdfDocument,
        validatedSettings,
        (progressUpdate) => {
          setProgress(progressUpdate);
          
          // Check for cancellation
          if (progressUpdate.status === 'cancelled') {
            cancelRef.current = true;
          }
        },
        () => cancelRef.current
      );
      
      // Check if conversion was cancelled
      if (cancelRef.current) {
        cleanupExportResources(assets);
        setProgress({ ...progress, status: 'cancelled' });
        return;
      }
      
      // Store the page assets
      setPageAssets(assets);
      
      // Update progress to completed
      setProgress({
        currentPage: pdfDocument.numPages,
        totalPages: pdfDocument.numPages,
        percentage: 100,
        status: 'completed',
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Conversion failed: ${errorMessage}`);
      setProgress({ ...progress, status: 'error', errorMessage });
      cleanupExportResources(pageAssets);
      setPageAssets([]);
    }
  }, [pdfDocument, pdfFile, settings, pageAssets, progress]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (pageAssets.length === 0 || !documentInfo) {
      setError('No pages to export.');
      return;
    }
    
    try {
      setProgress({ ...progress, status: 'converting' });
      
      // Generate the HTML export
      const exportConfig = {
        mode: settings.mode,
        scale: settings.scale,
        includeTextLayer: settings.includeTextLayer,
        includeOriginalPdf: settings.includeOriginalPdf,
        originalPdf: pdfFile || undefined,
      };
      
      const result = await generateHtmlExport(pageAssets, documentInfo, exportConfig);
      setExportResult(result);
      
      // Download the export
      downloadExport(result);
      
      // Update progress
      setProgress({ ...progress, status: 'completed' });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Export failed: ${errorMessage}`);
      setProgress({ ...progress, status: 'error', errorMessage });
    }
  }, [pageAssets, documentInfo, settings, pdfFile, progress]);

  // Handle cancel conversion
  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    setProgress({ ...progress, status: 'cancelled' });
  }, [progress]);

  // Handle clear
  const handleClear = useCallback(() => {
    clearState();
  }, []);

  // Clear all state
  const clearState = useCallback(() => {
    // Clean up resources
    if (pdfDocument) {
      destroyPdfDocument(pdfDocument);
      setPdfDocument(null);
    }
    
    cleanupExportResources(pageAssets);
    
    // Reset state
    setPdfFile(null);
    setDocumentInfo(null);
    setPageAssets([]);
    setExportResult(null);
    setError(null);
    setProgress({
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
      status: 'idle',
    });
    
    cancelRef.current = false;
  }, [pdfDocument, pageAssets]);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
  }, []);

  // Handle error dismiss
  const handleErrorDismiss = useCallback(() => {
    setError(null);
  }, []);

  // Check if we should start conversion automatically
  useEffect(() => {
    if (pdfDocument && pdfFile && progress.status === 'idle' && pageAssets.length === 0) {
      // Auto-start conversion when PDF is loaded
      handleConvert();
    }
  }, [pdfDocument, pdfFile, progress.status, pageAssets.length, handleConvert]);

  // Determine if we're processing
  const isProcessing = progress.status === 'converting' || progress.status === 'cancelled';

  // Determine if export is disabled
  const exportDisabled = pageAssets.length === 0 || progress.status !== 'completed';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-branding">
          <h1>PDF HTML Forge</h1>
          <p className="app-tagline">Convert PDFs to visually accurate offline HTML</p>
        </div>
        <div className="app-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => window.open('https://github.com/youh4ck3dme/AAA-pdf--convertor', '_blank')}
            title="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* Error display */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="error-message">{error}</span>
              <button 
                type="button" 
                className="error-dismiss"
                onClick={handleErrorDismiss}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Upload zone */}
        {!pdfFile && !isProcessing && (
          <div className="upload-section">
            <UploadZone
              onFileUpload={handleFileUpload}
              onError={setError}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Settings panel */}
        {(pdfFile || pageAssets.length > 0) && (
          <div className="settings-section">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              disabled={isProcessing}
            />
            
            <ModeExplainer currentMode={settings.mode} />
          </div>
        )}

        {/* Progress panel */}
        {(pdfFile || pageAssets.length > 0) && (
          <div className="progress-section">
            <ProgressPanel
              progress={progress}
              documentInfo={documentInfo}
              onCancel={handleCancel}
              onExport={handleExport}
              onClear={handleClear}
              exportDisabled={exportDisabled}
            />
          </div>
        )}

        {/* Preview grid */}
        {pageAssets.length > 0 && (
          <div className="preview-section">
            <h3>Page Previews</h3>
            <PreviewGrid 
              pageAssets={pageAssets} 
              onPreviewClick={(pageNumber) => {
                // Could implement page preview modal here
                console.log('Preview page:', pageNumber);
              }}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          PDF HTML Forge v1.0.0 | 
          <a href="https://github.com/youh4ck3dme/AAA-pdf--convertor" target="_blank" rel="noopener noreferrer">
            Open Source
          </a> | 
          Browser-only PDF to HTML conversion
        </p>
      </footer>
    </div>
  );
};

export default App;
