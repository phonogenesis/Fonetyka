/*
 * Fonetyka – Polish phonetic transcription generator
 * Copyright (C) 2023-2025 Jakub Kłało <https://github.com/Quanosek/Fonetyka>
 * Copyright (C) 2026 Przemysław Grądzki
 *
 * Modified 2026-11-17 by Przemysław Grądzki
 * for the research project "Euphony in Adam Mickiewicz's Writings. Genetic
 * Approach" (National Science Centre, Poland, grant no. 2024/55/B/HS2/01013):
 * - footer with the notices required by section 5(d) of the GNU GPL v3
 *   (copyright, license, no warranty) and a link to the source code.
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

import type { Metadata, Viewport } from 'next'
import Analytics from '@/components/analytics'

import 'the-new-css-reset/css/reset.css'
import './globals.scss'

import { Encode_Sans } from 'next/font/google'
const EncodeSansFont = Encode_Sans({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  applicationName: 'Fonetyka',
  title: 'Generator zapisu fonetycznego / klalo.pl',
  description:
    'Przekształcanie wyrazów w języku polskim na zapis fonetyczny w standardach AS i IPA.',
  icons: {
    icon: ['/favicons/favicon.ico', '/favicons/icon.svg'],
    apple: '/favicons/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pl'>
      {process.env.NODE_ENV === 'production' && <Analytics />}

      <body className={EncodeSansFont.className}>
        {children}

        <footer style={{ textAlign: 'center' }}>
          <p>
            Program Fonetyka &#169; 2023-{new Date().getFullYear()} Jakub Kłało │ domena{' '}
            <a href='https://www.klalo.pl' target='_blank' rel='noopener noreferrer'>
              klalo.pl
            </a>
          </p>
          <p>
            Wersja zmodyfikowana &#169; 2026 Przemysław Grądzki │ projekt NCN nr 2024/55/B/HS2/01013
          </p>
          <p>
            Program można rozpowszechniać i zmieniać na warunkach{' '}
            <a
              href='https://www.gnu.org/licenses/gpl-3.0.html'
              target='_blank'
              rel='noopener noreferrer'
            >
              licencji GNU GPL w wersji 3
            </a>
            . Jest udostępniany bez jakiejkolwiek gwarancji.
          </p>
          <p>
            <a
              href='https://github.com/phonogenesis/Fonetyka'
              target='_blank'
              rel='noopener noreferrer'
            >
              Kod źródłowy
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
