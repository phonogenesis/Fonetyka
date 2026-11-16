/**
 * Polish -> Slavicist Alphabet (AS) phonetic transcription.
 *
 * Pipeline:
 *   1. Orthography -> segments   (digraphs, softening by <i>, nasal placeholders)
 *   2. Progressive devoicing     (w, rz after a voiceless obstruent: trzy, kwiat)
 *   3. Final devoicing           (krew -> kref)
 *   4. Regressive voicing assim. (prośba -> proźba), optionally across words
 *   5. Nasal vowels              (ą, ę -> on/om/oŋ/oń, ǫ/ę, or plain vowel)
 *   6. Output
 *
 * Usage:  const { transcribe } = require('./polish_to_as');
 *         transcribe('Dzień dobry') // -> 'dźeń dobry'
 */
'use strict';

const DEFAULTS = Object.freeze({
  lSymbol: 'ŭ',      // how ł is written: 'ŭ' (= [w]) or 'ł'
  palatalMark: 'ʹ',  // palatalisation mark: pʹ bʹ kʹ gʹ ...
  sandhi: true,      // voicing assimilation / retention across word boundaries
});

// voiceless -> voiced obstruent pairs (AS symbols)
const TO_VOICED = new Map([
  ['p', 'b'], ['t', 'd'], ['k', 'g'], ['f', 'v'], ['s', 'z'],
  ['ś', 'ź'], ['š', 'ž'], ['c', 'dz'], ['ć', 'dź'], ['č', 'dž'], ['x', 'γ'],
]);
const TO_VOICELESS = new Map([...TO_VOICED].map(([a, b]) => [b, a]));

const VOWEL_LETTERS = 'aeiouyóąę';
const LABIAL_VELAR = { p: 'p', b: 'b', m: 'm', f: 'f', k: 'k', g: 'g', w: 'v', v: 'v' };

const isObs = (s) => !!s && s.kind === 'C' && (TO_VOICED.has(s.c) || TO_VOICELESS.has(s.c));
const isVoiced = (s) => TO_VOICELESS.has(s.c);
const setVoicing = (s, voiced) => {
  if (voiced && TO_VOICED.has(s.c)) s.c = TO_VOICED.get(s.c);
  else if (!voiced && TO_VOICELESS.has(s.c)) s.c = TO_VOICELESS.get(s.c);
};

/* ---------- 1. orthography -> segments ---------- */

function toSegments(rawWord, o) {
  const w = rawWord.toLowerCase();
  const segs = [];
  const isV = (ch) => ch !== undefined && VOWEL_LETTERS.includes(ch);
  const C = (c, extra = {}) => {
    const s = { c, pal: false, kind: 'C', ...extra };
    segs.push(s);
    return s;
  };
  const V = (c, kind = 'V') => segs.push({ c, pal: false, kind });
  let i = 0;

  // <i> directly after a consonant only marks softness when a vowel follows
  const swallowI = () => { if (w[i] === 'i' && isV(w[i + 1])) i++; };
  // optional palatalisation of t, d, l, r (only before i + vowel: dialog, Maria)
  const softOpt = (s) => { if (w[i] === 'i' && isV(w[i + 1])) { s.pal = true; i++; } };

  while (i < w.length) {
    const ch = w[i];
    const nx = w[i + 1];

    switch (ch) {
      case 'a': case 'e': case 'o': case 'y': V(ch); i++; break;
      case 'ó': V('u'); i++; break;
      case 'u': {
        const prev = segs[segs.length - 1];
        const diphthong = prev && prev.kind === 'V' && (prev.c === 'a' || prev.c === 'e') && !isV(nx);
        V(diphthong ? 'ŭ' : 'u'); i++; break;
      }
      case 'i': // reaches here only when not absorbed by a preceding consonant
        if (isV(nx)) C('j'); else V('i');
        i++; break;
      case 'ą': case 'ę': V(ch, 'N'); i++; break;

      case 'p': case 'b': case 'm': case 'f': case 'k': case 'g': case 'w': case 'v': {
        const s = C(LABIAL_VELAR[ch]);
        i++;
        if (w[i] === 'i') s.pal = true;   // pʹi, bʹa, kʹe, gʹi ...
        swallowI();
        break;
      }
      case 'h': {
        const s = C('x'); i++;
        if (w[i] === 'i') s.pal = true;
        swallowI(); break;
      }
      case 'c':
        if (nx === 'z') { C('č'); i += 2; }
        else if (nx === 'h') {
          const s = C('x'); i += 2;
          if (w[i] === 'i') s.pal = true;
          swallowI();
        }
        else if (nx === 'i') { C('ć'); i++; swallowI(); }
        else { C('c'); i++; }
        break;
      case 's':
        if (nx === 'z') { C('š'); i += 2; }
        else if (nx === 'i') { C('ś'); i++; swallowI(); }
        else { C('s'); i++; }
        break;
      case 'z':
        if (nx === 'i') { C('ź'); i++; swallowI(); }
        else { C('z'); i++; }
        break;
      case 'n':
        if (nx === 'i') { C('ń'); i++; swallowI(); }
        else { C('n'); i++; }
        break;
      case 'd':
        if (nx === 'ź') { C('dź'); i += 2; }
        else if (nx === 'ż') { C('dž'); i += 2; }
        else if (nx === 'z') {
          i += 2;
          if (w[i] === 'i') { C('dź'); swallowI(); } else C('dz');
        } else { const s = C('d'); i++; softOpt(s); }
        break;
      case 'r':
        if (nx === 'z') { C('ž'); i += 2; }
        else { const s = C('r'); i++; softOpt(s); }
        break;
      case 't': { const s = C('t'); i++; softOpt(s); break; }
      case 'l': { const s = C('l', { lateral: true }); i++; softOpt(s); break; }
      case 'ł': C(o.lSymbol, { lateral: true }); i++; break;
      case 'j': C('j'); i++; break;
      case 'ż': C('ž'); i++; break;
      case 'ć': case 'ś': case 'ź': case 'ń': C(ch); i++; break;
      case 'q': C('k'); i++; break;
      case 'x': C('k'); C('s'); i++; break;
      default: segs.push({ c: ch, pal: false, kind: 'O' }); i++;
    }
  }
  return segs;
}

