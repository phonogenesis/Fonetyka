/**
 * Polish -> Slavicist Alphabet (AS) phonetic transcription (TypeScript).
 *
 * Pipeline:
 *   1. Orthography -> segments   (digraphs, softening by <i>, nasal placeholders)
 *   2. Progressive devoicing     (w, rz after a voiceless obstruent: trzy, kwiat)
 *   3. Final devoicing           (krew -> kref)
 *   4. Regressive voicing assim. (prośba -> proźba), optionally across words
 *   5. Nasal vowels              (ą, ę -> on/om/oŋ/oń, ǫ/ę, or plain vowel)
 *   6. Output
 *
 * Usage:
 *   import { transcribe } from './polish_to_as';
 *   transcribe('Dzień dobry'); // "dźeń dobry"
 */

export interface TranscribeOptions {
  /** How ł is written: 'ŭ' (= [w], default) or 'ł'. */
  lSymbol?: 'ŭ' | 'ł';
  /** Palatalisation mark, e.g. pʹ bʹ kʹ gʹ (default 'ʹ'). */
  palatalMark?: string;
  /** Voicing assimilation / retention across word boundaries (default true). */
  sandhi?: boolean;
}

type ResolvedOptions = Required<TranscribeOptions>;

export const DEFAULTS: Readonly<ResolvedOptions> = Object.freeze({
  lSymbol: 'ŭ',
  palatalMark: 'ʹ',
  sandhi: true,
});

/** A phonetic segment. kind: V vowel, N nasal-vowel placeholder, C consonant, O other. */
interface Segment {
  kind: 'V' | 'N' | 'C' | 'O';
  c: string;
  pal: boolean;
  lateral?: boolean;
  wordStart?: boolean;
  wordEnd?: boolean;
}

/** Whitespace/punctuation between words. `sandhi` is true for plain spaces only. */
interface Separator {
  kind: 'sep';
  text: string;
  sandhi: boolean;
}

type Item = Segment | Separator;

// voiceless -> voiced obstruent pairs (AS symbols)
const TO_VOICED: ReadonlyMap<string, string> = new Map([
  ['p', 'b'], ['t', 'd'], ['k', 'g'], ['f', 'v'], ['s', 'z'],
  ['ś', 'ź'], ['š', 'ž'], ['c', 'dz'], ['ć', 'dź'], ['č', 'dž'], ['x', 'γ'],
]);
const TO_VOICELESS: ReadonlyMap<string, string> = new Map(
  [...TO_VOICED].map(([a, b]): [string, string] => [b, a]),
);

const VOWEL_LETTERS = 'aeiouyóąę';
const LABIAL_VELAR: Readonly<Record<string, string>> = {
  p: 'p', b: 'b', m: 'm', f: 'f', k: 'k', g: 'g', w: 'v', v: 'v',
};

const isSegment = (s: Item | null | undefined): s is Segment => !!s && s.kind !== 'sep';
const isObs = (s: Item | null | undefined): s is Segment =>
  isSegment(s) && s.kind === 'C' && (TO_VOICED.has(s.c) || TO_VOICELESS.has(s.c));
const isVoiced = (s: Segment): boolean => TO_VOICELESS.has(s.c);

function setVoicing(s: Segment, voiced: boolean): void {
  if (voiced) {
    const v = TO_VOICED.get(s.c);
    if (v) s.c = v;
  } else {
    const v = TO_VOICELESS.get(s.c);
    if (v) s.c = v;
  }
}

/* ---------- 1. orthography -> segments ---------- */

