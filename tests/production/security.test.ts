import { describe, it, expect } from 'vitest';
import { validateIBAN, sanitizeInput, sanitizeTransaction } from '../../src/lib/security';

describe('Security - Production Tests', () => {
  describe('IBAN Validation', () => {
    it('should validate correct Slovak IBAN', () => {
      expect(validateIBAN('SK70 0200 0000 0011 4286 3551')).toBe(true);
      expect(validateIBAN('SK7002000000001142863551')).toBe(true);
    });

    it('should reject invalid IBAN', () => {
      expect(validateIBAN('SK123')).toBe(false);
      expect(validateIBAN('SK12345678901234567890')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('img src=x onerror=alert(1)');
    });

    it('should sanitize transaction data', () => {
      const dirtyTx = {
        popis: '<script>malicious</script>',
        account: 'SK12 3456 7890',
        vs: '123/456',
        ks: ' 789 012 ',
        amount: -100
      };

      const cleanTx = sanitizeTransaction(dirtyTx as any);
      expect(cleanTx.popis).toBe('malicious');
      expect(cleanTx.vs).toBe('123456');
      expect(cleanTx.ks).toBe('789012');
    });
  });
});
