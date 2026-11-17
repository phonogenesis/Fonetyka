/*
 * ArFi – phonetic transcription in the notation of the Phonogenesis project
 * Copyright (C) 2026 Przemysław Grądzki
 *
 * Part of a modified version of Fonetyka by Jakub Kłało,
 * prepared for the research project "Euphony in Adam Mickiewicz's Writings. Genetic
 * Approach" (National Science Centre, Poland, grant no. 2024/55/B/HS2/01013).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Transkrypcja fonetyczna polszczyzny rękopisów filomackich
 * do notacji projektu „Eufonia Mickiewiczowska w perspektywie genetycznej".
 *
 * Notacja wyjściowa: inwentarz 61 głosek z arkusza TEI_gloski_v3
 * (a, ɪ, l, ṷ, ɕ, ʃ, ʐ, i̯; zmiękczenie = apostrof U+0027; NFC).
 *
 * Moduł jest samodzielny (bez importów) i bezstanowy: ten sam tekst
 * z tymi samymi opcjami daje zawsze ten sam wynik.
 *
 * Etapy:
 *   1. rozbiór wejścia: znaczniki XML (przezroczyste), encje, wyrazy, separatory
 *   2. litery -> głoski (dwuznaki, zmiękczenia przez <i>, dawna pisownia joty)
 *   3. ubezdźwięcznienie postępowe (kwiat, przy)
 *   4. wygłos i fonetyka międzywyrazowa
 *   5. upodobnienie wsteczne wewnątrz wyrazu (prośba, ławka)
 *   6. samogłoski nosowe, ŋ, wariant kresowy miękkich
 *   7. złożenie wyniku z powrotem ze znacznikami i interpunkcją
 */

export type Sandhi = 'none' | 'devoicing' | 'retaining' | 'voicing'

export interface ArfiOptions {
  /** w, rz po bezdźwięcznej -> f, ʃ (kwiat -> kf'at, przy -> pʃy) */
  progressive: boolean
  /** upodobnienie wsteczne pod względem dźwięczności wewnątrz wyrazu (prośba -> proźba) */
  regressive: boolean
  /** ubezdźwięcznienie wygłosu przed pauzą (wóz -> vus) */
  finalDevoicing: boolean
  /**
   * fonetyka międzywyrazowa (tylko przez spację, nie przez interpunkcję ani koniec wersu):
   *  none      – każdy wyraz osobno
   *  devoicing – ubezdźwięczniająca (warszawska): brat ojca -> brat oi̯ca, wóz nurza -> vus nuʐa
   *  retaining – zachowująca dźwięczność przed samogłoską i sonorną (książka, s. 29: voz nuʐa),
   *              bez udźwięczniania bezdźwięcznych (i̯ak ṷotka)
   *  voicing   – udźwięczniająca w pełni: brat ojca -> brad oi̯ca
   */
  sandhi: Sandhi
  /** ą, ę: keep = zawsze ǫ, ę; split = rozłożone przed zwartymi (dąb -> domb/domp, ręka -> reŋka) */
  nasals: 'keep' | 'split'
  /** wygłosowe ę: keep = ę, oral = e */
  finalNasalE: 'keep' | 'oral'
  /** n przed k, g -> ŋ (tango -> taŋgo) */
  velarNasal: boolean
  /** litera h: ɣ (zachowana opozycja h : ch) albo x */
  h: 'ɣ' | 'x'
  /** litera ó: ó (ścieśnione, osobna głoska), u albo o (Nowogródzkie, książka s. 29) */
  oAcute: 'ó' | 'u' | 'o'
  /** wargowe miękkie przed samogłoską: sync = p'e, async = p'i̯e */
  softLabials: 'sync' | 'async'
  /** ć, ɕ, ź, ʒ́ -> c', s', z', ʒ' (wariant północnokresowy, książka s. 29) */
  kresowaSoftness: boolean
  /** słownik wyjątków: wyraz ortograficzny (małymi literami) -> gotowa transkrypcja */
  exceptions: Record<string, string>
}

export type ProfileName = 'bazowy' | 'ortofoniczny' | 'kresowy'

/** Wyrazy, których reguły nie rozstrzygną (obce połączenia si, zi, ci, ni z twardą spółgłoską itd.). */
export const BUILTIN_EXCEPTIONS: Readonly<Record<string, string>> = Object.freeze({
  sinus: "s'ɪnus",
  zanzibar: "zanz'ɪbar",
})

