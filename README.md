# 🚀 VÚB Statement Generator

Moderná, plne offline klientska React PWA aplikácia navrhnutá na precízne generovanie, vizuálnu replikáciu a detailnú úpravu PDF výpisov z účtov VÚB banky. Aplikácia umožňuje načítanie dát z CSV/JSON súborov, ich automatickú extrakciu z neštruktúrovaných textov pomocou umelej inteligencie (Mistral AI) alebo manuálne modelovanie jednotlivých transakcií aj celých časových radov.

Aplikácia zaisťuje **100% vizuálnu zhodu** s originálnym PDF formátom VÚB banky (vrátane rozloženia, písiem, pätiek a ochranných prvkov), pričom všetky výpočty a vykresľovania prebiehajú bezpečne v prehliadači používateľa. Žiadne bankové dáta sa nikdy neodosielajú na externé servery (**plne client-side, offline-first, privacy-safe**).

Aktuálny stav projektu k **26. júnu 2026** je plne stabilný s kompletne prechádzajúcim integračným a výkonnostným testovaním.

---

## 🌟 Kľúčové Vlastnosti a Moduly

### 1. 🤖 AI Import (Mistral Extraction Assistant)
*   **Analýza neštruktúrovaných textov:** Umožňuje používateľovi skopírovať surový text výpisu z inej banky (napríklad Slovenská sporiteľňa / George, Tatra banka, ČSOB) alebo iného zdroja a vložiť ho priamo do aplikácie.
*   **Mistral AI Integrácia:** Integrovaný Mistral klient posiela zabezpečený dopyt na servery Mistral AI s prísnym systémovým promptom, ktorý vynucuje vrátenie presnej JSON schémy.
*   **Podpora modelov:** Používateľ si môže v rozhraní vybrať model:
    *   `mistral-large-latest` (najvyššia presnosť pre zložité tabuľky transakcií)
    *   `open-mistral-nemo` (rýchly a optimalizovaný model)
    *   `mistral-small-latest` (stredná trieda)
*   **Lokálne a bezpečné úložisko:** API kľúč pre Mistral sa ukladá iba lokálne v prehliadači (`localStorage`). Nikdy neprechádza cez sprostredkovateľský server (middle-man backend).

### 2. 🔮 Magic Mirror (Interaktívny WYSIWYG Editor)
*   **Dual-View režim:** Pravý panel aplikácie umožňuje prepínanie medzi dvoma zobrazeniami:
    *   **PDF Náhľad:** Živé a reálne vykreslenie finálneho PDF dokumentu priamo v prehliadači cez `@react-pdf/renderer`.
    *   **Editor (HTML):** Interaktívna maketa A4 výpisu vo formáte HTML.
*   **Vizuálne indikátory úprav:** V režime editora sa pri prejdení kurzorom nad ľubovoľným upraviteľným elementom (názov banky, adresa klienta, IBAN, IČO, zostatok) zobrazí vizuálny rámček s ceruzkou.
*   **Modálne okná na inline úpravu:** Kliknutím na pole sa otvorí plávajúce glassmorphic okno, kde môže používateľ upraviť danú hodnotu.
*   **Editácia transakcií v tabuľke:** Kliknutím na ľubovoľný riadok v tabuľke transakcií sa otvorí formulár na úpravu dátumov realizácie/valuty, IBAN protistrany, popisu transakcie, premenných symbolov (VS, KS, ŠS) a sumy.
*   **Zmazanie transakcie a prepočet:** Používateľ môže priamo v modálnom okne transakciu vymazať. Akákoľvek zmena sumy alebo vymazanie transakcie okamžite vyvolá prepočet celkových príjmov (credit), výdavkov (debit) a konečného zostatku (closing balance) v reálnom čase.
*   **Zmena logotypu Drag & Drop:** Pretiahnutím obrázka (PNG, JPG, SVG) priamo na logotyp v HTML editore (alebo kliknutím a nahraním) sa obrázok skonvertuje do Base64 formátu a automaticky sa synchronizuje do PDF dokumentu. Pravým kliknutím na nahrané logo sa vráti predvolený textový logotyp VÚB banky.

