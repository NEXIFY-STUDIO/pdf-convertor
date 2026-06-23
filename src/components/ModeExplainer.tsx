/**
 * PDF HTML Forge - Mode Explainer Component
 * 
 * Provides clear explanation of fidelity limitations for each conversion mode.
 */

import React, { useState } from 'react';
import { ConversionMode } from '../types';

interface ModeExplainerProps {
  currentMode: ConversionMode;
}

const ModeExplainer: React.FC<ModeExplainerProps> = ({ currentMode }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getModeInfo = () => {
    if (currentMode === 'visual') {
      return {
        title: 'Visual Fidelity Mode',
        description: 'The recommended mode for accurate visual representation.',
        features: [
          'Each PDF page is rendered to a high-quality PNG image',
          'Preserves exact page size, aspect ratio, and layout',
          'Maintains visual appearance including colors, fonts, and graphics',
          'Optionally includes a transparent selectable text layer',
          'Works offline and produces static HTML/CSS',
        ],
        limitations: [
          'Text is not editable (it\'s part of the image)',
          'Larger file size due to images',
          'Text selection requires the text layer option',
        ],
        useCase: 'Best for preserving the exact visual appearance of the PDF.',
      };
    } else {
      return {
        title: 'Experimental Structured HTML Mode',
        description: 'An experimental mode that extracts text and creates semantic HTML.',
        features: [
          'Extracts text content from the PDF',
          'Produces readable, semantic-ish HTML',
          'Smaller file size (no images)',
          'Text is fully selectable and editable',
        ],
        limitations: [
          'Lower visual fidelity - layout may not match the original PDF',
          'Complex layouts, columns, and positioning may be lost',
          'Images and graphics are not preserved',
          'Fonts and styling may differ from the original',
          'Not suitable for visually accurate representations',
        ],
        useCase: 'Best for extracting text content when visual appearance is not critical.',
      };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="mode-explainer">
      <button
        type="button"
        className="explainer-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="explainer-icon">
          {isExpanded ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18,15 12,9 6,15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          )}
        </span>
        <span className="explainer-title">{modeInfo.title}</span>
      </button>

      {isExpanded && (
        <div className="explainer-content">
          <p className="explainer-description">{modeInfo.description}</p>

          <div className="explainer-section">
            <h4>Features</h4>
            <ul className="explainer-list">
              {modeInfo.features.map((feature, index) => (
                <li key={`feature-${index}`} className="explainer-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="explainer-section">
            <h4>Limitations</h4>
            <ul className="explainer-list">
              {modeInfo.limitations.map((limitation, index) => (
                <li key={`limitation-${index}`} className="explainer-item warning">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="explainer-use-case">{modeInfo.useCase}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ModeExplainer);