export const PROFILES: Readonly<Record<ProfileName, Readonly<ArfiOptions>>> = Object.freeze({
  // Zgodny z transkrypcją Epilogu zatwierdzoną 17.09.2026 i z regułami konwertera z testu 30.09.2026:
  // blisko grafemu, tylko ubezdźwięcznienie postępowe.
  bazowy: Object.freeze<ArfiOptions>({
    progressive: true,
    regressive: false,
    finalDevoicing: false,
    sandhi: 'none',
    nasals: 'keep',
    finalNasalE: 'keep',
    velarNasal: false,
    h: 'ɣ',
    oAcute: 'ó',
    softLabials: 'sync',
    kresowaSoftness: false,
    exceptions: BUILTIN_EXCEPTIONS,
  }),
  // Współczesna wymowa wzorcowa (dla porównań i korpusu referencyjnego).
  ortofoniczny: Object.freeze<ArfiOptions>({
    progressive: true,
    regressive: true,
    finalDevoicing: true,
    sandhi: 'devoicing',
    nasals: 'split',
    finalNasalE: 'oral',
    velarNasal: true,
    h: 'x',
    oAcute: 'u',
    softLabials: 'sync',
    kresowaSoftness: false,
    exceptions: BUILTIN_EXCEPTIONS,
  }),
  // Rekonstrukcja północnokresowa wg książki, s. 29.
  kresowy: Object.freeze<ArfiOptions>({
    progressive: true,
    regressive: true,
    finalDevoicing: true,
    sandhi: 'retaining',
    nasals: 'keep',
    finalNasalE: 'keep',
    velarNasal: false,
    h: 'ɣ',
    oAcute: 'o',
    softLabials: 'sync',
    kresowaSoftness: true,
    exceptions: BUILTIN_EXCEPTIONS,
  }),
})

/** Inwentarz 61 głosek (arkusz „Głoski", TEI_gloski_v3). */
export const INVENTORY: readonly string[] = Object.freeze([
  'a',
  'o',
  'ǫ',
  'u',
  'ó',
  'ɪ',
  'y',
  'e',
  'é',
  'ę',
  'ṷ',
  'i̯',
  'l',
  "l'",
  'r',
  "r'",
  'm',
  "m'",
  'n',
  'ń',
  'ŋ',
  'f',
  "f'",
  'v',
  "v'",
  's',
  "s'",
  'ɕ',
  'z',
  "z'",
  'ź',
  'ʃ',
  "ʃ'",
  'ʐ',
  "ʐ'",
  'x',
  "x'",
  'ɣ',
  "ɣ'",
  'c',
  "c'",
  'ć',
  'ʒ',
  "ʒ'",
  'ʒ́',
  'č',
  "č'",
  'ǯ',
  "ǯ'",
  'p',
  "p'",
  'b',
  "b'",
  't',
  "t'",
  'd',
  "d'",
  'k',
  "k'",
  'g',
  "g'",
])

/* ------------------------------------------------------------------ */
/* typy wewnętrzne                                                     */
/* ------------------------------------------------------------------ */

/** V samogłoska, N nosówka do rozstrzygnięcia, G półsamogłoska, C spółgłoska, O znak spoza reguł */
type Kind = 'V' | 'N' | 'G' | 'C' | 'O'

interface Seg {
  kind: Kind
  /** glif podstawowy, bez apostrofu */
  g: string
  /** zmiękczona (apostrof) */
  pal: boolean
  /** ʐ pochodzące z dwuznaku rz */
  rz?: boolean
  /** pozycja pierwszej litery źródłowej w strumieniu oczyszczonym */
  at: number
  word: number
}

interface Word {
  start: number
  end: number
  segs: Seg[]
  /** czy przed następnym wyrazem stoi wyłącznie odstęp (brak pauzy) */
  linked: boolean
}

export interface ArfiResult {
  text: string
  /** głoski w kolejności, bez separatorów */
  phones: string[]
  warnings: string[]
}

const VOWEL_LETTERS = 'aeiouyóéąę'
const isV = (ch: string | undefined): boolean => ch !== undefined && VOWEL_LETTERS.includes(ch)

