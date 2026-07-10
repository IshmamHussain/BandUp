// Lightweight input validation. Deliberately dependency-free so every
// team member can read and explain exactly how validation works.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmptyString(value, maxLength = 255) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 255 && EMAIL_REGEX.test(value);
}

export function isValidPassword(value) {
  // Minimum 8 chars with at least one letter and one number.
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 128 &&
    /[a-zA-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}
