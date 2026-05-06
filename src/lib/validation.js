// Hong Kong Identity Card validators.
//
// HKID format: one or two letters followed by six digits and a check digit
// in parentheses, e.g. "A123456(7)" or "AB123456(7)". We accept the common
// formatted variants, the bare alnum form, and forms with stripped parens.
// Anything matching this shape is rejected from the case-number field.

const HKID_PATTERNS = [
  /\b[A-Z]{1,2}\s?\d{6}\s?\(?[0-9A]\)?\b/i, // A123456(7) or AB123456(7)
  /\b[A-Z]{1,2}\d{6}[0-9A]\b/i, // bare alnum form
];

export function looksLikeHKID(value) {
  if (!value) return false;
  const v = String(value).trim();
  return HKID_PATTERNS.some((re) => re.test(v));
}

// Soft check: anything that looks like a long digit string is suspect too —
// HK hospital case numbers are typically alphanumeric tokens like "ERAS-001".
const LONG_DIGIT_RUN = /\d{7,}/;

export function caseNumberWarning(value) {
  if (!value) return null;
  if (looksLikeHKID(value)) {
    return 'This looks like a Hong Kong ID number. Use a de-identified internal reference instead.';
  }
  if (LONG_DIGIT_RUN.test(value)) {
    return 'Long digit run detected. Make sure this is not a real patient identifier.';
  }
  return null;
}

export const AGE_BANDS = ['<50', '50-64', '65-74', '75-84', '85+'];
export const SEXES = ['M', 'F', 'Other/Unspecified'];