const VOICED_OF: Readonly<Record<string, string>> = {
  p: 'b',
  t: 'd',
  k: 'g',
  f: 'v',
  s: 'z',
  ɕ: 'ź',
  ʃ: 'ʐ',
  c: 'ʒ',
  ć: 'ʒ́',
  č: 'ǯ',
  x: 'ɣ',
}
const VOICELESS_OF: Readonly<Record<string, string>> = Object.keys(VOICED_OF).reduce(
  (acc, k) => {
    acc[VOICED_OF[k]] = k
    return acc
  },
  {} as Record<string, string>
)

const isObs = (s: Seg | undefined): s is Seg =>
  !!s && s.kind === 'C' && (s.g in VOICED_OF || s.g in VOICELESS_OF)
const isVoiced = (s: Seg): boolean => s.g in VOICELESS_OF
/** dźwięczne v i ʐ<rz nie udźwięczniają poprzedzającej spółgłoski (twój, krzak) */
const isTrigger = (s: Seg): boolean => !(isVoiced(s) && (s.g === 'v' || s.rz === true))

function setVoicing(s: Seg, voiced: boolean): void {
  const target = voiced ? VOICED_OF[s.g] : VOICELESS_OF[s.g]
  if (target) {
    s.g = target
    if (!voiced) s.rz = false
  }
}

/* ------------------------------------------------------------------ */
/* 1. rozbiór wejścia                                                  */
/* ------------------------------------------------------------------ */

interface Lexed {
  /** tekst bez znaczników; encje zastąpione pojedynczym znakiem */
  clean: string
  /** znaczniki z pozycją w `clean`, przed którą stoją */
  tags: { at: number; text: string }[]
  /** encje: znak zastępczy -> oryginał */
  entities: Map<number, string>
}

const ENTITY_CHAR = ''

function lex(input: string): Lexed {
  const tags: Lexed['tags'] = []
  const entities = new Map<number, string>()
  let clean = ''
  const re = /<[^>]*>|&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z]+);/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    clean += input.slice(last, m.index)
    if (m[0][0] === '<') {
      tags.push({ at: clean.length, text: m[0] })
    } else {
      entities.set(clean.length, m[0])
      clean += ENTITY_CHAR
    }
    last = m.index + m[0].length
  }
  clean += input.slice(last)
  return { clean, tags, entities }
}

/* ------------------------------------------------------------------ */
/* 2. litery -> głoski                                                 */
/* ------------------------------------------------------------------ */

/** normalizacja pojedynczych liter (R0 z testu 30.09.2026) */
const LETTER_NORMAL: Readonly<Record<string, string>> = {
  ſ: 's',
  ʃ: 's',
  á: 'a',
  à: 'a',
  â: 'a',
  ä: 'a',
  è: 'e',
  ê: 'e',
  ë: 'e',
  ô: 'o',
  ö: 'o',
  ò: 'o',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ú: 'u',
  î: 'i',
  ï: 'i',
  í: 'i',
  ç: 'c',
  ý: 'y',
  ß: 's',
  ñ: 'ń',
  ė: 'e',
  ĕ: 'e',
  ē: 'e',
  ž: 'ż',
  ā: 'a',
  ō: 'o',
  ū: 'u',
  ī: 'i',
}

/**
 * Miejsca, w których rz / dz nie są dwuznakami (granica morfemu).
 * Grupa 1 wyrażenia = litery poprzedzające r lub d. Lista do uzupełniania.
 */
const DIGRAPH_SPLITS: readonly RegExp[] = [
  /(ma)rz(?=n|ł|l)/g, // marznąć, zamarzł, zmarzlina
  /(mie)rzi/g, // mierzić
  /(^e)rzac/g,
  /(^ta)rzan/g,
  /(^(?:na|po|wy|za|przy|roz)?(?:o|po|na|prze))d(?=z(?:iem|ew|yw|ysk|wycz|nacz|nak|na[ćjłl]|or|ór|wierc|dr)|ż(?:yw|eg))/g,
]

function splitPoints(letters: string): Set<number> {
  const set = new Set<number>()
  for (const re of DIGRAPH_SPLITS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(letters)) !== null) {
      set.add(m.index + m[1].length)
      if (m[0].length === 0) re.lastIndex++
    }
  }
  return set
}

/** spółgłoski, które przed <i> dają głoskę prepalatalną */
const PREPALATAL: Readonly<Record<string, string>> = { s: 'ɕ', z: 'ź', c: 'ć', n: 'ń', ʒ: 'ʒ́' }

