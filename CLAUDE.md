# CLAUDE.md

Udhëzime për asistentët e IA-së që punojnë në këtë depo. Lexoje para se ta prekësh kodin.

Dokumentacioni i projektit është shqip, prandaj edhe ky skedar. Struktura, komentet, commit-et
dhe teksti në ekran janë shqip — mos e ndërro gjuhën. Përjashtim bëjnë vetëm emrat e fushave të
të dhënave (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`), për arsyen te pika 5.

## Çka është kjo

**Bridzh** — një numërues pikësh që i përgjigjet një pyetjeje: *sa ka secili, dhe kush kujt sa i
del*. Zëvendëson një fletë Google Sheets-i që mbahej me dorë për bridzhin kosovar, varianti i
xhin-ramit që luhet me 14 letra dhe mbyllet me 51 pikë.

Tri gjëra e përcaktojnë çdo vendim këtu:

1. **Nuk ka server.** IndexedDB dhe asgjë tjetër. Loja luhet rreth tavolinës, jo çdo mbrëmje ka
   internet të mirë, dhe historiku i një shoqërie nuk ka pse të rrijë te dikush tjetër. Kjo do të
   thotë edhe se kopja rezervë nuk është shtojcë — është dalja e vetme e të dhënave.
2. **Përdoruesi po mban letrat me dorën tjetër.** Çdo fushë numri është së paku 2.75rem, tastiera
   del numerike, dhe blloku që përdoret dhjetëra herë në mbrëmje („Ruaj raundin") rri i pari.
   Ekrani i ngushtë vjen i pari; kompjuteri pas.
3. **Fiton totali më i vogël.** Kjo është e kundërta e asaj që pret syri te një tabelë pikësh,
   prandaj vendi i parë ngjyroset dhe legjenda e matricës e thotë me fjalë çfarë do të thotë shenja.

## Komandat

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # tsc --noEmit && vite build
npm run preview
npm test          # node --test — 52 prova, pa framework provash
```

`npm test` para çdo commit-i. Nuk ka linter të konfiguruar.

## Rregullat e arkitekturës

### 1. `llogaritjet.ts`, `pikezimi.ts` dhe `fusha.ts` nuk njohin as bazën, as React-in, as `window`-in

Të treja importohen drejtpërdrejt nga `node --test`, pa bundler dhe pa DOM — prandaj `npm test`
zgjat treqind milisekonda dhe nuk ka çka të prishet mes provës dhe kodit.

Logjika e re shkon në njërin nga këta tre skedarë, me prova. Mos fut `import` të bazës, të
React-it apo të ndonjë API-je të shfletuesit në to.

### 2. Asnjë vlerë e derivuar nuk ruhet

Në bazë shkruhen vetëm pikët e futura. Totalet, renditja dhe matrica llogariten sa herë lexohen.

Kjo nuk është kursim vendi — është e vetmja mënyrë që redaktimi i raundit të tretë në raundin e
dhjetë të mos lërë prapa një total të ngrirë diku. Nëse shton një vlerë të derivuar, mos e ruaj.

### 3. Fushat e numrave mbeten burimi i vërtetë, llogaritësi vetëm i mbush

Llogaritësi hant/normal shkruan te fushat dhe pastaj hiqet nga mesi; pikët ende preken me dorë.

Arsyeja rri te vetë të dhënat: te fleta origjinale ka një raund me mbyllës të shënuar **−50**, që
nuk e jep asnjë nga dy mbylljet, dhe një raund të papërfunduar pa asnjë mbyllës. Një aplikacion që
pranon vetëm kombinimet e lejuara nuk do t'i shënonte dot. Prova
`llogaritësi i mbulon të gjitha raundet e shënuara, veç dy përjashtimeve` e mban këtë të matur:
nëse dikush „rregullon" rregullat, ajo bie.

### 4. Lojërat e kaluara nuk preken kur ndërron grupi

Secila lojë mban `selectedPlayers` — fotografinë e atyre që luajtën atë natë. Raundet, renditja
dhe matrica shkruhen mbi atë listë, kurrë mbi `playerNames` të grupit.

Prandaj shtimi, heqja ose riemërtimi i një lojtari sot nuk e prek asnjë lojë të djeshme. Mos e
lidh asnjë ekran lojës me listën e sotme të grupit.

### 5. Lista e lojës ndryshon edhe pasi loja ka nisur

Dikush vjen te raundi i pestë; dikush ngrihet e ikën. `selectedPlayers` i një loje pranon shtim dhe
heqje mes rrugës, dhe kjo nuk prek asnjë raund: lojtari i ri thjesht s'ka pikë te raundet e
shkuara, dhe qeliza e zbrazët nuk numërohet si zero.

Dy gjëra rrjedhin prej kësaj dhe nuk guxojnë të hiqen:

- **Hiqet vetëm ai që s'ka shënuar ende.** Kush ka pikë te ndonjë raund mbetet te loja — pikët e
  tij janë pjesë e historikut të asaj mbrëmjeje dhe heqja do t'i linte pa kolonë. Kush ikën para
  fundit thjesht pushon së shënuari.
- **Pjesëmarrja e pabarabartë tregohet, nuk fshihet.** Totali mbetet shuma e pikëve — rregulli i
  `logic.json`-it nuk preket — por meqë fiton totali më i vogël, kush hyri te raundi i fundit del
  i pari pa luajtur asgjë. Prandaj `raundetELuajtura` nxjerr kontekstin dhe renditja shton kolonën
  „raunde" me një shënim mbi tabelë. Mos e „rregullo" duke ndryshuar totalin.

### 6. Emrat e fushave vijnë nga `logic.json`

`test/logic.json` është fleta origjinale e nxjerrë nga Google Sheets-i, dhe çdo numër aty u
kontrollua kundër formulave të saj. Provat maten kundër tij, jo kundër pritjeve të shpikura.

Prandaj `playerNames`, `selectedPlayers`, `roundNumber` e `scores` mbeten anglisht: janë kontrata
me atë skedar. Gjithçka tjetër — emrat e moduleve, e funksioneve, e komponentëve, komentet dhe
teksti në ekran — është shqip.

Dy fusha të `logic.json`-it nuk përdoren dot, sepse dolën të cunguara nga nxjerrja e
automatizuar dhe jo nga tabela: `domina_1.standings` (një rresht nga tre lojtarë) dhe
`brigj_4_merged_teams.settlement_matrix` (rreshti i dytë quhet `null`). Totalet e të dyve janë të
plota dhe provohen normalisht. Mos i „rregullo" ato fusha — janë dëshmi e asaj që erdhi.

### 7. Vlerat dinamike vizatohen me SVG, jo me atribut `style`

Asnjë atribut `style` nuk shkruhet askund: vlerat që ndryshojnë marrin klasë ose atribut SVG. Kjo
është zakoni i Kujdestarisë, ku CSP-ja `style-src 'self'` e ndalon atributin `style` fare — dhe
mbahet edhe këtu, që të dy projektet të mbeten të zëvendësueshëm.

Nëse shton diçka që kërkon stil inline, zgjidhja është një klasë ose një atribut SVG.

### 8. Pa bibliotekë grafikësh, pa bibliotekë rrugëtimi, pa bibliotekë gjendjeje

Varësitë janë tri: `react`, `react-dom`, `idb`. Rrugët janë katër; një `switch` mbi hash-in
mjafton dhe butoni «prapa» i telefonit punon vetvetiu. Gjendja lexohet nga baza pas çdo shkrimi —
baza është lokale, një lexim i tërë është disa milisekonda, dhe një cache që del jashtë sinkronie
do të ishte rrezik pa përfitim.

Mos shto framework, mos shto bibliotekë komponentësh, mos shto bibliotekë grafikësh.

## Sistemi vizual

Tokenat, paleta, rrezet, hijet, kartelat dhe tabelat janë marrë nga
[Kujdestaria](https://github.com/rilindkycyku/kujdestaria) ashtu si janë, që të dy aplikacionet të
duken si i njëjti dorëshkrim. Nëse ndërron një token atje, ndërroje edhe këtu.

- Dy ngjyra theksi: smeraldi (`--hapur`) dhe ciani (`--theks`). Veprimi kryesor merr kalimin
  smerald→cian.
- Tema e errët nuk është shtojcë: mbrëmja është ora kur luhet.
- Fonti mbetet ai i sistemit; ndjesia merret nga pesha, hapësira e shkronjave dhe numrat tabelorë
  (`--shkronja-numrat`).
- Ikonat janë SVG inline te `ikonat.tsx`, jo emoji: emoji-t vizatohen nga fonti i sistemit, dalin
  me ngjyra e madhësi të ndryshme dhe nuk e marrin ngjyrën e tekstit përreth.
- `--kufiri-veprues` (≥3:1 sipas WCAG 1.4.11) për çdo gjë që klikohet; `--kufiri` është vetëm
  dekorativ. Mos e përdor kufirin dekorativ për një kontroll.
- `env(safe-area-inset-*)` me `viewport-fit=cover` për pamjen e instaluar. Ka edhe stil për shtypje.

## Gjëra që të zënë ngushtë

- **Ngjyrat e matricës ndjekin tabelën origjinale, jo rezultatin**: pozitivja jeshile, negativja e
  kuqe. Meqë fiton totali më i vogël, një `+214` jeshil do të thotë „ka 214 pikë më shumë", pra
  është ana që paguan — jo që prin. Legjenda nën tabelë e thotë këtë me fjalë pikërisht që ngjyra
  të mos lexohet si vend.
- **`dataShqip` e ndan datën me dorë.** `new Date('2026-01-08')` lexohet si UTC dhe në Kosovë do të
  jepte 7 janar. Mos e zëvendëso me `Date`.
- **Butoni i fshirjes rri brenda një lidhjeje** te historiku i grupit, prandaj i duhen
  `preventDefault` e `stopPropagation` — pa to, fshirja hap njëkohësisht edhe lojën.
- **Kthimi i një kopjeje e zëvendëson tërë bazën**, prandaj `lexoKopjen` kontrollon edhe lidhjet
  `groupId`/`gameId`: një skedar gjysmak do ta fshinte pikërisht atë që duhej të shpëtonte.
- **Numërimet e listave shkojnë përmes `index.count()`**, jo duke lexuar regjistrat. `numriILojerave`
  dhe `numriIRaundeve` e nxjerrin numrin nga vetë indeksi, brenda një transaksioni të vetëm — pa to,
  ekrani i grupeve shpaketonte çdo objekt `scores` të çdo raundi vetëm që të matte një gjatësi.
- **Fusha e pikëve është `type="text"`, dhe shenja ka butonin e vet.** Tastiera `inputMode="numeric"`
  e Androidit ka vetëm shifra — pa minus — prandaj pikët e mbylljes (−20, −40) nuk shkruheshin dot
  fare në telefon. `pastro()` te `fusha.ts` e njeh minusin kudo qoftë e jo vetëm në krye, sepse kur
  shenja shtypet para shifrave kursori bie para tij dhe teksti del „4−". Mos e kthe në `type="number"`:
  ajo e hedh poshtë „−"-in e vetëm para se të vijnë shifrat.
- **Matrica renditet sipas renditjes, jo sipas radhës së tavolinës.** Shlyerja shihet kur mbaron
  loja, dhe atëherë lexohet duke nisur nga fituesi. Vendi shkruhet krah emrit te rreshti, që radha
  të mos duket e rastit.
- **Kolona e parë e tabelës së raundeve rri `sticky`.** Me gjashtë lojtarë tabela del më e gjerë se
  telefoni, dhe pa të humb se cili raund po shihet sapo rrëshqitet.
