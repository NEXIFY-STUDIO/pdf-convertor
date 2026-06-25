# VÚB Statement Generator

Moderná, plne offline klientská React aplikácia navrhnutá na precízne vizuálne generovanie PDF výpisov VÚB banky zo zdrojových dát. 

Aplikácia zaisťuje 100% vizuálnu zhodu s originálnym PDF formátom, pričom všetky procesy prebiehajú bezpečne v prehliadači používateľa. Dáta nikdy neopúšťajú zariadenie.

## Hlavné Vlastnosti

- **Offline-First & PWA**: Celá aplikácia funguje lokálne, bez potreby backendu. Na inštaláciu je podpora PWA.
- **Striktná Schéma Dát**: Používa sa Zod pre prísnu validáciu vstupných dát (Banka, Klient, Zostatky, Transakcie).
- **100% Test Coverage**: Aplikácia disponuje kompletnou sadou testov pre formátovanie, validáciu, kalkulácie a samotné vykreslenie (Snapshot testing PDF štruktúry).
- **Live PDF Preview**: Interaktívne používateľské prostredie, ktoré okamžite reaguje na zmenu vstupov a generuje PDF náhľad v reálnom čase (pomocou `@react-pdf/renderer`).
- **Bezpečnosť**: Vďaka absencii serveru neexistuje riziko úniku bankových dát (No Data Upload, Strict CSP).

## Inštalácia a Spustenie

### Požiadavky
- Node.js 18+ 
- npm 9+

### Postup

```bash
# Inštalácia závislostí
npm install

# Spustenie vývojového servera s live-reload (Vite)
npm run dev

# Sklompilovanie produkčného buildu
npm run build

# Spustenie unit testov
npm run test

# Kontrola test coverage
npm run test:coverage
```

## Štruktúra Aplikácie

- **`src/components/`**: UI komponenty aplikácie (LeftPanel pre vstupy, RightPanel pre PDF rendering).
- **`src/schema/`**: Zod schémy definujúce dátový kontrakt pre generovanie (`SourceOfTruthType`).
- **`src/store/`**: Globálny stav pomocou knižnice Zustand. Spája UI so schémou dát a stará sa o validné výpočty (suma debet/kredit).
- **`src/test/`**: Integračné a unit testy, nastavenie Vitest, React Testing Library.

> 💡 *Pre detailný architektonický návrh a návod na zostavenie pozrite `developer.md`.*

## Plánovaný Vývoj (Next Steps)
- **Mistral API Integrácia**: Inteligentný import transakcií z akéhokoľvek textového výpisu (napr. George) cez LLM analýzu a konverziu do Zod schémy.

## Licencia
MIT License - viac v súbore LICENSE.