type CClass = 'P' | 'L' | 'T' | 'X'

function wordToSegs(raw: string, start: number, wordIdx: number, o: ArfiOptions): Seg[] {
  // litery po normalizacji + mapa na pozycje źródłowe
  const L: string[] = []
  const P: number[] = []
  const lower = raw.toLowerCase()
  for (let k = 0; k < lower.length; k++) {
    const ch = LETTER_NORMAL[lower[k]] ?? lower[k]
    const push = (c: string) => {
      L.push(c)
      P.push(start + k)
    }
    if (ch === 'x') {
      push('k')
      push('s')
    } else if (ch === 'q') {
      push('k')
      if (lower[k + 1] === 'u') {
        k++
        push('w')
      }
    } else if (ch === 'p' && lower[k + 1] === 'h') {
      k++
      push('f')
    } else if (ch === 't' && lower[k + 1] === 'h') {
      k++
      push('t')
    } else if (lower[k] === 'ß') {
      push('s')
      push('z')
    } else push(ch)
  }

  const letters = L.join('')
  const noDigraph = splitPoints(letters)
  const segs: Seg[] = []
  const add = (kind: Kind, g: string, at: number, extra: Partial<Seg> = {}): Seg => {
    const s: Seg = { kind, g, pal: false, at, word: wordIdx, ...extra }
    segs.push(s)
    return s
  }
  const lastKind = (): Kind | undefined => segs[segs.length - 1]?.kind

  let i = 0

  /**
   * Spółgłoska `g` została właśnie odczytana, `i` wskazuje literę po niej.
   * Rozstrzyga zmiękczenie przez <i>, dawną jotę <y> i <j>.
   */
  const consonant = (g: string, cls: CClass, at: number, extra: Partial<Seg> = {}): void => {
    const s = add('C', g, at, extra)
    const n1 = L[i]
    const n2 = L[i + 1]
    const soften = (): void => {
      if (cls === 'P') s.g = PREPALATAL[g]
      else s.pal = true
    }
    const softenBeforeJot = (): void => {
      // racya, okazya, historya, Azja: zmiękczona, nie miękka (tabela: racji -> rac'i̯ɪ)
      if (g === 'n') s.g = 'ń'
      else s.pal = true
    }

    if (cls === 'X') return

    if (n1 === 'i') {
      soften()
      if (n2 === 'i' && isV(L[i + 2])) {
        // wiie, biie, żmiia: pierwsze <i> samogłoskowe, drugie jest jotą
      } else if (n2 === 'i') {
        // -ii: akademii -> akadem'i̯ɪ, Danii -> dańi̯ɪ
        i++
        add('G', 'i̯', P[i - 1])
      } else if (isV(n2)) {
        i++ // <i> jest tylko znakiem miękkości
        const labial = 'pbmfv'.includes(g)
        if (cls === 'T' || (labial && o.softLabials === 'async')) add('G', 'i̯', P[i - 1])
      }
      return
    }
    // dawna pisownia joty po spółgłosce: Marya, historya, racyi.
    // Nie dotyczy: żyie, szyia, kryie (y samogłoskowe + jota pisana <i>)
    // ani przedrostków wy-, przy- przed samogłoską (wyobrazić, przyodziać).
    const yThenJot = n2 === 'i' && isV(L[i + 2])
    const prefixY = /^(?:nie|naj|nay|po|na|za|u|roz)?(?:w|prz)$/.test(letters.slice(0, i))
    if (n1 === 'y' && isV(n2) && n2 !== 'y' && !yThenJot && !prefixY) {
      softenBeforeJot()
      i++
      add('G', 'i̯', P[i - 1])
      return
    }
    if (n1 === 'j' && isV(n2) && (g === 's' || g === 'c' || g === 'z')) {
      // racja, pasja, Azja – ale nie na granicy przedrostka: zjazd, rozjazd, bezjęzyczny
      const before = letters.slice(0, i - 1)
      const prefixZ = g === 'z' && (before === '' || before === 'ro' || before === 'be')
      if (!prefixZ) s.pal = true
    }
  }

  while (i < L.length) {
    const ch = L[i]
    const nx = L[i + 1]
    const at = P[i]
    const prevLetter = L[i - 1]

    switch (ch) {
      case 'a':
      case 'e':
      case 'o':
      case 'é':
        add('V', ch, at)
        i++
        break
      case 'ó':
        add('V', o.oAcute, at)
        i++
        break
      case 'u':
        // nagłosowe au-, eu- przed spółgłoską: autor, Europa, eufonia
        if (i === 1 && (L[0] === 'a' || L[0] === 'e') && nx !== undefined && !isV(nx))
          add('G', 'ṷ', at)
        else add('V', 'u', at)
        i++
        break
      case 'ą':
      case 'ę':
        add('N', ch, at)
        i++
        break
      case 'y':
        // dawna pisownia joty: moy, kray, naywiększy; yako
        if (isV(prevLetter) || (i === 0 && isV(nx))) add('G', 'i̯', at)
        else add('V', 'y', at)
        i++
        break
      case 'i':
        // tu trafia tylko <i> niepochłonięte przez spółgłoskę
        if (isV(nx) && nx !== 'i') {
          add('G', 'i̯', at) // iak, iest, moia
        } else {
          if (lastKind() === 'V' || lastKind() === 'N') add('G', 'i̯', at) // moi -> moi̯ɪ
          add('V', 'ɪ', at)
        }
        i++
        break
      case 'j':
        // dawne <J> w funkcji <I>: J (spójnik), Jgnacy, Jmię
        if (i === 0 && !isV(nx)) add('V', 'ɪ', at)
        else add('G', 'i̯', at)
        i++
        break
      case 'ł':
        add('G', 'ṷ', at)
        i++
        break

      case 'p':
      case 'b':
      case 'm':
      case 'f':
      case 'k':
      case 'g':
        i++
        consonant(ch, 'L', at)
        break
      case 'w':
      case 'v':
        i++
        consonant('v', 'L', at)
        break
      case 'h':
        i++
        consonant(o.h, 'L', at)
        break
      case 'c':
        if (nx === 'h') {
          i += 2
          consonant('x', 'L', at)
        } else if (nx === 'z') {
          i += 2
          consonant('č', 'T', at)
        } else {
          i++
          consonant('c', 'P', at)
        }
        break
      case 's':
        if (nx === 'z') {
          i += 2
          consonant('ʃ', 'T', at)
        } else {
          i++
          consonant('s', 'P', at)
        }
        break
      case 'z':
        i++
        consonant('z', 'P', at)
        break
      case 'n':
        i++
        consonant('n', 'P', at)
        break
      case 'd':
        if (noDigraph.has(i)) {
          i++
          consonant('d', 'T', at)
        } else if (nx === 'ź') {
          i += 2
          consonant('ʒ́', 'X', at)
        } else if (nx === 'ż') {
          i += 2
          consonant('ǯ', 'T', at)
        } else if (nx === 'z') {
          i += 2
          consonant('ʒ', 'P', at)
        } else {
          i++
          consonant('d', 'T', at)
        }
        break
      case 'r':
        if (nx === 'z' && !noDigraph.has(i)) {
          i += 2
          consonant('ʐ', 'T', at, { rz: true })
        } else {
          i++
          consonant('r', 'T', at)
        }
        break
      case 't':
      case 'l':
        i++
        consonant(ch, 'T', at)
        break
      case 'ż':
        i++
        consonant('ʐ', 'T', at)
        break
      case 'ś':
        i++
        consonant('ɕ', 'X', at)
        break
      case 'ź':
        i++
        consonant('ź', 'X', at)
        break
      case 'ć':
        i++
        consonant('ć', 'X', at)
        break
      case 'ń':
        i++
        consonant('ń', 'X', at)
        break
      default:
        add('O', ch, at)
        i++
    }
  }
  return segs
}

