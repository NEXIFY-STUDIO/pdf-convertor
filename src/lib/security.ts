/**
 * Security utilities for the bank statement generator.
 */

/**
 * Validates an IBAN according to the standard ISO 13616 algorithm.
 * Specifically checks for Slovak IBAN constraints (length 24, prefix SK).
 * 
 * @param iban The IBAN string to validate
 * @returns boolean True if the IBAN is valid
 */
export function validateIBAN(iban: string): boolean {
  if (!iban) return false;

  // 1. Clean the input: remove spaces, punctuation and convert to uppercase
  const cleanIban = iban.replace(/[\s\-_.,\/]/g, '').toUpperCase();

  // 2. Basic length and format validation
  // Slovakia (SK) IBAN must be exactly 24 characters
  if (cleanIban.startsWith('SK') && cleanIban.length !== 24) {
    return false;
  }

  // General IBAN length checks (must be between 15 and 34 characters)
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return false;
  }

  // Must start with two letters followed by two digits
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIban)) {
    return false;
  }

  // 3. Move the first 4 characters to the end
  const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);

  // 4. Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged[i];
    const code = char.charCodeAt(0);
    
    if (code >= 65 && code <= 90) { // A-Z
      numericString += String(code - 55); // 65 - 55 = 10
    } else if (code >= 48 && code <= 57) { // 0-9
      numericString += char;
    } else {
      return false; // Invalid character
    }
  }

  // 5. Check modulo 97 using BigInt to prevent overflow/rounding errors
  try {
    const bigNum = BigInt(numericString);
    return bigNum % 97n === 1n;
  } catch (e) {
    return false;
  }
}

/**
 * Removes HTML tags from input string
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;
  return input.replace(/<[^>]*>?/gm, '');
}

/**
 * Sanitizes transaction data by removing HTML tags and cleaning numeric symbols
 */
export function sanitizeTransaction(tx: any): any {
  const cleanTx = { ...tx };
  if (cleanTx.popis) {
    cleanTx.popis = sanitizeInput(cleanTx.popis);
  }
  if (cleanTx.vs) {
    cleanTx.vs = cleanTx.vs.replace(/\D/g, '');
  }
  if (cleanTx.ks) {
    cleanTx.ks = cleanTx.ks.replace(/\D/g, '');
  }
  if (cleanTx.ss) {
    cleanTx.ss = cleanTx.ss.replace(/\D/g, '');
  }
  return cleanTx;
}
