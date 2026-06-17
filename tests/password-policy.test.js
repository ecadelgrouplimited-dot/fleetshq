const { checkPassword } = require('../src/utils/passwordPolicy');

describe('password policy', () => {
  it('rejects a password shorter than 8 chars', () => {
    expect(checkPassword('Ab1')).toMatch(/at least/i);
  });

  it('rejects a password with no digit', () => {
    expect(checkPassword('AllLetters')).toMatch(/number/i);
  });

  it('rejects a password with no letter', () => {
    expect(checkPassword('123456789')).toMatch(/letter/i);
  });

  it('rejects common passwords', () => {
    expect(checkPassword('password1')).toMatch(/common/i);
    expect(checkPassword('changeme1')).toMatch(/common/i);
  });

  it('rejects empty or non-string input', () => {
    expect(checkPassword('')).toBeTruthy();
    expect(checkPassword(null)).toBeTruthy();
    expect(checkPassword(undefined)).toBeTruthy();
  });

  it('accepts a strong password', () => {
    expect(checkPassword('MySecure99!')).toBeNull();
  });

  it('accepts the minimum valid length of exactly 8 chars with letter+digit', () => {
    expect(checkPassword('Abcde123')).toBeNull();
  });

  it('rejects passwords over 128 chars', () => {
    expect(checkPassword('A1' + 'x'.repeat(128))).toMatch(/too long/i);
  });
});