/** rozbiór gotowej transkrypcji (wyjątki) na głoski – reguła najdłuższego dopasowania */
const INVENTORY_BY_LENGTH = [...INVENTORY].sort((a, b) => b.length - a.length)
const VOWEL_GLYPHS = new Set(['a', 'o', 'ǫ', 'u', 'ó', 'ɪ', 'y', 'e', 'é', 'ę'])

export function tokenizePhones(transcription: string): string[] {
  const t = transcription.normalize('NFC')
  const out: string[] = []
  let i = 0
  while (i < t.length) {
    const hit = INVENTORY_BY_LENGTH.find((g) => t.startsWith(g, i))
    if (hit) {
      out.push(hit)
      i += hit.length
    } else {
      out.push(t[i])
      i++
    }
  }
  return out
}

function exceptionToSegs(value: string, at: number, wordIdx: number): Seg[] {
  return tokenizePhones(value).map((p): Seg => {
    const pal = p.length > 1 && p.endsWith("'")
    const g = pal ? p.slice(0, -1) : p
    const kind: Kind = VOWEL_GLYPHS.has(g)
      ? 'V'
      : g === 'ṷ' || g === 'i̯'
        ? 'G'
        : INVENTORY.includes(p)
          ? 'C'
          : 'O'
    return { kind, g, pal, at, word: wordIdx }
  })
}

