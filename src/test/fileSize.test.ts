/**
 * PDF HTML Forge - File Size Formatting Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  parseFileSize,
  getFileSizeUnit,
  formatFileSizeWithUnit,
  isWithinSizeLimit,
  getFileExtension,
  isPdfFile,
  isPdfMimeType,
} from '../lib/fileSize';

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1)).toBe('1 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(1536)).toBe('1.50 KB');
    expect(formatFileSize(2048)).toBe('2.00 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
    expect(formatFileSize(1024 * 1024 * 10)).toBe('10.00 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.50 GB');
  });

  it('should format terabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
  });

  it('should handle custom decimal places', () => {
    expect(formatFileSize(1536, 0)).toBe('2 KB');
    expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    expect(formatFileSize(1536, 3)).toBe('1.500 KB');
  });

  it('should handle very small files', () => {
    expect(formatFileSize(0.5)).toBe('0 B');
    expect(formatFileSize(0.1)).toBe('0 B');
  });

  it('should throw error for negative values', () => {
    expect(() => formatFileSize(-1024)).toThrow('File size cannot be negative');
  });
});

describe('parseFileSize', () => {
  it('should parse bytes', () => {
    expect(parseFileSize('100 B')).toBe(100);
    expect(parseFileSize('100B')).toBe(100);
    expect(parseFileSize('100 b')).toBe(100);
    expect(parseFileSize('100')).toBe(100);
  });

  it('should parse kilobytes', () => {
    expect(parseFileSize('1 KB')).toBe(1024);
    expect(parseFileSize('1KB')).toBe(1024);
    expect(parseFileSize('1 kb')).toBe(1024);
    expect(parseFileSize('2.5 KB')).toBe(2560);
  });

  it('should parse megabytes', () => {
    expect(parseFileSize('1 MB')).toBe(1024 * 1024);
    expect(parseFileSize('1MB')).toBe(1024 * 1024);
    expect(parseFileSize('2.5 MB')).toBe(2621440);
  });

  it('should parse gigabytes', () => {
    expect(parseFileSize('1 GB')).toBe(1024 * 1024 * 1024);
    expect(parseFileSize('1GB')).toBe(1024 * 1024 * 1024);
    expect(parseFileSize('2.5 GB')).toBe(2684354560);
  });

  it('should parse terabytes', () => {
    expect(parseFileSize('1 TB')).toBe(1024 * 1024 * 1024 * 1024);
    expect(parseFileSize('1TB')).toBe(1024 * 1024 * 1024 * 1024);
  });

  it('should handle zero', () => {
    expect(parseFileSize('0')).toBe(0);
    expect(parseFileSize('0 B')).toBe(0);
  });

  it('should handle decimal values', () => {
    expect(parseFileSize('1.5 KB')).toBe(1536);
    expect(parseFileSize('0.5 MB')).toBe(524288);
  });

  it('should handle spaces', () => {
    expect(parseFileSize('  1.5  KB  ')).toBe(1536);
  });

  it('should throw error for invalid format', () => {
    expect(() => parseFileSize('invalid')).toThrow('Invalid file size format');
    expect(() => parseFileSize('100 XB')).toThrow('Unknown size unit');
  });

  it('should throw error for invalid number', () => {
    expect(() => parseFileSize('abc KB')).toThrow('Invalid number in file size');
  });
});

describe('getFileSizeUnit', () => {
  it('should return B for bytes', () => {
    expect(getFileSizeUnit(0)).toBe('B');
    expect(getFileSizeUnit(1)).toBe('B');
    expect(getFileSizeUnit(1023)).toBe('B');
  });

  it('should return KB for kilobytes', () => {
    expect(getFileSizeUnit(1024)).toBe('KB');
    expect(getFileSizeUnit(2048)).toBe('KB');
    expect(getFileSizeUnit(1024 * 1023)).toBe('KB');
  });

  it('should return MB for megabytes', () => {
    expect(getFileSizeUnit(1024 * 1024)).toBe('MB');
    expect(getFileSizeUnit(1024 * 1024 * 1023)).toBe('MB');
  });

  it('should return GB for gigabytes', () => {
    expect(getFileSizeUnit(1024 * 1024 * 1024)).toBe('GB');
    expect(getFileSizeUnit(1024 * 1024 * 1024 * 1023)).toBe('GB');
  });

  it('should return TB for terabytes', () => {
    expect(getFileSizeUnit(1024 * 1024 * 1024 * 1024)).toBe('TB');
  });
});

describe('formatFileSizeWithUnit', () => {
  it('should format with specified unit', () => {
    expect(formatFileSizeWithUnit(1024, 'B')).toBe('1024 B');
    expect(formatFileSizeWithUnit(1024, 'KB')).toBe('1.00 KB');
    expect(formatFileSizeWithUnit(1024 * 1024, 'MB')).toBe('1.00 MB');
  });

  it('should handle custom decimal places', () => {
    expect(formatFileSizeWithUnit(1536, 'KB', 0)).toBe('2 KB');
    expect(formatFileSizeWithUnit(1536, 'KB', 1)).toBe('1.5 KB');
  });

  it('should throw error for unknown unit', () => {
    expect(() => formatFileSizeWithUnit(1024, 'XB' as any)).toThrow('Unknown size unit');
  });
});

describe('isWithinSizeLimit', () => {
  it('should return true when within limit', () => {
    expect(isWithinSizeLimit(100, 200)).toBe(true);
    expect(isWithinSizeLimit(200, 200)).toBe(true);
  });

  it('should return false when exceeding limit', () => {
    expect(isWithinSizeLimit(201, 200)).toBe(false);
    expect(isWithinSizeLimit(1000, 200)).toBe(false);
  });
});

describe('getFileExtension', () => {
  it('should return extension for simple filenames', () => {
    expect(getFileExtension('file.pdf')).toBe('pdf');
    expect(getFileExtension('file.txt')).toBe('txt');
    expect(getFileExtension('file')).toBe('');
  });

  it('should return extension for filenames with multiple dots', () => {
    expect(getFileExtension('file.name.pdf')).toBe('pdf');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('should handle uppercase extensions', () => {
    expect(getFileExtension('file.PDF')).toBe('pdf');
    expect(getFileExtension('file.TXT')).toBe('txt');
  });

  it('should return empty string for no extension', () => {
    expect(getFileExtension('file')).toBe('');
    expect(getFileExtension('file.')).toBe('');
    expect(getFileExtension('.hidden')).toBe('hidden');
  });
});

describe('isPdfFile', () => {
  it('should return true for PDF files', () => {
    expect(isPdfFile('file.pdf')).toBe(true);
    expect(isPdfFile('document.PDF')).toBe(true);
    expect(isPdfFile('my-file.pdf')).toBe(true);
  });

  it('should return false for non-PDF files', () => {
    expect(isPdfFile('file.txt')).toBe(false);
    expect(isPdfFile('file.docx')).toBe(false);
    expect(isPdfFile('file')).toBe(false);
  });
});

describe('isPdfMimeType', () => {
  it('should return true for PDF MIME types', () => {
    expect(isPdfMimeType('application/pdf')).toBe(true);
    expect(isPdfMimeType('application/x-pdf')).toBe(true);
    expect(isPdfMimeType('application/acrobat')).toBe(true);
    expect(isPdfMimeType('applications/vnd.pdf')).toBe(true);
    expect(isPdfMimeType('text/pdf')).toBe(true);
    expect(isPdfMimeType('text/x-pdf')).toBe(true);
  });

  it('should return true for uppercase MIME types', () => {
    expect(isPdfMimeType('APPLICATION/PDF')).toBe(true);
    expect(isPdfMimeType('Application/Pdf')).toBe(true);
  });

  it('should return false for non-PDF MIME types', () => {
    expect(isPdfMimeType('text/plain')).toBe(false);
    expect(isPdfMimeType('application/json')).toBe(false);
    expect(isPdfMimeType('image/png')).toBe(false);
  });
});