### 3. 📅 Dávkový Generátor (Time-Machine Generator)
*   **Generovanie časových radov:** Umožňuje prepnúť aplikáciu do režimu dávkového generátora, kde sa na základe počiatočného mesiaca, roka a počtu mesiacov vygeneruje sekvenčný rad výpisov.
*   **Šablóny opakujúcich sa transakcií:** Používateľ si navolí zoznam pravidelných pohybov (napr. výplata, nájomné, potraviny, internet) s konkrétnym dňom v mesiaci a sumou (kladná pre príjem, záporná pre výdavok).
*   **Kaskádový prepočet zostatkov (`cascadeBalances`):** **Kľúčová vlastnosť.** Zmena v transakciách alebo počiatočnom zostatku v mesiaci `N` sa okamžite premietne do všetkých nasledujúcich mesiacov `N+1`, `N+2` atď. Konečný zostatok predchádzajúceho mesiaca sa automaticky stáva počiatočným zostatkom mesiaca nasledujúceho.
*   **Časová os navigácie:** V hornej časti náhľadu sa zobrazí horizontálny panel so všetkými vygenerovanými mesiacmi a ich konečnými zostatkami pre rýchle prepínanie a kontrolu jednotlivých mesiacov.

### 4. 📦 Pamäťovo bezpečný ZIP export
*   **Hromadné generovanie:** Kliknutím na tlačidlo *Exportovať všetky do ZIP* aplikácia vygeneruje PDF dokumenty pre všetky mesiace v časovej osi a zabalí ich do jedného ZIP archívu pomocou `jszip` a `file-saver`.
*   **Batch processing:** Sťahovanie PDF súborov prebieha po menších častiach (predvolená veľkosť dávky `BATCH_SIZE = 3`). Tento prístup šetrí pamäť prehliadača a zabraňuje pádom typu Out-Of-Memory (OOM) pri veľkých časových osiach (napríklad 12 a viac mesiacov).
*   **Detekcia zaplnenia pamäte:** Pred začatím exportu aplikácia odhadne potrebnú pamäť (cca 5 MB na jeden PDF dokument + režijné náklady). Ak odhadovaná pamäť prekročí 70 % limitu JS heapu (dostupného cez `window.performance.memory`), používateľovi sa zobrazí varovanie s odporúčaním znížiť počet generovaných mesiacov. Pre dávky nad 24 mesiacov sa vyžaduje explicitné potvrdenie.

### 5. 🛡️ Offline-First & Progressive Web App (PWA)
*   **Nezávislosť na sieti:** Aplikácia je nakonfigurovaná ako PWA. Všetky skripty, štýly, obrázky a webové fonty sú ukladané do cache prehliadača pomocou Service Workera (Workbox).
*   **Možnosť inštalácie:** Aplikáciu je možné priamo nainštalovať do operačného systému (Windows, macOS, Android, iOS) ako natívnu aplikáciu.

---

## 🛠️ Vývojové Prostredie a Príkazový riadok

### Systémové požiadavky
Pre správny chod vývojového a zostavovacieho prostredia sa odporúča použiť manažér verzií Node.js (`nvm`):
*   **Node.js v22.22.2** (pre lokálny vývoj, testy a build)
*   **Node.js v24.15.0** (pre nasadenie na Vercel CLI)

---

### 1. Inštalácia závislostí
Pred spustením projektu nainštalujte lokálne balíčky:
```bash
npm install
```

