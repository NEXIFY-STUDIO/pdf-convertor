# Rozbor obrázku: VÚB Banka - Výpis z účtu

> [!IMPORTANT]
> **SOURCE OF TRUTH - MINIMÁLNY FINÁLNY PRODUKT**
> Cieľom tohto projektu je, aby PWA aplikácia po dodaní JSON štruktúry (extrahovanej cez AI) vygenerovala na pixel presné, plnohodnotné PDF.
> Benchmark a vzorový referenčný súbor pre tento výsledok je:
> `vypis_ucet_SK8402000000004077557753_01-11-2025_30-11-2025.pdf`
> Vygenerované PDF z `@react-pdf/renderer` sa musí dizajnovo a rozložením stopercentne zhodovať s týmto vzorom.

## 1. Extrahovaný text a priradené štítky (zladené so statement_data.json)

**Ľavá horná časť (Identifikácia banky - bank_data):**
*   `bank_logo_id` -> "VÚB BANKA Intesa Sanpaolo Group"
*   `bank_register_info` -> "VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava 25, Obch. reg.: Mestský súd Bratislava III, Oddiel: Sa, Vložka č. 341/B, IČO: 31320155, www.vub.sk"

**Pravá horná časť (Údaje výpisu - statement_data & bank_data):**
*   `statement_month` -> "11" (z riadku Por. číslo 11/2025)
*   `statement_year` -> "2025" (z riadku Por. číslo 11/2025)
*   `statement_cur_page` -> "1" (z riadku Strana 1/1)
*   `statement_all_pages` -> "1" (z riadku Strana 1/1)
*   `statement_date` -> "30.11.2025" (z riadku Zo dňa)
*   `bank_outlet_id` -> "30017" (z riadku Pobočka)

**Ľavá stredná časť (Údaje o účte - client_data & statement_data & bank_data):**
*   `statement_title` -> **VÝPIS Z ÚČTU** (nadpis sekcie - default value)
*   `client_title` -> "*GIGASTARS, S.R.O." (z riadku Názov)
*   `client_iban` -> "SK84 0200 0000 0040 7755 7753" (z riadku Číslo)
*   `client_swift` -> "SUBASKBX" (z riadku BIC)
*   `statement_currency` -> "EUR" (z riadku Mena)
*   `client_account` -> "VÚB Biznis účet Štandard" (z riadku Typ)
*   `bank_outlet_address` -> "KOMÁRNICKÁ 11, BRATISLAVA" (z riadku Pobočka)

**Pravá stredná časť (Identifikácia klienta - client_data):**
*   `client_id` -> "36821608" (z riadku IČO klienta)

**Ľavá dolná časť (Doplňujúce údaje účtu):**
*   `client_limit` -> "0,00" (z riadku Limit povoleného prečerpania)
*   (text bez štítku) -> "Platnosť povoleného prečerpania:"
*   `statement_frequency` -> "mesačne" (z riadku Frekvencia výpisov)

**Pravá dolná časť (Adresa klienta - client_data):**
*   `client_title` -> "*GIGASTARS, S.R.O."
*   `client_street` -> "VILOVÁ 31"
*   `client_zip` -> "851 01"
*   `client_city` -> "BRATISLAVA-PETRŽALKA"


## 2. ASCII Nákres štruktúry dokumentu (Presné rozloženie)

```text
[bank_logo_id]                                                   Por. číslo: 11/2025   <-- [statement_month]/[statement_year]
+---------------------------------------+                        Strana:     1/1       <-- [statement_cur_page]/[statement_all_pages]
|  VÚB BANKA                            |                        Zo dňa:     30.11.2025<-- [statement_date]
|  Intesa Sanpaolo Group                |                        Pobočka:    30017     <-- [bank_outlet_id]
+---------------------------------------+
[bank_register_info]                                             IČO klienta:36821608  <-- [client_id]
+-----------------------------------------------------------+
| VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava 25,...       |
+-----------------------------------------------------------+

VÝPIS Z ÚČTU                               <-- [statement_title]
Názov:   *GIGASTARS, S.R.O.                        <-- [client_title]
Číslo:   SK84 0200 0000 0040 7755 7753             <-- [client_iban]
BIC:     SUBASKBX                                  <-- [client_swift]
Mena:    EUR                                       <-- [statement_currency]
Typ:     VÚB Biznis účet Štandard                  <-- [client_account]
Pobočka: KOMÁRNICKÁ 11, BRATISLAVA                 <-- [bank_outlet_address]


Limit povoleného prečerpania:                0,00  <-- [client_limit]
Platnosť povoleného prečerpania:                   
Frekvencia výpisov:                       mesačne  <-- [statement_frequency]

                                                                 *GIGASTARS, S.R.O.             <-- [client_title]
                                                                 VILOVÁ 31                      <-- [client_street]
                                                                 851 01 BRATISLAVA-PETRŽALKA    <-- [client_zip] [client_city]
```

## 3. Prompt pre AI (extrakcia dát presne podľa CCT)

**Systémový prompt (System Message):**
```text
Role: You are an expert data extraction AI specialized in parsing bank statements into structured JSON.
Task: Extract structured data from the provided image of a VÚB Banka bank statement.

Instructions:
Please locate the fields in the image and extract their exact text values. Return the result in a strict JSON format using ONLY the keys provided below. These keys directly correspond to our database schema.

Keys to extract:
- bank_logo_id (string: extract the name of the bank and group, e.g. "VÚB BANKA Intesa Sanpaolo Group")
- bank_outlet_id (string: branch ID number, e.g. "30017")
- bank_register_info (string: Full company registration details of the bank)
- bank_outlet_address (string: text description of the branch, e.g. "KOMÁRNICKÁ 11, BRATISLAVA")
- client_title (string: Name of the client/company)
- client_id (string: Company ID / IČO klienta)
- client_street (string: Street name and number of the client's address)
- client_zip (string: Postal code)
- client_city (string: City name)
- client_iban (string: IBAN account number)
- client_swift (string: BIC/SWIFT code)
- client_account (string: Account type description, e.g. "VÚB Biznis účet Štandard")
- client_limit (string: Overdraft limit value, e.g. "0,00")
- statement_title (string: Title of the document, typically "VÝPIS Z ÚČTU" as a default value)
- statement_date (string: e.g. "30.11.2025")
- statement_year (string: just the year, e.g. "2025" from Por. číslo)
- statement_month (string: just the month, e.g. "11" from Por. číslo)
- statement_frequency (string: e.g. "mesačne")
- statement_currency (string: e.g. "EUR")
- statement_cur_page (string: just the current page number, e.g. "1")
- statement_all_pages (string: total number of pages, e.g. "1")

Rules:
1. Ensure absolute accuracy, copy the text exactly as it appears.
2. For statement_month and statement_year, split the "Por. číslo" (e.g. 11/2025 becomes month 11, year 2025).
3. For statement_cur_page and statement_all_pages, split the "Strana" value (e.g. 1/1 becomes cur_page 1, all_pages 1).
4. Output ONLY valid JSON, without any markdown formatting wrappers or additional text.
```
