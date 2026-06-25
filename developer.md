# Developer Blueprint: VÚB Statement Generator

Tento dokument slúži ako ultimátny architektonický plán (blueprint) pre túto aplikáciu. Popisuje, ako je aplikácia navrhnutá z technologického hľadiska a aké pravidlá dodržiava, aby v prípade potreby bolo možné celý kód kedykoľvek znovu postaviť od piky.

---

## 1. Architektonické Princípy

1.  **Single Source of Truth (SSOT)**: 
    *   Srdcom aplikácie je Zod schéma `src/schema/sourceOfTruth.ts`.
    *   Akákoľvek zmena dát, ktorá ovplyvní vizuálny výstup v PDF, musí prúdiť cez tento centrálny dátový model.
    *   Typizácia v celej aplikácii (`SourceOfTruthType`) sa automaticky odvodzuje priamo zo Zod schémy.
2.  **State Management (Zustand)**:
    *   Store `src/store/useAppStore.ts` uchováva aktuálny stav `sourceOfTruth`.
    *   Stav je prepojený s React komponentmi. Zabezpečuje automatické rátanie zostatkov (total debit/credit) pri akejkoľvek zmene transakcií.
    *   Obsahuje metódu na import celého JSON súboru.
3.  **PDF Rendering (`@react-pdf/renderer`)**:
    *   O finálny vizuál a štruktúru PDF sa stará výhradne `@react-pdf/renderer` v komponente `RightPanel.tsx` (`StatementDocument`).
    *   Žiadne kreslenie na HTML Canvas ani obchádzanie logiky. Všetko sú deklaratívne PDF komponenty (`<View>`, `<Text>`, `<Page>`).
4.  **100% Testability**:
    *   Každý modul musí byť pokrytý unit a integračnými testami (cez `Vitest`). 
    *   PDF výstupy sa testujú štrukturálne pomocou `react-test-renderer` snapshotov.

---

## 2. Dátový Model (The Schema)

Aplikácia rozdeľuje dáta na 4 hlavné bloky (podľa VÚB výpisu):

*   **Bank**: Dáta a logo banky (napr. VÚB adresa pobočky).
*   **Client**: Dáta klienta (Meno, Adresa, IBAN, SWIFT, Limit).
*   **Statement**: Parametre výpisu (Obdobie, Názov, Mena, Dátum generovania).
*   **Transactions & Balances**: Dynamické dáta. Každá transakcia má definovaný Dátum, Sumu (debet/kredit s príslušným znamienkom), Popis a voliteľné premenné symboly (`vs`, `ks`, `ss`).

---

## 3. Štruktúra Aplikácie (Komponenty)

Základné rozdelenie používateľského prostredia v `src/App.tsx`:

*   **`<LeftPanel />` (Editor / Vstupy)**:
    *   Obsahuje interaktívne formuláre na úpravu klientskych, bankových a transakčných údajov.
    *   Načítava dáta zo Zustand Storu a umožňuje doň ukladať zmeny (`onChange`).
    *   Zahŕňa tlačidlá na JSON/CSV import a tlačidlo na manuálne stiahnutie PDF.
*   **`<RightPanel />` (Live Preview)**:
    *   Zobrazuje živý, deklaratívny náhľad PDF pomocou `<PDFViewer>` od `@react-pdf`.
    *   Vo vnútri je zapuzdrený komponent `<StatementDocument sourceOfTruth={...} />`.
    *   Je "read-only", slúži výhradne na render vizuálu podľa aktuálneho `sourceOfTruth`.

---

## 4. Testovanie (Zero Regressions)

Aplikácia používa Vitest a React Testing Library. 

### Typy testov:
1.  **Zod Schema Testy (`sourceOfTruth.test.ts`)**: 
    *   Overujú validáciu edge case-ov (napríklad dlhé texty, chýbajúce symboly, validné dátumy).
2.  **Store Testy (`useAppStore.test.ts`)**:
    *   Overujú logiku aktualizácie dát, sumárnych výpočtov a JSON importu priamo v pamäti.
3.  **PDF Render Testy (`StatementDocument.test.tsx`)**:
    *   Využívajú `react-test-renderer` na preloženie deklaratívneho PDF Reactu na testovateľný JSON strom. Zaručuje sa tým, že sa pri zmene kódu nerozbije layout.
4.  **Integration Testy (`LeftPanel.integration.test.tsx`)**:
    *   DOM testy formulárových prvkov. Overuje sa interaktivita, prenos dát do Storu a trigger pre sťahovanie (Blob generácia).

---

## 5. Ďalšia Vývojová Fáza (Mistral API Integration)

Ďalším krokom je integrácia **Mistral AI** na priamu konverziu neštruktúrovaných bankových dát (napríklad z Georgea) do striktného formátu našej Zod schémy. 

*Ako to bude fungovať:*
1. V `LeftPanel` používateľ zadá textový výstup z inej banky.
2. Klient na pozadí odošle asynchrónny request na API Mistral (cez definovaný model a prompt), s požiadavkou o JSON výstup.
3. Odpoveď prejde pre-validáciou cez existujúci Zod schema.
4. Validné dáta aktualizujú Store a automaticky vyrenderujú VÚB PDF.
5. Bezpečnostné kľúče k API budú bezpečne uschované iba v `localStorage` užívateľa. Žiadny "middle-man" backend neexistuje.
