/**
 * Algorytm Transkrypcji Fonetycznej Języka Polskiego do Alfabetu Slawistycznego (AS)
 * MODUŁ: Asymilacja Samogłosek Nosowych (ą, ę)
 */

type FonemMap = { [key: string]: string };

const VOWELS: Set<string> = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'ę', 'ą', 'ó']);

const DEVOICING_MAP: FonemMap = {
    'b': 'p', 'd': 't', 'g': 'k', 'v': 'f', 'z': 's',
    'ž': 'š', 'ź': 'ś', 'ʒ': 'c', 'ǯ': 'č', 'ʒ́': 'ć'
};

const SOFTENING_MAP: FonemMap = {
    's': 'ś', 'z': 'ź', 'c': 'ć', 'ʒ': 'ʒ́', 'n': 'ń',
    'p': "pʹ", 'b': "bʹ", 'f': "fʹ", 'v': "vʹ", 'm': "mʹ",
    'k': "kʹ", 'g': "gʹ", 'x': "xʹ", 'ł': "lʹ" 
};

// Klasyfikacja spółgłosek do asymilacji nosowości
// Zbiór spółgłosek szczelinowych, przed którymi występuje u-niezgłoskotwórcze nosowe [ų̃]
const FRICATIVES = new Set(['f', 'v', 's', 'z', 'ś', 'ź', 'š', 'ž', 'x']);
const LABIALS = new Set(['p', 'b', 'pʹ', 'bʹ', 'm', 'mʹ']); // Wargowe
const DENTALS = new Set(['t', 'd', 'c', 'ʒ']); // Zębowe
const PALATALS = new Set(['ć', 'ʒ́', 'ń', 'ś', 'ź']); // Środkowojęzykowe / Palatalne
const POSTALVEOLARS = new Set(['č', 'ǯ']); // Dziąsłowe
const VELARS = new Set(['k', 'g', 'kʹ', 'gʹ', 'x']); // Tylnojęzykowe

export function transkrybujDoAS(tekst: string): string {
    if (!tekst) return "";
    
    const slowa: string[] = tekst.toLowerCase()
                     .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
                     .split(/\s+/);
                     
    return slowa.map(slowo => transkrybujSlowo(slowo)).join(" ");
}

function transkrybujSlowo(slowo: string): string {
    let tokens: string[] = tokenizuj(slowo);
    tokens = obslugaLiteryI(tokens);
    tokens = asymilacjaNosowych(tokens); // <-- NOWY KROK w odpowiednim miejscu
    tokens = asymilacjaWsteczna(tokens);
    tokens = ubezdzwiecznienieWygłosu(tokens);
    
    return tokens.join("");
}

/**
 * Krok 2.5: Asymilacja kontekstowa 'ą' oraz 'ę'
 * Uwzględnia przejście w samogłoskę + u-niezgłoskotwórcze nosowe [ų̃] przed spółgłoskami szczelinowymi.
 */
function asymilacjaNosowych(tokens: string[]): string[] {
    const wynik: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const obecny = tokens[i];
        const nastepny = tokens[i + 1];
        
        if (obecny === 'ę' || obecny === 'ą') {
            const podstawa = obecny === 'ę' ? 'e' : 'o';
            
            // 1. Całkowita denazalizacja przed 'ł' (u̯) oraz 'l' / 'lʹ' (np. wziąłem)
            if (nastepny === 'u̯' || nastepny === 'l' || nastepny === 'lʹ') {
                wynik.push(podstawa);
                continue;
            }
            
            // 2. Wygłos (koniec wyrazu)
            if (!nastepny) {
                if (obecny === 'ę') {
                    wynik.push('e'); // idę -> [ide]
                } else {
                    wynik.push('oų̃'); // idą -> [idoų̃]
                }
                continue;
            }
            
            const czystyNastepny = nastepny.replace("ʹ", "");
            
            // 3. Zmiana: Przed spółgłoskami szczelinowymi (np. wąs, gęsty, afisz)
            // Nosówka przechodzi w samogłoskę ustną + u-niezgłoskotwórcze nosowe [ų̃]
            if (FRICATIVES.has(czystyNastepny)) {
                wynik.push(podstawa, 'ų̃');
                continue;
            }
            
            // 4. Przed spółgłoskami wargowymi (np. kępa, dąb) -> m / mʹ
            if (LABIALS.has(nastepny)) {
                const nosowa = nastepny.includes("ʹ") ? "mʹ" : "m";
                wynik.push(podstawa, nosowa);
                continue;
            }
            
            // 5. Przed spółgłoskami zębowymi (np. pętla, kąt) -> n
            if (DENTALS.has(czystyNastepny)) {
                wynik.push(podstawa, 'n');
                continue;
            }
            
            // 6. Przed spółgłoskami dziąsłowymi (np. pączek) -> n dziąsłowe (ṇ)
            if (POSTALVEOLARS.has(czystyNastepny)) {
                wynik.push(podstawa, 'ṇ');
                continue;
            }
            
            // 7. Przed spółgłoskami środkowojęzykowymi (np. dęcie) -> ń
            if (PALATALS.has(czystyNastepny)) {
                wynik.push(podstawa, 'ń');
                continue;
            }
            
            // 8. Przed spółgłoskami tylnojęzykowymi (np. ręka) -> n tylnojęzykowe (ŋ)
            if (VELARS.has(czystyNastepny)) {
                wynik.push(podstawa, 'ŋ');
                continue;
            }
        }
        
        wynik.push(obecny);
    }
    return wynik;
}

