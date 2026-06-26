import { describe, it, expect } from 'vitest';
import { validateIBAN } from '../lib/security';

describe('validateIBAN', () => {
  it('should return false for empty or undefined IBAN', () => {
    expect(validateIBAN('')).toBe(false);
    expect(validateIBAN(null as any)).toBe(false);
    expect(validateIBAN(undefined as any)).toBe(false);
  });

  it('should validate correct Slovak IBANs with spaces', () => {
    // Monika Kupčová's VÚB IBAN from statement
    expect(validateIBAN('SK70 0200 0000 0011 4286 3551')).toBe(true);
    // Default store client VÚB IBAN
    expect(validateIBAN('SK84 0200 0000 0040 7755 7753')).toBe(true);
  });

  it('should validate correct Slovak IBANs without spaces or formatted with dashes/dots', () => {
    expect(validateIBAN('SK7002000000001142863551')).toBe(true);
    expect(validateIBAN('SK70-0200-0000-0011-4286-3551')).toBe(true);
    expect(validateIBAN('SK70.0200.0000.0011.4286.3551')).toBe(true);
  });

  it('should fail Slovak IBANs with incorrect length', () => {
    // Slovak IBANs must be exactly 24 characters
    expect(validateIBAN('SK70 0200 0000 0011 4286 355')).toBe(false); // 23 characters
    expect(validateIBAN('SK70 0200 0000 0011 4286 35512')).toBe(false); // 25 characters
  });

  it('should fail general IBANs with invalid check digits', () => {
    // Modulo 97 check fails
    expect(validateIBAN('SK71 0200 0000 0011 4286 3551')).toBe(false);
    expect(validateIBAN('SK70 0200 0000 0011 4286 3552')).toBe(false);
  });

  it('should fail IBANs with invalid formats or country codes', () => {
    expect(validateIBAN('1234 5678 9012 3456 7890 1234')).toBe(false); // No country code
    expect(validateIBAN('S170 0200 0000 0011 4286 3551')).toBe(false); // Wrong country format
    expect(validateIBAN('SKXX 0200 0000 0011 4286 3551')).toBe(false); // Letters in check digits
  });
});
