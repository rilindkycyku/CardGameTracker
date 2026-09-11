# CLAUDE.md

Udhëzime për asistentët e IA-së që punojnë në këtë depo. Lexoje para se ta prekësh kodin.

Dokumentacioni i projektit është shqip, prandaj edhe ky skedar. Struktura, komentet, commit-et
dhe teksti në ekran janë shqip — mos e ndërro gjuhën. Përjashtim bëjnë vetëm emrat e fushave të
të dhënave (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`), për arsyen te pika 8.

## Çka është kjo

**Bridzh** — një numërues pikësh që i përgjigjet një pyetjeje: *sa ka secili, dhe kush kujt sa i
del*. Zëvendëson një fletë Google Sheets-i që mbahej me dorë për bridzhin kosovar, varianti i
xhin-ramit që luhet me 14 letra, mbyllet me 51 pikë dhe mbaron pasi secili i ka përzier
letrat dy herë.

Ajo fletë ka edhe një skedë të dytë — **Magarec** — dhe tani e ka edhe aplikacioni: kush e humb
raundin merr një shkronjë, dhe kush e mbush fjalën „MAGAREC" e humb mbrëmjen. Rregullat te
[pika 11](#11-magareci-është-lojë-e-dytë-jo-aplikacion-i-dytë); ajo që vlen këtu është se të dyja
janë e njëjta tavolinë, i njëjti grup dhe e njëjta bazë.

Tri gjëra e përcaktojnë çdo vendim këtu:

1. **Nuk ka server.** IndexedDB dhe asgjë tjetër. Loja luhet rreth tavolinës, jo çdo mbrëmje ka
   internet të mirë, dhe historiku i një shoqërie nuk ka pse të rrijë te dikush tjetër. Kjo do të
   thotë edhe se kopja rezervë nuk është shtojcë — është dalja e vetme e të dhënave.

   Ka **një shmangje të vetme**, dhe rri e rrethuar: mënyra „me kod" e lidhjes së drejtpërdrejtë
   (`lidhjaMeServer.ts`) përdor një server sinjalizimi të huaj. Të dhënat e lojës nuk shkruhen te
   asnjë server edhe atëherë, dhe ekrani i thotë hapur çka del nga pajisja para se të shtypet
   butoni.

   **Ajo mënyrë tani rri e parazgjedhur, me kërkesë të pronarit të projektit**: shoqëria zakonisht
   nuk luan te i njëjti wifi, dhe mënyra pa server atëherë nuk lidhet fare. Pra rruga e parë e
   ekranit prek një server, dhe pika 1 mbetet e plotë vetëm për bazën e të dhënave e për
   fotografinë. Kjo është zgjedhje e pronarit, e jo rrjedhojë e kodit — mos e ndërro pa e pyetur.
   Kushtet që mbeten te pika 7.
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
npm test          # node --test — 150 prova, pa framework provash
```

`npm test` para çdo commit-i. Nuk ka linter të konfiguruar.

Versioni mbahet vetëm te `package.json` (`npm version patch|minor|major`). `vite.config.ts` e fut te
ndërtimi si `__VERSIONI__`, `versioni.ts` e lexon dhe fundfaqja e ekranit të parë e tregon. Kjo
ekziston sepse aplikacioni hapet nga një adresë dhe telefoni e mban në cache: pa një numër të
dukshëm, «e ke të renë apo të vjetrën?» nuk i përgjigjet dot kush. Ngrite atë numër kur del një
ndryshim që përdoruesi e sheh.

## Rregullat e arkitekturës

### 1. Logjika rri te module që nuk njohin as bazën, as React-in, as `window`-in

`llogaritjet.ts`, `pikezimi.ts`, `magareci.ts`, `parashikimi.ts`, `fusha.ts`, `qr.ts`, `paketa.ts`,
`ndarja.ts`, `sinjalizimi.ts` dhe `kodi.ts` importohen drejtpërdrejt nga `node --test`, pa bundler dhe pa DOM — prandaj `npm test`
zgjat nën një sekondë dhe nuk ka çka të prishet mes provës dhe kodit.

`lidhja.ts`, `lidhjaMeServer.ts` dhe `ruajtja.ts` nuk hyjnë te kjo listë me qëllim: e para njeh
`RTCPeerConnection` e `BroadcastChannel`, e dyta PeerJS-in, e treta bazën. Logjika e tyre e
provueshme është nxjerrë jashtë — te `sinjalizimi.ts`, `kodi.ts` dhe `kopja.ts` — dhe ajo që mbetet
provohet me shfletues.

Logjika e re shkon te një prej tyre, ose te një modul i ri i të njëjtit lloj, me prova. Mos fut
`import` të bazës, të React-it apo të ndonjë API-je të shfletuesit në to.

### 2. Asnjë vlerë e derivuar nuk ruhet

Në bazë shkruhen vetëm pikët e futura. Totalet, renditja dhe matrica llogariten sa herë lexohen.

Kjo nuk është kursim vendi — është e vetmja mënyrë që redaktimi i raundit të tretë në raundin e
dhjetë të mos lërë prapa një total të ngrirë diku. Nëse shton një vlerë të derivuar, mos e ruaj.

### 3. Llogaritësi hapet i pari, por fushat mbeten burimi i vërtetë

**Raundi i ri hapet me llogaritësin gati, me kërkesë të pronarit.** Pikët e një raundi dalin nga
rregulli e jo nga koka, prandaj rruga e shpeshtë nuk kërkon as prekjen që e hap atë. Pas ruajtjes ai
mbetet i hapur për raundin tjetër, por nis nga e para — `key`-i i tij mban numrin e raundit dhe sa
raunde janë ruajtur, që dora e sapofutur të mos mbetet e shkruar aty. Redaktimi i një raundi nis i
mbyllur: atje fushat mbajnë tashmë pikët e shënuara, dhe ajo që duhet rregulluar është pikërisht një
prekje me dorë.

**Me llogaritësin hapur, fushat hiqen nga ekrani.** Janë të zbrazëta gjithsesi, dhe gjashtë rreshta
të zbrazët mbi të vetëm e shtynin poshtë atë që po përdoret. Vlerat e shkruara rrinë te gjendja e
komponentit, prandaj «Mbyll llogaritësin» i kthen ashtu si ishin dhe «Vendosi te fushat» i kthen të
mbushura — nuk fshihet asgjë.

**Mbyllësi nuk vjen i zgjedhur**, dhe kjo rrjedh nga rreshti më sipër. Sa kohë llogaritësi hapej me
prekje, i pari i listës ishte parazgjedhje e padëmshme; me të hapur vetvetiu, ai emër del i zgjedhur
pa e prekur kush, dhe një prekje e vetme e «Ruaj raundin» e shkruan raundin te lojtari i gabuar.
Prandaj `<select>`-i nis te «Kush mbylli?», pikët nuk llogariten fare pa përgjigje (`pike` del
`null`), dhe të dy butonat e daljes rrinë të fikur derisa të zgjidhet. Mos i kthe parazgjedhje.

Llogaritësi hant/normal ka dy dalje, dhe të dyja duhen:

- **«Ruaj raundin N»** — butoni i rreshtit të ngjitur, i cili me llogaritësin hapur ruan pikët e tij
  ashtu si dalin. Raundi që bie brenda rregullit — dhe ata janë pothuajse të gjithë — mbaron me një
  prekje. Butoni rri poshtë e jo brenda llogaritësit, sepse brenda binte nën fund të ekranit sapo
  lojtarët ishin shumë; dhe është një i vetëm, sepse dy me të njëjtat fjalë lexoheshin si prishje.
- **«Vendosi te fushat»** — i shkruan pikët te fushat pa i ruajtur, dhe pastaj llogaritësi hiqet nga
  mesi. Kjo është rruga e raundit që rregulli nuk e mbulon.

Kjo e dyta nuk guxon të hiqet, dhe arsyeja rri te vetë të dhënat: te fleta origjinale ka një raund me mbyllës të shënuar **−50**, që
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
- **Rreshti i veprimeve rri `position: sticky` në fund të kartelës, dhe ka një «Ruaj» të vetëm** —
  atë të fushave, ose atë të llogaritësit kur ai është hapur (pika 3). Me tastierën e hapur ekrani
  i mbetur është nën gjysmën e telefonit. Prandaj `.kartela--kryesore` ka `overflow: clip` e jo
  `hidden`: të dyja e presin vijën e theksit njësoj, por `hidden` krijon kontejner rrëshqitjeje dhe
  ia heq fuqinë `sticky`-t brenda.
- **Nga pesë lojtarë e tutje shtrëngohen rreshtat dhe tabelat** (`data-shume`). Ulet vetëm ajri:
  fushat dhe butonat mbeten 2.75rem, sepse ai është kufiri nën të cilin gishti nuk i zë.

Llogaritësi nuk ka çelës „s'hapi / hapi" — dora e thotë. Fushë e zbrazët do të thotë që lojtari
nuk hapi, prandaj merr dënimin fiks; çdo numër do të thotë që hapi, dhe ai numër është dora.
Një lojtar që ka hapur e ka mbetur me zero pikë do ta kishte mbyllur vetë raundin, prandaj zeroja
nuk humb asnjë gjendje të vërtetë. Me gjashtë lojtarë kjo e preu llogaritësin nga 1195px në 569px
dhe hoqi pesë prekje.

### 7. Rezultati shpërndahet tri rrugë, dhe parazgjedhja nuk ka server

Kush rri rreth tavolinës do t'i shohë pikët në telefonin e vet. Ka tri rrugë, dhe secila mbulon atë
që tjetra nuk mundet:

- **E drejtpërdrejtë, pa server** (`lidhja.ts`, `sinjalizimi.ts`): një kanal WebRTC mes telefonave
  të së njëjtës rrjetë, me sinjalizimin nëpër dy kode QR. Parazgjedhja, dhe e vetmja që nuk
  kontakton kurrë asnjë server.
- **E drejtpërdrejtë, me kod** (`lidhjaMeServer.ts`, `kodi.ts`): i njëjti kanal WebRTC, por
  sinjalizimi kalon nëpër një server të huaj, prandaj mjafton një kod tetëkarakterësh. Shmangja e
  vetme nga pika 1, dhe rri me kushte — më poshtë.
- **Fotografia e çastit** (`ndarja.ts`): gjendja shkruhet te vetë adresa, adresa bëhet kod QR, dhe
  kush e skanon hap `#/shiko/<paketë>`. Rri sepse e para ka një kufi që nuk varet nga kodi — një
  rrjetë që i ndan klientët nga njëri-tjetri (AP isolation, wifi hoteli, „rrjeta e mysafirëve") e
  bllokon lidhjen fare. Atëherë fotografia është e vetmja, dhe punon edhe kur telefonat nuk janë
  fare në të njëjtin wifi.

Katër rrugë — `#/shiko/`, `#/lidhu/`, `#/pergjigje/` dhe `#/bashkohu/` — nuk lexojnë as shkruajnë
në bazë fare.
Prandaj hapen edhe në një telefon që nuk e ka pasur kurrë aplikacionin: pikërisht ai që sapo skanoi
kodin. Një provë me shfletues e mban këtë të matur duke kontrolluar se `indexedDB.databases()` te
ana që shikon rri e zbrazët.

Ajo që kalon nëpër kanal është pikërisht paketa e `ndarja.ts` — të njëjtat bajte të fotografisë —
dhe `PamjaERezultatit` është një vend i vetëm vizatimi për të dyja. Dy kopje do të dilnin jashtë
sinkronie pikërisht atje ku numri duhet të jetë i njëjti.

**Ajo pamje tregon më shumë se paketa, dhe pa asnjë bajt të shtuar.** Kush skanon një kod nuk e ka
hapur aplikacionin: ai është ulur te tavolina, faqja sapo u hap, dhe pyetja e tij është një e vetme —
*kush prin, dhe sa larg jam unë*. Prandaj sipër tabelave rri `PermbledhjaEPamjes` (kush prin, sa
vjen i dyti prapa, sa raunde kanë mbetur, kush përzien) dhe nën renditje `Vetja` («Unë jam …» →
rreshti yt i matricës). Të gjitha dalin nga dy gjëra që paketa i mbante që më parë: totalet, dhe
radha e tavolinës te `selectedPlayers`. Mos i shto fusha paketës për diçka që nxirret prej tyre.

Dy gjëra te ajo pamje nuk guxojnë të ndryshojnë:

- **Zgjedhja e vetes nuk ruhet askund.** Rrugët e ndarjes nuk shkruajnë asgjë (kushti i mësipërm),
  dhe një emër i mbajtur mend do të ishte shkelja e parë e tij. Rri te gjendja e komponentit; për një
  faqe që hapet një herë, nuk vlen as sa kostoja e të shpjeguarit.
- **Drejtimi i shlyerjes thuhet me fjalë, jo me ngjyrë.** Te matrica pozitivja është jeshile sepse
  ashtu e kishte fleta origjinale, dhe legjenda e shpjegon; po ajo ngjyrë mbi një rresht që thotë «ti
  i jep» do të lexohej si fitore. Dhe fjala mban kryefjalën e shkruar: një «i jep» i vetëm, me emrin
  e rreshtit sipër, lexohet sikur ta jepte ai — pikërisht e kundërta.

Paketa është te versioni **2**, dhe fusha e shtuar është një shkronjë: `b` a `m`, lloji i lojës.
Pa të ana që shikon nuk ka nga ta dijë se `3` do të thotë „MAG" e jo tri pikë — numri është i njëjti
bajt te të dyja lojërat. Versioni 1 lexohet ende dhe lexohet bridzh: një adresë e ndarë dje te një
bisedë nuk ka pse të vdesë sot, dhe atëherë kishte vetëm bridzh gjithsesi.

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

#### Mënyra e dytë: kodi i shkurtër, dhe kushtet e shmangjes

Shkëmbimi pa server kërkon dy skanime, sepse gishtëza DTLS dhe kredencialet ICE nuk hyjnë te tetë
karaktere dhe duhet të kalojnë nga jashtë. Me një server sinjalizimi mes vete, të dyja anët i marrin
ato nga serveri, dhe mbetet vetëm një emër i shkurtër — një skanim, ose një kod i diktuar me zë.
Punon edhe kur telefonat nuk janë te i njëjti wifi, dhe edhe kur rrjeta i ndan klientët.

Kjo shmangje pranohet vetëm nën këto kushte, dhe nëse dikush e prek një prej tyre, shmangja nuk
qëndron më:

- **Nuk niset vetë, dhe nuk ka rënie automatike.** `Drejtperdrejt` hapet te «Me kod» (zgjedhje e
  pronarit), por lidhja ende kërkon butonin: pa të, çdo hapje e një loje do të ngrinte një lidhje
  që nuk i kërkoi kush. **Mos shto rënie automatike mes mënyrave** — kush zgjedh «Pa server» nuk
  guxon të kalojë te serveri pa e ditur, dhe anasjelltas.
- **Ekrani e thotë çka del nga pajisja, para butonit.** Te serveri i sinjalizimit shkojnë kodi dhe
  adresat ICE (pra edhe IP-ja); te relenjat TURN, dhe vetëm kur lidhja e drejtpërdrejtë dështon,
  kalojnë bajtet e kanalit — të kriptuara me DTLS, prandaj relenja nuk i lexon pikët. Pikët nuk
  ruhen te asnjë server. I njëjti shënim rri edhe te `#/bashkohu`, sepse kush skanon një kod nuk e
  ka lexuar tekstin te ana tjetër.
- **PeerJS-i ngarkohet vetëm kur mënyra niset** (`await import('peerjs')`). Kush nuk e prek fare nuk
  e shkarkon fare: `index.html` nuk e përmend chunk-un, dhe një provë me shfletues e kontrollon se
  nuk kërkohet as kur zgjedhet çelësi — vetëm pas butonit. Ky është kushti nën të cilin varësia e
  katërt qëndron.
- **Gjithçka që njeh PeerJS-in rri te një skedar.** `lidhjaMeServer.ts` është i vetmi që e importon;
  komponentët njohin vetëm klasat e tij. Kështu shmangja nuk përhapet, dhe heqja e mënyrës do të
  ishte heqja e një skedari.
- **Kodi ka tetë karaktere, jo gjashtë.** Emrat te reja publike e PeerJS-it rrinë në një hapësirë të
  përbashkët publike, prandaj kush e gjen emrin i shikon pikët. Tetë karaktere nga tridhjetë e dy
  janë dyzet bita; gjashtë do të kishin qenë njësoj të lehta për t'u qëlluar sa për t'u shkruar.
  Emri mban edhe parathënjen `bridzh-`, që të mos përplaset me emrat e aplikacioneve të tjera te ajo
  hapësirë.
- **Alfabeti është Crockford base32** — pa `I`, `L`, `O`, `U` — dhe leximi i kthen ngatërresat
  prapa (`O`→`0`, `I`/`L`→`1`), sepse kodi diktohet me zë dhe shkruhet me nxitim. Vija dhe shkronjat
  e vogla nuk pengojnë.

`VITE_PEER_SERVER` (si `host:porta/shtegu`) e ndërron serverin gjatë ndërtimit. E zbrazët — dhe
kështu rri te prodhimi — do të thotë reja publike. Ekziston sepse reja publike nuk kapet nga makina
e provave, dhe pa të e tërë kjo mënyrë do të shkonte e paprovuar; dhe sepse kush nuk do t'ia besojë
lidhjen një serveri të huaj mund të ngrejë të vetin. Prova me shfletues ngre një `peerjs-server`
lokal dhe kalon nëpër tërë rrugën; ndërtimi i prodhimit kontrollohet se nuk mban asnjë gjurmë të
adresës së provave.

#### Kodi QR

I shkruar me dorë te `qr.ts` — mënyra „byte", niveli L, versionet 1–20 — sepse rregulli i varësive
vlen edhe këtu. Një kod QR i gabuar nuk duket i gabuar, thjesht nuk lexohet, prandaj
`test/qr.test.mjs` mban matrica të ngrira që u vizatuan dhe u lexuan me `zxing-cpp`, një dekodues
krejt i pavarur. Gjatë zhvillimit u kontrollua i tërë intervali 1–20 njësoj: njëzet e katër tekste,
mes tyre UTF-8 shumëbajtësh, u lexuan të gjitha saktë. Nëse i prek bitet e koduesit, riverifikoji
ashtu — jo me sy.

Kodi i mënyrës me kod është shumë më i shpërndarë: adresa `#/bashkohu/<kod>` është 43 karaktere,
pra 29 module dhe 7.8 piksela për modul — `zxing-cpp` e lexon edhe te një e pesta e madhësisë. Kjo
është përfitimi i dytë i atij mënyre, pas kodit të diktueshëm.

Ftesa e mënyrës pa server merr `qr--madh`, me kufi 18rem e jo 15rem. Ftesa del rreth 240 karaktere — 57 module kur
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

**Emrat e lojtarëve aty janë pseudonime** — `alfa`, `beta`, `gama` e kështu me radhë — sepse te
fleta ishin emrat e vërtetë të shoqërisë dhe depoja nuk ka pse t'i mbajë. U ndërruan njësoj kudo, e
numrat nuk u prekën fare. Mos i kthe emra njerëzish, as te provat, as te teksti i ekranit.

Prandaj `playerNames`, `selectedPlayers`, `roundNumber` e `scores` mbeten anglisht: janë kontrata
me atë skedar. Gjithçka tjetër — emrat e moduleve, e funksioneve, e komponentëve, komentet dhe
teksti në ekran — është shqip.

Fushat e reja janë shqip, sepse nuk janë pjesë e asaj kontrate: `lloji` te `Loja` e thotë çka u
luajt atë mbrëmje. Ai skedar njeh vetëm bridzhin, prandaj lista e emrave anglisht mbetet ajo që
është dhe nuk zgjatet.

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

Varësitë janë katër: `react`, `react-dom`, `idb` dhe `peerjs` — pa bibliotekë kodesh QR, dhe pa
bibliotekë WebRTC-je për mënyrën e parazgjedhur, që rri e shkruar me dorë.

`peerjs` është e katërta dhe e vetmja që hyri pas rregullit, prandaj mban kushte: ngarkohet vetëm me
kërkesë, e prek vetëm një skedar, dhe mbulon vetëm mënyrën që përdoruesi zgjedh me dorë (pika 7).
Nëse ndonjë prej tyre bie, bie edhe arsyeja pse rri.

Rrugët janë pak; një `switch` mbi hash-in
mjafton dhe butoni «prapa» i telefonit punon vetvetiu. Gjendja lexohet nga baza pas çdo shkrimi —
baza është lokale, një lexim i tërë është disa milisekonda, dhe një cache që del jashtë sinkronie
do të ishte rrezik pa përfitim.

Mos shto framework, mos shto bibliotekë komponentësh, mos shto bibliotekë grafikësh.

Për zhvillim përdoren dëshmitarë që **nuk hyjnë te aplikacioni** dhe nuk rrinë te `package.json`:
`segno`, `zxing-cpp` e `pillow` për koduesin QR, dhe `npx peer` (`peerjs-server`) si server
sinjalizimi lokal gjatë provave të mënyrës me kod. Mos i shto te varësitë — `peer` sjell me vete
`express` me dobësi të njohura, dhe një depo e klonuar nuk ka pse t'i marrë.

### 11. Magareci është lojë e dytë, jo aplikacion i dytë

Fleta e vjetër kishte një skedë „Magarec" krah atyre të bridzhit: shkronjat M-A-G-A-R-E-C poshtë
njëra-tjetrës, emrat përsipër, dhe një shenjë te qeliza sa herë dikush humbte raundin. Kush e mbush
fjalën e humb mbrëmjen. Kjo është e tërë loja, dhe `magareci.ts` është ajo fletë e bërë llogari.

E njëjta tavolinë, i njëjti grup, e njëjta bazë — prandaj magareci nuk solli as skemë të re, as
ekran të dytë:

- **Raundi i magarecit është një raund si çdo tjetër.** Humbësi merr `1`, të tjerët `0`, te i njëjti
  `scores`. Prandaj totali është numri i shkronjave, „fiton totali më i vogël" mbetet fjalë për
  fjalë e vërtetë, dhe raundet, redaktimi, kopja rezervë e ndarja e rezultatit punojnë ashtu si
  punonin. Mos i shto një vend të vetin shkronjës.
- **Zeroja e të tjerëve nuk është qelizë e zbrazët.** Kush ishte te tavolina e luajti atë raund; e
  zbrazëta do të thoshte „nuk ishte". Pa këtë dallim `raundetELuajtura` do t'i numëronte të gjithë
  sikur të kishin ardhur vonë, dhe renditja do të nxirrte shënimin e pjesëmarrjes së pabarabartë te
  çdo mbrëmje. Prova `zeroja e të tjerëve nuk është qelizë e zbrazët` e mban këtë të matur.
- **Shkronjat nuk ruhen, si asnjë vlerë e derivuar** (pika 2). Fjala del nga numri, dhe shkronja e
  një raundi del nga sa herë e kishte humbur ai lojtar deri atje — prandaj fshirja e raundit të dytë
  i rinumëron vetvetiu të gjitha ato që vijnë pas.
- **Një shkronjë për raund, dhe loja mbaron kur mbushet fjala.** Ekrani nuk pranon raund të ri pasi
  dikush e ka mbushur: një shkronjë më shumë nuk do të thoshte asgjë, dhe fleta do të gënjente.
  Redaktimi mbetet i hapur nga lista — atje rregullohet një prekje e gabuar.
- **Futja është një prekje, jo një buton „Ruaj".** Raundi ka një pyetje të vetme; prekja e emrit e
  ruan. Butoni e thotë edhe fjalën e atij lojtari deri tani dhe shkronjën që do të marrë, sepse pa të
  duhet lexuar rrjeti poshtë para çdo prekjeje.
- **Ngjyra shkon në të kundërt.** Te bridzhi theksi smerald i takon vendit të parë; këtu shkronjat e
  marra janë të verdha e shkronja e shtatë e kuqe. Numri i madh nuk është epërsi, është mbrëmja e
  humbur.
- **Tabelat e grupit rrinë dy.** Pikët me qindra dhe shkronjat nga zero në shtatë nuk mblidhen te e
  njëjta mesatare. Mos i bashko.
- **Shlyerje nuk ka.** `total[i] − total[j]` mbi shkronja nuk shlyhet me para; matrica nuk vizatohet
  fare te magareci.

Lojërat e shkruara para tij nuk e kanë fushën `lloji` dhe lexohen bridzh — `llojiILojes()` është
vendi i vetëm ku bëhet ai lexim. Një vlerë e panjohur te një kopje rezervë refuzohet e nuk lexohet
bridzh: do të vinte nga një version më i ri, dhe shkronjat e tij do të dilnin pikë pa e thënë kush.

### 12. Parashikimi mat kufij të arritshëm, jo gjasa

Pas renditjes vjen gjithmonë e njëjta pyetje rreth tavolinës: *a e arrin dot i dyti të parin nëse
luajmë edhe një raund?* `parashikimi.ts` i përgjigjet asaj, dhe ajo që e bën të përgjigjshme është
se të dyja lojërat veçojnë saktësisht një lojtar për raund — mbyllësin te bridzhi, humbësin te
magareci. Prandaj kufijtë e një raundi janë numra, e jo hamendje: −40 poshtë dhe +200 lart te
bridzhi (pra 240 pikë diferencë për raund), një shkronjë te magareci.

Katër gjëra e mbajnë të ndershëm, dhe asnjëra nuk guxon të hiqet:

- **Skenarët janë të arritshëm bashkë, jo kufij teorikë.** «Vendi më i mirë» te bridzhi është një
  raund hant ku askush tjetër nuk kishte hapur — një gjendje e vetme, jo dy supozime të ndara.
- **Mbyllja është një për raund, dhe ndahet.** Te «vendi më i keq» të tjerët nuk mbyllin dot të
  gjithë njëkohësisht; raundet u ndahen, më i liri i pari. Pa këtë, kush prin me njëqind pikë do të
  dilte i fundit pas një raundi të vetëm. E njëjta ndarje vlen te magareci për shkronjat.
- **Kufiri i sipërm është i rregullit, jo i së mundshmes.** `2 × dora` e kalon 200-shin kur dora del
  mbi 100 pikë. Ekrani e thotë këtë me fjalë poshtë tabelës; mos e hiq atë fjali duke e quajtur
  hollësi.
- **Barazimi numërohet si i njëjti vend.** `renditja` e ndan barazimin sipas radhës së listës — aty
  duhet një vend i vetëm për rresht — por një parashikim që thotë «i dyti» vetëm sepse emri vjen më
  vonë do të ishte numër i shpikur. Prandaj vendi këtu është «sa veta kanë më pak, plus një», dhe
  prova `vendi i tanishëm rri mes vendit më të mirë dhe atij më të keq` e mban të matur.

**Horizonti nuk hamendësohet.** Të dyja lojërat e kanë fundin e vet, prandaj «sa ka mbetur» është
numër që del nga vetë loja, dhe `raundetEMbetura` është vendi i vetëm ku bëhet ai dallim: te bridzhi
dy raunde për lojtar minus ato të luajtura (pika 13), te magareci sa mund të luhen më së shumti para
se të mbushet fjala (`raundetMeTeShumta`). E dyta është kufi i sipërm e jo numër i saktë — fjala
mund të mbushet shumë më herët — prandaj ekrani e shkruan «së shumti» krah numrit. Mos e zëvendëso
asnjërin me një numër të zgjedhur me dorë.

Ekrani ka dy çelësa e jo pesë, sepse vetëm dy pyetje bëhen vërtet: *sikur të luajmë edhe një raund*,
dhe *deri në fund*. Me një raund të mbetur të dyja janë e njëjta gjë, dhe çelësi zhduket.

Provat nuk maten kundër `logic.json`-it me numra të gatshëm: ai skedar nuk ka kolonë «vendi më i
mirë», sepse ajo pyetje nuk i bëhej dot një flete. Maten totalet e tij të vërteta kundër ligjeve që
një parashikim nuk i thyen dot — vendi i tanishëm rri brenda intervalit, më shumë raunde nuk e
ngushtojnë atë, dhe numri i raundeve që premton e mban premtimin me saktësisht një raund më pak.
Për magarecin të njëjtat mbrëmje lexohen sërish si shkronja — raundin e humb ai që mori më shumë
pikë — sepse pikët me qindra nuk hyjnë te një llogari ku totali shkon nga zero në shtatë.

### 13. Përzierja vlen te të dyja lojërat; dy rrotullimet vetëm te bridzhi

Dy rregulla që preken, por nuk janë një — dhe ngatërrimi i tyre është gabimi i lehtë këtu:

- **Përzierja** kalon një vend çdo raund te **të dyja** lojërat. Edhe magareci luhet me letra te e
  njëjta tavolinë, prandaj edhe atje dikush i përzien.
- **Gjatësia** është vetëm e **bridzhit**: dy raunde për lojtar, pra tavolina rrotullohet saktësisht
  dy herë dhe aty mbaron mbrëmja. **Magareci nuk e njeh atë kufi fare** — atje mbrëmja mbaron kur
  dikujt i mbushet fjala (pika 11), dhe mund të zgjasë shumë më gjatë ose të mbarojë te raundi i
  shtatë. Mos ia vër magarecit një fund të numëruar me raunde.

`perziersiIRaundit` nuk mban gjendje: raundi i parë i takon të parit të `selectedPlayers`, i dyti të
dytit, dhe pas të fundit nis prapë nga kreu. Kjo punon vetëm sepse radha e emrave ruhet që nga
futja — kutia e emrave e thotë («Radha ruhet — kështu ulen rreth tavolinës»), dhe fleta e vjetër i
mbante ashtu për të njëjtën arsye.

`raundetELojes` (`lojtarë × 2`) është rregulli i dytë, dhe del vetëm te bridzhi. Dy vende e thërrasin,
dhe të dyja e ndajnë llojin para se ta bëjnë: `Loja` me `magarec ? 0 : …`, dhe `raundetEMbetura` te
`parashikimi.ts` me një kthim të hershëm te rreshti i parë. Mos e thirr nga një ekran që u shërben të
dyja lojërave pa e ndarë llojin — prova `kufiri i bridzhit nuk e mbyll një mbrëmje magareci` e mban
këtë të matur.

**Rregulli nuk u shpik — fleta e dëshmon.** Çdo mbrëmje bridzhi te `logic.json` ka saktësisht dy
raunde për lojtar, dhe prova `çdo mbrëmje bridzhi e logic.json-it ka saktësisht dy raunde për
lojtar` e mban këtë të matur. Dy grupe rrinë jashtë saj, dhe asnjëri nuk e kundërshton:
`brigj_4_merged_teams` i ka kolonat çifte („alfa + zeta"), pra tetë raunde nga katër veta — që e
përforcon rregullin — dhe `domina_1` nuk është bridzh fare.

Asnjëri nga të dy numrat nuk ruhet, si asnjë vlerë e derivuar (pika 2): dalin nga lista e lojtarëve
sa herë lexohen. Prandaj shtimi ose heqja e dikujt mes lojës (pika 5) e rirendit përzierjen mbi listën
e tanishme, dhe te bridzhi e zgjat ose e shkurton mbrëmjen vetvetiu. Kjo është e vërteta e tavolinës: kush u
ngrit nuk përzien më, dhe letrat nuk e presin.

**Fundi mbyll futjen te të dyja lojërat, dhe vizatohet një herë.** `mbaroi` te `Loja` e bën atë
dallim një herë të vetme — fjala e mbushur te magareci, dy raundet për lojtar te bridzhi — dhe nga
aty poshtë ekrani pyet vetëm «a mbaroi». Butonat nuk rrinë të fikur, hiqen: një raund i shënuar pas
fundit do ta bënte fletën të gënjejë.

Kufiri i bridzhit nuk ngec dot mbi një raund të vërtetë, dhe kjo varet nga pika 5: hiqet vetëm ai që
s'ka shënuar ende, prandaj lista nuk shkurtohet dot nën raundet që janë luajtur tashmë. Dy rrugë
mbeten të hapura, dhe të dyja janë të vërteta të tavolinës: raundi i shënuar gabim rregullohet nga
lista poshtë, dhe kush u ul vonë shtohet te lojtarët — atëherë mbrëmja zgjatet me dy raunde
vetvetiu. Mos e mbyll njërën prej tyre.

Përzierësi rri krah titullit të raundit dhe jo te një rresht i vetin: blloku poshtë përdoret dhjetëra
herë në mbrëmje (pika 6), dhe një rresht mbi të do t'i hiqte hapësirë pikërisht atij. Numri i plotë
(«4 nga 8 raunde») rri te kreu, krah lojtarëve.

### 14. Fituesi shpallet nga totali, jo nga radha e listës

`renditja` i jep secilit një vend të vetëm dhe barazimin e ndan sipas radhës së listës. Te një tabelë
ashtu duhet — një rresht nuk rri dot në dy vende, dhe kështu i numëron fleta origjinale — prandaj ata
numra nuk preken.

Por një **pohim** nuk e ndan dot barazimin ashtu. Një mbrëmje e rregullt e nxjerr atë rast vetë: me
tre lojtarë dhe gjashtë raunde normale, ku secili mbyll dy herë, të tre dalin te 360 pikë. «alfa
fitoi» atëherë është e pavërtetë, dhe kurora mbi rreshtin e parë po ashtu — të dyja e shpallin një
fitues që nuk e ka ndarë kush.

Prandaj `fituesit()` te `llogaritjet.ts` kthen **të gjithë** ata që e ndajnë totalin më të vogël, dhe
çdo vend që shpall një fitues merret prej andej e jo prej `rreshtat[0]`: shenja e fundit te `Loja`,
kreu i `PermbledhjaEPamjes`, dhe kurora te `Renditja`. Vendet mbeten ashtu si ishin; ndryshon vetëm
ajo që thuhet me fjalë a me ikonë. Provat `barazimi te kreu nuk ndahet sipas radhës së listës` dhe
`fituesi i çdo mbrëmjeje të logic.json-it është ai me totalin më të vogël` e mbajnë këtë të matur.

## Sistemi vizual

Paleta, rrezet, hijet, kartelat dhe tabelat vijnë nga
[Kujdestaria](https://github.com/rilindkycyku/kujdestaria), por **dy gjëra u ndanë me qëllim, me
kërkesë të pronarit**, prandaj të dy projektet nuk duken më si i njëjti dorëshkrim:

- **Fonti është Quicksand**, e vendosur brenda paketës te `public/shkronja/`, e jo fonti i
  sistemit. Nuk merret nga Google Fonts gjatë hapjes: faqja duhet të hapet e plotë pa internet, dhe
  një kërkesë te një host i huaj do të thoshte edhe se dikush tjetër e mëson kur luajmë. Dy
  nënbashkësi mjaftojnë; `unicode-range` bën që vetëm `latin` të shkarkohet për tekstin shqip.
  `preload` te `index.html` e shkurton pritjen. Nëse shton shkronja të tjera, kontrollo se
  `unicode-range` i mbulon.
- **Asnjë kalim ngjyre.** Nuk ka `linear-gradient` as `radial-gradient` askund — një provë e
  thjeshtë është `grep -c gradient src/style.css`, dhe duhet të jepë zero. Veprimi kryesor, çelësat
  e shtypur, vija e theksit e kartelës dhe shenja e faqes marrin ngjyrë të plotë (`--hapur`).
  Sfondi i faqes rri i sheshtë. Kontrasti u rimatur pas heqjes: teksti mbi veprimin kryesor del
  5.5:1 në dritë e 7.6:1 në terr.

- Dy ngjyra theksi: smeraldi (`--hapur`) dhe ciani (`--theks`). Veprimi kryesor merr smeraldin e
  plotë.
- Tema e errët nuk është shtojcë: mbrëmja është ora kur luhet.
- Teksti është Quicksand me peshë 500 (`--shkronja`); numrat e kolonave mbeten monospace
  (`--shkronja-numrat`), sepse te një tabelë pikësh shifrat duhet të bien mbi njëra-tjetrën dhe
  Quicksand-i i ka proporcionale.
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
- **Te magareci numri krah emrit është shkronjë, jo raund.** `LojtaretELojes` e merr atë numër për
  të vendosur kush hiqet nga loja, dhe te magareci secili shënon `0` te çdo raund — pra raundet e
  luajtura do t'ua ndalnin heqjen të gjithëve. Prandaj aty i kalohen shkronjat: kush ka marrë
  shkronja mbetet te loja, kush u ngrit pa marrë asnjë hiqet.
- **`dataShqip` e ndan datën me dorë.** `new Date('2026-01-08')` lexohet si UTC dhe në Kosovë do të
  jepte 7 janar. Mos e zëvendëso me `Date`.
- **Fusha e datës është tekst, jo `type="date"`.** Atë e vizaton shfletuesi sipas gjuhës së vet, dhe
  një telefon me anglishten amerikane e nxjerr muajin i pari: 11 shtatori dilte „09/11" dhe lexohej
  9 nëntor. Radha nuk caktohet dot me HTML. Prandaj shkruhen vetëm shifrat, `pastroDaten` i vendos
  vijat sa shkruhen, `dataNgaNumrat` e kthen te `YYYY-MM-DD` (dhe refuzon 31 shkurtin), dhe poshtë
  fushës rri data me fjalë. Në bazë data mbetet `YYYY-MM-DD` — renditja e historikut varet nga ajo.
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
- **Kutia e emrave pranon disa njëherësh** — «alfa, beta, gama, delta». Ndarësit janë presja,
  pikëpresja dhe rreshti i ri, kurrë hapësira: emrat me dy fjalë („alfa + zeta" te fleta e vjetër)
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
- **Reja publike e PeerJS-it nuk u provua as ajo.** Egresi i makinës së provave nuk e lëshon
  `0.peerjs.com`, prandaj mënyra me kod u provua kundër një `peerjs-server` lokal. Ajo që u provua
  është tërë rruga e aplikacionit; ajo që mbetet e paprovuar është vetëm arritja te ai host.
- **Hook-et rrinë mbi kthimet e para, te `Loja` e te `Grupi`.** React-i i numëron sipas radhës: një
  `useMemo` nën `if (te_dhenat === null) return …` thirret vetëm pasi të dhënat mbërrijnë, prandaj
  vizatimi i dytë ka më shumë hook-e se i pari dhe React-i bie me gabimin **#310** — ekrani nuk
  hapet fare. Ndodhi pikërisht ashtu gjatë kësaj pune, dhe u kap nga një provë me shfletues që
  numëron fushat dhe lexon konsolën. Vlerat lexohen me `te_dhenat?.…` dhe me konstanten `BOSH`.
- **`memo` mbi tabelat punon vetëm bashkë me `useMemo` mbi hyrjet.** `Raundet`, `Shlyerja`,
  `Renditja` e `TabelaEPergjithshme` rrinë pas `memo`, dhe kjo kap diçka vetëm sepse `rreshtat`,
  `matrica`, `rendituar` e `luajtur` mbahen te një `useMemo` i vetëm, dhe `onRedakto`/`onFshi` te
  `useCallback`. Nëse dikush e kthen ndonjërën te trupi i vizatimit — një shigjetë brenda JSX-it,
  ose `rreshtat.map(...)` te vendi i hyrjes — mbështjellja bëhet peshë e kotë.
- **Numrat e matur, që të mos „optimizohet" ajo që është e shpejtë.** Mbledhja e pikëve për një
  mbrëmje me gjashtë lojtarë e njëzet raunde: **0.025 ms**. Leximi i raundeve nga IndexedDB:
  **0.7 ms**. Shkrim plus rilexim: **1.2 ms**. Ruajtja e një raundi, e matur brenda faqes nga
  shtypja e butonit deri te rreshti i re te DOM-i, me 30 raunde e 8 lojtarë: **26 ms**. Hapja e
  ekranit të lojës: **82 ms**; e ekranit të grupit me dyzet mbrëmje: **113 ms**. Një shkronjë te
  fusha: **7 ms**. Pra logjika nuk është pengesë, dhe një matje me Playwright që tregon 140 ms për
  ruajtjen mat kryesisht kostot e vetë Playwright-it — mate brenda faqes.
- **`<details>` është çelës, edhe te provat.** Një `click()` mbi titullin e panelit e mbyll atë po
  aq lehtë sa e hap, dhe atëherë etiketa e gjendjes rri te pema por e fshehur — `waitForSelector`
  pret pa fund për diçka që ekziston. Prova e mënyrës me kod e lexon `details.open` para se të
  klikojë.
