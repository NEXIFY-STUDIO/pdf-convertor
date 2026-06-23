/**
 * PDF HTML Forge - Test Setup
 * 
 * Setup file for Vitest tests
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock global objects that are available in the browser
beforeAll(() => {
  // Mock URL.createObjectURL and URL.revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
  
  // Mock fetch for PDF.js
  global.fetch = vi.fn();
  
  // Mock canvas and context
  global.HTMLCanvasElement = class HTMLCanvasElement {
    width: number = 0;
    height: number = 0;
    
    constructor() {
      this.width = 0;
      this.height = 0;
    }
    
    getContext(type: string) {
      if (type === '2d') {
        return {
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          fillText: vi.fn(),
          strokeText: vi.fn(),
          measureText: vi.fn(() => ({ width: 100 })),
          fillStyle: '',
          strokeStyle: '',
          globalAlpha: 1,
          textAlign: 'left',
          textBaseline: 'top',
        };
      }
      return null;
    }
    
    toBlob(callback: (blob: Blob | null) => void, _type?: string, _quality?: number) {
      callback(new Blob(['mock-image-data'], { type: _type || 'image/png' }));
    }
    
    toDataURL(_type?: string, _quality?: number): string {
      return 'data:image/png;base64,mock-data-url';
    }
  } as any;
  
  // Mock Blob
  global.Blob = class Blob {
    constructor(_parts: BlobPart[], _options?: BlobPropertyBag) {
      // Mock implementation
    }
    
    static from = (parts: BlobPart[]) => new Blob(parts);
  } as any;
  
  // Mock File
  global.File = class File extends Blob {
    constructor(bits: BlobPart[], _name: string, _options?: FilePropertyBag) {
      super(bits);
      // Mock implementation
    }
  } as any;
  
  // Mock Image
  global.Image = class Image {
    src: string = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width: number = 0;
    height: number = 0;
  } as any;
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
      // Mock implementation
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  } as any;
  
  // Mock performance
  global.performance = {
    now: () => Date.now(),
  } as any;
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 0);
  };
  
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

export {};