// Pozostałe funkcje (tokenizuj, obslugaLiteryI, asymilacjaWsteczna, ubezdzwiecznienieWygłosu) 
// pozostają bez zmian w stosunku do poprzedniego kodu TypeScript.
function tokenizuj(slowo: string): string[] {
    let i = 0; const tokens: string[] = [];
    while (i < slowo.length) {
        if (slowo.slice(i, i + 3) === 'dzi') { tokens.push('ʒi'); i += 3; continue; }
        const dwuznak = slowo.slice(i, i + 2);
        if (dwuznak === 'sz') { tokens.push('š'); i += 2; continue; }
        if (dwuznak === 'cz') { tokens.push('č'); i += 2; continue; }
        if (dwuznak === 'rz' || dwuznak === 'ż') { tokens.push('ž'); i += 2; continue; }
        if (dwuznak === 'ch') { tokens.push('x'); i += 2; continue; }
        if (dwuznak === 'dz') { tokens.push('ʒ'); i += 2; continue; }
        if (dwuznak === 'dż') { tokens.push('ǯ'); i += 2; continue; }
        if (dwuznak === 'ci') { tokens.push('ć'); i += 2; continue; } 
        if (dwuznak === 'ni') { tokens.push('ń'); i += 2; continue; }
        if (dwuznak === 'si') { tokens.push('ś'); i += 2; continue; }
        if (dwuznak === 'zi') { tokens.push('ź'); i += 2; continue; }
        const litera = slowo[i];
        if (litera === 'w') tokens.push('v');
        else if (litera === 'h') tokens.push('x');
        else if (litera === 'ł') tokens.push('u̯');
        else if (litera === 'ó') tokens.push('u');
        else tokens.push(litera);
        i++;
    }
    return tokens;
}

// Zbiór wszystkich spółgłosek (w tym przekształconych znaków AS) do weryfikacji kontekstu
const CONSONANTS: Set<string> = new Set([
    'b', 'c', 'ć', 'č', 'd', 'f', 'g', 'h', 'x', 'j', 'k', 'l', 'ł', 'm', 'n', 'ń',
    'p', 'r', 's', 'ś', 'š', 't', 'v', 'w', 'z', 'ź', 'ž', 'ʒ', 'ʒ́', 'ǯ', 'u̯'
]);

/**
 * Krok 2: Logika zmiękczeń realizowanych przez literę 'i'
 */
function obslugaLiteryI(tokens: string[]): string[] {
    const wynik: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const obecny = tokens[i];
        const nastepny = tokens[i + 1];
        
        // Jeśli obecny token to 'i' złączone z afrykatą (np. ʒi) lub samo 'i' po spółgłosce,
        // które zostało już przetworzone, przepisujemy je.
        if (obecny === 'i' || obecny.endsWith('i')) {
            wynik.push(obecny);
            continue;
        }
        
        // Sprawdzamy, czy kolejny token to samogłoska 'i'
        if (nastepny === 'i') {
            const poprzedni = obecny;             // Spółgłoska przed 'i'
            const kolejnyPoI = tokens[i + 2];    // Token występujący po 'i'
            
            // NOWA REGUŁA: Jeżeli przed "i" występuje spółgłoska oraz po "i" występuje spółgłoska
            if (CONSONANTS.has(poprzedni) && kolejnyPoI && CONSONANTS.has(kolejnyPoI)) {
                wynik.push(SOFTENING_MAP[poprzedni] || poprzedni);
                wynik.push('i');
                i++; // Pomijamy 'i', ponieważ właśnie je dodaliśmy, w następnym obiegu przejdziemy do spółgłoski po 'i'
                continue;
            }
            
            // Przypadek A: 'i' przed inną samogłoską (np. "pies" -> p + i + e)
            // 'i' znika jako dźwięk samogłoskowy, pozostaje tylko zmiękczenie
            if (kolejnyPoI && VOWELS.has(kolejnyPoI)) {
                wynik.push(SOFTENING_MAP[poprzedni] || poprzedni);
                i++; // Pomijamy 'i', przechodzimy do samogłoski
                continue;
            } 
            
            // Przypadek domyślny (np. 'i' na końcu wyrazu po spółgłosce: "psi")
            wynik.push(SOFTENING_MAP[poprzedni] || poprzedni);
            continue;
        }
        
        wynik.push(obecny);
    }
    return wynik;
}

function asymilacjaWsteczna(tokens: string[]): string[] {
    const wynik: string[] = [...tokens];
    const bezdzwieczne: Set<string> = new Set(Object.values(DEVOICING_MAP));
    for (let i = wynik.length - 2; i >= 0; i--) {
        const obecny = wynik[i]; const nastepny = wynik[i + 1];
        if (bezdzwieczne.has(nastepny)) {
            const czystaBaza = obecny.replace("ʹ", "");
            if (DEVOICING_MAP[czystaBaza]) {
                const ubezdzw = DEVOICING_MAP[czystaBaza];
                wynik[i] = obecny.includes("ʹ") ? ubezdzw + "ʹ" : ubezdzw;
            }
        }
    }
    return wynik;
}

function ubezdzwiecznienieWygłosu(tokens: string[]): string[] {
    if (tokens.length === 0) return tokens;
    const wynik: string[] = [...tokens];
    const ostatniIndex = wynik.length - 1; const ostatni = wynik[ostatniIndex];
    const czystaBaza = ostatni.replace("ʹ", "");
    if (DEVOICING_MAP[czystaBaza]) {
        const ubezdzw = DEVOICING_MAP[czystaBaza];
        wynik[ostatniIndex] = ostatni.includes("ʹ") ? ubezdzw + "ʹ" : ubezdzw;
    }
    return wynik;
}

