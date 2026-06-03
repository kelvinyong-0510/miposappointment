/* Normalize Malaysian phone numbers to a tidy local format: 01X-XXXXXXX.
   Examples:
     "0165558845"      → "016-5558845"
     "165558845"       → "016-5558845"   (missing leading 0)
     "60165558845"     → "016-5558845"   (country code)
     "+60 16-555 8845" → "016-5558845"
   Non-Malaysian / unrecognised input is returned digit-cleaned but unchanged
   in shape, so it never corrupts a foreign number. */
export function normalizePhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/\D/g, '');
  if (!d) return '';

  // Strip Malaysian country code (60), keep a leading 0.
  if (d.startsWith('60')) d = '0' + d.slice(2);
  // Mobile typed without the leading 0 (starts with 1, 9–10 digits).
  else if (d[0] === '1' && d.length >= 9 && d.length <= 10) d = '0' + d;

  // Format local mobile/landline starting with 0: dash after the 01X / 0X prefix.
  if (d[0] === '0' && d.length >= 9 && d.length <= 11) {
    return d.slice(0, 3) + '-' + d.slice(3);
  }
  // Otherwise leave as-is (e.g. an international number) — don't mangle it.
  return d;
}
