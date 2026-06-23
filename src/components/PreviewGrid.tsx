/**
 * PDF HTML Forge - Preview Grid Component
 * 
 * Displays preview thumbnails of converted PDF pages.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PageAsset } from '../types';

interface PreviewGridProps {
  pageAssets: PageAsset[];
  onPreviewClick?: (pageNumber: number) => void;
  maxHeight?: number;
}

const PreviewGrid: React.FC<PreviewGridProps> = ({
  pageAssets,
  onPreviewClick,
  maxHeight = 200,
}) => {
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate thumbnail dimensions while maintaining aspect ratio
  const getThumbnailDimensions = useCallback((asset: PageAsset, maxHeight: number) => {
    const aspectRatio = asset.width / asset.height;
    const height = Math.min(asset.height, maxHeight);
    const width = Math.round(height * aspectRatio);
    return { width, height };
  }, []);

  // Initialize Intersection Observer for lazy loading
  useEffect(() => {
    if (!gridRef.current || pageAssets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNumber = parseInt(entry.target.getAttribute('data-page-number') || '0');
            if (pageNumber > 0 && !visiblePages.includes(pageNumber)) {
              setVisiblePages(prev => [...prev, pageNumber]);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    // Observe all preview items
    const items = gridRef.current.querySelectorAll('.preview-item');
    items.forEach(item => {
      observer.observe(item);
    });

    return () => {
      items.forEach(item => {
        observer.unobserve(item);
      });
      observer.disconnect();
    };
  }, [pageAssets.length, visiblePages]);

  // Reset visible pages when page assets change
  useEffect(() => {
    setVisiblePages([]);
    
    // Re-observe items after reset
    if (gridRef.current && observerRef.current) {
      const items = gridRef.current.querySelectorAll('.preview-item');
      items.forEach(item => {
        observerRef.current?.observe(item);
      });
    }
  }, [pageAssets]);

  // Handle preview click
  const handlePreviewClick = useCallback((pageNumber: number) => {
    if (onPreviewClick) {
      onPreviewClick(pageNumber);
    }
  }, [onPreviewClick]);

  if (pageAssets.length === 0) {
    return (
      <div className="preview-grid empty">
        <p>No pages to preview</p>
      </div>
    );
  }

  return (
    <div className="preview-grid" ref={gridRef}>
      {pageAssets.map((asset) => {
        const { width, height } = getThumbnailDimensions(asset, maxHeight);
        const isVisible = visiblePages.includes(asset.pageNumber);
        
        return (
          <div
            key={asset.pageNumber}
            className="preview-item"
            data-page-number={asset.pageNumber}
            style={{
              width: `${width}px`,
              height: `${height}px`,
            }}
            onClick={() => handlePreviewClick(asset.pageNumber)}
          >
            {isVisible ? (
              <>
                <img
                  src={asset.imageUrl}
                  alt={`Page ${asset.pageNumber} preview`}
                  loading="lazy"
                  className="preview-image"
                />
                <div className="preview-overlay">
                  <span className="preview-page-number">{asset.pageNumber}</span>
                </div>
              </>
            ) : (
              <div className="preview-placeholder">
                <span className="preview-page-number">{asset.pageNumber}</span>
                <div className="preview-loading"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(PreviewGrid);