/* ---------- 2-4. voicing ---------- */

// next segment, optionally looking across a plain space (word-boundary sandhi)
function nextSeg(flat, i, o) {
  const n = flat[i + 1];
  if (!n) return null;
  if (n.kind !== 'sep') return n;
  return o.sandhi && n.sandhi && flat[i + 2] ? flat[i + 2] : null;
}

function applyVoicing(flat, o) {
  // 2. progressive devoicing of v and ž after a voiceless obstruent (same word)
  flat.forEach((s, i) => {
    if (s.kind === 'C' && (s.c === 'v' || s.c === 'ž') && !s.wordStart) {
      const p = flat[i - 1];
      if (isObs(p) && !isVoiced(p)) setVoicing(s, false);
    }
  });

  // 3. final devoicing (only where no following word/segment is reachable)
  flat.forEach((s, i) => {
    if (s.wordEnd && isObs(s) && isVoiced(s) && !nextSeg(flat, i, o)) setVoicing(s, false);
  });

  // 4. regressive assimilation, right to left; [v] is a target but never a trigger
  for (let i = flat.length - 1; i >= 0; i--) {
    const s = flat[i];
    if (!isObs(s)) continue;
    const n = nextSeg(flat, i, o);
    if (isObs(n) && n.c !== 'v') setVoicing(s, isVoiced(n));
  }
}

/* ---------- 5. nasal vowels ---------- */

function resolveNasals(flat) {
  const out = [];
  flat.forEach((s, i) => {
    if (s.kind !== 'N') { out.push(s); return; }
    const vowel = s.c === 'ę' ? 'e' : 'o';
    const nasalVowel = s.c === 'ę' ? 'ę' : 'ǫ';
    const V = (c) => out.push({ c, pal: false, kind: 'V' });
    const N = (c) => out.push({ c, pal: false, kind: 'C' });
    const nxt = s.wordEnd ? null : flat[i + 1];

    if (!nxt) { V(s.c === 'ę' ? 'e' : 'ǫ'); return; }   // final: się -> śe, idą -> idǫ
    if (nxt.lateral) { V(vowel); return; }               // wzięli -> vźeli
    const n = nxt.c;
    if (n === 'p' || n === 'b') { V(vowel); N('m'); }
    else if (['t', 'd', 'c', 'dz', 'č', 'dž'].includes(n)) { V(vowel); N('n'); }
    else if (n === 'ć' || n === 'dź') { V(vowel); N('ń'); }
    else if (n === 'k' || n === 'g') { V(vowel); N('ŋ'); }
    else V(nasalVowel);                                  // before fricatives etc.
  });
  return out;
}

/* ---------- public API ---------- */

function transcribe(text, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const parts = text.normalize('NFC').split(/(\p{L}+)/u); // odd indices = words
  let flat = [];

  parts.forEach((p, idx) => {
    if (!p) return;
    if (idx % 2 === 1) {
      const segs = toSegments(p, o);
      segs.forEach((s, k) => { s.wordStart = k === 0; s.wordEnd = k === segs.length - 1; });
      flat.push(...segs);
    } else {
      flat.push({ kind: 'sep', text: p, sandhi: /^[ \t]+$/.test(p) });
    }
  });

  applyVoicing(flat, o);
  flat = resolveNasals(flat);

  return flat.map((s) => (s.kind === 'sep' ? s.text : s.c + (s.pal ? o.palatalMark : ''))).join('');
}

module.exports = { transcribe, DEFAULTS };

/* ---------- demo: node polish_to_as.js ---------- */
if (require.main === module) {
  const samples = [
    'Dzień dobry', 'Jak się masz?', 'Szczęście', 'Przyjaciel', 'Mężczyzna',
    'Chrząszcz', 'Dąb', 'Mąka', 'Węgiel', 'Wzięli', 'Żółć', 'Łódź', 'Kwiat',
    'Trzy', 'Zdrowie', 'Europa', 'Pięć', 'Brat zosi', 'W tym domu', 'Chleb',
  ];
  for (const s of samples) console.log(s.padEnd(14), '->', transcribe(s));
}
