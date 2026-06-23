/**
 * PDF HTML Forge - HTML Escaping Utilities
 * 
 * Security: All extracted PDF text must be escaped before inserting into generated HTML
 * to prevent XSS attacks from malicious PDF content.
 */

/**
 * HTML entity map for escaping special characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters in a string
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
export function escapeHtml(text: string): string {
  if (text.length === 0) return text;
  
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Escape text for use in HTML attributes
 * @param text - The text to escape
 * @returns The escaped text safe for HTML attribute values
 */
export function escapeHtmlAttribute(text: string): string {
  if (text.length === 0) return text;
  
  // First escape HTML entities, then escape quotes and other dangerous chars
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/"/g, '&quot;');
  escaped = escaped.replace(/'/g, '&#x27;');
  
  return escaped;
}

/**
 * Escape text for use in CSS content
 * @param text - The text to escape
 * @returns The escaped text safe for CSS content
 */
export function escapeCss(text: string): string {
  if (text.length === 0) return text;
  
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, '\\\'')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Escape text for use in JavaScript strings
 * @param text - The text to escape
 * @returns The escaped text safe for JavaScript strings
 */
export function escapeJs(text: string): string {
  if (text.length === 0) return text;
  
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, '\\\'')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Sanitize a string for use as a CSS class name
 * @param text - The text to sanitize
 * @returns A safe CSS class name
 */
export function sanitizeClassName(text: string): string {
  if (text.length === 0) return 'unnamed';
  
  return text
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

/**
 * Sanitize a string for use as a CSS ID
 * @param text - The text to sanitize
 * @returns A safe CSS ID
 */
export function sanitizeId(text: string): string {
  if (text.length === 0) return 'unnamed';
  
  // CSS IDs cannot start with a number
  const sanitized = text
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
  
  // Ensure it doesn't start with a number
  if (/^[0-9]/.test(sanitized)) {
    return `id-${sanitized}`;
  }
  
  return sanitized;
}

export default {
  escapeHtml,
  escapeHtmlAttribute,
  escapeCss,
  escapeJs,
  sanitizeClassName,
  sanitizeId,
};
