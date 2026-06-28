VÚB Statement Generator — Windows 11 balík (v2)
================================================

Tento balík obsahuje PDF-first editor v2 s Tailscale ochranou.

PREDPOKLADY
-----------
1. Node.js 24 LTS (https://nodejs.org/)
2. Tailscale nainštalovaný a prihlásený (https://tailscale.com/download/windows)
3. TAILSCALE_SECRET rovnaký ako na Vercel (projekt vub-statement-generator)
4. VITE_MISTRAL_API_KEY (voliteľné, pre AI extrakciu)

RÝCHLY ŠTART (ZIP s dist/)
--------------------------
1. Rozbaľ ZIP do priečinka (napr. C:\Apps\vub-statement-generator)
2. Skopíruj win11\.env.example -> .env.local a vyplň hodnoty
3. Spusti win11\START-PROXY.bat  (nechaj bežať)
4. Spusti win11\TAILSCALE-SERVE.bat
5. Otvor: https://TVOJ-WIN11-NODE.tailXXXXX.ts.net/vub

VÝVOJÁRSKY ŠTART (celý zdroják)
-------------------------------
1. Rozbaľ alebo git clone repozitár
2. Spusti win11\INSTALL.bat
3. Potom kroky 3-5 vyššie

PRÍSTUP
-------
- Iba cez Tailscale magic DNS (/vub cesta)
- Priamy Vercel URL je blokovaný (401 bez x-tailscale-auth)

WINDOWS NODE: lenovo-ai-node (100.65.155.123) v tailnete

Verzia: v2 PDF-first refactor | branch: win11version