# Transcription algorithm drafts

Rule-based drafts of a Polish → Slavic Alphabet (AS) phonetic transcriber, prepared in November 2026
by Przemysław Grądzki with the help of an AI model. They were the starting point for adapting this
generator to the research project _Euphony in Adam Mickiewicz’s Writings. Genetic Approach_
(National Science Centre, Poland, grant no. 2024/55/B/HS2/01013).

| File                 | Contents                                                                    |
| -------------------- | --------------------------------------------------------------------------- |
| `polish_to_as.js`    | transcriber in JavaScript (segments, voicing, nasal vowels, sandhi option)  |
| `polish_to_as.ts`    | TypeScript port of `polish_to_as.js`                                        |
| `polish_to_as.txt`   | notes on both versions: usage, rules, options, limitations                  |
| `transkrybujDoAS.ts` | variant with a module for nasal-vowel assimilation (ą, ę before consonants) |

The files are kept verbatim as documentation of the work. The web application does not import them,
and they are excluded from linting, formatting and type checking.

## License

Copyright (C) 2026 Przemysław Grądzki

These files are part of this repository and are distributed under the terms of the GNU General
Public License version 3 (see [`LICENSE`](../../LICENSE)), WITHOUT ANY WARRANTY; without even the
implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
