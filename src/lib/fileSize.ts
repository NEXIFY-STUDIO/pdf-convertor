/**
 * PDF HTML Forge - File Size Formatting Utilities
 */

/**
 * File size units in bytes
 */
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
type SizeUnit = typeof SIZE_UNITS[number];

/**
 * Format file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Human-readable file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  
  if (bytes < 0) {
    throw new Error('File size cannot be negative');
  }

  // Handle very small files
  if (bytes < 1) return '0 B';
  
  let size = bytes;
  let unitIndex = 0;
  
  // Find the appropriate unit
  while (size >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  const unit = SIZE_UNITS[unitIndex];
  
  // Format the number
  if (unitIndex === 0) {
    // Bytes don't need decimals
    return `${Math.round(size)} ${unit}`;
  }
  
  return `${size.toFixed(decimals)} ${unit}`;
}

/**
 * Parse human-readable file size string to bytes
 * @param sizeString - Human-readable file size (e.g., "1.5 MB")
 * @returns File size in bytes
 */
export function parseFileSize(sizeString: string): number {
  const trimmed = sizeString.trim().toUpperCase();
  
  if (trimmed === '0' || trimmed === '0 B') return 0;
  
  const match = trimmed.match(/^([A-Z\d.]+)\s*([A-Z]*)$/);
  
  if (!match) {
    throw new Error(`Invalid file size format: ${sizeString}`);
  }
  
  let valueStr = match[1];
  let unitRaw = match[2];

  if (unitRaw === '') {
     const splitMatch = valueStr.match(/^([\d.]+)([A-Z]+)$/);
     if (splitMatch) {
         valueStr = splitMatch[1];
         unitRaw = splitMatch[2];
     } else if (/^[A-Z]+$/.test(valueStr)) {
         throw new Error(`Invalid file size format: ${sizeString}`);
     }
  }
  
  const value = parseFloat(valueStr);
  
  if (isNaN(value)) {
    throw new Error(`Invalid number in file size: ${sizeString}`);
  }

  let unit = unitRaw;
  if (unit === '') {
    unit = 'B';
  } else if (!unit.endsWith('B')) {
    unit += 'B';
  }
  
  const unitIndex = SIZE_UNITS.findIndex(u => u === unit);
  
  if (unitIndex === -1) {
    throw new Error(`Unknown size unit: ${unitRaw}`);
  }
  
  return value * Math.pow(1024, unitIndex);
}

/**
 * Get the appropriate file size unit for a given number of bytes
 * @param bytes - File size in bytes
 * @returns The appropriate unit
 */
export function getFileSizeUnit(bytes: number): SizeUnit {
  if (bytes === 0) return 'B';
  
  let unitIndex = 0;
  let size = bytes;
  
  while (size >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return SIZE_UNITS[unitIndex];
}

/**
 * Format file size with a specific unit
 * @param bytes - File size in bytes
 * @param unit - The unit to use
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSizeWithUnit(
  bytes: number, 
  unit: SizeUnit, 
  decimals: number = 2
): string {
  const unitIndex = SIZE_UNITS.findIndex(u => u === unit);
  
  if (unitIndex === -1) {
    throw new Error(`Unknown size unit: ${unit}`);
  }
  
  const size = bytes / Math.pow(1024, unitIndex);
  
  if (unitIndex === 0) {
    return `${Math.round(size)} ${unit}`;
  }
  
  return `${size.toFixed(decimals)} ${unit}`;
}

/**
 * Check if a file size is within a maximum limit
 * @param bytes - File size in bytes
 * @param maxBytes - Maximum allowed size in bytes
 * @returns True if the file size is within the limit
 */
export function isWithinSizeLimit(bytes: number, maxBytes: number): boolean {
  return bytes <= maxBytes;
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns The file extension (without dot)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Check if a file is a PDF based on its extension
 * @param filename - The filename
 * @returns True if the file appears to be a PDF
 */
export function isPdfFile(filename: string): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  return extension === 'pdf';
}

/**
 * Check if a file is a PDF based on its MIME type
 * @param mimeType - The MIME type
 * @returns True if the MIME type indicates a PDF
 */
export function isPdfMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase();
  return normalized === 'application/pdf' || 
         normalized === 'application/x-pdf' ||
         normalized === 'application/acrobat' ||
         normalized === 'applications/vnd.pdf' ||
         normalized === 'text/pdf' ||
         normalized === 'text/x-pdf';
}

export default {
  formatFileSize,
  parseFileSize,
  getFileSizeUnit,
  formatFileSizeWithUnit,
  isWithinSizeLimit,
  getFileExtension,
  isPdfFile,
  isPdfMimeType,
};
