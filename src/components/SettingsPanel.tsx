/**
 * PDF HTML Forge - Settings Panel Component
 * 
 * Provides conversion settings controls.
 */

import React, { useCallback } from 'react';
import { ConversionMode, RenderScale, AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  disabled?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  const handleModeChange = useCallback((mode: ConversionMode) => {
    onSettingsChange({ ...settings, mode });
  }, [settings, onSettingsChange]);

  const handleScaleChange = useCallback((scale: RenderScale) => {
    onSettingsChange({ ...settings, scale });
  }, [settings, onSettingsChange]);

  const handleTextLayerToggle = useCallback(() => {
    onSettingsChange({ 
      ...settings, 
      includeTextLayer: !settings.includeTextLayer 
    });
  }, [settings, onSettingsChange]);

  const handleOriginalPdfToggle = useCallback(() => {
    onSettingsChange({ 
      ...settings, 
      includeOriginalPdf: !settings.includeOriginalPdf 
    });
  }, [settings, onSettingsChange]);

  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Conversion Settings</h3>
      
      <div className="settings-section">
        <label className="settings-label">Conversion Mode</label>
        <div className="mode-options">
          <button
            type="button"
            className={`mode-option ${settings.mode === 'visual' ? 'active' : ''}`}
            onClick={() => handleModeChange('visual')}
            disabled={disabled}
            title="Visual Fidelity Mode: Renders each page as an image, preserving exact visual appearance"
          >
            <span className="mode-name">Visual Fidelity</span>
            <span className="mode-badge">Recommended</span>
          </button>
          
          <button
            type="button"
            className={`mode-option ${settings.mode === 'structured' ? 'active' : ''}`}
            onClick={() => handleModeChange('structured')}
            disabled={disabled}
            title="Experimental Structured HTML Mode: Extracts text and creates semantic-ish HTML with lower visual fidelity"
          >
            <span className="mode-name">Structured HTML</span>
            <span className="mode-badge experimental">Experimental</span>
          </button>
        </div>
        
        <p className="mode-description">
          {settings.mode === 'visual' 
            ? 'Renders each PDF page to a high-quality image. Preserves page size, aspect ratio, order, layout, and visual appearance.'
            : 'Extracts text from the PDF and produces readable semantic-ish HTML. Visual fidelity may be lower.'}
        </p>
      </div>

      <div className="settings-section">
        <label className="settings-label">Render Scale</label>
        <div className="scale-options">
          {[1, 2, 3, 4].map((scale) => (
            <button
              key={scale}
              type="button"
              className={`scale-option ${settings.scale === scale ? 'active' : ''}`}
              onClick={() => handleScaleChange(scale as RenderScale)}
              disabled={disabled}
              title={`${scale}x scale - Higher scales produce larger images with better quality but increase file size`}
            >
              {scale}x
            </button>
          ))}
        </div>
        <p className="settings-hint">
          Higher scales produce larger images with better quality but increase file size
        </p>
      </div>

      <div className="settings-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.includeTextLayer}
            onChange={handleTextLayerToggle}
            disabled={disabled || settings.mode === 'structured'}
          />
          <span className="toggle-text">Include Selectable Text Layer</span>
        </label>
        <p className="settings-hint">
          Adds an invisible text layer above the rendered image for text selection (Visual mode only)
        </p>
      </div>

      <div className="settings-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.includeOriginalPdf}
            onChange={handleOriginalPdfToggle}
            disabled={disabled}
          />
          <span className="toggle-text">Include Original PDF in Export</span>
        </label>
        <p className="settings-hint">
          Adds the original PDF file to the exported ZIP archive
        </p>
      </div>
    </div>
  );
};

export default React.memo(SettingsPanel);
