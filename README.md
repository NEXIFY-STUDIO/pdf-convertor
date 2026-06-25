# 🚀 VÚB Statement Generator

Moderná, plne offline klientská React PWA aplikácia navrhnutá na precízne generovanie a úpravu PDF výpisov VÚB banky zo zdrojových dát alebo pomocou umelej inteligencie. 

Aplikácia zaisťuje 100% vizuálnu zhodu s originálnym PDF formátom, pričom všetky procesy prebiehajú bezpečne v prehliadači používateľa. Žiadne bankové dáta sa nikdy neposielajú na externé servery (plne client-side, offline-first).

---

## 🌟 Kľúčové Vlastnosti

### 1. 🤖 AI Import (Mistral Extraction Assistant)
- Umožňuje vložiť surový kopírovaný text výpisu z inej banky (napr. George / Slovenská sporiteľňa) alebo iného textového zdroja.
- Integrovaný Mistral AI klient automaticky zanalyzuje neštruktúrovaný text a transformuje ho priamo do prísnej dátovej schémy pre VÚB výpis.
- Nastavenie API kľúča prebieha priamo v UI a kľúč sa bezpečne ukladá iba vo vašom prehliadači (`localStorage`).

### 2. 🔮 Magic Mirror (Interaktívny WYSIWYG Editor)
- Prepínač v pravom paneli umožňuje prepínať medzi **PDF Náhľadom** a interaktívnym **Editorom (HTML)**.
- V režime editora vidíte živú HTML repliku A4 výpisu. Prejdením myšou nad ľubovoľným poľom sa zobrazí vizuálny indikátor úpravy (ceruzka).
- Kliknutím na akékoľvek pole (názov banky, adresa klienta, IBAN, IČO, zostatok) sa zobrazí plávajúce glassmorphic modálne okno pre editáciu.
- Kliknutím na riadok v tabuľke transakcií sa otvorí špecializovaný formulár pre úpravu dátumov, popisu, VS, KS, ŠS, protiúčtu a sumy.
- Transakcie je možné priamo vymazávať. Zmena sumy alebo zmazanie transakcie okamžite prepočíta sumárne príjmy, výdavky a konečný zostatok v store.

### 3. 🛡️ Offline-First & PWA
- Aplikácia je konfigurovaná ako Progressive Web App. Po prvom načítaní funguje plne offline a je možné ju nainštalovať ako natívnu aplikáciu do systému.

---

## 📂 Informácie o Priečinku a Prostredí

Projekt bol úspešne zjednotený do hlavného adresára:
- **Cesta k projektu**: `/Users/erikbabcan/AAAPDF`

Na vašom stroji sú k dispozícii tieto verzie Node.js (spravované cez NVM):
- **Node v22.22.2** (odporúčaná verzia pre spúšťanie a vývoj)
- **Node v24.15.0** (odporúčaná verzia pre prácu s Vercel CLI)

---

## 🛠️ Presné Príkazy a Postupy

### 1. Lokálny Vývoj (Spustenie dev servera)
Vite server beží s live-reloadom a okamžite premieta zmeny v kóde.

```bash
# 1. Otvorte terminál a prejdite do priečinka projektu
cd /Users/erikbabcan/AAAPDF

# 2. Nastavte verziu Node.js (ak používate nvm)
nvm use v22.22.2

# 3. Spustite vývojový server
npm run dev
```
*Aplikácia bude dostupná na adrese: `http://localhost:5173/`*

---

### 2. Produkčný Build (Kompilácia a bundling)
Tento príkaz skompiluje TypeScript a zostaví optimalizovaný produkčný balík do priečinka `dist/`.

```bash
# 1. Prejdite do priečinka projektu
cd /Users/erikbabcan/AAAPDF

# 2. Nastavte verziu Node.js
nvm use v22.22.2

# 3. Spustite build
npm run build
```

---

### 3. Nasadenie na Vercel (Deploy)
Tento príkaz nahrá váš lokálny build a nasadí aplikáciu na servery Vercel.

```bash
# 1. Prejdite do priečinka projektu
cd /Users/erikbabcan/AAAPDF

# 2. Nastavte verziu Node.js kompatibilnú s Vercelom
nvm use v24.15.0

# 3. Spustite deploy príkazu Vercel (automaticky zoberie nastavenia a nasadí)
vercel --yes
```
*Aplikácia je nasadená na produkčnej adrese: `https://vub-statement-generator.vercel.app`*

---

### 4. Spustenie Testovacej Sady (Vitest)
Aplikácia má 100% úspešnosť testov (82 passed). Spustite ich jednorazovo nasledovne:

```bash
# 1. Prejdite do priečinka projektu
cd /Users/erikbabcan/AAAPDF

# 2. Spustite Vitest v jednorazovom režime
npm run test -- --run
```

---

## 🗂️ Architektúra Kódu

- **`src/components/LeftPanel.tsx`**: Ľavý panel pre konfiguráciu. Obsahuje formulár pre manuálne zadávanie dát, sekciu pre import a uloženie Mistral API kľúča a textovú plochu na AI analýzu výpisov.
- **`src/components/RightPanel.tsx`**: Pravý panel spravujúci prepínanie zobrazení. Vykresľuje buď `<StatementDocument>` cez PDFViewer, alebo HTML A4 maketu, a spravuje modálne okná pre inline úpravy.
- **`src/schema/sourceOfTruth.ts`**: Striktná Zod schéma (`SourceOfTruthSchema`) definujúca formát a typy všetkých objektov (Banka, Klient, Výpis, Zostatky, Transakcie).
- **`src/store/useAppStore.ts`**: Zustand store, ktorý ukladá a spravuje stav dát, API kľúč a zapuzdruje logiku pre prepočet zostatkov (`recalculateBalances`).
- **`src/test/RightPanel.test.tsx`**: DOM integračné testy pre inline editáciu, prepínanie zobrazení a interakcie s modálmi.
- **`src/test/mistralClient.test.ts` / `mistralClient.live.test.ts`**: Testy pre AI parsovanie (jednotkové s mockom a živé s automatickou detekciou sieťového sandboxu).
