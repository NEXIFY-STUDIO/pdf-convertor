/**
 * PDF HTML Forge - Progress Panel Component
 * 
 * Displays conversion progress and controls.
 */

import React, { useEffect, useState } from 'react';
import { ConversionProgress, PdfDocumentInfo } from '../types';
import { formatFileSize } from '../lib/fileSize';

interface ProgressPanelProps {
  progress: ConversionProgress;
  documentInfo?: PdfDocumentInfo;
  onCancel: () => void;
  onExport: () => void;
  onClear: () => void;
  exportDisabled?: boolean;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({
  progress,
  documentInfo,
  onCancel,
  onExport,
  onClear,
  exportDisabled = true,
}) => {
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(true);

  // Disable animations when not converting
  useEffect(() => {
    setAnimationEnabled(progress.status === 'converting');
  }, [progress.status]);

  // Format progress message
  const getProgressMessage = (): string => {
    switch (progress.status) {
      case 'idle':
        return 'Ready to convert';
      case 'converting':
        return `Converting page ${progress.currentPage} of ${progress.totalPages}...`;
      case 'completed':
        return 'Conversion complete!';
      case 'error':
        return `Error: ${progress.errorMessage || 'Unknown error'}`;
      case 'cancelled':
        return 'Conversion cancelled';
      default:
        return 'Processing...';
    }
  };

  // Format percentage
  const getPercentageText = (): string => {
    if (progress.status === 'idle') return '';
    if (progress.status === 'error') return '';
    if (progress.status === 'cancelled') return '';
    return `${progress.percentage}%`;
  };

  // Check if cancel button should be shown
  const showCancelButton = progress.status === 'converting';

  // Check if export button should be shown
  const showExportButton = progress.status === 'completed';

  // Check if clear button should be shown
  const showClearButton = progress.status === 'completed' || progress.status === 'error' || progress.status === 'cancelled';

  return (
    <div className="progress-panel">
      {documentInfo && (
        <div className="document-summary">
          <h3>{documentInfo.fileName}</h3>
          <p className="document-stats">
            <span>{documentInfo.numPages} pages</span> | 
            <span>{formatFileSize(documentInfo.fileSize)}</span>
          </p>
        </div>
      )}

      <div className="progress-container">
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${progress.status}`}
            style={{
              width: `${progress.percentage}%`,
              transition: animationEnabled ? 'width 0.3s ease' : 'none',
            }}
          />
          <span className="progress-percentage">{getPercentageText()}</span>
        </div>
        
        <p className={`progress-message ${progress.status}`}>
          {getProgressMessage()}
        </p>
      </div>

      <div className="progress-actions">
        {showCancelButton && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel Conversion
          </button>
        )}

        {showExportButton && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onExport}
            disabled={exportDisabled}
          >
            Export HTML ZIP
          </button>
        )}

        {showClearButton && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProgressPanel);
