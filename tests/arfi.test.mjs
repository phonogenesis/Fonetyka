/*
 * Regression tests for src/utils/formats/ARFI.ts
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

// Testy regresyjne transkrypcji ArFi.  Uruchomienie:  pnpm test
import test from 'node:test'
import assert from 'node:assert/strict'
import transcribe, {
  transcribeDetailed,
  tokenizePhones,
  INVENTORY,
} from '../src/utils/formats/ARFI.ts'

const eq = (input, expected, profile = 'bazowy', overrides = {}) =>
  assert.equal(transcribe(input, profile, overrides), expected)

test('Epilog – transkrypcja zatwierdzona 17.09.2026 (profil bazowy)', () => {
  eq(
    [
      'Te kraje radbym myślami powitał,',
      'Kraje dzieciństwa, gdzie człowiek <del>jak dziecie</del> po świecie',
      'Biegł jak <del>powrucił</del> po<del>wruc</del> łące, a znał tylko kwiecie',
      'Małe i pieknę jadowite rzucił,',
      'Ku pozytecznym oka nie odwrocił',
    ].join('\n'),
    [
      "te krai̯e radbym myɕlam'ɪ pov'ɪtaṷ,",
      "krai̯e ʒ́ećɪństfa, gʒ́e čṷov'ek <del>i̯ak ʒ́eće</del> po ɕf'eće",
      "b'egṷ i̯ak <del>povrućɪṷ</del> po<del>vruc</del> ṷǫce, a znaṷ tylko kf'eće",
      "maṷe ɪ p'eknę i̯adov'ɪte ʐućɪṷ,",
      'ku pozytečnym oka ńe odvroćɪṷ',
    ].join('\n')
  )
})

test('książka, s. 29 – wariant północnokresowy', () => {
  eq(
    'Wóz nurza się w zieloności i jak łódka brodzi',
    "voz nuʐa s'ę v z'elonos'c'ɪ ɪ i̯ak ṷotka broʒ'ɪ",
    'kresowy'
  )
})

test('przykłady z arkusza „Głoski" (profil bazowy)', () => {
  const pairs = {
    mama: 'mama',
    oko: 'oko',
    są: 'sǫ',
    ul: 'ul',
    ósmy: 'ósmy',
    im: 'ɪm',
    byk: 'byk',
    emu: 'emu',
    głównéy: 'gṷóvnéi̯',
    węch: 'vęx',
    łapa: 'ṷapa',
    ja: 'i̯a',
    las: 'las',
    lipa: "l'ɪpa",
    rok: 'rok',
    riposta: "r'ɪposta",
    mak: 'mak',
    miś: "m'ɪɕ",
    ono: 'ono',
    koń: 'koń',
    gafa: 'gafa',
    film: "f'ɪlm",
    wola: 'vola',
    wino: "v'ɪno",
    sam: 'sam',
    sinus: "s'ɪnus",
    zmora: 'zmora',
    Zanzibar: "zanz'ɪbar",
    szal: 'ʃal',
    rzeka: 'ʐeka',
    żigolak: "ʐ'ɪgolak",
    chata: 'xata',
    Chiny: "x'ɪny",
    cel: 'cel',
    racji: "rac'i̯ɪ",
    ćma: 'ćma',
    dzwon: 'ʒvon',
    czas: 'čas',
    dżuma: 'ǯuma',
    dżin: "ǯ'ɪn",
    pas: 'pas',
    piwo: "p'ɪvo",
    bas: 'bas',
    bić: "b'ɪć",
    tam: 'tam',
    tipsy: "t'ɪpsy",
    dom: 'dom',
    diwa: "d'ɪva",
    kto: 'kto',
    kino: "k'ɪno",
    gdy: 'gdy',
    giń: "g'ɪń",
  }
  for (const [word, expected] of Object.entries(pairs)) eq(word, expected)
})

test('przykłady z arkusza wymagające procesów fonetycznych (profil ortofoniczny)', () => {
  eq('śnieg', 'ɕńek', 'ortofoniczny')
  eq('tango', 'taŋgo', 'ortofoniczny')
  eq('źródło', 'źrudṷo', 'ortofoniczny')
  eq('klechda', 'kleɣda', 'ortofoniczny')
  eq('dźwięk', "ʒ́v'i̯eŋk", 'ortofoniczny', { softLabials: 'async' })
})

test('dawna pisownia joty', () => {
  eq('moy kray iak iest naywiększy', "moi̯ krai̯ i̯ak i̯est nai̯v'ękʃy")
  eq('Marya historya racyi akademii', "mar'i̯a ɣ'ɪstor'i̯a rac'i̯ɪ akadem'i̯ɪ")
  eq('żyie szyia wyiechał przyiaciel wyobrazić', 'ʐyi̯e ʃyi̯a vyi̯exaṷ pʃyi̯aćel vyobraźɪć')
  eq('moi swoich nadzieia', 'moi̯ɪ sfoi̯ɪx naʒ́ei̯a')
  eq('wiie biie J Jgnacy', "v'ɪi̯e b'ɪi̯e ɪ ɪgnacy")
  eq('poʃzczuł kſtałt muʃi', 'poʃčuṷ kstaṷt muɕɪ') // długie s w źródle
})

test('dźwięczność – profil ortofoniczny', () => {
  eq('prośba ławka także krzak trzy', 'proźba ṷafka tagʐe kʃak tʃy', 'ortofoniczny')
  eq('krwi mózg.', "krf'ɪ musk.", 'ortofoniczny')
  eq('brat ojca, brat Zosi, w tym z pola', 'brat oi̯ca, brad zoɕɪ, f tym s pola', 'ortofoniczny')
  eq('wóz nurza', 'vus nuʐa', 'ortofoniczny')
  eq('wóz nurza', 'vuz nuʐa', 'ortofoniczny', { sandhi: 'retaining' })
  eq('brat ojca', 'brad oi̯ca', 'ortofoniczny', { sandhi: 'voicing' })
  eq('zjazd Azja racja', "zi̯ast az'i̯a rac'i̯a", 'ortofoniczny')
})

test('nosówki rozłożone', () => {
  eq(
    'dąb ręka pięć wziął wzięli idą się wąs',
    "domp reŋka p'eńć vźoṷ vźel'ɪ ɪdǫ ɕe vǫs",
    'ortofoniczny'
  )
})

test('granice morfemów i wyjątki', () => {
  eq('marznąć podziemny odzew', 'marznǫć podźemny odzev')
  eq('armia', "arm'i̯a", 'bazowy', { exceptions: { armia: "arm'i̯a" } })
})

test('znaczniki i encje są przezroczyste', () => {
  eq(
    'Xi<hi rend="underline">ą</hi>dz&#160;pocz<hi\n rend="underline">ę</hi>ła',
    'kɕ<hi rend="underline">ǫ</hi>ʒ&#160;poč<hi\n rend="underline">ę</hi>ṷa'
  )
  eq('pi<del>e</del>sze', "p'<del>e</del>ʃe")
  eq('расположенiе', 'расположенiе')
})

test('wynik składa się wyłącznie z głosek inwentarza', () => {
  const sample =
    'Litwo! Ojczyzno moja! ty jesteś jak zdrowie; Ile cię trzeba cenić, ten tylko się dowie, ' +
    'Kto cię stracił. Dziś piękność twą w całej ozdobie Widzę i opisuję, bo tęsknię po tobie. ' +
    'Chrząszcz brzmi w trzcinie, źdźbło, gżegżółka, hańba, dżdżysty, Xiądz, philozofia'
  for (const profile of ['bazowy', 'kresowy', 'ortofoniczny']) {
    const { phones, warnings } = transcribeDetailed(sample, profile)
    assert.deepEqual(warnings, [])
    for (const phone of phones) assert.ok(INVENTORY.includes(phone), `${profile}: ${phone}`)
  }
})

test('tokenizacja wg najdłuższego dopasowania', () => {
  assert.deepEqual(tokenizePhones("ʒ́v'i̯eŋk"), ['ʒ́', "v'", 'i̯', 'e', 'ŋ', 'k'])
})

test('brak stanu między wywołaniami', () => {
  const first = transcribe('kwiat prośba dąb')
  transcribe('zupełnie inny tekst, żeby coś zmienić')
  assert.equal(transcribe('kwiat prośba dąb'), first)
})
