/*
 * Fonetyka – Polish phonetic transcription generator
 * Copyright (C) 2023-2025 Jakub Kłało <https://github.com/Quanosek/Fonetyka>
 * Copyright (C) 2026 Przemysław Grądzki
 *
 * Modified 2026-11-16 by Przemysław Grądzki
 * for the research project "Euphony in Adam Mickiewicz's Writings. Genetic
 * Approach" (National Science Centre, Poland, grant no. 2024/55/B/HS2/01013):
 * - choice of transcription method (three ArFi profiles or the original
 *   algorithm), detailed rules, exception dictionary and warnings;
 * - input keeps punctuation, line breaks and TEI tags; output line by line;
 * - copying via navigator.clipboard.
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

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { rewriteKlalo } from '@/utils/rewrite'
import {
  transcribeDetailed,
  PROFILES,
  type ArfiOptions,
  type ProfileName,
  type Sandhi,
} from '@/utils/formats/ARFI'

import styles from './page.module.scss'

import { Domine } from 'next/font/google'
const DomineFont = Domine({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

type Engine = ProfileName | 'klalo'
type Toggles = Omit<ArfiOptions, 'exceptions'>

interface HistoryLog {
  date: string
  input: string
  output: string[]
}

const ENGINE_LABELS: Record<Engine, string> = {
  bazowy: 'ArFi – bazowy (blisko grafemu, jak Epilog)',
  kresowy: 'ArFi – północnokresowy (książka, s. 29)',
  ortofoniczny: 'ArFi – ortofoniczny (wymowa dzisiejsza)',
  klalo: 'KLALO – algorytm oryginalny (AS)',
}

const BUTTON_IDLE = 'Generuj + kopiuj'

// wyjątki: jeden na wiersz, „wyraz = transkrypcja"
function parseExceptions(text: string): Record<string, string> {
  const map: Record<string, string> = {}
  text.split('\n').forEach((line) => {
    const [word, value] = line.split('=').map((part) => part.trim())
    if (word && value) map[word.toLowerCase()] = value
  })
  return map
}

function togglesOf(profile: ProfileName): Toggles {
  const { exceptions: _unused, ...rest } = PROFILES[profile]
  void _unused
  return rest
}

export default function HomePage() {
  const [scrollTop, showScrollTop] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [magicText, setMagicText] = useState(BUTTON_IDLE)
  const [results, setResults] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [historyLog, setHistoryLog] = useState<HistoryLog[]>([])

  const [engine, setEngine] = useState<Engine>('bazowy')
  const [toggles, setToggles] = useState<Toggles>(togglesOf('bazowy'))
  const [exceptionsText, setExceptionsText] = useState('')

  // activate scroll-to-top button
  useEffect(() => {
    const scrollHandler = () => showScrollTop(window.scrollY > 200)

    window.addEventListener('scroll', scrollHandler)
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [])

  const changeEngine = (next: Engine) => {
    setEngine(next)
    if (next !== 'klalo') setToggles(togglesOf(next))
    setMagicText(BUTTON_IDLE)
  }

  const setToggle = <K extends keyof Toggles>(key: K, value: Toggles[K]) => {
    setToggles({ ...toggles, [key]: value })
    setMagicText(BUTTON_IDLE)
  }

  const magicButton = (input: string) => {
    if (!input.trim()) return alert('Nie wpisano żadnych liter!')

    const newInput = input.replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '')
    setTextInput(newInput)

    let result: string[]
    if (engine === 'klalo') {
      result = rewriteKlalo(newInput)
      setWarnings([])
    } else {
      const detailed = transcribeDetailed(newInput, engine, {
        ...toggles,
        exceptions: parseExceptions(exceptionsText),
      })
      result = detailed.text.split('\n')
      setWarnings(detailed.warnings)
    }
    setResults(result)

    navigator.clipboard
      ?.writeText(result.join('\n'))
      .then(() => setMagicText('Skopiowano'))
      .catch(() => setMagicText('Gotowe'))

    // before adding check if not included
    if (historyLog.length > 0) {
      if (historyLog[0].input === newInput && historyLog[0].output.join('\n') === result.join('\n'))
        return
    }

    // save to history array
    setHistoryLog([
      {
        date: new Date().toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        input: newInput,
        output: result,
      },
      ...historyLog,
    ])
  }

  const checkbox = (
    key: 'progressive' | 'regressive' | 'finalDevoicing' | 'velarNasal' | 'kresowaSoftness',
    label: string
  ) => (
    <label>
      <input
        type='checkbox'
        checked={toggles[key]}
        onChange={(e) => setToggle(key, e.target.checked)}
      />
      {label}
    </label>
  )

  return (
    <main>
      <Image
        className={styles.titleImage}
        src='/images/title.svg'
        alt='Generator zapisu fonetycznego'
        width={600}
        height={180}
        draggable={false}
        priority={true}
      />

      <a
        href='https://buycoffee.to/kubaklalo'
        className={styles.coffeeButton}
        target='_blank'
        rel='noopener noreferrer'
      >
        <Image
          alt='Buy me a coffee'
          src='/images/buycoffee.png'
          width={122 / 3.5}
          height={79 / 3.5}
          draggable={false}
        />
      </a>

      <div className={styles.options}>
        <label className={styles.engine}>
          Sposób transkrypcji
          <select value={engine} onChange={(e) => changeEngine(e.target.value as Engine)}>
            {(Object.keys(ENGINE_LABELS) as Engine[]).map((key) => (
              <option key={key} value={key}>
                {ENGINE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        {engine !== 'klalo' && (
          <details>
            <summary>Reguły szczegółowe i wyjątki</summary>

            <div className={styles.optionsGrid}>
              {checkbox(
                'progressive',
                'ubezdźwięcznienie postępowe (kwiat → kf\u2019at, przy → pʃy)'
              )}
              {checkbox('regressive', 'upodobnienie wsteczne w wyrazie (prośba → proźba)')}
              {checkbox('finalDevoicing', 'ubezdźwięcznienie wygłosu przed pauzą (wóz → …s)')}
              {checkbox('velarNasal', 'n przed k, g → ŋ (tango → taŋgo)')}
              {checkbox(
                'kresowaSoftness',
                'ć, ɕ, ź, ʒ́ → c\u2019, s\u2019, z\u2019, ʒ\u2019 (wariant kresowy)'
              )}

              <label>
                fonetyka międzywyrazowa
                <select
                  value={toggles.sandhi}
                  onChange={(e) => setToggle('sandhi', e.target.value as Sandhi)}
                >
                  <option value='none'>brak – każdy wyraz osobno</option>
                  <option value='devoicing'>ubezdźwięczniająca</option>
                  <option value='retaining'>zachowująca dźwięczność (voz nuʐa)</option>
                  <option value='voicing'>udźwięczniająca w pełni (brad oi̯ca)</option>
                </select>
              </label>

              <label>
                ą, ę
                <select
                  value={toggles.nasals}
                  onChange={(e) => setToggle('nasals', e.target.value as Toggles['nasals'])}
                >
                  <option value='keep'>zawsze ǫ, ę</option>
                  <option value='split'>rozłożone przed zwartymi (reŋka, domb)</option>
                </select>
              </label>

              <label>
                wygłosowe ę
                <select
                  value={toggles.finalNasalE}
                  onChange={(e) =>
                    setToggle('finalNasalE', e.target.value as Toggles['finalNasalE'])
                  }
                >
                  <option value='keep'>ę</option>
                  <option value='oral'>e</option>
                </select>
              </label>

              <label>
                litera h
                <select
                  value={toggles.h}
                  onChange={(e) => setToggle('h', e.target.value as Toggles['h'])}
                >
                  <option value='ɣ'>ɣ (inaczej niż ch)</option>
                  <option value='x'>x (jak ch)</option>
                </select>
              </label>

              <label>
                litera ó
                <select
                  value={toggles.oAcute}
                  onChange={(e) => setToggle('oAcute', e.target.value as Toggles['oAcute'])}
                >
                  <option value='ó'>ó (ścieśnione)</option>
                  <option value='u'>u</option>
                  <option value='o'>o</option>
                </select>
              </label>

              <label>
                wargowe miękkie przed samogłoską
                <select
                  value={toggles.softLabials}
                  onChange={(e) =>
                    setToggle('softLabials', e.target.value as Toggles['softLabials'])
                  }
                >
                  <option value='sync'>p’e (synchronicznie)</option>
                  <option value='async'>p’i̯e (asynchronicznie)</option>
                </select>
              </label>
            </div>

            <label className={styles.exceptions}>
              Wyjątki – jeden na wiersz, w postaci: wyraz = transkrypcja
              <textarea
                className={DomineFont.className}
                placeholder={'armia = arm\u0027i̯a\nmarzł = marzṷ'}
                value={exceptionsText}
                onChange={(e) => {
                  setExceptionsText(e.target.value)
                  setMagicText(BUTTON_IDLE)
                }}
              />
            </label>
          </details>
        )}
      </div>

      <div className={styles.main}>
        <textarea
          name='textInput'
          className={DomineFont.className}
          placeholder='Dowolny tekst – także ze znacznikami TEI (<del>, <add>, <hi>)'
          value={textInput}
          onChange={(e) => {
            setTextInput(e.target.value)
            setMagicText(BUTTON_IDLE)
          }}
        />

        <button
          title='Kliknij, aby wygenerować zapis fonetyczny + skopiować do schowka'
          className={styles.magicButton}
          onClick={() => magicButton(textInput)}
        >
          <p>{magicText}</p>
        </button>

        <div className={DomineFont.className}>
          {(!results.length && <p className={styles.placeholder}>Zapis fonetyczny</p>) ||
            results.map((result, index) => <p key={index}>{result || '\u00A0'}</p>)}
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className={styles.warnings}>
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      )}

      <div className={styles.historyHandler}>
        <h2>Historia wyszukiwań:</h2>

        <div className={styles.history}>
          {(!historyLog.length && <p>Lista na razie jest pusta</p>) || (
            <>
              {historyLog.map((log, i) => (
                <div
                  key={i}
                  className={styles.historyLog}
                  onClick={() => {
                    setTextInput(log.input)
                    magicButton(log.input)
                  }}
                >
                  <div>
                    <p className={`${DomineFont.className} ${styles.inputValue}`}>{log.input}</p>
                    <p className={styles.timeDate}>{log.date}</p>
                  </div>

                  <p className={`${DomineFont.className} ${styles.outputValue}`}>
                    {log.output.map((result, index) => (
                      <span key={index}>{result}</span>
                    ))}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className={styles.scrollTopHandler}>
        <button
          title='Powrót na górę strony'
          className={styles.scrollTopButton}
          style={{
            visibility: scrollTop ? 'visible' : 'hidden',
            opacity: scrollTop ? '1' : '0',
            bottom: scrollTop ? '' : '-3rem',
            scale: scrollTop ? '' : '75%',
            transition: '0.15s ease-in-out',
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Image
            alt='arrow-up'
            src='/images/arrow-up.svg'
            height={50}
            width={50}
            draggable={false}
          />
        </button>
      </div>
    </main>
  )
}
