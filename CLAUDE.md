# CLAUDE.md

Udhëzime për asistentët e IA-së që punojnë në këtë depo. Lexoje para se ta prekësh kodin.

Dokumentacioni i projektit është shqip, prandaj edhe ky skedar. Struktura, komentet, commit-et
dhe teksti në ekran janë shqip — mos e ndërro gjuhën. Përjashtim bëjnë vetëm emrat e fushave të
të dhënave (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`), për arsyen te pika 8.

## Çka është kjo

**Tavolina** — një numërues pikësh që i përgjigjet një pyetjeje: *sa ka secili, dhe kush kujt sa i
del*. Zëvendëson një fletë Google Sheets-i që mbahej me dorë për lojërat e një shoqërie.

U quajt „Bridzh" derisa mbante një lojë të vetme: bridzhin kosovar, varianti i xhin-ramit që luhet
me 14 letra, hapet me 51 pikë dhe mbaron pasi secili i ka përzier letrat dy herë. Tani mban katër,
dhe emri i vjetër do të gënjente te tri prej tyre. Ai emër mbeti vetëm te një vend, dhe atje me
arsye: parathënja `bridzh-` e emrit te serveri i sinjalizimit (`kodi.ts`) është pjesë e telit e jo
fjalë që lexon njeriu — ndërrimi i saj do t'i ndante dy telefonat që nuk e kanë rifreskuar faqen
njëkohësisht.

Katër lojëra, një tavolinë:

| Loja | Raundi | Mbaron | Fiton | Shlyhet |
| --- | --- | --- | --- | --- |
| **Bridzh** | pikët, ose llogaritësi hant/normal | dy raunde për lojtar | më i vogli | po |
| **Magarec** | një prekje: kush e humbi | kur mbushet fjala „MAGAREC" | më i vogli | jo |
| **Domina** | gurët e mbetur në dorë | kur dikujt i mbushet kufiri (100 a 250) | më i vogli | po |
| **Pishpirik** | pikët e dorës (25 + 10 për pishpirik, 15 me fant) | kur dikush arrin kufirin (101, 120 a 151) | **më i madhi** | jo |

Dy të parat vijnë nga dy skedat e para të asaj flete, domina nga e treta, dhe pishpiriku nga vetë
tavolina — atë skedë fleta nuk e pati kurrë. Rregullat te
[pika 11](#11-magareci-është-lojë-e-dytë-jo-aplikacion-i-dytë) dhe
[pika 16](#16-një-lojë-e-re-hyn-te-regjistri-jo-te-ekranet); ajo që vlen këtu është se të katërta
janë e njëjta tavolinë, i njëjti grup dhe e njëjta bazë.

Tri gjëra e përcaktojnë çdo vendim këtu:

1. **Nuk ka server i yni.** IndexedDB dhe asgjë tjetër, derisa përdoruesi të kërkojë ndryshe. Loja
   luhet rreth tavolinës, jo çdo mbrëmje ka internet të mirë, dhe historiku i një shoqërie nuk ka pse
   të rrijë te dikush tjetër. Kjo do të thotë edhe se kopja rezervë nuk është shtojcë — është dalja
   e parë e të dhënave.

   Ka **katër shmangje**, dhe të katërta rrinë të rrethuara. E para: mënyra „me kod" e lidhjes së
   drejtpërdrejtë (`lidhjaMeServer.ts`) përdor një server sinjalizimi të huaj. Të dhënat e lojës nuk
   shkruhen te asnjë server edhe atëherë, dhe ekrani i thotë hapur çka del nga pajisja para se të
   shtypet butoni.

   E dyta: numërimi i hapjeve te strehuesi (pika 18). Nga pajisja del emri i rrugës — `/loja/[id]`,
   `/shiko` — dhe asgjë tjetër: as pikë, as emra, as lojëra. Adresa e vërtetë nuk del kurrë, sepse
   te rrugët e ndara ajo e mban brenda vetes tërë mbrëmjen. Fundfaqja e ekranit të parë e thotë me
   fjalë, krah numrit të versionit.

   **Ajo mënyrë tani rri e parazgjedhur, me kërkesë të pronarit të projektit**: shoqëria zakonisht
   nuk luan te i njëjti wifi, dhe mënyra pa server atëherë nuk lidhet fare. Pra rruga e parë e
   ekranit prek një server, dhe pika 1 mbetet e plotë vetëm për bazën e të dhënave e për
   fotografinë. Kjo është zgjedhje e pronarit, e jo rrjedhojë e kodit — mos e ndërro pa e pyetur.
   Kushtet që mbeten te pika 7.

   E treta: **sinkronizimi** (pika 19), me kërkesë të pronarit. Ajo është e vetmja gjë që i shkruan
   pikët dhe emrat te një bazë jashtë pajisjes — por te një bazë që e zotëron vetë përdoruesi, te
   projekti i tij Supabase, dhe vetëm pasi ta ketë lidhur me dorë. Rri e fikur derisa dikush ta
   ndezë; kushtet e plota te pika 19.

   E katërta, dhe ajo që e ndërron vetë fjalinë e parë: **serveri i sinjalizimit është i yni**
   (`api/sinjali.ts`, pika 20), **me kërkesë të shprehur të pronarit**. Deri para saj këtu rrinte
   „Server i Tavolinës nuk ka, dhe mos shto një të tillë" pa asnjë përjashtim; pronari e hoqi atë
   ndalesë për një gjë të vetme, dhe ajo gjë është e ngushtë sa vetë fjalia:

   - Nëpër të kalojnë **vetëm dy varga sinjalizimi** — ftesa dhe përgjigja, pra pikërisht ato që te
     mënyra pa server kalojnë nëpër dy kode QR. Kredenciale ICE dhe një gishtëz DTLS: emra, raunde
     dhe totale nuk hyjnë aty fare, dhe as nuk mund të hyjnë.
   - Preket **vetëm sa zgjat shtrëngimi i duarve**. Sapo kanali hapet, asnjë kërkesë nuk niset më —
     një provë me shfletues e numëron pikërisht këtë.
   - **Asgjë nuk mbahet**: vargu zhduket vetë brenda tre minutash, dhe nuk ka llogari, cookie as
     regjistër.

   Pra baza e të dhënave mbetet e paprekur nga kjo: pikët janë ende vetëm te telefoni, dhe
   **një server që i sheh të dhënat e lojës nuk guxon të shtohet ende** — as për sinkronizim, as për
   „lehtësi". Shmangja e katërt lejon një server që lidh dy telefona, e jo një që mban një mbrëmje.
   Kushtet e plota te pika 20.
2. **Përdoruesi po mban letrat me dorën tjetër.** Çdo fushë numri është së paku 2.75rem, tastiera
   del numerike, dhe blloku që përdoret dhjetëra herë në mbrëmje („Ruaj raundin") rri i pari.
   Ekrani i ngushtë vjen i pari; kompjuteri pas.
3. **Fiton totali më i vogël.** Kjo është e kundërta e asaj që pret syri te një tabelë pikësh,
   prandaj vendi i parë ngjyroset dhe legjenda e matricës e thotë me fjalë çfarë do të thotë shenja.

## Komandat

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # tsc --noEmit && vite build && vite build -c vite.punetori.config.ts
npm run preview
npm test          # node --test — 347 prova, pa framework provash
```

`npm test` para çdo commit-i. Nuk ka linter të konfiguruar.

Ndërtimi ka dy hapa e jo një: i dyti e nxjerr punëtorin e shërbimit te `dist/sw.js`, nga manifesti
që la i pari (pika 17). Njëri pa tjetrin lë ose faqe pa punëtor, ose punëtor që tregon te skedarë që
nuk ekzistojnë më — prandaj thirren gjithmonë bashkë, nga `npm run build`.

Versioni mbahet vetëm te `package.json` (`npm version patch|minor|major`). `vite.config.ts` e fut te
ndërtimi si `__VERSIONI__`, `versioni.ts` e lexon dhe fundfaqja e ekranit të parë e tregon. Kjo
ekziston sepse aplikacioni hapet nga një adresë dhe telefoni e mban në cache: pa një numër të
dukshëm, «e ke të renë apo të vjetrën?» nuk i përgjigjet dot kush. Ngrite atë numër kur del një
ndryshim që përdoruesi e sheh.

Tani ai numër mban edhe emrin e koshit të punëtorit të shërbimit (pika 17), pra një ndërtim i
ngritur nis me kosh të ri dhe e fshin të vjetrin. Një ndryshim i botuar pa e ngritur versionin i le
të dy ndërtimet te i njëjti kosh — dhe atëherë skedari i ri dhe ai i vjetri rrinë te i njëjti emër.

## Rregullat e arkitekturës

### 1. Logjika rri te module që nuk njohin as bazën, as React-in, as `window`-in

`llogaritjet.ts`, `pikezimi.ts`, `magareci.ts`, `lojerat.ts`, `parashikimi.ts`, `fundi.ts`,
`fusha.ts`, `qr.ts`, `paketa.ts`, `ndarja.ts`, `sinjalizimi.ts`, `kodi.ts`, `takimi.ts`,
`analitika.ts`, `tema.ts`, `bashkimi.ts`, `skema.ts`, `projekti.ts` dhe `identiteti.ts` importohen
drejtpërdrejt nga
`node --test`, pa bundler dhe pa DOM — prandaj `npm test` zgjat nën një sekondë dhe nuk ka çka të
prishet mes provës dhe kodit.

`lidhja.ts`, `lidhjaMeServer.ts`, `lidhjaMeTakim.ts`, `sistemi.ts`, `ruajtja.ts`, `matja.ts`,
`ndricimi.ts`, `supabase.ts`, `sinkronizimi.ts` dhe `pajisja.ts` nuk hyjnë te kjo listë me qëllim: e para njeh
`RTCPeerConnection` e `BroadcastChannel`, e dyta PeerJS-in, e treta `navigator`-in (tabelën e
fragmenteve dhe fletën e ndarjes), e katërta bazën, e pesta `document`-in dhe `window`-in, e gjashta
`localStorage`-in e `matchMedia`-n, e shtata `fetch`-in e `localStorage`-in, e teta të dyja ato
bashkë me bazën, dhe e nënta `localStorage`-in e `navigator`-in. Logjika e tyre e provueshme është
nxjerrë jashtë — te `sinjalizimi.ts`, `kodi.ts`, `kopja.ts`, `analitika.ts`, `tema.ts`,
`bashkimi.ts`, `skema.ts`, `projekti.ts` dhe `identiteti.ts` — dhe ajo që mbetet provohet me
shfletues.

Çiftet e sinkronizimit lexohen si ato që ekzistonin: `bashkimi.ts` krah `sinkronizimi.ts` si
`sherbimi.ts` krah `punetori.ts`, dhe `projekti.ts` krah `supabase.ts` si `analitika.ts` krah
`matja.ts`. Vendimi rri te i pari; kërkesa te i dyti. `takimi.ts` është i njëjti çift dy herë: krah
`lidhjaMeTakim.ts` te shfletuesi, dhe krah `api/sinjali.ts` te serveri — i njëjti kontroll alfabeti
lexohet nga të dyja anët, sepse një anë e vetme që e bën atë punë nuk është kontroll fare.

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
Prandaj asnjë emër nuk nis i shtypur, pikët nuk llogariten fare pa përgjigje (`pike` del `null`),
dhe të dy butonat e daljes rrinë të fikur derisa të zgjidhet. Mos i kthe parazgjedhje.

**Mbyllësi zgjidhet me emra të shkruar, jo me listë të shpalosur.** Ishte `<select>`: dy prekje —
hape, zgjidhe — dhe lista vizatohej nga sistemi, pra me shkronja e gjerësi që nuk i vendos faqja.
Lojtarët janë dy deri tetë dhe hyjnë të gjithë në ekran, prandaj rrinë butona me `aria-pressed`
(`.celesi--rrjet`, i njëjti çelës si te lojërat): një prekje, caku mbi 2.75rem, dhe kush mbylli
duket pa u hapur asgjë. Prekja e dytë mbi të njëjtin emër nuk e zbraz zgjedhjen — raundi nuk ruhet
dot pa mbyllës gjithsesi, prandaj zbrazja nuk hap asnjë rrugë, vetëm i fshin pikët e llogaritura.

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

**Çdo fushë pikësh ka mbledhësen e vet** (`Mbledhesja`, aritmetika te `mbledhja.ts`): një kuti me
tastierë të vetën që i mbledh letrat ose gurët një nga një — «10 + 15 + 5» — dhe «Gati» e shkruan
shumën te fusha e atij lojtari. Termat rrinë të dukshëm sa kohë kutia është hapur, sepse ata thonë
edhe cila letër u harrua; shuma vetëm veten. Tri gjëra aty nuk janë zgjedhje stili:

- **Tastiera është e vetja.** Ajo e Androidit nuk ka as «+» as «−» — e njëjta mungesë që i dha
  shenjës te fushat një buton të vetin — prandaj një mbledhje e shkruar si tekst nuk shtypej dot
  fare në telefon.
- **Është `<dialog>` i vërtetë** dhe i vetmi te ky aplikacion: fokusi mbetet brenda, «Esc» e mbyll,
  dhe ekrani kthehet ashtu si ishte. Një panel i shpalosur nën rresht do t'i shtynte gjashtë a tetë
  rreshtat e tjerë pikërisht kur syri po krahason dorën e radhës.
- **Nuk prek shenjën.** Kthen gjithmonë një numër pa shenjë; te fushat ruhet minusi që kishte
  rreshti, sepse «−» aty do të thotë mbyllje e jo dorë më e vogël.

Llogaritësi nuk ka çelës „s'hapi / hapi" — dora e thotë. Fushë e zbrazët do të thotë që lojtari
nuk hapi, prandaj merr dënimin fiks; çdo numër do të thotë që hapi, dhe ai numër është dora.
Një lojtar që ka hapur e ka mbetur me zero pikë do ta kishte mbyllur vetë raundin, prandaj zeroja
nuk humb asnjë gjendje të vërtetë. Me gjashtë lojtarë kjo e preu llogaritësin nga 1195px në 569px
dhe hoqi pesë prekje.

### 7. Rezultati shpërndahet katër rrugë, dhe vetëm njëra nuk prek asnjë server

Kush rri rreth tavolinës do t'i shohë pikët në telefonin e vet. Ka katër rrugë, dhe secila mbulon atë
që tjetra nuk mundet:

- **E drejtpërdrejtë, pa server** (`lidhja.ts`, `sinjalizimi.ts`): një kanal WebRTC mes telefonave
  të së njëjtës rrjetë, me sinjalizimin nëpër dy kode QR. Parazgjedhja, dhe e vetmja që nuk
  kontakton kurrë asnjë server.
- **E drejtpërdrejtë, me takim** (`lidhjaMeTakim.ts`, `takimi.ts`, `api/sinjali.ts`): i njëjti kanal
  WebRTC dhe i njëjti kod i vetëm, por serveri që i takon dy anët është **yni**, te e njëjta adresë
  ku rri aplikacioni. Kërkon të njëjtin wifi — `iceServers` rri i zbrazët si te mënyra pa server —
  dhe është e vetmja rrugë me një kod të vetëm që nuk i thotë asgjë asnjë të treti. Shmangja e
  katërt nga pika 1, dhe kushtet e plota te pika 20.
- **E drejtpërdrejtë, me kod** (`lidhjaMeServer.ts`, `kodi.ts`): i njëjti kanal WebRTC, por
  sinjalizimi kalon nëpër një server të huaj, prandaj mjafton një kod tetëkarakterësh. Shmangja e
  parë nga pika 1, dhe rri me kushte — më poshtë.
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

**Ikja brenda paketës prek vetëm ndarësit.** Trupi kalon nëpër base64 para se t'i afrohet adresës,
prandaj asnjë karakter nuk ka nevojë t'i ikë adresës — ikje kërkojnë vetëm `|`, `,`, `:` dhe vetë
`%`-i. Këtu rrinte `encodeURIComponent`, dhe ai u ikte të gjithave: një hapësirë bëhej `%20` dhe një
`ë` bëhej `%C3%AB`, gjashtë bajte për një shkronjë që base64-i e mban me dy. Te një grup me emra
shqip paketa binte nga 148 karaktere në 114, pra nga 57 module në 53. Leximi nuk u prek fare —
`decodeURIComponent` i kthen `%XX`-të dhe pjesën tjetër e lë ashtu — prandaj versioni nuk u ngrit
dhe të dyja anët lexohen mes vete. Mos e kthe te ikja e plotë.

**Kodi i fotografisë rri i madh, si ai i ftesës.** Ishte 9.5rem krah një kolone teksti, dhe atje
dilte 2.5 piksela për modul me gjashtë lojtarë — 2.1 me tetë emra të gjatë — pra nën kufirin ku
skanimi nga një ekran në tjetrin nis të dështojë. Tani zë rreshtin e vet dhe merr 18rem, si ftesa.
Kjo nuk është zbukurim: një kod që nuk lexohet është e njëjta gjë me një kod që nuk ekziston.

Paketa është te versioni **2**, dhe fusha e shtuar është një shkronjë: lloji i lojës — `b`, `m`,
`d`, `p`. Pa të ana që shikon nuk ka nga ta dijë se `3` do të thotë „MAG" e jo tri pikë — numri
është i njëjti bajt te të katër lojërat. Versioni 1 lexohet ende dhe lexohet bridzh: një adresë e
ndarë dje te një bisedë nuk ka pse të vdesë sot, dhe atëherë kishte vetëm bridzh gjithsesi.

**Kufiri i mbrëmjes hipën te e njëjta fushë**, si shifra pas shkronjës: `d100`, `p0`, `b`. Pa të,
rreshti «edhe 39 deri te 100» te ana që shikon do të shkruante parazgjedhjen mbi një mbrëmje të
nisur deri te 250. Një fushë e re do ta bënte paketën versioni 3, dhe atëherë çdo aplikacion i
djeshëm do t'i refuzonte edhe paketat e bridzhit; kështu `b` e `m` mbeten fjalë për fjalë ato që
ishin, dhe refuzohen vetëm dy lojërat që ai nuk i njeh gjithsesi. Shifrat lexohen me alfabet të
ngushtë si çdo fushë tjetër — një shkronjë, së shumti katër shifra — dhe mungesa e tyre do të thotë
«nuk thuhet», jo zero.

Dy shkronjat e fundit hynë pa e ngritur versionin, dhe kjo është zgjedhje: një aplikacion i vjetër
një paketë domine e refuzon fare — shkronjën nuk e njeh — dhe kjo është pikërisht ajo që duhet. Te
pishpiriku fiton totali më i madh, prandaj një lexim „si bridzh" do të shpallte fitues atë që mbeti
i fundit, në heshtje. Shkronjat rrinë te `lojerat.ts` dhe nuk riciklohen kurrë.

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

- **Serveri që bie nuk e mbaron mbrëmjen.** Kjo mënyrë varet nga priza e telefonit dhe nga një
  server që nuk është i yni, dhe të dyja bien pikërisht te tavolina — ku askush nuk shikon konsolën.
  Deri tani secila rënie e linte kodin të vdekur derisa dikush ta rihapte skedën. Katër gjëra e
  ndalojnë atë, dhe rrinë të ndara: vendimi te `kodi.ts`, kërkesa te `lidhjaMeServer.ts` (pika 1).

  - **Hapja ka afat** (`AFATI_I_HAPJES`). Një server që e pranon prizën dhe hesht nuk nxjerr asnjë
    gabim — pra pa afat, «Duke marrë kodin…» rrinte përgjithmonë. I njëjti kusht si te
    `KOHA_PARA_SINKRONIZIMIT` e `kerko` (pika 19): çdo pritje pa afat është një ekran i ngrirë.
  - **Dështimi provohet sërish, me largim** (`pritjaEProves`: nga një sekondë te gjysmë minute).
    Strehuesi provon pa fund, sepse paneli i tij rri hapur tërë mbrëmjen dhe kush e hapi do ta mbajë
    kodin të gjallë; ana që shikon provon `PROVAT_E_VIZITORIT` herë e pastaj rri te butoni — ai
    telefon zakonisht nuk është i atij që e nisi mbrëmjen, dhe provat e pafundme vetëm i pinë
    baterinë. Të dyja zgjohen te `online` dhe te kthimi i skedës në pamje: telefoni që fjeti në xhep
    e ka prizën e vdekur pa e ditur.
  - **Kodi nuk ndërrohet mes provave.** Kush e shkroi kodin në një copë letër nuk ka pse ta
    rishkruajë sepse wifi-ja pati një çast të keq. Ndërrohet vetëm kur serveri e refuzon si të zënë
    **para** se ta ketë pranuar një herë; pas asaj, i zëni jemi ne vetë — regjistrimi i vjetër që
    serveri ende nuk e ka lëshuar — dhe prova tjetër e gjen të lirë.
  - **Rilidhja e butë nuk i vret lidhjet e hapura.** `peer.destroy()` i mbyll të gjitha bashkë me
    vete, pra një vizitor që rri duke shikuar do ta humbte pamjen sa herë serveri kollitet;
    `reconnect()` i mban, dhe e mban edhe emrin. Prandaj provohet i pari, dhe e ashpra rri vetëm për
    atë peer që është shkatërruar tashmë.

  Dy kurthe rrinë të mbyllura me flamurin `#nePerpjekje` dhe me krahasimin `#lidhja !== lidhja`, dhe
  të dyja janë e njëjta gjë: rilidhja që numërohet dështim i vetvetes. `disconnect()` e nxjerr
  `disconnected` në çast e jo te radha tjetër, dhe kanali i vjetër që sapo u mbyll e nxjerr `close`
  të vetin — pa ato dy rreshta, çdo rilidhje shtonte dy dështime dhe ana që shikon dorëzohej në
  gjysmë të rrugës. Mos i hiq.

- **Emri i gabimit nuk del kurrë në ekran.** `shpjegimi()` te `kodi.ts` është vendi i vetëm ku
  `socket-closed` bëhet fjali shqip, dhe prova `asnjë gabim nuk del me emrin e tipit në ekran` e
  lexon çdo lloj kundër saj — edhe një të panjohur.

`VITE_PEER_SERVER` i ndërron serverat gjatë ndërtimit: **listë e ndarë me presje**, secili si
`[https://|http://]host[:porta][/shtegu]`, dhe prova e radhës shkon te i pari i pastaj te i dyti. E
zbrazët — dhe kështu rri te prodhimi — do të thotë reja publike. Ekziston sepse reja publike nuk
kapet nga makina e provave, dhe pa të e tërë kjo mënyrë do të shkonte e paprovuar; dhe sepse kush
nuk do t'ia besojë lidhjen një serveri të huaj mund të ngrejë të vetin — ose një rezervë, për atë
mbrëmje kur reja publike nuk përgjigjet.

**Asnjë server i dytë nuk hyn i shkruar te kodi**, dhe kjo është e njëjta gjë si `BOSH` te
`supabase.ts` (pika 19): çdo server që shtohet është një i tretë i ri që mëson kur luajmë, dhe një
«rezervë e përshtatshme» nuk do të dukej te asnjë ekran. Kush do një rezervë e shkruan vetë te
ndërtimi, dhe e di se çka shtoi. Prova `pa VITE_PEER_SERVER nuk shkruhet asnjë server` e mban këtë
të matur.

**TLS-ja nuk hamendësohet gabim.** Skema e thënë vendos vetë; pa skemë, porta e thotë — 443 dhe
vetëm ajo — dhe pa portë fare lexohet një server publik. Deri tani `secure` rrinte `false`
gjithmonë, pra `localhost:9000` i provave punonte e një server i vetin me certifikatë nuk lidhej dot
fare.

Prova me shfletues (`deshmitare/lidhja-me-kod.mjs`) ngre një `peerjs-server` lokal, kalon nëpër tërë
rrugën, dhe pastaj **e vret serverin në mes të mbrëmjes**: numrat e fundit duhet të rrinë në ekran,
kodi duhet të mbetet i njëjti kur serveri kthehet, dhe një telefon krejt i ri duhet të lidhet ende me
të. Ndërtimi i prodhimit kontrollohet se nuk mban asnjë gjurmë të adresës së provave.

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
luajt atë mbrëmje — `bridzh`, `magarec`, `domina` a `pishpirik`. Ai skedar njeh vetëm bridzhin (dhe
një skedë domine pa emër fushe), prandaj lista e emrave anglisht mbetet ajo që është dhe nuk
zgjatet.

**Kufiri i dy lojërave të fundit nuk është rregull, është marrëveshje** — dhe prandaj rri te mbrëmja
e jo te kodi (pika 13). Numrat e regjistrit janë vetëm parazgjedhja e çelësit: 100 te domina, sepse
ashtu thonë rregullat e shkruara, dhe 120 te pishpiriku, sepse ashtu thotë tavolina e pronarit.

Skeda „Domina" e fletës nuk është dëshmi e dobët: raundi i vetëm i shënuar u jep dy lojtarëve 21 e
38 dhe të tretit asgjë, pra secili shkruan sa i mbetën në dorë, dhe totalet e matrica dalin nga po
ato llogari si te bridzhi. Prova `mbrëmja e dominës te logic.json lexohet me të njëjtat llogari` e
mban këtë të matur. Ajo që fleta nuk e thotë është kufiri — njëqindshi vjen nga rregulli i lojës, jo
nga tabela — dhe rri i shkruar një herë te `KUFIRI_I_DOMINES`.

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

**Sinkronizimi nuk e shtoi të pestën.** `@supabase/supabase-js` do të bënte pikërisht atë që bën
`supabase.ts`, por është ~120 kB për katër thirrje HTTP — një hyrje me fjalëkalim, një rifreskim, një
`select` dhe një `upsert` — te një aplikacion që instalohet në telefon. E njëjta arsye si te kodi QR
i shkruar me dorë, dhe e njëjta masë: nëse ajo bibliotekë ndonjëherë duhet vërtet, duhet edhe arsyeja
pse rregulli nuk vlen më.

Rrugët janë pak; një `switch` mbi hash-in
mjafton dhe butoni «prapa» i telefonit punon vetvetiu. Gjendja lexohet nga baza pas çdo shkrimi —
baza është lokale, një lexim i tërë është disa milisekonda, dhe një cache që del jashtë sinkronie
do të ishte rrezik pa përfitim.

Mos shto framework, mos shto bibliotekë komponentësh, mos shto bibliotekë grafikësh.

Edhe punëtori i shërbimit hyn te kjo listë: është shkruar me dorë (pika 17), pa `workbox` e pa
`vite-plugin-pwa`. Ato sjellin një gjenerues strategjish për një skedar që ka tri ngjarje dhe
gjashtëdhjetë rreshta — dhe do ta zhvendosnin vendimin «çka ruhet» te një konfigurim që nuk lexohet
si kod.

Për zhvillim përdoren dëshmitarë që **nuk hyjnë te aplikacioni** dhe nuk rrinë te `package.json`:
`segno`, `zxing-cpp` e `pillow` për koduesin QR, dhe `npx peer` (`peerjs-server`) si server
sinjalizimi lokal gjatë provave të mënyrës me kod.

Te kjo listë hyn edhe Chromium-i pa kokë me të cilin janë nxjerrë `public/ikona-180.png` dhe
`ikona-512.png`: janë e njëjta `ikona.svg`, e vizatuar një herë me qoshet katrore (iOS-i dhe maskat
e Androidit e vënë vetë rrumbullakimin). Vizatimi mbetet një i vetëm — nëse preket SVG-ja, të dyja
nxirren sërish, e nuk redaktohen me dorë. Mos i shto te varësitë — `peer` sjell me vete
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
  Një prekje e gabuar rregullohet duke e rihapur mbrëmjen (pika 15).
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
vendi i vetëm ku bëhet ai lexim (pika 16). Një vlerë e panjohur te një kopje rezervë refuzohet e nuk lexohet
bridzh: do të vinte nga një version më i ri, dhe shkronjat e tij do të dilnin pikë pa e thënë kush.

### 12. Parashikimi mat kufij të arritshëm, jo gjasa

Pas renditjes vjen gjithmonë e njëjta pyetje rreth tavolinës: *a e arrin dot i dyti të parin nëse
luajmë edhe një raund?* `parashikimi.ts` i përgjigjet asaj, dhe ajo që e bën të përgjigjshme është
se dy nga katër lojërat veçojnë saktësisht një lojtar për raund — mbyllësin te bridzhi, humbësin te
magareci. Prandaj kufijtë e një raundi janë numra, e jo hamendje: −40 poshtë dhe +200 lart te
bridzhi (pra 240 pikë diferencë për raund), një shkronjë te magareci.

**Domina dhe pishpiriku nuk parashikohen fare, dhe blloku hiqet nga ekrani.** Atje një dorë u jep
pikë disave njëherësh, dhe sa — atë nuk e thotë rregulli: gurët e mbetur në dorë janë nga zero deri
diku, dhe pishpirikët e një dore nuk kanë numër të caktuar. Një tabelë «vendi më i mirë» mbi ta do
të ishte e mbushur me numra që duken të matur e nuk janë. `rregullat().parashikimi` e mban këtë
dallim, dhe `raundetEMbetura` kthen zero atje — pra edhe titulli «edhe N raunde» nuk shkruhet dot
gabim. Mos i „plotëso" me kufij të zgjedhur me dorë.

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

**Horizonti nuk hamendësohet.** Të dyja lojërat që parashikohen e kanë fundin e vet, prandaj «sa ka
mbetur» është numër që del nga vetë loja, dhe `raundetEMbetura` është vendi i vetëm ku bëhet ai
dallim: te bridzhi dy raunde për lojtar minus ato të luajtura (pika 13), te magareci sa mund të luhen
më së shumti para se të mbushet fjala (`raundetMeTeShumta`), dhe te dy të tjerat zero — «nuk
parashikohet». E dyta është kufi i sipërm e jo numër i saktë — fjala mund të mbushet shumë më herët —
prandaj ekrani e shkruan «së shumti» krah numrit. Mos e zëvendëso asnjërin me një numër të zgjedhur
me dorë.

Ekrani ka dy çelësa e jo pesë, sepse vetëm dy pyetje bëhen vërtet: *sikur të luajmë edhe një raund*,
dhe *deri në fund*. Me një raund të mbetur të dyja janë e njëjta gjë, dhe çelësi zhduket.

Provat nuk maten kundër `logic.json`-it me numra të gatshëm: ai skedar nuk ka kolonë «vendi më i
mirë», sepse ajo pyetje nuk i bëhej dot një flete. Maten totalet e tij të vërteta kundër ligjeve që
një parashikim nuk i thyen dot — vendi i tanishëm rri brenda intervalit, më shumë raunde nuk e
ngushtojnë atë, dhe numri i raundeve që premton e mban premtimin me saktësisht një raund më pak.
Për magarecin të njëjtat mbrëmje lexohen sërish si shkronja — raundin e humb ai që mori më shumë
pikë — sepse pikët me qindra nuk hyjnë te një llogari ku totali shkon nga zero në shtatë.

### 13. Përzierja vlen te të gjitha lojërat; dy rrotullimet vetëm te bridzhi

Dy rregulla që preken, por nuk janë një — dhe ngatërrimi i tyre është gabimi i lehtë këtu:

- **Përzierja** kalon një vend çdo raund te **të katërta** lojërat. Edhe magareci e pishpiriku luhen
  me letra te e njëjta tavolinë, dhe edhe gurët e dominës i përzien dikush — prandaj kush e bën
  ndërrohet çdo raund, kudo.
- **Gjatësia** është vetëm e **bridzhit**: dy raunde për lojtar, pra tavolina rrotullohet saktësisht
  dy herë dhe aty mbaron mbrëmja. **Tri lojërat e tjera nuk e njohin atë kufi fare** — atje mbrëmja
  mbaron kur dikush e arrin kufirin e vet të totalit: fjala te magareci (pika 11), njëqind pikët te
  domina, 101-shi te pishpiriku. Mos u vër atyre një fund të numëruar me raunde.

  Të tri kufijtë janë i njëjti rregull parë nga ana e numrit, prandaj `mbaroiSipasRregullit` i pyet
  të njëjtat dy gjëra: a numërohet mbrëmja me raunde (`raundePerLojtar`), dhe nëse jo, a e ka arritur
  ndonjë total kufirin (`arritiKufirin`). Ajo që ndryshon është kuptimi — te magareci e te domina ai
  që e arriti humbi, te pishpiriku fitoi — dhe atë e thotë ekrani, jo ajo llogari.

**Kufiri i dominës dhe i pishpirikut zgjidhet për çdo mbrëmje.** Deri ku luhet nuk e thotë loja, e
thotë tavolina para se të ndahen letrat: domina deri te 100 a 250, pishpiriku deri te 101, 120 a 151,
ose pa kufi fare — luajmë sa të luajmë. Prandaj numri rri te `Loja.kufiri` e jo te regjistri, dhe
`kufiriILojes()` te `fundi.ts` është vendi i vetëm ku zgjidhet cili vlen:

  - **mungon** → parazgjedhja e lojës. Kështu lexohen të gjitha mbrëmjet e shkruara para se fusha të
    ekzistonte, dhe ato nuk ndërrojnë kuptim.
  - **numër** → pikërisht ai kufi.
  - **`0`** → pa kufi; mbrëmja mbaron vetëm me dorë (pika 15). Lexohet me `??` e jo me `||`, si
    `mbyllur` dhe për të njëjtën arsye: me `||` zeroja do të lexohej mungesë, dhe mbrëmja do të
    mbyllej vetvetiu pikërisht te kufiri që u nis për të mos e pasur.

Kufiri ndërrohet edhe mes mbrëmjes, nga një `<details>` te ekrani i lojës. Pa atë, një numër i
zgjedhur gabim te nisja do ta mbyllte fletën në mes të lojës, dhe rruga e vetme prapa do të ishte
rihapja pas çdo raundi. Magareci e bridzhi nuk e kanë atë çelës fare: i pari mbaron me raundet, dhe
te i dyti kufiri është vetë fjala — «deri te pesë shkronja» do të ishte lojë tjetër.

**Numrat e kufirit nuk shkruhen te teksti i rregullit.** `rregulli` e `shenimi` te regjistri e thonë
si shënohet raundi dhe kush fiton, kurrë deri ku luhet: ai numër ndryshon për çdo mbrëmje, dhe një i
ngrirë atje do të thoshte «mbaron te 100» mbi një fletë të nisur deri te 250 — pra do të gënjente
pikërisht atë që sapo e zgjodhi vetë.

`perziersiIRaundit` nuk mban gjendje: raundi i parë i takon të parit të `selectedPlayers`, i dyti të
dytit, dhe pas të fundit nis prapë nga kreu. Kjo punon vetëm sepse radha e emrave ruhet që nga
futja — kutia e emrave e thotë («Radha ruhet — kështu ulen rreth tavolinës»), dhe fleta e vjetër i
mbante ashtu për të njëjtën arsye.

`raundetELojes` (`lojtarë × 2`) është rregulli i dytë, dhe del vetëm te bridzhi. Kush e thërret e
ndan llojin para se ta bëjë, dhe pyetja është gjithmonë e njëjta — `rregullat(lloji).raundePerLojtar`:
`Loja` e `PermbledhjaEPamjes` e lexojnë për të vendosur nëse shkruhet «4 nga 8 raunde» apo vetëm
«4 raunde», dhe `raundetEMbetura` te `parashikimi.ts` me një kthim të hershëm. Mos e thirr nga një
ekran që u shërben të katërta lojërave pa e ndarë llojin — provat `kufiri i bridzhit nuk e mbyll një
mbrëmje magareci` dhe `kufiri i bridzhit nuk e mbyll një mbrëmje domine` e mbajnë këtë të matur.

**Rregulli nuk u shpik — fleta e dëshmon.** Çdo mbrëmje bridzhi te `logic.json` ka saktësisht dy
raunde për lojtar, dhe prova `çdo mbrëmje bridzhi e logic.json-it ka saktësisht dy raunde për
lojtar` e mban këtë të matur. Dy grupe rrinë jashtë saj, dhe asnjëri nuk e kundërshton:
`brigj_4_merged_teams` i ka kolonat çifte („alfa + zeta"), pra tetë raunde nga katër veta — që e
përforcon rregullin — dhe `domina_1` nuk është bridzh fare.

Asnjëri nga të dy numrat nuk ruhet, si asnjë vlerë e derivuar (pika 2): dalin nga lista e lojtarëve
sa herë lexohen. Prandaj shtimi ose heqja e dikujt mes lojës (pika 5) e rirendit përzierjen mbi listën
e tanishme, dhe te bridzhi e zgjat ose e shkurton mbrëmjen vetvetiu. Kjo është e vërteta e tavolinës: kush u
ngrit nuk përzien më, dhe letrat nuk e presin.

**Fundi mbyll futjen te të katërta lojërat, dhe vizatohet një herë.** `mbaroiSipasRregullit` te
`fundi.ts` e bën atë dallim një herë të vetme — dy raundet për lojtar te bridzhi, kufiri i totalit te
tri të tjerat — dhe nga aty poshtë ekrani pyet vetëm «a mbaroi». Butonat nuk rrinë të fikur, hiqen: një
raund i shënuar pas fundit do ta bënte fletën të gënjejë.

Kufiri i bridzhit nuk ngec dot mbi një raund të vërtetë, dhe kjo varet nga pika 5: hiqet vetëm ai që
s'ka shënuar ende, prandaj lista nuk shkurtohet dot nën raundet që janë luajtur tashmë. Dy rrugë
mbeten të hapura, dhe të dyja janë të vërteta të tavolinës: raundi i shënuar gabim rregullohet nga
lista poshtë, dhe kush u ul vonë shtohet te lojtarët — atëherë mbrëmja zgjatet me dy raunde
vetvetiu. Mos e mbyll njërën prej tyre; të dyja kalojnë nëpër rihapjen e pikës 15.

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

Prandaj `fituesit()` te `llogaritjet.ts` kthen **të gjithë** ata që e ndajnë totalin fitues, dhe
çdo vend që shpall një fitues merret prej andej e jo prej `rreshtat[0]`: shenja e fundit te `Loja`,
kreu i `PermbledhjaEPamjes`, dhe kurora te `Renditja`. Vendet mbeten ashtu si ishin; ndryshon vetëm
ajo që thuhet me fjalë a me ikonë.

„Totali fitues" do të thotë më i vogli te tri lojërat, dhe më i madhi te pishpiriku. Drejtimi i
jepet — `fituesit(rreshtat, drejtimi)` — e nuk merret me mend brenda: i njëjti funksion thirret edhe
mbi një paketë të ardhur nga jashtë, ku lloji rri fushë më vete, dhe një lexim i dytë i tij aty do
të dilte jashtë sinkronie me regjistrin (pika 16). Provat `barazimi te kreu nuk ndahet sipas radhës së listës` dhe
`fituesi i çdo mbrëmjeje të logic.json-it është ai me totalin më të vogël` e mbajnë këtë të matur.

### 15. Mbrëmja e kryer lexohet, nuk shënohet

Kur mbrëmja mbaron, pyetja rreth tavolinës ndërron: nuk është më «sa mora këtë raund», por «kush
fitoi, dhe kush kujt sa i del». Pikërisht pyetja e atij që sapo skanoi kodin QR — prandaj ekrani i
lojës së kryer është **i njëjti vizatim** me atë të `#/shiko/`: `PamjaERezultatit`, me përmbledhjen
sipër, renditjen, rreshtin e vetes dhe matricën. Nuk është kursim kodi; është e njëjta pyetje.

Nga ajo pamje hiqen futja, redaktimi dhe fshirja. Raundet mbeten poshtë te një `<details>` si dëshmi
e mbrëmjes, pa kolonën e veprimeve — `onRedakto`/`onFshi` nuk jepen fare, dhe kolona zhduket e nuk
rri e fikur: një buton i fikur thotë «provo prapë», dhe atje nuk ka çka provohet.

Fundi ka dy burime, dhe `fundi.ts` është vendi i vetëm ku ndahen:

- **`mbaroiSipasRregullit`** — fjala e mbushur te magareci, dy raundet për lojtar te bridzhi
  (pika 13). Kjo mbyll futjen e raundit.
- **`perfundoiMbremja`** — a është e kryer fleta. Rregulli e vendos vetë, por `loja.mbyllur` e
  mbivendos.

**`mbyllur` ka tri gjendje, dhe kjo nuk është luks.** Mungon → vendos rregulli. `true` → e mbyllur me
dorë, edhe pse rregulli nuk e mbaroi: shoqëria u ngrit herët dhe fleta mbyllet aty ku është. `false`
→ **e rihapur me dorë**, dhe pa këtë gjendje të tretë një raund i shënuar gabim te një mbrëmje që
rregulli e mbaroi nuk do të rregullohej dot kurrë — fshirja e fushës do të thoshte «vendos rregulli»,
dhe rregulli do ta mbyllte sërish në çast. Prandaj lexohet me `??` e jo me `||`, edhe te `kopja.ts`.

**Rihapja rri gjithmonë një prekje larg.** Mbyllja nuk fshin asgjë dhe nuk është e pakthyeshme; kjo
është kushti nën të cilin një ekran pa redaktim qëndron fare.

**Fjalia e fundit i ndan rastet, sepse janë të vërteta të ndryshme** (`ShenjaEFundit` te `Loja`):
magareci i mbushur, magareci i mbyllur pa u mbushur, mbrëmja e mbaruar sipas rregullit, dhe ajo e
mbyllur herët. Te e mbaruara sipas rregullit fjalia e thotë edhe **si** mbaroi, dhe ajo ndryshon me
lojën: «8 raunde, 2 për lojtar» te bridzhi, «delta i mbushi 100 pikët» te domina — emri i atij që e
mbylli mbrëmjen, pa të cilin «fitoi» mbetet pa shkak — dhe «i pari te 101» te pishpiriku, ku
pikërisht ai që e arriti kufirin është fituesi.

Te mbyllja e hershme shkruhet **«prin»** e jo «fitoi» — raundet që kishin mbetur do ta ndërronin atë
radhë, dhe fleta nuk guxon ta shpallë të përfunduar një gjë që u ndërpre. Nga e njëjta arsye
`perfundoi` i heq nga përmbledhja dy faktet që shikojnë përpara: sa raunde kanë mbetur, dhe kush
përzien atë që vjen.

E njëjta fjali vizatohet edhe brenda kartelës kur rregulli e mbaron mbrëmjen por fleta është rihapur
me dorë, dhe merret nga i njëjti komponent: dy kopje të saj do të dilnin jashtë sinkronie pikërisht
atje ku njëra shpall fitues e tjetra jo.

**Paketa nuk e mori këtë fushë**, dhe nuk ka pse ta marrë: kur mbrëmja mbaron sipas rregullit, ana
që shikon e nxjerr vetë nga totalet e numri i raundeve (pika 2). Jashtë mbetet vetëm mbyllja e
hershme me dorë, dhe ajo nuk vlen sa një fushë e re te një kod QR (pika 7).

### 16. Një lojë e re hyn te regjistri, jo te ekranet

`lojerat.ts` mban gjithçka që e ndan një lojë nga tjetra, dhe asgjë tjetër: emrin, shkronjën e
paketës, drejtimin e fitores, njësinë, gjatësinë, kufirin e totalit, tri po-a-jo — llogaritës,
shlyerje, parashikim — dhe tri tekste: `rregulli` (një fjali te çelësi), `shenimi` (një rresht nën
fushat e raundit) e `hollesite` (rregullat e plota te paneli i mbledhur). Katër rreshta të dhënash,
dhe tre funksione mbi ta.

Ekziston sepse numri i vendeve që duhet ta dinin lojën nuk rritet me një kur shtohet një lojë — rritet
me dhjetë. Me dy lojëra një `lloji === 'magarec'` i shpërndarë nëpër ekrane ishte i durueshëm; me
katër, i njëjti `if` do të kërkohej te renditja, te kurora, te fjalia e fundit, te futja e raundit,
te tabela e grupit, te teksti i ndarjes, te përmbledhja e pamjes dhe te dy blloqet e parashikimit —
dhe ai që harrohet nuk duket si gabim, duket si numër.

Prandaj ekranet pyesin **çka thotë rregulli**, e jo **cila lojë është**:

- `rregullat(lloji).drejtimi` → `renditja` dhe `fituesit`. Parazgjedhja e të dyve mbetet `poshte`,
  sepse tri lojëra nga katër fitohen ashtu dhe kështu e numëron edhe fleta origjinale.
- `rregullat(lloji).raundePerLojtar` → a shkruhet «4 nga 8 raunde» apo «4 raunde» (pika 13).
- `rregullat(lloji).kufiriITotalit` → parazgjedhja e kufirit, dhe `kufijteEMundshem` ata që i ofron
  çelësi. Cili vlen për një mbrëmje të caktuar e thotë `kufiriILojes()` (pika 13), e jo regjistri.
- `rregullat(lloji).llogaritesi`, `.shlyerja`, `.parashikimi` → a vizatohen ato tri blloqe.

Tri gjëra nuk guxojnë të ndryshojnë:

- **Shkronja e paketës nuk riciklohet kurrë.** Ajo shkruhet brenda një adrese që rri te një bisedë
  për muaj me radhë (pika 7). Prova `çdo lojë e regjistrit ka shkronjën e vet` e mban të matur.
- **`llojiILojes()` mbetet leximi i vetëm i fushës.** Mungesa lexohet bridzh — lojërat e shkruara
  para magarecit nuk e kanë fushën — kurse një vlerë e panjohur te një **kopje rezervë** refuzohet e
  tëra (`kopja.ts`): ajo do të vinte nga një version më i ri, dhe pikët e një loje të panjohur do
  të dilnin pikë bridzhi, me fituesin e gabuar te ajo ku fiton më i madhi.
- **Tabela e grupit ndahet sipas lojës.** Pikët e bridzhit e ato të dominës mblidhen njësoj si
  numra, por nuk janë e njëjta gjë, dhe ato të pishpirikut fitohen nga ana tjetër — një mesatare mbi
  të gjitha do të ishte numër që nuk i përgjigjet asnjë pyetjeje. `Grupi` e thërret
  `tabelaEPergjithshme` një herë për lojë, me drejtimin e saj; magareci e ka tabelën e vet që më
  parë (pika 11). Tabela pa rreshta nuk vizatohet, prandaj një grup që luan vetëm bridzh nuk e sheh
  kurrë fjalën „pishpirik".

**Rregullat e plota rrinë te regjistri, e vizatohen një herë.** `hollesite` është një varg fjalish
për lojë, dhe `RregullatELojes` i nxjerr te një `<details>` i mbledhur — te ekrani ku zgjidhet çka
luhet, dhe te ai i lojës. Deri tani ato rrinin vetëm te README-ja, pra jashtë telefonit që i mban
pikët: te tavolina pyetja «a vlen fanti dhjetë a pesëmbëdhjetë?» vjen pikërisht kur askush nuk e hap
GitHub-un. Tri kushte i mbajnë të ndershme, dhe provat i masin:

- **Numrat e kufirit nuk hyjnë atje** (pika 13). Ata i zgjedh tavolina për çdo mbrëmje, dhe një numër
  i ngrirë te teksti do të gënjente pikërisht atë që sapo e zgjodhi vetë. Prova `kufiri i mbrëmjes nuk
  shkruhet te teksti i rregullave` e lexon çdo tekst të regjistrit kundër `kufijteEMundshem` të asaj
  loje. Numrat e rregullit — 51-shi i hapjes, 25-a e dorës, 10-a e pishpirikut — mbeten, sepse ata
  nuk ndryshojnë nga mbrëmja në mbrëmje.
- **Numrat e shkruar vijnë nga konstantet**, jo nga dora: `${DORA_E_PISHPIRIKUT}` e `${FJALA.length}`
  te teksti, që një ndërrim i tyre të mos lërë prapa një fjali që mëson gabim një tavolinë të tërë.
- **Paneli rri i mbledhur, dhe jashtë bllokut të futjes** (pika 6). Ai bllok përdoret dhjetëra herë
  në mbrëmje; kjo pyetje bëhet një herë, nëse bëhet.

Tani të katërta lojërat e kanë edhe `shenimi`-n: bridzhi e mori të fundit, sepse llogaritësi i tij i
thotë numrat vetë (pika 3) — por vetëm kur është hapur, dhe raundi që shkruhet me dorë është
pikërisht ai që rregulli nuk e mbulon.

**Ajo që regjistri nuk e mban është vetë loja.** Pishpiriku ka njëzet e pesë pikë për dorë, dhjetë për
çdo pishpirik dhe pesëmbëdhjetë kur ai bëhet me fant; domina i numëron gurët e mbetur në dorë. Asnjëra nuk hyri te kodi si formulë, dhe
asnjëra nuk ka llogaritës: numri numërohet te tavolina, ku janë letrat dhe gurët, dhe aplikacioni nuk
i njeh as të parat as të dytët. Ajo që ka bridzhi — `pikezimi.ts` — e ka sepse aty shumëzohet e
mblidhet me kokë në orën dy të natës, jo sepse aplikacioni i njeh letrat. Kufijtë e pikëve (100, 101)
janë e vetmja gjë e rregullave të tyre që shkruhet, dhe rrinë konstante me emër te `lojerat.ts`:
nëse shoqëria luan deri te 150, ndërrohet një numër i vetëm.

### 17. Faqja hapet pa internet, dhe versioni i ri pret të pyetet

Të dhënat rrinë te telefoni që nga dita e parë (pika 1), pra pikët ishin gjithmonë aty pa rrjetë.
Ajo që mungonte ishte vetë faqja: hapja e saj varej nga cache-i i zakonshëm i shfletuesit, i cili e
mban një kopje kur do dhe e heq kur do. Punëtori i shërbimit e bën atë premtim të matshëm — skedarët
e ndërtimit ruhen me instalimin, dhe pastaj faqja hapet e plotë në «mënyrë avioni».

Tri skedarë, dhe secili me një punë:

- **`sherbimi.ts`** — vendimet, dhe asgjë tjetër: emri i koshit, koshët e vjetër që fshihen, lista e
  asaj që ruhet, dhe çka bëhet me një kërkesë. Nuk njeh as `self`, as `caches` — prandaj provohet me
  `node --test` si çdo modul tjetër logjike (pika 1).
- **`punetori.ts`** — lidhja me shfletuesin: tri ngjarje dhe asnjë vendim. Ndërtohet veç, me
  `vite.punetori.config.ts`, sepse duhet të dalë `/sw.js` te rrënja: ai vend e ai emër e vendosin
  fushën e punëtorit, dhe një emër i hashuar te `/assets/` do ta ngushtonte atë te ajo dosje.
- **`instalimi.ts`** — regjistrimi, dhe njoftimi kur del një version i ri.

**Lista e asaj që ruhet nuk shkruhet me dorë.** Emrat janë të hashuar, prandaj një listë e shkruar
vjetërohet te ndërtimi i parë që ndërron një hash — pra menjëherë, dhe pa u vënë re. Ndërtimi i parë
lë manifestin e vet, i dyti e lexon, dhe `precachja()` ndjek prej tij vetëm importet **statike** të
hyrjes.

**Copa e `peerjs`-it mbetet jashtë asaj liste, dhe kjo nuk është kursim bajtesh.** Ajo varësi
qëndron nën kushtin që ngarkohet vetëm kur përdoruesi e nis mënyrën me kod (pika 7 e pika 10); një
punëtor që e shkarkon me instalimin do ta thyente atë kusht pikërisht atje ku nuk duket — te rrjeti,
e jo te ekrani. Kush e prek atë mënyrë e merr copën nga rrjeti herën e parë, dhe atëherë ajo ruhet
vetvetiu. Prova `copa e peerjs-it nuk hyn te lista e instalimit` e mban këtë të matur.

**Koshi i pari, e rrjeti i dyti** — për skedarët e faqes. Emrat janë të hashuar, prandaj një skedar
i ruajtur nuk vjetërohet dot, dhe hapja nuk pret asnjë rrjetë. Kjo është e rëndësishme pikërisht te
rrjeta e ngadaltë e një kafeneje, e cila është më e keqe se mungesa: mungesa dështon menjëherë,
ngadalësia rri.

**Çdo navigim kthen rrënjën.** Rrugët janë me hash (`#/loja/3`), prandaj çdo navigim është i njëjti
dokument. Ruhet `/` e jo `/index.html`: disa strehues e kthejnë të dytën me një ridrejtim, dhe një
përgjigje e ridrejtuar nuk hyn dot te koshi — instalimi do të dështonte i tëri, pra pa kosh e pa
asgjë offline.

**Kërkesat jashtë origjinës nuk preken fare.** Serveri i sinjalizimit i PeerJS-it, relenjat TURN dhe
projekti Supabase i përdoruesit janë shmangje e pikës 1, dhe rrinë të rrethuara; një punëtor që i
lexon a i ruan do ta zgjeronte atë shmangje pa e thënë kush.

**As `/api/` nuk preket**, edhe pse rri te e njëjta origjinë. Atje rri serveri ynë i sinjalizimit
(pika 20), dhe një ftesë e ruajtur do të kthehej pasi vargu i saj të kishte vdekur — pra lidhja do të
dështonte pa asnjë shpjegim. Më keq: dy vizitorë do të merrnin nga koshi të njëjtën ftesë, dhe
pikërisht ajo përplasje është ajo që pika 20 e mbyll me zënien atomike. Te sinkronizimi kjo është edhe e vetmja gjë e
saktë: një përgjigje e ruajtur e një `select`-i do të kthente mbrëmjen e djeshme si të sotmen, dhe
një `POST` i ruajtur nuk do të thoshte asgjë. E njëjta gjë për çdo metodë përveç `GET`, dhe për
`/_vercel/` — ai shteg rri te e njëjta origjinë, por është i strehuesit e jo i faqes (pika 18).

**Versioni i ri nuk merr pushtetin pa u pyetur.** Një punëtor që kalon vetvetiu do t'i ndërronte
skedarët nën këmbët e një skede të hapur: kodi i vjetër në ekran, ai i riu te rrjeti, dhe një copë e
ngarkuar vonë që nuk përputhet me asnjërin. Prandaj i riu pret, dhe fundfaqja e ekranit të parë e
thotë me fjalë — atje ku rri numri i versionit gjithsesi, sepse tani ai numër është e vetmja gjë që
e dallon një kosh nga tjetri. Prekja e butonit i dërgon punëtorit mesazhin, dhe faqja ringarkohet
sapo ai ta marrë pushtetin. **Mos e shto `skipWaiting()` te instalimi.**

**Emri i koshit e mban versionin**, prandaj ndërtimi i ri nis me kosh krejt të ri dhe i vjetri
fshihet i tëri kur punëtori i ri merr pushtetin. Fshihen vetëm koshët me parathënjen tonë: te e njëjta
origjinë mund të rrijë edhe koshi i dikujt tjetër, dhe ai nuk është i yni për ta hequr.

**Gjatë zhvillimit punëtori nuk regjistrohet fare** (`import.meta.env.PROD`). Përndryshe do t'i
shërbente skedarët e ruajtur mbi ata që Vite-ja i ndërron gjatë shkrimit — dhe ndryshimi do të dukej
herë pas here, që është më keq se të mos dukej fare.

**Ikonat e instalimit nuk hyjnë te koshi.** Ato i lexon sistemi kur shtohet aplikacioni te ekrani
kryesor, e jo faqja gjatë punës — një kosh që i mban do të shtonte tetëdhjetë kilobajtë që nuk i
kërkon kush gjatë mbrëmjes.

**Edhe ana që vetëm shikon e merr punëtorin**, dhe kjo nuk e prek pikën 7: ai ruan vetëm skedarët e
aplikacionit, kurrë të dhëna loje, dhe rrugët e ndarjes mbeten pa bazë fare. Përfitimi është i asaj
ane: fotografia e rezultatit e hapur një herë hapet prapë edhe kur telefonit i bie wifi-ja në mes të
mbrëmjes.

### 18. Matja numëron hapje, jo njerëz — dhe adresa nuk del kurrë e plotë

Numërimi i hapjeve rri te Vercel Web Analytics, dhe hyri **me kërkesë të pronarit**: një aplikacion
që hapet nga një adresë nuk ka nga ta dijë a e përdor kush, dhe pa atë numër çdo vendim për të
(«a ia vlen kjo pamje?», «a e hap kush fotografinë e ndarë?») merret me sy mbyllur.

Është shmangja e dytë nga pika 1, dhe pranohet vetëm nën këto kushte:

- **Adresa e vërtetë nuk del kurrë.** Kjo është e tëra. Rrugët janë me hash, dhe brenda hash-it rri
  gjithçka që nuk guxon të dalë: `#/shiko/<paketë>` e mban mbrëmjen e plotë — emrat, raundet,
  totalet — dhe `#/bashkohu/<kod>` mban kodin me të cilin kushdo do të lidhej te pikët e
  drejtpërdrejta. Prandaj `beforeSend` e zëvendëson adresën e çdo ngjarjeje me atë që kthen
  `analitika.ts`: origjina, plus emri i rrugës nga një listë e shkruar aty. Numri i grupit a i lojës
  bëhet `[id]`, paketa dhe kodi hiqen fare, dhe ajo që nuk njihet lexohet `/`. **Një rrugë e re nuk
  rrjedh vetvetiu** — nëse nuk shtohet te ai skedar, ajo numërohet si ekrani i parë.
- **Logjika rri te një modul që nuk njeh `window`-in** (pika 1). `analitika.ts` është varg brenda,
  varg jashtë, dhe provohet me `node --test` mbi paketa të vërteta: prova `paketa dhe kodi nuk dalin
  nga pajisja` është ajo që e mban kushtin e mësipërm të matur. Lidhja me shfletuesin — skripti,
  radha, ndërrimi i rrugës — rri te `matja.ts`, si `instalimi.ts` krah `sherbimi.ts`.
- **Pa varësi të pestë** (pika 10). `@vercel/analytics` bën pikërisht aq sa rri te `matja.ts`: një
  `<script>` te koka dhe një radhë thirrjesh te `window.va`. Kontrata (emrat `data-*`, forma e
  `beforeSend` e e `pageview`) është ajo e versionit 2.0.1 të asaj pakete, dhe prandaj shkruhet
  ashtu si e shkruan ajo. Nëse ndërron ajo kontratë, ndërron ky skedar — jo lista e varësive.
- **Skripti vjen nga vetë origjina**, `/_vercel/insights/script.js`; te Vercel-i atë shteg e shërben
  i njëjti domen. Asnjë host i huaj nuk kërkohet me hapjen e faqes — as këtu, as te fonti (sistemi
  vizual).
- **Vetëm te prodhimi.** Gjatë zhvillimit ai shteg nuk ekziston, dhe çdo rifreskim do të numërohej
  si hapje e dikujt.
- **Ekrani e thotë.** Fundfaqja, krah versionit: «Numërohen vetëm hapjet e faqes — pa pikë, pa emra,
  pa lojëra». Kushti është i njëjti si te mënyra me kod (pika 7): çka del nga pajisja thuhet atje ku
  lexohet, e jo te një ekran „rreth" që nuk e hap kush.

**Hapja e parë numërohet nga vetë skripti; ndërrimi i rrugës me dorë.** Skripti i ndjek ndërrimet e
`history`-së, kurse një `#/loja/3` nuk kalon as nga `pushState` as nga `popstate` — prandaj
`hashchange` dërgon një `pageview` me emrin e pastruar. Ndarja është me qëllim: po qe se ajo thirrje
ndërron formë te një version i ardhshëm, humbin rrugët e brendshme e jo vetë hapjet.

**Punëtori i shërbimit nuk e prek `/_vercel/` fare** (pika 17). Emri i skriptit nuk është i hashuar,
prandaj një kopje e ruajtur do të mbetej e ngrirë derisa të ngrihej versioni; dhe një përgjigje e
ruajtur e vetë numërimit do ta vriste numërimin në heshtje — kërkesa e dytë do ta merrte të parën
nga koshi e nuk do të dilte kurrë nga pajisja. Prova `shtegu i matjes nuk preket fare` e mban të
matur.

**Rruga `#/sinkronizimi` del me emrin e vet të plotë**, dhe kjo nuk e prek kushtin e parë: ajo nuk
mban asgjë brenda hash-it. Adresa e projektit, çelësi publik dhe email-i rrinë te `localStorage` e
nuk kalojnë kurrë nga shiriti (pika 19), prandaj s'ka çka të pastrohet prej saj. Rri e shkruar te
`TE_THJESHTA`, dhe prova `ekrani i sinkronizimit numërohet me emrin e vet` e mban të matur.

**Rrugët e ndara numërohen, por asgjë prej tyre nuk lexohet.** Kush skanon një kod QR e hap faqen te
telefoni i vet, dhe ajo hapje del si `/shiko` a `/bashkohu` — pa bazë, pa cookie, pa asgjë të
mbajtur mend (pika 7 mbetet fjalë për fjalë e vërtetë: ato rrugë nuk shkruajnë kurrkund). Nëse
ndonjëherë duket tepër, hiqet me një rresht: `/shiko` e tre të tjerat dalin nga lista te
`analitika.ts`.

**Ndërtimi te Vercel-i kërkon `@types/node`.** `tsc --noEmit` i lexon edhe dy konfigurimet e Vite-s,
dhe `vite.punetori.config.ts` importon `node:fs`. Ai paket vinte deri para pak si varësi e
zgjedhshme e Vite-s — lokalisht ishte aty, te strehuesi jo — dhe ndërtimi binte me
`TS2307: Cannot find module 'node:fs'`. Tani rri i shkruar te `devDependencies`. Mos e hiq: një
varësi tipesh e ardhur vetvetiu nuk është premtim.

### 19. Sinkronizimi është projekti i përdoruesit, jo yni

Deri tani përgjigjja e pyetjes «po nëse ndërroj telefonin?» ishte një skedar JSON që e nxjerr dhe e
kthen me dorë (pika 1). Ajo mbetet, dhe mbetet e para — por nuk i përgjigjet pyetjes së dytë: *pikët
i shënoi tableti mbrëmë, dhe sot po i shikoj te telefoni*. Për atë duhet një bazë që e shohin të dyja
pajisjet, dhe **kjo hyri me kërkesë të pronarit**.

Ajo bazë nuk është e jona. Përdoruesi sjell projektin e vet Supabase, ngjit adresën dhe çelësin
publik, dhe hyn me një llogari që ekziston vetëm brenda tij. **Server i yni që i sheh të dhënat e
lojës nuk ka, dhe mos shto një të tillë** — as për të rele-uar një mbrëmje, as për „lehtësi". Sapo të
ketë një, tërë kjo pikë bie bashkë me të.

Serveri i sinjalizimit (pika 20) nuk e prek këtë: atje kalojnë vetëm kredencialet e një lidhjeje, dhe
as një emër i vetëm lojtari nuk hyn dot. Ai është një server që lidh dy telefona; ky do të ishte një
server që mban një mbrëmje, dhe ata të dy nuk janë e njëjta gjë.

**Tabelën nuk e krijon dot aplikacioni, dhe kjo nuk është mangësi.** Çelësi publik që rri te
pajisja arrin **vetëm** te PostgREST-i, i cili shërben rreshta; tabela, politika dhe trigger-i
kërkojnë SQL, dhe asnjë cilësim i projektit nuk e bën atë çelës të aftë për të — e cila është
pikërisht ajo që e ndal një kopje të vjedhur të `localStorage`-it nga rishkrimi i bazës. API-ja e
dytë e Supabase-it (Management) e bën SQL-në, por `api.supabase.com` nuk pranon asnjë kërkesë
ndër-origjinë nga një faqe, dhe do të kërkonte një kredencial që mbulon tërë llogarinë — pra ose një
server i yni për ta rele-uar, ose një buton që nuk punon kurrë. FinanCarePersonal e pati atë rrugë
dhe e hoqi për këto arsye; këtu nuk hyri kurrë.

Prandaj ngritja është skripti: `linkuSkriptit` e hap SQL Editor-in e vetë përdoruesit me të brenda
(një prekje, pastaj «Run»), krah një butoni që e kopjon, dhe `verifikoSkemen` është rruga prapa —
çka ra pyetet te vetë baza e jo te ai që shtypi butonin. Një projekt përgjysmë merr vetëm migrimet
që i mbeten (`sqlPerMigrim`), sepse njeriu që shikon njëzet rreshta SQL nuk e di cilët janë të rinj.
Pas verifikimit sinkronizimi niset vetë: arsyeja pse dikush e hapi atë ekran ishte se sinkronizimi
nuk punonte.

**Asnjë projekt nuk vjen i shkruar te kodi**, dhe kjo është kërkesë e shprehur e pronarit: as adresë,
as çelës, as varg mjedisi që do t'i fuste gjatë ndërtimit. `BOSH` te `supabase.ts` nis me `url` e
`anonKey` të zbrazët, pra `eshteLidhur` del `false` dhe asnjë kërkesë nuk niset. Një „parazgjedhje e
përshtatshme" këtu do të thoshte se mbrëmjet e çdo instalimi shkojnë te baza e dikujt tjetër, dhe
kjo nuk do të dukej te asnjë ekran. Prova `asnjë projekt Supabase nuk vjen i shkruar te kodi` e lexon
tërë `src/`-në kundër kësaj — host projekti, çelës i të dy formave, dhe emrat e mundshëm të vargjeve
të mjedisit. Vend-mbajtësja te forma është `projekti-yt.supabase.co` pikërisht që të mos ketë formën
e një reference të vërtetë.

Kjo shmangje pranohet vetëm nën këto kushte, dhe nëse dikush e prek një prej tyre, shmangja nuk
qëndron më:

- **Rri e fikur derisa dikush ta ndezë.** `nisAutomatikun()` te `main.tsx` e lexon konfigurimin dhe
  kthehet menjëherë kur s'ka projekt të lidhur. Një pajisje që nuk e prek kurrë atë ekran nuk nxjerr
  asnjë kërkesë.
- **Ekrani e thotë çka del nga pajisja, para butonit.** Njësoj si te mënyra me kod (pika 7): te
  projekti shkruhen grupet, lojërat dhe raundet — pra emrat dhe pikët. Nuk është fjali te një ekran
  „rreth"; rri mbi vetë formën, ku lexohet.
- **Çelësi sekret refuzohet para se të shkruhet në disk.** `kontrolloCelesin` te `projekti.ts` e
  hedh poshtë `service_role`-in dhe `sb_secret_`-in me emër, sepse ai çelës i anashkalon rregullat e
  rreshtave dhe paneli i Supabase-it e shkruan dy rreshta nën atë publik. Prova
  `çelësi sekret dhe ai service_role refuzohen me emër` e mban këtë të matur. Mos e zbut.
- **Pa varësi të pestë** (pika 10). `supabase.ts` është `fetch` i shkruar me dorë.
- **Rreshtat e një përdoruesi i shikon vetëm ai.** Migrimi i parë e ndez `row level security` dhe e
  krijon politikën `auth.uid() = user_id`. Pa atë, dy llogari te i njëjti projekt do t'i shihnin
  mbrëmjet e njëra-tjetrës.

#### Pajisja e sapolidhur lexon, nuk shkruan

Dështimi që e formëson gjithçka këtu nuk është hipotetik: një telefon i pastruar, i rilidhur, që
ngarkon bazën e vet të zbrazët mbi historikun e një viti. Prandaj një pajisje sapo e lidhur
(`lidhjaVerifikuar === false`) **vetëm shkarkon**, dhe ekrani i tregon numrat e të dyja anëve para se
t'i lejohet të dërgojë. Tri përgjigjet — bashko, merr, dërgo — rrinë te `MENYRAT`, dhe dy prej tyre
kërkojnë një fjalë të shkruar me dorë. Mos e hiq atë pyetje, dhe mos i vër parazgjedhje që zbatohet
vetvetiu.

#### `uid`-i, e jo `id`-ja, është emri që del jashtë

Baza lokale i numëron regjistrat me `autoIncrement`, pra dy telefona e quajnë të dy `1` grupin e vet.
Prandaj çdo regjistër mban edhe një `uid` të rastësishëm (`identiteti.ts`), dhe jashtë pajisjes
udhëton vetëm ai — edhe te lidhjet: një lojë e cloud-it mban `groupUid` e jo `groupId`, dhe një raund
`gameUid`. Numri mbetet aty ku ishte: rrugët (`#/loja/3`), indekset dhe lidhjet brenda pajisjes
lexohen njësoj si më parë, dhe asnjë ekran nuk u prek.

Tri gjëra rrjedhin prej kësaj dhe nuk guxojnë të hiqen:

- **Fëmija pa prindin e vet shtyhet, nuk hidhet.** Një raund që mbërrin para lojës së vet nuk
  zbatohet dot; nëse do të hidhej, shënjuesi i shkarkimit do të kalonte mbi të dhe ai raund nuk do të
  shkarkohej më kurrë. Prandaj `maxTs` ndalet **nën** rreshtin më të hershëm që u shty. Prova
  `raundi pa lojën e vet shtyhet, dhe shënjuesi nuk kalon mbi të` e mban këtë të matur.
- **Fshirja lë varr** (`fshirjet`). Pa të, pajisja tjetër do ta shihte regjistrin që mban ende si
  «diçka që cloud-i s'e ka» dhe do ta ngarkonte sërish — pra fshirja do të zhbëhej vetvetiu.
  Kaskada e `fshiGrup` lë një varr për secilin, dhe zbatimi i fshirjeve shkon fëmija para prindit.
- **`uid`-i shkruhet edhe te kopja rezervë.** Kështu një kopje e kthyer te një pajisje tjetër e mban
  të njëjtin identitet e nuk krijon dublikatë. Mungesa e tij te një skedar i vjetër është e ligjshme
  — atëherë jepet një i ri — kurse përsëritja jo: i dyti riemërtohet, e nuk rrëzohet tërë skedari.

#### Kush fiton, dhe pse jo ora

Fiton **pajisja e fundit që sinkronizon**, për çdo regjistër. Një ndryshim lokal i padërguar
(`sinkPezull`) e mban vendin e vet dhe dërgohet; çdo gjë tjetër që zbret zbatohet. Asnjë vendim nuk e
krahason orën e një pajisjeje me atë të një tjetre — një telefon me orën një orë prapa prapë e di
shumë mirë **që** shënoi diçka, gabon vetëm për kur.

Ora e serverit hyn vetëm si emërues i përbashkët: trigger-i i migrimit të parë e shkruan
`updated_at` me `now()`, dhe dërgimi e lexon prapa. Prandaj jehona e rreshtit tim njihet deri te
milisekondi dhe kapërcehet, në vend që të rishkruhet te baza në çdo sinkronizim.

Përjashtimi i vetëm është `KOHA_PARA_SINKRONIZIMIT` (`1`): regjistrat që ekzistonin para se kjo të
vinte marrin atë datë dhe flamurin. Të dyja gjysmat duhen — flamuri që të **arrijnë** te një cloud që
nuk i ka parë kurrë, dhe data që të **humbin** kundër çdo rreshti që cloud-i e mban vërtet.

#### Gjërat që nuk guxojnë të hiqen

- **Flamuri nuk mjafton vetëm, prandaj ka edhe një kontroll të dytë.** Një herë në ditë numërohen të
  dyja anët; kur cloud-i del më i shkurtër, `mungojneNeCloud` e pyet atë drejtpërdrejt se çka ka, dhe
  çka mungon shënohet sërish për dërgim. Pa këtë, një regjistër i shënuar gabim si «i dërguar» nuk
  shikohet më kurrë dhe numrat e dy anëve mbeten të ndryshëm përgjithmonë.
- **Çdo fushë e ardhur nga jashtë kontrollohet** (`fushatENjeRreshti`), me të njëjtën ashpërsi si te
  `kopja.ts` dhe si te sinjali (pika 7): rreshtat vijnë nga një bazë që e administron vetë
  përdoruesi. Një `lloji` i panjohur e rrëzon rreshtin e nuk lexohet bridzh — te pishpiriku fiton
  totali më i madh, dhe një lexim i gabuar do të shpallte fitues të fundit, në heshtje (pika 16).
  Zeroja e `kufiri`-t dhe `false`-ja e `mbyllur`-it mbijetojnë, sepse atje mungesa do të thotë diçka
  tjetër nga vlera (pikat 13 e 15).
- **Migrimet rrinë te `skema.ts` dhe vetëm shtohen.** Ato bien te baza e dikujt tjetër, ku një
  redaktim thjesht nuk do të zbatohej kurrë; gabimi rregullohet me numrin tjetër. Çdo fjali është e
  rrethuar, që skripti të ofrohet si buton e jo si ritual — dhe prova `përsëritja e skriptit nuk
  prish gjë` e lexon fjali për fjali.
- **Verifikimi e pyet projektin, jo butonin.** Skripti bie te një SQL Editor, te një skedë tjetër,
  jashtë çdo gjëje që aplikacioni e sheh — prandaj «a ra?» i bëhet vetë bazës (`verifikoSkemen`).
- **Emri i pajisjes shkon me çdo rresht.** I njëjti email hyn kudo, prandaj llogaria nuk e thotë dot
  cila pajisje e shkroi çka, dhe `updated_at` thotë kur e jo kush. Rri te `localStorage` e **nuk
  sinkronizohet** — një id e sinkronizuar do t'i bënte të gjitha pajisjet të pohonin se janë e njëjta.
- **Shkrimet e cloud-it nuk e nxisin një sinkronizim të ri.** `onNdryshimLokal` bie vetëm te shkrimet
  e përdoruesit; `onBazaNdryshoi` bie te të dyja dhe e rifreskon ekranin. Pa atë ndarje, dy pajisje
  do të ushqenin njëra-tjetrën pa fund.

#### Çka e mban të gjallë pas muajsh

Sinkronizimi bie vetvetiu, te sfondi, mbi një bazë që rritet — pra dështimet e tij nuk janë të
dukshme sa ato të një butoni. Pesë gjëra e ndalojnë secilën nga mënyrat me të cilat ai ngrin pa u
vënë re, dhe asnjëra nuk guxon të hiqet:

- **Çdo `fetch` ka afat** (`kerko` te `supabase.ts`, 20s për lexim e 60s për dërgim). Pa të, një
  portal wifi-je që i mban lidhjet hapur pa u përgjigjur e lë `nePritje` të zënë **përgjithmonë**:
  çdo sinkronizim i mëpasshëm i bashkohet një premtimi që nuk zgjidhet, butoni rri i fikur, dhe
  rruga e vetme jashtë është rihapja e skedës.
- **Dështimet largohen dyfish** (`ecKeq`, nga një minutë deri te gjysmë ore). Një projekt i ndalur
  përndryshe do të merrte një kërkesë çdo dhjetë minuta, te çdo ndërrim skede dhe pas çdo raundi —
  pa rregulluar asgjë dhe duke pirë baterinë. Ngjarja `online` e heq pritjen, sepse atëherë shkaku
  vërtet mund të ketë rënë; «Sinkronizo tani» e shpërfill fare, sepse kush e shtyp e di se po provon.
- **Shtyrja e një jetimeje është e kufizuar** (pika më sipër). Tri prova, pastaj shënjuesi kalon.
- **Premtimi i dështuar i bazës nuk ruhet.** `db()` e pastron `baza`-n te `catch`: i ruajtur, ai do
  t'i kthehej çdo leximi të mëpasshëm, dhe një dështim i çastit do ta linte aplikacionin të vdekur
  derisa të rihapej skeda. Po ashtu `blocked` (një skedë e vjetër e mban bazën — ekrani e thotë me
  fjalë), `blocking` dhe `terminated`.
- **Varret fshihen pas tre muajsh** (`pastroVarretEVjetra`, një herë në ditë bashkë me kontrollin e
  dy anëve). Ata janë e vetmja gjë te kjo bazë që rritet pa kufi. Fshihen vetëm ata që cloud-i i ka
  pranuar: një varr i padërguar është një fshirje që s'ka mbërritur askund.

#### Faqja e bardhë është dështimi më i keq

`Gardhi` te `pjeset/Gardhi.tsx` rri jashtë gjithçkaje te `main.tsx`. Pa të, një gabim vizatimi te
cilido ekran e zbraz tërë pemën: pa tekst, pa buton, dhe pa asnjë shenjë se pikët janë ende te baza —
pra pikërisht në atë çast njeriu mendon se e humbi mbrëmjen. Kartela thotë tri gjëra me radhë: të
dhënat nuk humbën, ja si provohet sërish, dhe ja çka tha gabimi.

Është i vetmi vend te projekti ku shkruhet një klasë komponenti, sepse `componentDidCatch` nuk ka
hook që e zëvendëson.

**Dhe `useNgarko` e hedh gabimin e vet gjatë vizatimit**, që të bjerë te po ai gardh. Kufijtë e
React-it i kapin vetëm gabimet e vizatimit; një premtim i refuzuar u kalon pranë. Pa atë rresht, një
bazë që nuk hapet dot — kuota e mbushur, IndexedDB e fikur në shfletim privat — do ta linte ekranin
te «Duke lexuar…» **pa fund**. Kjo u provua me shfletues duke ia hequr `indexedDB`-në faqes.

#### Çka nuk e preku

Asnjë llogari: totalet, renditja, matrica dhe parashikimi lexojnë të njëjtat fusha si më parë.
Rrugët e ndarjes (`#/shiko`, `#/lidhu`, `#/pergjigje`, `#/bashkohu`) mbeten pa bazë fare — kushti i
pikës 7 është fjalë për fjalë i paprekur, dhe sinkronizimi nuk niset te ato rrugë sepse nuk niset
askund pa projekt të lidhur. Dhe kopja rezervë mbetet aty ku ishte: ajo është rruga pa llogari, pa
internet dhe pa varësi, dhe nuk zëvendësohet nga kjo.

### 20. Serveri i sinjalizimit është yni, dhe prek vetëm shtrëngimin e duarve

Kjo është e vetmja pikë e projektit që hoqi një ndalesë në vend që të shtonte një. Deri para saj
pika 1 thoshte „server i yni nuk ka" pa asnjë përjashtim; **pronari e hoqi atë ndalesë për një gjë
të vetme**, sepse mënyra me kod e PeerJS-it varej nga një server i huaj që kur binte e merrte me
vete tërë mbrëmjen — dhe rruga e vetme e mbetur atëherë kërkonte dy skanime.

`api/sinjali.ts` mban dy varga për një kod: ftesën dhe përgjigjen. Janë pikërisht ato që te mënyra
pa server kalojnë nëpër dy kode QR, dhe `sinjalizimi.ts` është i njëjti kodek për të dyja — një
format i dytë do të dilte jashtë sinkronie pikërisht atje ku bitet duhet të jenë të njëjtat.

Shmangja pranohet vetëm nën këto kushte, dhe nëse dikush e prek një prej tyre, shmangja nuk qëndron
më:

- **Pikët nuk e prekin atë shteg kurrë.** Sapo kanali WebRTC hapet, asnjë kërkesë nuk niset më.
  Kjo nuk lihet te leximi i kodit: prova `pikët nuk e prekin fare serverin` te
  `deshmitare/takimi.mjs` i numëron kërkesat e faqes dhe kërkon që numri të mos lëvizë pas
  transmetimit. Kjo është ndryshe nga PeerJS-i, i cili e mban prizën hapur tërë mbrëmjen.
- **`iceServers` rri i zbrazët**, si te `lidhja.ts` (pika 7). Pa STUN e pa TURN mblidhen vetëm
  kandidatë `typ host`, prandaj asnjë i tretë nuk kontaktohet dhe lidhja del vetëm brenda së njëjtës
  rrjetë. Pra kjo mënyrë **kërkon të njëjtin wifi** — ajo që ndërron kundrejt mënyrës pa server
  është vetëm numri i skanimeve, nga dy në një. Kush luan nëpër rrjeta të ndryshme e ka mënyrën me
  PeerJS, e cila i mban relenjat e veta. `VITE_ICE_SERVERS` e ndërron këtë gjatë ndërtimit, për atë
  që ka një TURN të vetin; asnjë adresë nuk vjen e shkruar te kodi, për të njëjtën arsye si te
  `VITE_PEER_SERVER` dhe si te `BOSH` i pikës 19.
- **Asgjë nuk mbahet.** Vargu rri `JETA` sekonda dhe zhduket vetë. Pa llogari, pa cookie, pa
  regjistër.
- **Çdo fushë kontrollohet me alfabet të ngushtë**, me të njëjtën ashpërsi si te sinjali i skanuar
  (pika 7) dhe te rreshtat e sinkronizimit (pika 19) — dhe këtu arsyeja është më e drejtpërdrejtë:
  shtegu është i hapur për këdo që e gjen adresën. Kodi tetë karaktere të alfabetit të vet, roli një
  nga dy, trupi nën `KUFIRI` bajte dhe pa asnjë karakter që SDP-ja e lexon si ndarës. Vendimet rrinë
  te `takimi.ts` e provohen me `node --test`; serveri vetëm i thërret.
- **Vendi i ruajtjes thuhet, e nuk hamendësohet.** Një funksion pa gjendje nuk i takon dot dy anët,
  prandaj duhet një vend ruajtjeje — Upstash Redis kur `KV_REST_API_*` rrinë te mjedisi, dhe kujtesa
  e vetë thirrjes kur jo. E dyta punon te zhvillimi dhe **herë po e herë jo** te prodhimi, prandaj
  përgjigjja e thotë me kokën `x-takimi` dhe ekrani e nxjerr me fjalë. Një mënyrë që dështon një herë
  në tri është më e keqe se një që thotë hapur se nuk është ngritur.

#### Një ftesë merr saktësisht një përgjigje

Kjo është pika që nuk merret me mend, dhe ajo që u pagua me një dështim një-në-tri.

Dy veta që e skanojnë kodin njëkohësisht e marrin të dy të njëjtën ftesë. Pa zënie, i dyti e
mbishkruante përgjigjen e të parit — dhe pastaj **të dy** i dërgonin strehuesit kontrolle ICE mbi po
ato kredenciale. Ai çift i ngatërruar nuk dështonte gjithmonë; dështonte rreth një herë në tri, dhe
atëherë nuk lidhej **asnjëri nga të dy**. Pra jo „i dyti pret" — të dy binin, dhe në heshtje.

Tri gjëra e mbyllin atë, dhe asnjëra nuk guxon të hiqet:

- **Përgjigja zihet një herë e vetme** (`zer`, me `SET … NX` te Redis-i). I pari e zë; i dyti merr
  `409` dhe e mëson menjëherë, në vend që të presë kot.
- **Ana që shikon pret ftesën e radhës, e jo po atë.** `#merrFtesen(perveq)` e krahason me atë që
  sapo e humbi — pa atë krahasim rrethi tjetër do t'i përgjigjej sërish së njëjtës ftesë, dhe do ta
  humbte sërish.
- **Ftesa e konsumuar fshihet në çast** (`DELETE`), e nuk lihet të vdesë vetë. Përndryshe kush
  skanon pikërisht atëherë i përgjigjet një ftese që nuk e pret më askush.

Dhe një e katërt, nga i njëjti dështim: **përgjigja pa asnjë adresë nuk dërgohet fare.** Mbledhja e
kandidatëve ka afat, dhe te një telefon i ngarkuar ai afat mund të mbarojë para se të vijë qoftë një
i vetëm. Atëherë dilte një përgjigje e ligjshme e pa asnjë adresë: strehuesi e pranonte, e prishte
ftesën e vet për të, dhe pastaj priste një shtrëngim që nuk kishte nga të vinte.

#### Importet e nxjerra shkruhen `.js`, përndryshe funksioni nuk botohet

`rewriteRelativeImportExtensions` te `tsconfig.json` rri për një arsye të vetme, dhe ajo arsye nuk
duket askund lokalisht.

Projekti i shkruan importet me `.ts`, sepse `node --test` i lexon modulet drejtpërdrejt dhe kërkon
shtegun e plotë (pika 1). Vercel-i e përkthen `api/sinjali.ts` te `.js` me TypeScript-in tonë, por
**pa i prekur specifikuesit** — pra pa atë rresht te dalja rri një funksion që importon
`../src/takimi.ts`, skedar që atje nuk ekziston, dhe botimi refuzohet me
«referencing unsupported modules».

Ajo që e bën këtë kurth: `npm test`, `tsc --noEmit` dhe `npm run build` kalojnë të gjitha. Refuzimi
vjen vetëm te botimi, pas gjithçkaje. Prandaj prova
`importet e nxjerra shkruhen .js, që funksioni të botohet dot` e lexon atë rresht drejtpërdrejt —
një provë mbi konfigurim, e cila zakonisht nuk vlen, por këtu është i vetmi vend ku dështimi kapet
para kohe.

Rruga për ta parë me sy është `npx vercel build` dhe pastaj një `grep` mbi specifikuesit te
`.vercel/output/functions/api/sinjali.func/`: aty duhet të dalin `.js`, dhe skedarët përbri duhet
të jenë pikërisht ata.

#### Serveri ngrihet edhe gjatë zhvillimit

Te prodhimi `api/sinjali.ts` e ngre Vercel-i vetë; te `npm run dev` nuk e ngre kush. Prandaj
`vite.config.ts` e mbërthen atë **të njëjtin skedar** si middleware — jo një imitim të tij, që ajo
që provohet të jetë ajo që botohet. Pa të, e tërë kjo mënyrë do të shkonte e paprovuar deri te
botimi, e cila është pikërisht mënyra si prishet kodi i rrjetës (e njëjta arsye si `VITE_PEER_SERVER`
te pika 7).


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
- **Tema e parazgjedhur është drita, me kërkesë të pronarit.** Tema e errët mbetet e plotë dhe një
  prekje larg — mbrëmja është ora kur luhet — por nuk vjen më vetvetiu, dhe as sistemi nuk pyetet pa
  u kërkuar. Kjo është zgjedhje e pronarit e jo rrjedhojë e kodit: mos e ndërro pa e pyetur. Numri i
  vetëm që e mban është `TEMA_E_PARAZGJEDHUR` te `tema.ts`, dhe prova `hapja e parë është drita, me
  kërkesë të pronarit` e lexon pikërisht atë vendim.

  Ndriçimin e zgjedh çelësi te fundfaqja — «Sistemi», «Dritë», «Terr» — dhe **tri gjendje e jo dy**,
  sepse pa të parën nuk kthehesh dot te ndërrimi automatik i telefonit (e njëjta trenjëshe si
  `mbyllur` te pika 15). Vendimet rrinë te `tema.ts` e provohen me `node --test`; `ndricimi.ts` njeh
  `document`-in, `localStorage`-in e `matchMedia`-n (pika 1).

  **Tokenat e territ rrinë të shkruar një herë**, te `:root[data-tema='terr']`, dhe atributin e vë
  `ndricimi.ts` — të zgjidhur, pra pa dallim a e zgjodhi njeriu a e tha telefoni. Me
  `prefers-color-scheme` ai bllok do të duhej dy herë: brenda pyetjes, dhe jashtë saj për terrin e
  zgjedhur mbi një telefon që rri në dritë. Prandaj **te CSS-i nuk ka asnjë `prefers-color-scheme`**
  — sistemi pyetet te një vend i vetëm, dhe prova `sistemi pyetet te një vend i vetëm` e mban këtë
  të matur.

  **Çasti para se atributi të stampohet e mban parazgjedhjen**, sepse e mban vetë `:root`-i. Kush
  nuk e ka prekur çelësin nuk sheh asnjë ndërrim te hapja; kush zgjodhi terrin sheh një çast drite,
  dhe ai është çmimi i të pasurit një parazgjedhje që CSS-i e di vetë. Sa kohë parazgjedhja ishte
  ajo e telefonit, atë çast e mbulonte një pyetje e vetme te CSS-i — nëse parazgjedhja ndërron
  sërish, ajo pyetje kthehet bashkë me të.

  `color-scheme` shkruhet i plotë te secila temë — ai vendos edhe kontrollet e sistemit — dhe blloku
  i shtypjes i emërton të dyja, përndryshe atributi do t'i mposhtte tokenat e letrës.

  **Ngjyra e shiritit është e treta që e di temën**, krah tokenave dhe metës te `index.html`. Ajo
  meta mban ngjyrën e parazgjedhjes e jo një çift me `media`: me `media` shiriti do të ndiqte
  telefonin e jo zgjedhjen, pra do të dilte i errët mbi një faqe të bardhë te aplikacioni i
  instaluar. `ndricimi.ts` e ndërron sapo tema vihet, dhe dy prova i lidhin të tri vendet.
- Teksti është Quicksand me peshë 500 (`--shkronja`); numrat e kolonave mbeten monospace
  (`--shkronja-numrat`), sepse te një tabelë pikësh shifrat duhet të bien mbi njëra-tjetrën dhe
  Quicksand-i i ka proporcionale.
- Ikonat janë SVG inline te `ikonat.tsx`, jo emoji: emoji-t vizatohen nga fonti i sistemit, dalin
  me ngjyra e madhësi të ndryshme dhe nuk e marrin ngjyrën e tekstit përreth.
- `--kufiri-veprues` (≥3:1 sipas WCAG 1.4.11) për çdo gjë që klikohet; `--kufiri` është vetëm
  dekorativ. Mos e përdor kufirin dekorativ për një kontroll.
- `env(safe-area-inset-*)` me `viewport-fit=cover` për pamjen e instaluar. Ka edhe stil për shtypje.
- **Ekrani i lojës ka tri grupe, dhe radha e tyre nuk ndërron me gjerësinë**: futja e raundit
  (`.loja__futja`), çka doli prej saj (`.loja__rezultatet`) dhe panelat që preken një herë a asnjë
  (`.loja__panelat` — lojtarët, ndarja, rregullat, kufiri, mbyllja). Ndërron vetëm sa prej tyre hyn
  në ekran njëherësh: mbi 48rem panelat dalin dy për rresht, mbi 62rem futja dhe renditja rrinë krah
  për krah dhe futja ngjitet (`position: sticky`), me kufi lartësie e rrëshqitje të vetën, sepse një
  bllok i ngjitur më i gjatë se ekrani i mban rreshtat e mesit të paarritshëm. Panelat nuk kthehen
  mes futjes dhe renditjes: atje ata shtynin poshtë pikërisht atë që lexohet pas çdo raundi.

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
- **Data e mbrëmjes nuk shkruhet me dorë**, me kërkesë të pronarit: loja shënohet atë natë që luhet,
  dhe telefoni e di se cila është. `sot()` llogaritet te vizatimi e nuk mbahet te gjendja — një skedë
  e lënë hapur para mesnate do ta niste lojën me datën e djeshme — dhe del me fjalë mbi butonin, që
  çka do të shkruhet të rrijë e dukshme. Në bazë mbetet `YYYY-MM-DD`: renditja e historikut varet
  nga ajo.

  `pastroDaten`, `dataMeNumra` e `dataNgaNumrat` mbeten me provat e tyre edhe pa përdorues, sepse
  mësimi i tyre nuk vjetërohet: fusha e dikurshme ishte tekst e jo `type="date"`, sepse atë e
  vizaton shfletuesi sipas gjuhës së vet dhe një telefon me anglishten amerikane e nxjerr muajin i
  pari — 11 shtatori dilte „09/11" dhe lexohej 9 nëntor. Radha nuk caktohet dot me HTML. Nëse ndonjë
  datë kthehet ndonjëherë e shkruajtshme, kthehet ashtu e jo me `type="date"`.
- **Kopjimi i lidhjes kthen përgjigje, edhe kur dështon.** `navigator.clipboard` mungon fare jashtë
  një konteksti të sigurt dhe lejen mund ta mohojë shfletuesi; me një `catch` të heshtur butoni
  shtypej e nuk ndodhte kurrgjë. Prandaj `sistemi.ts` kthen `false` dhe ekrani e nxjerr lidhjen në
  një fushë të zgjedhur vetë. Po ashtu, anulimi i fletës së ndarjes (`AbortError`) ndahet nga
  dështimi: kush e mbylli atë fletë nuk kërkoi rrugë të dytë, dhe një kopjim pas tij do t'ia zinte
  tabelën e fragmenteve pa e ditur.
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
- **Një navigim vetëm me hash nuk i rikërkon skriptet.** Kjo e zë ngushtë provën me shfletues që
  bllokon `**/*.js` për të mbushur bazën para se aplikacioni të nisë: pas `unroute`, një
  `goto('…#/loja/1')` mbetet te i njëjti dokument dhe faqja rri pa JS — duket sikur aplikacioni nuk
  vizaton fare. Duhet një `reload()` i vërtetë.
- **Shtresa e rrjetit provohet me një Supabase të rremë, jo me atë të vërtetin.** Makina e provave
  nuk e lëshon `*.supabase.co`, prandaj `deshmitare/supabase-i-rreme.mjs` mban pikërisht aq sa prek
  `supabase.ts` — hyrjen, rifreskimin, `select`-in, `upsert`-in dhe `delete`-in — dhe
  `deshmitare/rrjeti.mjs` e kalon tërë rrugën me shfletues: hyrje, tabela që mungon e njohur nga
  `PGRST205`, «Run» te editori, verifikim, dërgim, dhe një pajisje e dytë krejt e pastër që e merr
  grupin me lojtarët e duhur. Nuk bien me `npm test` (kërkojnë Playwright e një ndërtim, të dyja
  jashtë varësive — pika 10), prandaj rrinë jashtë `test/`: çdo skedar brenda asaj dosjeje e merr
  `node --test` vetvetiu.

  E paprovuar mbetet vetëm ajo që një server i rremë nuk e imiton dot: reja e vërtetë e Supabase-it,
  trigger-i i vërtetë i orës, dhe RLS-ja. Rruga e parë kur diçka nuk punon atje është skeda
  «Network» dhe tabela te SQL Editor-i.

  Dy gjendje dështimi u provuan vërtet me shfletues, sepse të dyja e linin faqen pa fjalë: një
  regjistër i dëmtuar (një lojë pa `selectedPlayers`) tani nxjerr kartelën e gardhit e jo faqen e
  bardhë, dhe një shfletues me `indexedDB`-në e hequr nxjerr po atë kartelë e jo një «Duke lexuar…»
  të përhershëm.
- **Migrimi i bazës rri jashtë `upgrade`-it.** Kursori që i vë `uid` çdo regjistri bie pas hapjes, te
  një transaksion i zakonshëm, sepse brenda `upgrade`-it ai do ta mbante transaksionin e versionit
  hapur sa zgjat leximi i tërë bazës. Çelësi `duhetStampim` e mban atë vendim, dhe bie vetëm kur
  versioni i vjetër ishte 1 — një bazë e re nuk ka çka të stampojë.
- **Nuk u provua me dy telefona të vërtetë.** Prova me shfletues i ngre të dy anët në të njëjtën
  makinë, prandaj ICE-ja lidhet mbi `192.0.2.2` e mDNS-i zgjidhet brenda së njëjtës Chrome. Rruga e
  parë kur diçka nuk punon në wifi të vërtetë është `chrome://webrtc-internals`, dhe dyshimi i parë
  është ndarja e klientëve nga rrjeta.
- **Dy skanime njëkohësisht nuk janë „rast i rrallë".** Te tavolina, kodi del në ekran dhe dy veta e
  drejtojnë kamerën njëkohësisht — kjo është rruga e zakonshme, jo ajo e çuditshmja. Pikërisht ajo e
  nxori dështimin një-në-tri të pikës 20, dhe pikërisht ajo është prova që duhet mbajtur: një
  `Promise.all` mbi dy faqe, e jo dy skanime të radhitura bukur. Prova e radhitur kalonte gjithmonë.
- **Reja publike e PeerJS-it nuk u provua as ajo.** Egresi i makinës së provave nuk e lëshon
  `0.peerjs.com`, prandaj mënyra me kod u provua kundër një `peerjs-server` lokal. Ajo që u provua
  është tërë rruga e aplikacionit — bashkë me rënien e serverit dhe kthimin e tij; ajo që mbetet e
  paprovuar është vetëm arritja te ai host.
- **`npx` nuk vdes me një `kill`, dhe një dëshmitar që e beson atë gënjen.** `deshmitare/lidhja-me-kod.mjs`
  e vret serverin e sinjalizimit në mes të mbrëmjes, dhe e tërë vlera e tij rri te ajo vrasje.
  `npx peer` është mbështjellës mbi një `sh -c` mbi një `node`, prandaj `serveri.kill()` e vret
  vetëm të parin dhe serveri mbetet gjallë — atëherë prova kalon e gjelbër pa e prekur fare rrugën
  që u shkrua për të. Prandaj `spawn` merr `detached: true` dhe vrasja shkon te tërë grupi
  (`process.kill(-pid)`); dhe pas saj pritet sa hesht vërtet porta, përndryshe ngritja e radhës e
  gjen të zënë.
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