/* ------------------------------------------------------------------ */
/* 3–6. procesy fonetyczne                                             */
/* ------------------------------------------------------------------ */

function applyVoicing(words: Word[], o: ArfiOptions): void {
  // 3. ubezdźwięcznienie postępowe
  if (o.progressive) {
    for (const w of words) {
      for (let k = 1; k < w.segs.length; k++) {
        const s = w.segs[k]
        if (s.kind !== 'C' || !(s.g === 'v' || (s.g === 'ʐ' && s.rz))) continue
        const p = w.segs[k - 1]
        const pp = w.segs[k - 2]
        const afterVoiceless = isObs(p) && !isVoiced(p)
        const viaR = s.g === 'v' && p.kind === 'C' && p.g === 'r' && isObs(pp) && !isVoiced(pp) // krwi, trwa
        if (afterVoiceless || viaR) setVoicing(s, false)
      }
    }
  }

  // 4. wygłos i fonetyka międzywyrazowa
  words.forEach((w, idx) => {
    const segs = w.segs
    let from = segs.length
    while (from > 0 && isObs(segs[from - 1])) from--
    if (from === segs.length) return
    const cluster = segs.slice(from)
    const next = w.linked ? words[idx + 1]?.segs[0] : undefined
    const nextObs = isObs(next) && isTrigger(next)

    let target: boolean | null = null // null = bez zmiany
    const proclitic = segs.length === 1 // w, z
    if (proclitic) {
      if (o.regressive && next && nextObs) target = isVoiced(next as Seg)
    } else if (next && o.sandhi !== 'none') {
      if (nextObs) target = isVoiced(next as Seg)
      else if (o.sandhi === 'devoicing') target = false
      else if (o.sandhi === 'voicing') target = true
    } else if (o.finalDevoicing) {
      target = false
    }
    if (target !== null) for (const s of cluster) setVoicing(s, target)
  })

  // 5. upodobnienie wsteczne wewnątrz wyrazu
  if (o.regressive) {
    for (const w of words) {
      for (let k = w.segs.length - 2; k >= 0; k--) {
        const s = w.segs[k]
        const n = w.segs[k + 1]
        if (isObs(s) && isObs(n) && isTrigger(n)) setVoicing(s, isVoiced(n))
      }
    }
  }
}

function resolveNasals(words: Word[], o: ArfiOptions): void {
  for (const w of words) {
    const out: Seg[] = []
    w.segs.forEach((s, k) => {
      if (s.kind !== 'N') {
        out.push(s)
        return
      }
      const isE = s.g === 'ę'
      const nasal = isE ? 'ę' : 'ǫ'
      const oral = isE ? 'e' : 'o'
      const nxt = w.segs[k + 1]
      const V = (g: string): void => {
        out.push({ ...s, kind: 'V', g })
      }
      const C = (g: string): void => {
        out.push({ ...s, kind: 'C', g, pal: false })
      }

      if (!nxt) {
        V(isE && o.finalNasalE === 'oral' ? 'e' : nasal)
        return
      }
      if (o.nasals === 'keep') {
        V(nasal)
        return
      }
      const n = nxt.g
      if (nxt.kind === 'G' && n === 'ṷ')
        V(oral) // wziął
      else if (n === 'l')
        V(oral) // wzięli
      else if (n === 'p' || n === 'b') {
        V(oral)
        C('m')
      } else if ('tdcʒčǯ'.includes(n) && n.length === 1) {
        V(oral)
        C('n')
      } else if (n === 'ć' || n === 'ʒ́') {
        V(oral)
        C('ń')
      } else if (n === 'k' || n === 'g') {
        V(oral)
        C('ŋ')
      } else V(nasal) // przed szczelinowymi i pozostałymi
    })
    w.segs = out
  }
}