function toSegments(rawWord: string, o: ResolvedOptions): Segment[] {
  const w = rawWord.toLowerCase();
  const segs: Segment[] = [];
  const isV = (ch: string | undefined): boolean => ch !== undefined && VOWEL_LETTERS.includes(ch);
  const C = (c: string, extra: Partial<Segment> = {}): Segment => {
    const s: Segment = { kind: 'C', c, pal: false, ...extra };
    segs.push(s);
    return s;
  };
  const V = (c: string, kind: 'V' | 'N' = 'V'): void => {
    segs.push({ kind, c, pal: false });
  };
  let i = 0;

  // <i> directly after a consonant marks softness only when a vowel follows
  const swallowI = (): void => {
    if (w[i] === 'i' && isV(w[i + 1])) i++;
  };
  // optional palatalisation of t, d, l, r (only before i + vowel: dialog, Maria)
  const softOpt = (s: Segment): void => {
    if (w[i] === 'i' && isV(w[i + 1])) {
      s.pal = true;
      i++;
    }
  };

  while (i < w.length) {
    const ch = w[i];
    const nx: string | undefined = w[i + 1];

    switch (ch) {
      case 'a': case 'e': case 'o': case 'y':
        V(ch); i++; break;
      case 'ó':
        V('u'); i++; break;
      case 'u': {
        const prev = segs[segs.length - 1];
        const diphthong =
          !!prev && prev.kind === 'V' && (prev.c === 'a' || prev.c === 'e') && !isV(nx);
        V(diphthong ? 'ŭ' : 'u');
        i++;
        break;
      }
      case 'i': // reaches here only when not absorbed by a preceding consonant
        if (isV(nx)) C('j'); else V('i');
        i++;
        break;
      case 'ą': case 'ę':
        V(ch, 'N'); i++; break;

      case 'p': case 'b': case 'm': case 'f': case 'k': case 'g': case 'w': case 'v': {
        const s = C(LABIAL_VELAR[ch]);
        i++;
        if (w[i] === 'i') s.pal = true; // pʹi, bʹa, kʹe, gʹi ...
        swallowI();
        break;
      }
      case 'h': {
        const s = C('x');
        i++;
        if (w[i] === 'i') s.pal = true;
        swallowI();
        break;
      }
      case 'c':
        if (nx === 'z') { C('č'); i += 2; }
        else if (nx === 'h') {
          const s = C('x');
          i += 2;
          if (w[i] === 'i') s.pal = true;
          swallowI();
        } else if (nx === 'i') { C('ć'); i++; swallowI(); }
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
        } else {
          const s = C('d');
          i++;
          softOpt(s);
        }
        break;
      case 'r':
        if (nx === 'z') { C('ž'); i += 2; }
        else {
          const s = C('r');
          i++;
          softOpt(s);
        }
        break;
      case 't': {
        const s = C('t');
        i++;
        softOpt(s);
        break;
      }
      case 'l': {
        const s = C('l', { lateral: true });
        i++;
        softOpt(s);
        break;
      }
      case 'ł': C(o.lSymbol, { lateral: true }); i++; break;
      case 'j': C('j'); i++; break;
      case 'ż': C('ž'); i++; break;
      case 'ć': case 'ś': case 'ź': case 'ń': C(ch); i++; break;
      case 'q': C('k'); i++; break;
      case 'x': C('k'); C('s'); i++; break;
      default:
        segs.push({ kind: 'O', c: ch, pal: false });
        i++;
    }
  }
  return segs;
}

/* ---------- 2-4. voicing ---------- */

// next item, optionally looking across a plain space (word-boundary sandhi)
function nextSeg(flat: Item[], i: number, o: ResolvedOptions): Segment | null {
  const n = flat[i + 1];
  if (!n) return null;
  if (n.kind !== 'sep') return n;
  const after = flat[i + 2];
  return o.sandhi && n.sandhi && isSegment(after) ? after : null;
}

function applyVoicing(flat: Item[], o: ResolvedOptions): void {
  // 2. progressive devoicing of v and ž after a voiceless obstruent (same word)
  flat.forEach((s, i) => {
    if (isSegment(s) && s.kind === 'C' && (s.c === 'v' || s.c === 'ž') && !s.wordStart) {
      const p = flat[i - 1];
      if (isObs(p) && !isVoiced(p)) setVoicing(s, false);
    }
  });

  // 3. final devoicing (only where no following word/segment is reachable)
  flat.forEach((s, i) => {
    if (isObs(s) && s.wordEnd && isVoiced(s) && !nextSeg(flat, i, o)) setVoicing(s, false);
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

function resolveNasals(flat: Item[]): Item[] {
  const out: Item[] = [];
  flat.forEach((s, i) => {
    if (s.kind !== 'N') {
      out.push(s);
      return;
    }
    const isE = s.c === 'ę';
    const vowel = isE ? 'e' : 'o';
    const nasalVowel = isE ? 'ę' : 'ǫ';
    const V = (c: string): void => { out.push({ kind: 'V', c, pal: false }); };
    const N = (c: string): void => { out.push({ kind: 'C', c, pal: false }); };
    const nxt = s.wordEnd ? null : flat[i + 1];

    if (!isSegment(nxt)) { V(isE ? 'e' : 'ǫ'); return; } // final: się -> śe, idą -> idǫ
    if (nxt.lateral) { V(vowel); return; }               // wzięli -> vźeli

    const n = nxt.c;
    if (n === 'p' || n === 'b') { V(vowel); N('m'); }
    else if (['t', 'd', 'c', 'dz', 'č', 'dž'].includes(n)) { V(vowel); N('n'); }
    else if (n === 'ć' || n === 'dź') { V(vowel); N('ń'); }
    else if (n === 'k' || n === 'g') { V(vowel); N('ŋ'); }
    else V(nasalVowel); // before fricatives etc.
  });
  return out;
}

/* ---------- public API ---------- */

export function transcribe(text: string, options: TranscribeOptions = {}): string {
  const o: ResolvedOptions = { ...DEFAULTS, ...options };
  const parts = text.normalize('NFC').split(/(\p{L}+)/u); // odd indices = words
  let flat: Item[] = [];

  parts.forEach((p, idx) => {
    if (!p) return;
    if (idx % 2 === 1) {
      const segs = toSegments(p, o);
      segs.forEach((s, k) => {
        s.wordStart = k === 0;
        s.wordEnd = k === segs.length - 1;
      });
      flat.push(...segs);
    } else {
      flat.push({ kind: 'sep', text: p, sandhi: /^[ \t]+$/.test(p) });
    }
  });

  applyVoicing(flat, o);
  flat = resolveNasals(flat);

  return flat
    .map((s) => (s.kind === 'sep' ? s.text : s.c + (s.pal ? o.palatalMark : '')))
    .join('');
}

export default transcribe;
