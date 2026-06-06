// Kiosk text-to-speech. The Sunmi K2's WebView (Chrome 66) supports
// window.speechSynthesis with en/zh voices (+ id-ID, used for Malay).
// Pure web — no native bridge needed.

let _voices = [];
function loadVoices() {
  try { _voices = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis.getVoices() : []; }
  catch (e) { _voices = []; }
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
}

// App lang code → preferred BCP-47 voice prefixes (Malay falls back to Indonesian).
const PREFS = {
  en: ['en-us', 'en-gb', 'en'],
  zh: ['zh-cn', 'zh-hk', 'zh-tw', 'zh'],
  my: ['ms-my', 'ms', 'id-id', 'id'],
};
const FALLBACK_LANG = { en: 'en-US', zh: 'zh-CN', my: 'id-ID' };

function pickVoice(lang) {
  if (!_voices.length) loadVoices();
  const prefs = PREFS[lang] || PREFS.en;
  for (let i = 0; i < prefs.length; i++) {
    const p = prefs[i];
    const v = _voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(p) === 0);
    if (v) return v;
  }
  return null;
}

export function ttsAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text, lang) {
  if (!ttsAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();           // never queue/overlap
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    if (v) { u.voice = v; u.lang = v.lang; }
    else { u.lang = FALLBACK_LANG[lang] || 'en-US'; }
    u.rate = 0.98; u.pitch = 1; u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

export function stopSpeak() {
  try { if (ttsAvailable()) window.speechSynthesis.cancel(); } catch (e) {}
}