### 2. Spustenie vývojového servera (Local Dev)
Spustí lokálny Vite server s podporou live-reloadu a rýchlym premietaním zmien:
```bash
npm run dev
```
*Aplikácia bude spustená na: [http://localhost:5173/](http://localhost:5173/)*

### 3. Zostavenie projektu pre produkciu (Production Build)
Skompiluje TypeScript typy a vygeneruje optimalizovaný a minifikovaný kód vrátane service workera do priečinka `dist/`:
```bash
npm run build
```

### 4. Spustenie testov (Vitest)
Aplikácia obsahuje robustné testovacie pokrytie pre schémy, store, renderovanie PDF a inline editáciu. Pre jednorazové spustenie celej sady použite:
```bash
npm run test -- --run
```
*Pre spustenie v interaktívnom watch móde:*
```bash
npm run test
```

### 5. Preview produkčného buildu
Umožňuje otestovať lokálne vygenerovanú produkčnú verziu z priečinka `dist/` na lokálnom porte:
```bash
npm run preview
```

### 6. Nasadenie na Vercel (Deploy)
Nasadenie na Vercel prebieha priamo cez Vercel CLI s využitím Node v24.15.0:
```bash
# 1. Prepnite na Node v24.15.0
nvm use v24.15.0

# 2. Spustite deploy
vercel --yes
```
*Produkčné prostredie je dostupné na adrese:* `https://vub-statement-generator.vercel.app`

---

## 🗂️ Architektúra Priečinkov a Kódu

Aplikácia je postavená na čistom rozdelení logiky (State / Schémy) a prezentačnej vrstvy (React / CSS / PDF Render):

```text
/Users/erikbabcan/AAAPDF/
├── docs/                      # Dokumentácia, šablóny a JSON exporty (transfers.json)
├── public/                    # Statické aktíva aplikácie (vuub.png, manifest, ikony)
├── src/
│   ├── components/            # React UI komponenty
│   │   ├── LeftPanel.tsx      # Vstupné formuláre, AI sekcia, CSV import, dávkový editor
│   │   └── RightPanel.tsx     # PDFViewer, interaktívny HTML WYSIWYG a modalové okná
│   ├── lib/                   # Pomocné knižnice a API klienti
│   │   └── mistralClient.ts   # Integrácia a validácia odpovedí z Mistral AI API
│   ├── schema/                # Striktné dátové modely (Zod)
│   │   └── sourceOfTruth.ts   # Source of Truth schéma (definícia banky, klienta, výpisu)
│   ├── store/                 # Centralizovaný stav aplikácie (Zustand)
│   │   └── useAppStore.ts     # Store pre dáta, výpočty a logiku kaskádového prepočtu zostatkov
│   ├── test/                  # Testovacie súbory (Vitest + React Testing Library)
│   │   ├── BatchGenerator.test.tsx      # Integračné testy pre dávkové generovanie
│   │   ├── LeftPanel.integration.test.tsx # Simulácia interakcií používateľa na ľavom paneli
│   │   ├── MemoryProfiler.test.ts       # Testy zaťaženia pamäte pre cascadeBalances
│   │   ├── RightPanel.test.tsx          # Testy WYSIWYG editora, prepínania módov a modalov
│   │   ├── StatementDocument.test.tsx   # Štrukturálne PDF snapshot testy
│   │   └── mistralClient.test.ts        # Unit testy pre AI parsovanie s mockovanou API
│   ├── types.ts               # Pomocné typové definície pre export a PDF rendering
│   ├── App.tsx                # Hlavný obal aplikácie a rozloženie workspace-u
│   ├── fintech.css            # Hlavný diznový systém, tokeny a moderný vzhľad
│   ├── index.css              # Globálne nastavenia písma a základných HTML tagov
│   └── main.tsx               # Vstupný bod aplikácie, registrácia PWA Service Workera
├── tsconfig.json              # Konfigurácia TypeScriptu pre projekt
├── vite.config.ts             # Konfigurácia Vite, PWA pluginu a aliasov
└── package.json               # Definícia závislostí a skriptov
```

---

## 🧪 Testovacia stratégia a kvalita kódu

Aplikácia vynucuje nulovú regresiu kódu pomocou **94 prísnych automatizovaných testov** spúšťaných v prostredí Vitest:

1.  **Zod Validácia (`sourceOfTruth.test.ts`):** Zaručuje správnosť všetkých polí, kontroluje minimálne dĺžky textov (napríklad validita IBAN, SWIFT), povinné polia a správanie pri neúplných dátach.
2.  **Zustand Store Testy (`useAppStore.test.ts`):** Testujú správnosť matematických výpočtov pri vkladaní príjmov/výdavkov, prepočet celkových zostatkov a spracovanie importovaných súborov.
3.  **PDF Štrukturálne Testy (`StatementDocument.test.tsx`):** Využívajú `react-test-renderer` na preklad deklaratívneho PDF stromu do formátu JSON, čo umožňuje testovať presnú hierarchiu a prítomnosť textov v PDF bez potreby vizuálneho porovnávania obrázkov.
4.  **Integračné DOM Testy (`LeftPanel.integration.test.tsx` a `RightPanel.test.tsx`):** Testujú simulácie kliknutí používateľa, vkladanie textu do formulárov, otváranie inline modalov, interakcie s Magic Mirror a sťahovanie vygenerovaných súborov.
5.  **Výkonnostný a pamäťový profil (`MemoryProfiler.test.ts`):** Meria trvanie prepočtov pri 500-cyklových operáciách a garantuje, že kaskádový prepočet a spracovanie veľkých dávok nespôsobuje úniky pamäte (memory leaks).
