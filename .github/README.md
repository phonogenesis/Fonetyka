# Fonetyka – Phonogenesis version

This repository is a modified version of [Fonetyka](https://github.com/Quanosek/Fonetyka) by Jakub
Kłało, adapted for the research project **Euphony in Adam Mickiewicz’s Writings. Genetic Approach**
(National Science Centre, Poland, grant no. 2024/55/B/HS2/01013). The modified application runs at
<https://fonetyka.arfi.kul.pl/>.

This research was funded in whole or in part by the National Science Centre, Poland, grant no.
2024/55/B/HS2/01013.

## What this version adds

The original generator transcribes single words into the AS and IPA notations. The project needs
transcriptions of whole manuscript texts from the digital edition of the
[Philomaths’ Archive](https://github.com/Edycja-cyfrowa-KUL/Archiwum_Filomatow_edycja_cyfrowa), in
the project’s own inventory of 61 phones. This version adds:

- **`src/utils/formats/ARFI.ts`**: a self-contained, stateless transcription module. Its output uses
  only the project’s phone inventory (`a, ɪ, l, ṷ, ɕ, ʃ, ʐ, i̯`, …; palatalisation marked with an
  apostrophe; Unicode NFC). It handles the older spelling of the manuscripts (`moy`, `iak`,
  `historya`, `Xiądz`, long s), keeps punctuation, line breaks, XML entities and TEI tags (also
  inside words, e.g. `pi<del>e</del>sze`), and reports characters it cannot transcribe.
- **Three profiles**, each rule switchable separately:

  | Rule                                    | `bazowy`    | `kresowy`        | `ortofoniczny`     |
  | --------------------------------------- | ----------- | ---------------- | ------------------ |
  | progressive devoicing (`kwiat`, `przy`) | yes         | yes              | yes                |
  | regressive assimilation within a word   | no          | yes              | yes                |
  | final devoicing before a pause          | no          | yes              | yes                |
  | sandhi (across a space)                 | none        | voicing retained | devoicing          |
  | `ą`, `ę`                                | always ǫ, ę | always ǫ, ę      | split before stops |
  | `n` before `k`, `g` → ŋ                 | no          | no               | yes                |
  | letter `h`                              | ɣ           | ɣ                | x                  |
  | letter `ó`                              | ó           | o                | u                  |
  | `ć ɕ ź ʒ́` → `c' s' z' ʒ'`               | no          | yes              | no                 |

  `bazowy` stays close to the spelling, `kresowy` reconstructs the north-eastern borderland
  pronunciation, `ortofoniczny` follows present-day standard Polish.

- **Web page** (`src/app/page.tsx`): choice of profile or the original algorithm, detailed rules,
  an exception dictionary (`word = transcription`), warnings.
- **Batch use** (`scripts/arfi-cli.mjs`) and **regression tests** (`tests/arfi.test.mjs`).
- **`research/g2p-drafts/`**: earlier drafts of the algorithm, kept for documentation.

## Usage

Node.js 22.6 or newer and pnpm are required.

```sh
pnpm install
pnpm dev                    # development server
pnpm build && pnpm start    # production
pnpm test                   # regression tests
pnpm -s arfi bazowy < input.txt > output.txt   # batch transcription (bazowy | kresowy | ortofoniczny)
```

## Modifications

As required by section 5(a) of the GNU GPL v3, the changes made to the original program are listed
below. The commit history gives the full detail.

| Date       | Author             | Changes                                                                                                                                                                                                             |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-16 | Przemysław Grądzki | `research/g2p-drafts/` added; `research/` excluded from Prettier, ESLint and the TypeScript project                                                                                                                 |
| 2026-11-16 | Przemysław Grądzki | `src/utils/formats/ARFI.ts`, `tests/`, `scripts/` added; `src/app/page.tsx` rewritten; `rewriteKlalo()` added to `src/utils/rewrite.ts`; styles added to `src/app/page.module.scss`; `package.json` scripts         |
| 2026-11-17 | Przemysław Grądzki | footer in `src/app/layout.tsx` with copyright, license, no-warranty notices and a link to the source code; license headers in modified and new files; `license` field in `package.json`; this section of the README |

The transcription module and the changes to the web page were prepared with the assistance of
Claude, an AI model by Anthropic.

## License

Copyright (C) 2023-2025 Jakub Kłało (original program)<br>
Copyright (C) 2026 Przemysław Grądzki (modifications)

This program is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License version 3 as published by the Free Software Foundation (see
[`LICENSE`](../LICENSE)). It is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

---

_The original README by Jakub Kłało follows unchanged._

# Fonetyka

<img alt="pnpm" src="https://skillicons.dev/icons?i=pnpm" height="40" /> <img alt="nodejs" src="https://skillicons.dev/icons?i=nodejs" height="40" /> <img alt="react" src="https://skillicons.dev/icons?i=react" height="40" /> <img alt="nextjs" src="https://skillicons.dev/icons?i=nextjs" height="40" /> <img alt="typescript" src="https://skillicons.dev/icons?i=ts" height="40" /> <img alt="sass" src="https://skillicons.dev/icons?i=sass" height="40" />

## 📖 Project Description

A comprehensive frontend PWA application for converting Polish words into phonetic transcription using two internationally recognized standards: AS (Slavic Alphabet) and IPA (International Phonetic Alphabet).

### ⚡ Technologies

- **Framework**: [Next.js](https://nextjs.org/docs) with App Router (`/app`)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **PWA**: Offline-first approach with service worker
- **Styling**: Sass/SCSS with CSS modules
- **TypeScript**: Full application typing

### 🚀 Features

- 🔤 Polish phonetic transcription generator
- 🌍 Support for IPA (International Phonetic Alphabet) standard
- 🇵🇱 Support for AS (Slavic Alphabet) standard
- 📱 Responsive design for all devices
- 🔄 Offline functionality (PWA)
- 📜 Search history with quick recall
- ⚡ Real-time transcription conversion
- 🎯 Automatic handling of Polish phonetic rules (voicing, softening, etc.)

###

<img alt="Screenshot of Fonetyka application" width="100%" src="./screenshot.webp"  />

## ☕ Project Support

If this project has been helpful to you, you can buy me a coffee as a thank you for the work invested.

<a href="https://buycoffee.to/kubaklalo">
  <img alt="Buy me a coffee" src="https://storagebuycoffeeprod.blob.core.windows.net/content-files/Logo/0197ef01-0531-46ad-b782-1ea5a5bca0b7.png" height="32" />
</a>

Thank you for all your support! 🙏
