# CLAUDE.md

Udhëzime për asistentët e IA-së që punojnë në këtë depo. Lexoje para se ta prekësh kodin.

Dokumentacioni i projektit është shqip, prandaj edhe ky skedar. Struktura, komentet, commit-et
dhe teksti në ekran janë shqip — mos e ndërro gjuhën. Përjashtim bëjnë vetëm emrat e fushave të
të dhënave (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`), për arsyen te pika 8.

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
npm test          # node --test — 111 prova, pa framework provash
```

`npm test` para çdo commit-i. Nuk ka linter të konfiguruar.

## Rregullat e arkitekturës

### 1. Logjika rri te module që nuk njohin as bazën, as React-in, as `window`-in

`llogaritjet.ts`, `pikezimi.ts`, `fusha.ts`, `qr.ts`, `paketa.ts`, `ndarja.ts` dhe `sinjalizimi.ts`
importohen drejtpërdrejt nga `node --test`, pa bundler dhe pa DOM — prandaj `npm test` zgjat nën një
sekondë dhe nuk ka çka të prishet mes provës dhe kodit.

`lidhja.ts` dhe `ruajtja.ts` nuk hyjnë te kjo listë me qëllim: e para njeh `RTCPeerConnection` e
`BroadcastChannel`, e dyta bazën. Logjika e tyre e provueshme është nxjerrë jashtë — te
`sinjalizimi.ts` dhe `kopja.ts` — dhe ajo që mbetet provohet me shfletues.

Logjika e re shkon te një prej tyre, ose te një modul i ri i të njëjtit lloj, me prova. Mos fut
`import` të bazës, të React-it apo të ndonjë API-je të shfletuesit në to.

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

### 6. Futja e raundit optimizohet për gjashtë lojtarë, jo për dy

Ky bllok përdoret dhjetëra herë në një mbrëmje, dhe një grup me gjashtë lojtarë e trefishon punën
e tij. Tri gjëra e mbajnë të përdorshëm, dhe asnjëra nuk guxon të hiqet pa e zëvendësuar:

- **«Next» i tastierës kalon te lojtari tjetër, dhe te i fundit ruan raundin.** Me gjashtë lojtarë
  kjo është gjashtë prekje më pak për raund. Pas ruajtjes me tastierë fokusi kthehet te i pari; pas
  një prekjeje të butonit jo, sepse hapja e tastierës pa u kërkuar do të mbulonte renditjen që
  përdoruesi sapo shkoi ta shohë.
- **Rreshti i veprimeve rri `position: sticky` në fund të kartelës.** Me tastierën e hapur ekrani i
  mbetur është nën gjysmën e telefonit. Prandaj `.kartela--kryesore` ka `overflow: clip` e jo
  `hidden`: të dyja e presin vijën e theksit njësoj, por `hidden` krijon kontejner rrëshqitjeje dhe
  ia heq fuqinë `sticky`-t brenda.
- **Nga pesë lojtarë e tutje shtrëngohen rreshtat dhe tabelat** (`data-shume`). Ulet vetëm ajri:
  fushat dhe butonat mbeten 2.75rem, sepse ai është kufiri nën të cilin gishti nuk i zë.

Llogaritësi nuk ka çelës „s'hapi / hapi" — dora e thotë. Fushë e zbrazët do të thotë që lojtari
nuk hapi, prandaj merr dënimin fiks; çdo numër do të thotë që hapi, dhe ai numër është dora.
Një lojtar që ka hapur e ka mbetur me zero pikë do ta kishte mbyllur vetë raundin, prandaj zeroja
nuk humb asnjë gjendje të vërtetë. Me gjashtë lojtarë kjo e preu llogaritësin nga 1195px në 569px
dhe hoqi pesë prekje.

### 7. Rezultati shpërndahet dy rrugë, dhe asnjëra nuk ka server

Kush rri rreth tavolinës do t'i shohë pikët në telefonin e vet. Ka dy rrugë, dhe të dyja duhen:

- **E drejtpërdrejtë** (`lidhja.ts`, `sinjalizimi.ts`): një kanal WebRTC mes telefonave të së
  njëjtës rrjetë. Pikët dalin vetë pas çdo raundi. Kjo është ajo që duhet gjatë lojës.
- **Fotografia e çastit** (`ndarja.ts`): gjendja shkruhet te vetë adresa, adresa bëhet kod QR, dhe
  kush e skanon hap `#/shiko/<paketë>`. Rri sepse e para ka një kufi që nuk varet nga kodi — një
  rrjetë që i ndan klientët nga njëri-tjetri (AP isolation, wifi hoteli, „rrjeta e mysafirëve") e
  bllokon lidhjen fare. Atëherë fotografia është e vetmja, dhe punon edhe kur telefonat nuk janë
  fare në të njëjtin wifi.

Tri rrugë — `#/shiko/`, `#/lidhu/` dhe `#/pergjigje/` — nuk lexojnë as shkruajnë në bazë fare.
Prandaj hapen edhe në një telefon që nuk e ka pasur kurrë aplikacionin: pikërisht ai që sapo skanoi
kodin. Një provë me shfletues e mban këtë të matur duke kontrolluar se `indexedDB.databases()` te
ana që shikon rri e zbrazët.

Ajo që kalon nëpër kanal është pikërisht paketa e `ndarja.ts` — të njëjtat bajte të fotografisë —
dhe `PamjaERezultatit` është një vend i vetëm vizatimi për të dyja. Dy kopje do të dilnin jashtë
sinkronie pikërisht atje ku numri duhet të jetë i njëjti.

#### Sinjalizimi kalon nëpër kamerën e telefonit

WebRTC-ja kërkon që të dy anët t'i njohin kredencialet e njëra-tjetrës, dhe kjo bëhet zakonisht me
një server sinjalizimi. Server nuk ka, prandaj sinjali kalon nga jashtë — dy kode QR:

1. Strehuesi tregon ftesën. Kush shikon e skanon me **kamerën e telefonit**, jo me aplikacionin, dhe
   kamera hap `#/lidhu/<paketë>`.
2. Ai ekran tregon një kod të dytë. Strehuesi e skanon me kamerën e vet, dhe kamera hap
   `#/pergjigje/<paketë>` **në një skedë të dytë**.
3. Skeda e dytë e kalon paketën te skeda e lojës me `BroadcastChannel`, merr pohimin dhe thotë
   „mbyllu".

Hapi i tretë ekziston sepse skeda e lojës nuk guxon të lëvizë: ajo mban `RTCPeerConnection`-in, dhe
një navigim do ta vriste pikërisht lidhjen që po ndërtohej. Kamera nuk di t'ia dorëzojë tekstin një
skede që rri hapur.

Hapat rrinë të shkruar me numra te ekrani. Hapi i dytë nuk merret me mend — *skanova kodin, dhe tani
pse më del një kod tjetër?* — dhe pa fjalë njeriu ngec atje.

#### Gjërat që nuk guxojnë të hiqen

- **`iceServers` rri i zbrazët.** Pa STUN e pa TURN mblidhen vetëm kandidatë `typ host`, prandaj
  asnjë server nuk kontaktohet dhe lidhja del vetëm brenda së njëjtës rrjetë. Kjo nuk është kufizim
  i pranuar me hall — është pika 1 e mbajtur: pikët nuk kalojnë nëpër asnjë pajisje tjetër. Prandaj
  `sinjaliNgaSdp` i heq kandidatët `srflx` e `relay` (do të kërkonin serverin që nuk ka) dhe ata TCP
  me portë 9 (të pavlefshëm pa të).
- **Nga SDP-ja mbahen gjashtë fusha, pjesa tjetër rindërtohet.** SDP-ja e Chrome-it del mbi një mijë
  bajte dhe pothuajse e tëra është tekst i njëjtë çdo herë; `sdpNgaSinjali` e shkruan atë fjalë për
  fjalë. Nga 1200 bajte bien nën 250 — pra një kod QR që skanohet. Nëse i prek fushat, prova
  `SDP-ja e rindërtuar i mban të gjitha fushat që kanë kuptim` e lexon rindërtimin sërish dhe
  krahason.
- **Çdo fushë kontrollohet me alfabet të ngushtë kur shpaketohet.** Sinjali vjen nga kushdo që të
  tregon një kod QR, dhe një rresht i futur brenda një adrese — `\r\n` pastaj një kandidat `relay`
  që shpik një server — do t'i çonte pikët atje. Prandaj nuk kalon asnjë karakter që SDP-ja e lexon
  si ndarës. Mos e zbut `ADRESA`, `ICE` as `MID`.
- **Paketa ka nënshkrim** (`nenshkrimi()` te `paketa.ts`, FNV-1a me bazë 36). Te fotografia, pa të
  një adresë e prerë lexohej ende dhe totali i lojtarit të fundit dilte 105 → 0, pra ai dilte
  fitues; meqë ajo pamje shërben për t'u shlyer mes vete, një numër i gabuar në heshtje është më i
  keq se një lidhje që thotë hapur „nuk lexohem". Te sinjali arsyeja është tjetër dhe përfundimi i
  njëjti: një gishtëz DTLS e prerë e lë lidhjen të dështojë pa shpjegim. Mos e hiq, dhe mos i shto
  fusha paketës pa e futur në nënshkrim.
- **Përgjigja mban `ref`** — `ufrag`-un e ftesës që i përgjigjet. Pa të, një përgjigje e vjetër, kodi
  i mbetur i hapur në ekranin e dikujt, do të aplikohej mbi ftesën e re dhe lidhja do të vdiste në
  heshtje.
- **Ftesa e radhës përgatitet te `dc.onopen`, e jo sa pranohet përgjigja.** Përndryshe kodi QR
  ndërrohet nën hundën e atij që po e skanon.
- **Rruga me dorë rri jashtë kushtit të ftesës.** Brenda tij ajo zhduket pikërisht kur duhet: kur
  përgatitja e ftesës dështon dhe kodi QR nuk del fare, ngjitja e kodit është e vetmja rrugë e
  mbetur.

#### Kodi QR

I shkruar me dorë te `qr.ts` — mënyra „byte", niveli L, versionet 1–20 — sepse rregulli i varësive
vlen edhe këtu. Një kod QR i gabuar nuk duket i gabuar, thjesht nuk lexohet, prandaj
`test/qr.test.mjs` mban matrica të ngrira që u vizatuan dhe u lexuan me `zxing-cpp`, një dekodues
krejt i pavarur. Gjatë zhvillimit u kontrollua i tërë intervali 1–20 njësoj: njëzet e katër tekste,
mes tyre UTF-8 shumëbajtësh, u lexuan të gjitha saktë. Nëse i prek bitet e koduesit, riverifikoji
ashtu — jo me sy.

Ftesa merr `qr--madh`, me kufi 18rem e jo 15rem. Ftesa del rreth 240 karaktere — 57 module kur
kandidati është emër mDNS, si te telefoni — dhe këtë kod duhet ta lexojë kamera e një telefoni tjetër
nga ekrani i këtij: ekran i ndritshëm, kënd i shtrembër, dorë që dridhet. Me zonën e qetë dalin 65
module, pra 4.4 piksela për modul te 18rem në vend të 3.7. E vizatuar ashtu, `zxing-cpp` e lexon
edhe kur zvogëlohet në 1.5 piksela për modul, edhe me turbullim, edhe me kontrast 15%.

Sfondi i kodit mbetet i bardhë edhe në temën e errët, dhe pikat të zeza: skanuesi pret të errët mbi
të çelët, dhe një kod i përmbysur nuk lexohet nga shumë telefona. Kjo është e vetmja ngjyrë te
projekti që nuk vjen nga tokenat.

### 8. Emrat e fushave vijnë nga `logic.json`

`test/logic.json` është fleta origjinale e nxjerrë nga Google Sheets-i, dhe çdo numër aty u
kontrollua kundër formulave të saj. Provat maten kundër tij, jo kundër pritjeve të shpikura.

Prandaj `playerNames`, `selectedPlayers`, `roundNumber` e `scores` mbeten anglisht: janë kontrata
me atë skedar. Gjithçka tjetër — emrat e moduleve, e funksioneve, e komponentëve, komentet dhe
teksti në ekran — është shqip.

Dy fusha të `logic.json`-it nuk përdoren dot, sepse dolën të cunguara nga nxjerrja e
automatizuar dhe jo nga tabela: `domina_1.standings` (një rresht nga tre lojtarë) dhe
`brigj_4_merged_teams.settlement_matrix` (rreshti i dytë quhet `null`). Totalet e të dyve janë të
plota dhe provohen normalisht. Mos i „rregullo" ato fusha — janë dëshmi e asaj që erdhi.

### 9. Vlerat dinamike vizatohen me SVG, jo me atribut `style`

Asnjë atribut `style` nuk shkruhet askund: vlerat që ndryshojnë marrin klasë ose atribut SVG. Kjo
është zakoni i Kujdestarisë, ku CSP-ja `style-src 'self'` e ndalon atributin `style` fare — dhe
mbahet edhe këtu, që të dy projektet të mbeten të zëvendësueshëm.

Nëse shton diçka që kërkon stil inline, zgjidhja është një klasë ose një atribut SVG.

### 10. Pa bibliotekë grafikësh, pa bibliotekë rrugëtimi, pa bibliotekë gjendjeje

Varësitë janë tri: `react`, `react-dom`, `idb` — pa bibliotekë kodesh QR dhe pa bibliotekë WebRTC-je.
Rrugët janë pak; një `switch` mbi hash-in
mjafton dhe butoni «prapa» i telefonit punon vetvetiu. Gjendja lexohet nga baza pas çdo shkrimi —
baza është lokale, një lexim i tërë është disa milisekonda, dhe një cache që del jashtë sinkronie
do të ishte rrezik pa përfitim.

Mos shto framework, mos shto bibliotekë komponentësh, mos shto bibliotekë grafikësh.

Për zhvillim përdoren tri paketa Python që **nuk hyjnë te aplikacioni**: `segno`, `zxing-cpp` dhe
`pillow`, vetëm si dëshmitarë të pavarur për koduesin QR.

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
- **Leximet e listave hyjnë në një transaksion të vetëm.** `numriILojerave` e nxjerr numrin nga vetë
  indeksi, pa i prekur regjistrat. Ekrani i grupit i lexon raundet vërtet, sepse tregon renditjen e
  secilës mbrëmje — por përmes `raundetELojerave`, një transaksion për tërë grupin e jo një për çdo
  lojë.
- **Fusha e pikëve është `type="text"`, dhe shenja ka butonin e vet.** Tastiera `inputMode="numeric"`
  e Androidit ka vetëm shifra — pa minus — prandaj pikët e mbylljes (−20, −40) nuk shkruheshin dot
  fare në telefon. `pastro()` te `fusha.ts` e njeh minusin kudo qoftë e jo vetëm në krye, sepse kur
  shenja shtypet para shifrave kursori bie para tij dhe teksti del „4−". Mos e kthe në `type="number"`:
  ajo e hedh poshtë „−"-in e vetëm para se të vijnë shifrat.
- **Një lojë e hapur e paluajtur nuk renditet fare.** Të gjitha totalet zero i bëjnë të gjithë të
  barabartë, dhe `renditja` do t'ia jepte vendin e parë të parit të listës — një fitore e fituar nga
  radha e emrave. Prandaj `renditjaELojes` dhe `tabelaEPergjithshme` i kapërcejnë lojërat pa asnjë
  pikë, dhe brenda një loje marrin vetëm ata që shënuan. Kjo është edhe arsyeja pse renditja e
  `brigj_4_merged_teams` te `logic.json` nuk provohet dot kundër tabelës: fleta e rendit, kjo jo.
- **Matrica renditet sipas renditjes, jo sipas radhës së tavolinës.** Shlyerja shihet kur mbaron
  loja, dhe atëherë lexohet duke nisur nga fituesi. Vendi shkruhet krah emrit te rreshti, që radha
  të mos duket e rastit.
- **Kutia e emrave pranon disa njëherësh** — «meri, lesa, lila, rila». Ndarësit janë presja,
  pikëpresja dhe rreshti i ri, kurrë hapësira: emrat me dy fjalë („meri + mil" te fleta e vjetër)
  duhet të mbeten një i vetëm. Shtimi mes lojës kalon një varg te `onShto`, jo një emër për
  thirrje — çdo thirrje niset nga e njëjta listë e vjetër dhe do të mbetej vetëm i fundit.
- **Lojë e re niset nga lojtarët e lojës së fundit**, jo nga tërë lista e grupit: shoqëria është
  zakonisht e njëjta, prandaj më shpesh nuk ka çka të preket fare. „E fundit" është ajo që del e
  para te historiku — më e reja sipas datës.
- **Kolona e parë e tabelës së raundeve rri `sticky`.** Me gjashtë lojtarë tabela del më e gjerë se
  telefoni, dhe pa të humb se cili raund po shihet sapo rrëshqitet.
- **Përgjigja e lidhjes mbërrin nga dy rrugë njëherësh** — `BroadcastChannel` dhe ngjarja `storage` —
  prandaj `pergjigju()` e shkruan gjendjen **para** `await`-it. Me shkrimin pas tij, thirrja e dytë e
  gjente `#pritja`-n ende të plotë, shkruheshin dy përshkrime mbi të njëjtën lidhje, e dyta kërcente,
  dhe kapja e gabimit rrëzonte një lidhje që ishte e mirë. Dilte një herë në tri te prova me
  shfletues; mos e zhvendos atë shkrim pas `await`-it.
- **Lidhjet e hapura mbahen veç ftesës që pret.** `#hapFtese` e mbyll ftesën e papërgjigjur, dhe ajo
  thirret nga `dc.onopen` — pa këtë ndarje do të mbyllte pikërisht lidhjen që sapo u hap.
- **Një kod i skanuar merr gjithmonë përgjigje me fjalë.** Kur nuk ka ftesë të hapur, kodi është i
  vjetër gjithsesi; pa mesazh, njeriu ngjit kodin, shtyp «Lidhu», dhe nuk ndodh kurrgjë.
- **Lidhja nis me kërkesë, jo me hapjen e ekranit.** `<details>` vetëm i fsheh fëmijët, prandaj
  paneli rri i montuar edhe i mbyllur — dhe pa çelësin `nisur` çdo hapje e një loje do të ngrinte një
  `RTCPeerConnection` që nuk i kërkoi kush. Po ashtu, lidhja jeton sa rri hapur ajo skedë.
- **Kandidatët e telefonit janë emra mDNS**, jo IP: `<uuid>.local`. Ata zgjidhen mes pajisjeve të së
  njëjtës rrjetë, prandaj punojnë — por i shtojnë ftesës dyzet karaktere, dhe kjo është arsyeja pse
  gishtëza paketohet si bajte e jo si heks.
- **Nuk u provua me dy telefona të vërtetë.** Prova me shfletues i ngre të dy anët në të njëjtën
  makinë, prandaj ICE-ja lidhet mbi `192.0.2.2` e mDNS-i zgjidhet brenda së njëjtës Chrome. Rruga e
  parë kur diçka nuk punon në wifi të vërtetë është `chrome://webrtc-internals`, dhe dyshimi i parë
  është ndarja e klientëve nga rrjeta.
