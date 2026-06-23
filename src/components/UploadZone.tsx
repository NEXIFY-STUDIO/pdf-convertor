/**
 * PDF HTML Forge - Upload Zone Component
 * 
 * Handles PDF file upload via drag and drop or file input.
 */

import React, { useState, useCallback, useRef } from 'react';
import { isPdfFile, isPdfMimeType, formatFileSize } from '../lib/fileSize';
import { validatePdfFile } from '../lib/pdfWorker';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

interface DragState {
  isDragging: boolean;
  dragCounter: number;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFileUpload,
  onError,
  isProcessing,
  disabled = false,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragCounter: 0,
  });
  const [fileInputKey, setFileInputKey] = useState<string>('file-input');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing) return;
    
    setDragState(prev => ({
      isDragging: true,
      dragCounter: prev.dragCounter + 1,
    }));
  }, [disabled, isProcessing]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing) return;
    
    // Set drop effect
    e.dataTransfer.dropEffect = 'copy';
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing) return;
    
    setDragState(prev => {
      const newCounter = prev.dragCounter - 1;
      return {
        isDragging: newCounter > 0,
        dragCounter: newCounter,
      };
    });
  }, [disabled, isProcessing]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing) return;
    
    // Reset drag state
    setDragState({ isDragging: false, dragCounter: 0 });
    
    // Get files from data transfer
    const files = e.dataTransfer.files;
    
    if (files.length === 0) {
      onError('No files were dropped');
      return;
    }
    
    // Handle the first PDF file
    const pdfFile = await findAndValidatePdfFile(files);
    
    if (pdfFile) {
      onFileUpload(pdfFile);
    } else {
      onError('No valid PDF file found in the dropped files');
    }
  }, [disabled, isProcessing, onFileUpload, onError]);

  // Handle file input change
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    // Handle the first PDF file
    const pdfFile = await findAndValidatePdfFile(files);
    
    if (pdfFile) {
      onFileUpload(pdfFile);
      // Reset file input to allow selecting the same file again
      setFileInputKey(`file-input-${Date.now()}`);
    } else {
      onError('No valid PDF file found. Please select a PDF file.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onFileUpload, onError]);

  // Find and validate PDF file from file list
  const findAndValidatePdfFile = useCallback(async (files: FileList): Promise<File | null> => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file extension and MIME type
      if (isPdfFile(file.name) || isPdfMimeType(file.type)) {
        // Validate it's actually a PDF
        const isValid = await validatePdfFile(file);
        if (isValid) {
          return file;
        }
      }
    }
    
    return null;
  }, []);

  // Trigger file input click
  const handleUploadClick = useCallback(() => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isProcessing]);

  // Handle paste event
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled || isProcessing) return;
    
    const files = e.clipboardData.files;
    
    if (files.length === 0) return;
    
    const pdfFile = await findAndValidatePdfFile(files);
    
    if (pdfFile) {
      onFileUpload(pdfFile);
    }
  }, [disabled, isProcessing, findAndValidatePdfFile, onFileUpload]);

  return (
    <div
      ref={dropZoneRef}
      className={`upload-zone ${dragState.isDragging ? 'dragging' : ''} ${disabled || isProcessing ? 'disabled' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={handleUploadClick}
    >
      <input
        key={fileInputKey}
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || isProcessing}
      />
      
      <div className="upload-content">
        <div className="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        
        <h3>Upload PDF</h3>
        
        <p className="upload-description">
          {dragState.isDragging 
            ? 'Drop your PDF file here' 
            : 'Drag & drop your PDF file here or click to browse'}
        </p>
        
        <p className="upload-hint">
          Supports single PDF files up to 100MB
        </p>
        
        {disabled && (
          <p className="upload-disabled">
            Upload is disabled while processing
          </p>
        )}
      </div>
    </div>
  );
};

export default React.memo(UploadZone);