const KRESOWE: Readonly<Record<string, string>> = { ć: 'c', ɕ: 's', ź: 'z', ʒ́: 'ʒ' }

function finish(words: Word[], o: ArfiOptions): void {
  for (const w of words) {
    w.segs.forEach((s, k) => {
      if (o.velarNasal && s.kind === 'C' && s.g === 'n') {
        const n = w.segs[k + 1]
        if (n && n.kind === 'C' && (n.g === 'k' || n.g === 'g')) s.g = 'ŋ'
      }
      if (o.kresowaSoftness && s.kind === 'C' && s.g in KRESOWE) {
        s.g = KRESOWE[s.g]
        s.pal = true
      }
    })
  }
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

// U+0283 (ʃ): w edycji ArFi tym znakiem oddawane jest długie s rękopisu
const LETTER = /[A-Za-zÀ-ÖØ-öø-ɏʃ]+/g

export function resolveOptions(
  profile: ProfileName = 'bazowy',
  overrides: Partial<ArfiOptions> = {}
): ArfiOptions {
  const base = PROFILES[profile]
  return {
    ...base,
    ...overrides,
    exceptions: { ...base.exceptions, ...(overrides.exceptions ?? {}) },
  }
}

export function transcribeDetailed(
  input: string,
  profile: ProfileName = 'bazowy',
  overrides: Partial<ArfiOptions> = {}
): ArfiResult {
  const o = resolveOptions(profile, overrides)
  const { clean, tags, entities } = lex(input.normalize('NFC'))
  const warnings: string[] = []

  // wyrazy
  const words: Word[] = []
  LETTER.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LETTER.exec(clean)) !== null) {
    const raw = m[0]
    // litery łacińskie wewnątrz wyrazu pisanego cyrylicą lub greką zostają bez zmian
    const around = clean.charAt(m.index - 1) + clean.charAt(m.index + raw.length)
    if (/[\u0370-\u052F\u1F00-\u1FFF]/.test(around)) continue
    const idx = words.length
    const exc = o.exceptions[raw.toLowerCase()]
    const segs =
      exc !== undefined ? exceptionToSegs(exc, m.index, idx) : wordToSegs(raw, m.index, idx, o)
    words.push({ start: m.index, end: m.index + raw.length, segs, linked: false })
  }
  words.forEach((w, k) => {
    const nxt = words[k + 1]
    if (!nxt) return
    const between = clean.slice(w.end, nxt.start)
    // pauzą jest wszystko poza zwykłym odstępem: interpunkcja, koniec wiersza, encja inna niż spacja
    w.linked =
      between.length > 0 &&
      [...between].every((ch, j) =>
        ch === ENTITY_CHAR
          ? /^&(#160|#xa0|nbsp);$/i.test(entities.get(w.end + j) ?? '')
          : ch === ' ' || ch === '\t' || ch === ' '
      )
  })

  applyVoicing(words, o)
  resolveNasals(words, o)
  finish(words, o)

  // złożenie wyniku
  const phones: string[] = []
  let out = ''
  let tagIdx = 0
  const flushTags = (pos: number): void => {
    while (tagIdx < tags.length && tags[tagIdx].at <= pos) out += tags[tagIdx++].text
  }
  let pos = 0
  for (const w of words) {
    for (; pos < w.start; pos++) {
      flushTags(pos)
      out += clean[pos] === ENTITY_CHAR ? (entities.get(pos) ?? '') : clean[pos]
    }
    for (const s of w.segs) {
      flushTags(s.at)
      const glyph = s.g + (s.pal ? "'" : '')
      if (s.kind === 'O')
        warnings.push(
          `Znak „${s.g}" w wyrazie „${clean.slice(w.start, w.end)}" nie jest objęty regułami – przepisany bez zmian.`
        )
      else phones.push(glyph)
      out += glyph
    }
    pos = w.end
  }
  for (; pos < clean.length; pos++) {
    flushTags(pos)
    out += clean[pos] === ENTITY_CHAR ? (entities.get(pos) ?? '') : clean[pos]
  }
  flushTags(clean.length)

  return { text: out.normalize('NFC'), phones, warnings: [...new Set(warnings)] }
}

export default function transcribe(
  input: string,
  profile: ProfileName = 'bazowy',
  overrides: Partial<ArfiOptions> = {}
): string {
  return transcribeDetailed(input, profile, overrides).text
}
