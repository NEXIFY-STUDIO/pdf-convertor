# Návrh integrácie: AAA-pdf--convertor do prostredia George PWA (Next.js)

Tento dokument sumarizuje dostupné architektonické možnosti, ako prepojiť túto samostatnú aplikáciu (Vite/React PWA na konverziu PDF) s rozsiahlejším systémom George (Next.js 16, Tailwind, Shadcn). Cieľom je spracovávať PDF súbory výhradne na strane klienta (v prehliadači).

## Zhodnotenie situácie
- **AAA-pdf--convertor**: Klientska Vite/React aplikácia bez backendu. Využíva HTML5 Canvas a `pdf.worker.js` pre renderovanie stránok.
- **George PWA (george-dev)**: Moderná SSR Next.js aplikácia.
- **Konflikt**: Next.js má odlišný prístup k buildovaniu a importovaniu Web Workerov (ako napr. ten pre `pdfjs-dist`) v porovnaní s Vite. Tiež je nutné dať si pozor na to, aby sa kód s Canvasom nezačal renderovať na serveri (SSR), čo by viedlo k padnutiu appky.

---

## Možnosti Integrácie

### 1. "Iframe / Statický Export" (Najrýchlejšia a najizolovanejšia cesta)
Tento prístup zachováva oba projekty fyzicky oddelené v zmysle kompilácie.

- **Postup:** 
  1. V repozitári `AAA-pdf--convertor` spustiť `npm run build`.
  2. Vzniknutú produkčnú zložku `dist/` prekopírovať do verejnej zložky `george-dev/public/pdf-nastroje/`.
  3. V aplikácii George vytvoriť dedikovanú stránku, ktorá načíta túto zložku cez `<iframe src="/pdf-nastroje/index.html">`.
- **Výhody:** Absolútne žiadne riziko konfliktov s Next.js, Webpackom alebo Turbopackom. Izolované prostredie.
- **Nevýhody:** Nemožnosť priameho zdieľania stavu (napríklad session prihláseného klienta). UI dizajn sa môže odlišovať. Dáta medzi appkami sa musia posielať cez `window.postMessage`.

### 2. "Natívny Next.js Port" (Najlepšie UX a prepojenosť)
Migrácia zdrojového kódu konvertora priamo do monolitického frontendového riešenia Georgea.

- **Postup:**
  1. Presunúť logiku zo zložky `src/` tohto konvertora do Georgea, napr. do `george-dev/components/pdf-converter/`.
  2. V Georgeovi obaliť túto logiku do direktívy `'use client'`.
  3. UI prerobiť do Tailwind/Shadcn dizajnu banky.
  4. Komponenty importovať pomocou `next/dynamic` s vypnutým SSR (`ssr: false`), aby nedochádzalo k chybám s chýbajúcim objektom `window` a `document`.
- **Výhody:** Maximálna integrácia. Dáta z PDF sa môžu ihneď napojiť na bankové procesy (napr. predvyplnenie faktúry z PDF na príkaz na úhradu). Jednotný dizajn.
- **Nevýhody:** Vyžaduje prepísanie konfigurácie pre Web Worker (`pdfjs-dist`) z Vite štýlu do Next.js štýlu, s čím zvyknú byť problémy.

### 3. "Monorepo / Lokálny NPM Balíček" (Najčistejšia architektúra)
Prestavba tohto projektu z finálnej "webovej stránky" na znovupoužiteľnú knižnicu (React Component Library).

- **Postup:**
  1. Úprava `vite.config.ts` v tomto repozitári na `lib` mód (balenie knižnice).
  2. Nastavenie oboch projektov v nadradenej zložke ako npm/pnpm Workspace (Monorepo štruktúra).
  3. Aplikácia George si naimportuje `<PdfConverter />` z tohto balíčka rovnako, ako si importuje akúkoľvek inú NPM závislosť.
- **Výhody:** Udržuje sa oddelený vývoj, čistý kód, možnosť použiť konvertor aj v iných interných projektoch.
- **Nevýhody:** Mierny "overkill", vyžaduje konfiguráciu Turborepa alebo aspoň NPM Workspaces, a zložitejší CI/CD proces pre lokálne linkované balíky.

---

## Ďalší Krok
Rozhodnutie ponechané otvorené. V rámci tohto branchu (`georgeVSpdf`) sa projekt dočasne zakonzervuje pre neskoršiu implementáciu.
