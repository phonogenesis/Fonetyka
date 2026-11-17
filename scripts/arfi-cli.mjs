#!/usr/bin/env node
/*
 * Batch transcription with src/utils/formats/ARFI.ts
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
// Transkrypcja wsadowa:  node --experimental-strip-types scripts/arfi-cli.mjs [profil] < wejście.txt > wyjście.txt
// profil: bazowy (domyślny) | kresowy | ortofoniczny.  Ostrzeżenia trafiają na stderr.
import { readFileSync } from 'node:fs'
import { transcribeDetailed, PROFILES } from '../src/utils/formats/ARFI.ts'

const profile = process.argv[2] ?? 'bazowy'
if (!(profile in PROFILES)) {
  console.error(`Nieznany profil „${profile}". Dostępne: ${Object.keys(PROFILES).join(', ')}`)
  process.exit(1)
}
const { text, warnings } = transcribeDetailed(readFileSync(0, 'utf8'), profile)
process.stdout.write(text)
for (const warning of warnings) console.error(warning)
