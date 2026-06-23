/**
 * PDF HTML Forge - HTML Escaping Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  escapeHtml, 
  escapeHtmlAttribute, 
  escapeCss, 
  escapeJs, 
  sanitizeClassName, 
  sanitizeId 
} from '../lib/escapeHtml';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('should escape ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less than and greater than', () => {
    expect(escapeHtml('<div>content</div>')).toBe('&lt;div&gt;content&lt;&#x2F;div&gt;');
  });

  it('should escape quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("'single'")).toBe('&#x27;single&#x27;');
  });

  it('should escape backticks', () => {
    expect(escapeHtml('`code`')).toBe('&#x60;code&#x60;');
  });

  it('should escape forward slash', () => {
    expect(escapeHtml('/path/')).toBe('&#x2F;path&#x2F;');
  });

  it('should escape equals sign', () => {
    expect(escapeHtml('a=b')).toBe('a&#x3D;b');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle string with no special characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('should handle unicode characters', () => {
    expect(escapeHtml('Hello 世界')).toBe('Hello 世界');
  });

  it('should handle newlines and tabs', () => {
    expect(escapeHtml('line1\nline2\tindented')).toBe('line1\nline2\tindented');
  });
});

describe('escapeHtmlAttribute', () => {
  it('should escape quotes for HTML attributes', () => {
    expect(escapeHtmlAttribute('value="test"')).toBe('value&#x3D;&quot;test&quot;');
    expect(escapeHtmlAttribute("value='test'")).toBe('value&#x3D;&#x27;test&#x27;');
  });

  it('should handle empty string', () => {
    expect(escapeHtmlAttribute('')).toBe('');
  });

  it('should escape all HTML special characters', () => {
    expect(escapeHtmlAttribute('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
    );
  });
});

describe('escapeCss', () => {
  it('should escape backslashes', () => {
    expect(escapeCss('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('should escape quotes', () => {
    expect(escapeCss('font-family: "Arial"')).toBe('font-family: \\"Arial\\"');
    expect(escapeCss("font-family: 'Arial'")).toBe("font-family: \\'Arial\\'");
  });

  it('should escape newlines', () => {
    expect(escapeCss('line1\nline2')).toBe('line1\\nline2');
  });

  it('should escape carriage returns', () => {
    expect(escapeCss('line1\rline2')).toBe('line1\\rline2');
  });

  it('should escape tabs', () => {
    expect(escapeCss('col1\tcol2')).toBe('col1\\tcol2');
  });

  it('should handle empty string', () => {
    expect(escapeCss('')).toBe('');
  });

  it('should handle string with no special characters', () => {
    expect(escapeCss('normal text')).toBe('normal text');
  });
});

describe('escapeJs', () => {
  it('should escape backslashes', () => {
    expect(escapeJs('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('should escape quotes', () => {
    expect(escapeJs('"quoted"')).toBe('\\"quoted\\"');
    expect(escapeJs("'single'")).toBe('\\\'single\\\'');
  });

  it('should escape newlines', () => {
    expect(escapeJs('line1\nline2')).toBe('line1\\nline2');
  });

  it('should escape carriage returns', () => {
    expect(escapeJs('line1\rline2')).toBe('line1\\rline2');
  });

  it('should escape tabs', () => {
    expect(escapeJs('col1\tcol2')).toBe('col1\\tcol2');
  });

  it('should escape line separators', () => {
    expect(escapeJs('line1\u2028line2')).toBe('line1\\u2028line2');
    expect(escapeJs('line1\u2029line2')).toBe('line1\\u2029line2');
  });

  it('should handle empty string', () => {
    expect(escapeJs('')).toBe('');
  });

  it('should handle string with no special characters', () => {
    expect(escapeJs('normal text')).toBe('normal text');
  });
});

describe('sanitizeClassName', () => {
  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeClassName('my class')).toBe('my-class');
    expect(sanitizeClassName('my.class')).toBe('my-class');
    expect(sanitizeClassName('my#class')).toBe('my-class');
    expect(sanitizeClassName('my@class')).toBe('my-class');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeClassName('-my-class-')).toBe('my-class');
    expect(sanitizeClassName('---my-class---')).toBe('my-class');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitizeClassName('my---class')).toBe('my-class');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeClassName('MyClass')).toBe('myclass');
    expect(sanitizeClassName('MY_CLASS')).toBe('my_class');
  });

  it('should handle empty string', () => {
    expect(sanitizeClassName('')).toBe('unnamed');
  });

  it('should handle string with only invalid characters', () => {
    expect(sanitizeClassName('!@#$%^&*()')).toBe('unnamed');
  });

  it('should preserve valid characters', () => {
    expect(sanitizeClassName('my-valid_class123')).toBe('my-valid_class123');
  });
});

describe('sanitizeId', () => {
  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeId('my.id')).toBe('my-id');
    expect(sanitizeId('my id')).toBe('my-id');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeId('-my-id-')).toBe('my-id');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitizeId('my---id')).toBe('my-id');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeId('MyId')).toBe('myid');
  });

  it('should handle empty string', () => {
    expect(sanitizeId('')).toBe('unnamed');
  });

  it('should prefix with id- if starts with number', () => {
    expect(sanitizeId('123myid')).toBe('id-123myid');
    expect(sanitizeId('1myid')).toBe('id-1myid');
  });

  it('should handle string with only numbers', () => {
    expect(sanitizeId('123')).toBe('id-123');
  });

  it('should preserve valid characters', () => {
    expect(sanitizeId('my-valid_id123')).toBe('my-valid_id123');
  });
});
