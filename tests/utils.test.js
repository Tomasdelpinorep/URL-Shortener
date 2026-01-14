const generateShortCode = require('../src/utils/shortCodeGenerator');
const isValidUrl = require('../src/utils/validateUrl');

describe('Utility Functions', () => {
  
  describe('generateShortCode', () => {
    
    it('should generate a 6 character code by default', () => {
      const code = generateShortCode();
      expect(code).toHaveLength(6);
    });
    
    it('should generate code with custom length', () => {
      const code = generateShortCode(10);
      expect(code).toHaveLength(10);
    });
    
    it('should only contain alphanumeric characters', () => {
      const code = generateShortCode();
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });
    
    it('should generate different codes', () => {
      const code1 = generateShortCode();
      const code2 = generateShortCode();
      expect(code1).not.toBe(code2);
    });
    
  });
  
  describe('isValidUrl', () => {
    
    it('should validate correct HTTP URL', () => {
      expect(isValidUrl('http://www.google.com')).toBe(true);
    });
    
    it('should validate correct HTTPS URL', () => {
      expect(isValidUrl('https://www.github.com')).toBe(true);
    });
    
    it('should reject invalid URL', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });
    
    it('should reject FTP protocol', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });
    
    it('should reject empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });
    
  });
  
});