# Tavolina — pikët e mbrëmjes

Numërues pikësh për lojërat e një tavoline. Zëvendëson fletën e Google
Sheets-it: shënon pikët e secilit raund dhe nxjerr vetë totalet, renditjen dhe
shlyerjen.

Katër lojëra, një grup, një bazë:

| Loja | Raundi | Mbaron | Fiton |
| --- | --- | --- | --- |
| **Bridzh** — xhin-rami kosovar me 14 letra, mbyllja me 51 pikë | pikët e secilit, ose llogaritësi hant/normal | pas dy raundeve për lojtar | totali më i vogël |
| **Magarec** — loja e shkronjave | një prekje: kush e humbi | kur dikujt i mbushet fjala „MAGAREC" | më pak shkronja |
| **Domina** — gurët e mbetur në dorë | pikët e secilit | kur dikujt i mbushet kufiri | totali më i vogël |
| **Pishpirik** — 25 pikë për dorë, plus 10 për çdo pishpirik | pikët e dorës | kur dikush arrin kufirin | **totali më i madh** |

Pishpiriku është i vetmi që fitohet nga ana tjetër, dhe ekrani e thotë atë me
fjalë: renditja, kurora dhe fjalia e fundit e lexojnë drejtimin nga vetë loja.

## Çka bën

- **Grupe dhe lojtarë** — shoqëria futet një herë, e tërë me një shkrim
  («alfa, beta, gama, delta»), dhe radha e emrave ruhet.
- **Zgjedhje para lojës** — grupi mund të ketë gjashtë të rregullt dhe sonte të
  luajnë katër.
- **Shtim mes lojës** — kush ulet te tavolina në raundin e pestë shtohet aty për
  aty, nga grupi ose si emër krejt i ri; raundet e shkuara nuk i preken dhe
  totali i tij nis nga hera e parë që shënon.
- **Futje e raundit** — një numër për lojtar, ose përmes llogaritësit
  hant/normal, i cili e ruan raundin vetë me një prekje.
- **Data ditë/muaj/vit** — shkruhet me numra dhe vijat dalin vetë; poshtë saj
  rri data me fjalë, që të mos ngatërrohet ditë me muaj.
- **Rregullat brenda aplikacionit** — çdo lojë i ka të vetat te një panel i
  mbledhur, te ekrani ku zgjidhet çka luhet dhe te ai i lojës: si shënohet
  raundi, sa vlen çka, dhe me çka mbaron mbrëmja. Deri ku luhet nuk shkruhet
  atje — atë e zgjedh tavolina për çdo mbrëmje.
- **Çka luhet** — zgjidhet para lojës, dhe çelësi nis te loja e fundit e grupit.
  Te magareci raundi ka një pyetje të vetme: kush e humbi. Prekja e emrit e ruan
  raundin, shkronja shkon te ai, e rrjeti M-A-G-A-R-E-C tregon ku janë të gjithë.
- **Domina dhe pishpirik** — i njëjti rrjet fushash si te bridzhi, pa
  llogaritës: numri numërohet te tavolina, ku janë gurët e letrat. Mbrëmja
  mbaron kur dikush e arrin kufirin që u zgjodh kur nisi — ose kurrë, nëse u nis
  «pa kufi» — dhe fjalia e fundit e thotë se kush e arriti.
- **Renditja** — sipas totalit, në drejtimin që e fiton loja: i pari është ai me
  më pak pikë kudo veç pishpirikut. Kur
  nuk kanë luajtur të gjithë njësoj, shtohet kolona „raunde" dhe një shënim.
  Barazimi te kreu nuk fshihet: kurora u shkon të gjithëve që e ndajnë totalin
  më të vogël.
- **Dy raunde për lojtar** — aq zgjat një lojë bridzhi, pra tavolina rrotullohet
  dy herë. Kreu tregon «4 nga 8 raunde», dhe kur mbushen futja mbyllet me
  fituesin, si te magareci kur mbushet fjala. Raundi i shënuar gabim rregullohet
  nga lista, dhe kush u ul vonë shtohet te lojtarët — mbrëmja zgjatet vetvetiu.
- **Kush përzien** — radha e emrave është radha e tavolinës, prandaj krah
  titullit të raundit rri kush i përzien letrat; kalon një vend çdo raund.
- **Parashikimi** — kush e arrin dot ende vendin e parë me raundet që kanë
  mbetur, dhe brenda sa raundeve. Tabela jep vendin më të mirë e më të keq që
  mund të arrijë secili, për raundin tjetër ose deri në fund. Numrat vijnë nga
  vetë rregulli: një raund mbyll 240 pikë diferencë te bridzhi, dhe një shkronjë
  te magareci. Te domina e pishpiriku blloku nuk del fare: sa bën një dorë atje
  nuk e thotë rregulli, dhe një parashikim pa kufij do të ishte numër i shpikur.
- **Shlyerja** — matrica N×N e diferencave, `matrica[i][j] = total[i] − total[j]`,
  me lojtarët sipas renditjes. Del te bridzhi e te domina; te magareci e te
  pishpiriku jo, sepse atje diferenca nuk paguhet me para.
- **Historik sipas ditës** — një grup ka shumë lojëra, edhe dy të njëjtën ditë,
  secila me renditjen e vet përfundimtare aty për aty.
- **Të përgjithshmet** — një tabelë për secilën lojë që grupi ka luajtur:
  lojëra, fitore dhe totali mesatar, e llogaritur nga vetë raundet. Tabelat rrinë
  të ndara sepse numrat nuk janë të njëjtë lloj — pikë bridzhi, pikë domine,
  shkronja, pikë pishpiriku.
- **Redaktim dhe fshirje** — çdo raund ndryshohet pas ruajtjes; gjithçka
  rillogaritet vetvetiu.
- **Pikët drejtpërdrejt** — kush rri rreth tavolinës i shikon pikët në
  telefonin e vet, dhe raundi i ri del vetë. Lidhja bëhet drejt mes telefonave
  me një kanal WebRTC, në dy mënyra:
  - **Pa server** — sinjalizimi kalon nëpër dy kode QR dhe kamerën e
    telefonit, prandaj server nuk duhet as për t'u lidhur. Kërkon që telefonat
    të rrinë te e njëjta rrjetë.
  - **Me kod** (parazgjedhja) — një kod i vetëm tetëkarakterësh, që diktohet
    me zë ose skanohet një herë. Punon edhe nëpër rrjeta të ndryshme, sepse
    shoqëria rrallë rri te i njëjti wifi — por i duhet internet dhe një server
    i huaj për t'i lidhur pajisjet. Lidhja kërkon butonin, dhe ekrani e thotë
    çka del nga pajisja.
- **Ose një fotografi e çastit** — rezultati shkon brenda vetë adresës dhe
  adresa bëhet kod QR. Punon edhe atje ku rrjeta i ndan pajisjet nga
  njëra-tjetra, dhe edhe nëpër mesazh.

  Të dyja hapen edhe në një telefon që nuk e ka aplikacionin, dhe asnjëra nuk
  lexon as shkruan në bazën e tij. Pamja që hapet nis me përmbledhjen — kush
  prin, sa vjen i dyti prapa, sa raunde kanë mbetur dhe kush përzien — dhe ka
  «Unë jam …»: prek emrin tënd, dhe del rreshti yt i matricës, kujt sa i del.
- **Kopje rezervë** — nxjerrja dhe kthimi i tërë historikut si një skedar JSON.
- **Punon pa internet, dhe instalohet** — një punëtor shërbimi i ruan skedarët e
  faqes me hapjen e parë, prandaj aplikacioni hapet i plotë edhe në «mënyrë
  avioni», dhe shtohet te ekrani kryesor i telefonit si aplikacion më vete. Kur
  del një version i ri, ai pret: fundfaqja e thotë, dhe kalimi bëhet me një
  prekje — kurrë nën këmbët e një loje që po shënohet.

Punon pa internet. Të dhënat rrinë vetëm në shfletuesin e pajisjes.

## Çka del nga pajisja

Pikët, emrat dhe raundet rrinë te telefoni, dhe dalin vetëm kur i nxjerr vetë
përdoruesi — një kopje rezervë, një kod QR, një lidhje e drejtpërdrejtë.

Dy gjëra të tjera prekin një server, dhe të dyja thuhen te ekrani aty ku
përdoren:

- **Lidhja «me kod»** — te serveri i sinjalizimit shkojnë kodi dhe adresat e
  rrjetës, kurrë pikët. Kërkon butonin; pa të nuk niset asgjë.
- **Numërimi i hapjeve** (Vercel Web Analytics) — nga faqja del emri i rrugës,
  `/loja/[id]` ose `/shiko`, e asgjë tjetër. Adresa e vërtetë nuk del kurrë:
  brenda saj rri mbrëmja e ndarë, prandaj pastrohet para se të nisë. Pa cookie
  dhe pa asgjë të mbajtur mend për vizitorin.

Për ta pasur atë numërim, «Web Analytics» ndizet një herë te paneli i projektit
te Vercel; skripti vjen nga vetë domeni (`/_vercel/insights/…`), prandaj asnjë
host i huaj nuk kërkohet me hapjen e faqes.

## Rregullat e pikëzimit

Çdo raund mbyllet nga një lojtar që arrin 51 pikë me kombinime prej një dore me
14 letra. Dy mbyllje:

| | Mbyllësi | Të tjerët që s’hapën | Të tjerët që kishin hapur |
| --- | --- | --- | --- |
| **Hant** — mbylli pa hedhur e pa shitur asnjë letër | −40 | +200 | 2 × pikët në dorë |
| **Normal** — kishte hapur më parë | −20 | +100 | pikët në dorë |

„I hapur" është lojtari që ka hedhur së paku një letër ose i ka shitur një letër
dikujt atë raund.

Llogaritësi i zbaton këto rregulla dhe e ruan raundin ashtu si i llogarit —
një prekje për raundin që bie brenda tyre. Fushat e numrave mbeten gjithmonë të
redaktueshme, dhe «Vendosi te fushat» i shkruan pikët aty pa i ruajtur: te
fletët e vjetra ka raunde që nuk dalin nga rregullat, dhe një aplikacion që
pranon vetëm kombinimet e lejuara nuk do t’i shënonte dot.

## Rregullat e dominës dhe të pishpirikut

Asnjëra nuk ka llogaritës: numri vjen i numëruar nga tavolina.

| | Raundi | Deri te | Fiton |
| --- | --- | --- | --- |
| **Domina** | sa gurë i mbetën secilit në dorë | 100 a 250 pikë | totali më i vogël |
| **Pishpirik** | pikët e dorës — 25 gjithsej, plus 10 për çdo pishpirik (15 me fant) | 101, 120 a 151 pikë | totali më i madh |

**Deri ku luhet zgjidhet kur nis mbrëmja**, sepse kjo është marrëveshje e
tavolinës e jo rregull i lojës — dhe «Pa kufi» rri krah numrave, për mbrëmjen që
mbaron kur ngrihet shoqëria. Ndërrohet edhe mes lojës, nga rreshti «Deri te …»:
nëse dikush e ka kaluar tashmë numrin e ri, fleta mbyllet aty për aty, dhe
rihapet po aq lehtë.

Te pishpiriku një dorë e plotë ndan 25 pikë: nga një për secilin as, dam, mbret,
fant e dhjetë (22 me dhjetën e bastunit dy e dyshin e lules një), dhe tri për
shumicën e letrave — 27 a më shumë, e askujt kur tavolina ndahet baras. Një
pishpirik vlen 10, dhe 15 kur letra që e bën është fant. Ata numra rrinë shkruar
nën fushat, që një dorë e numëruar gabim të bjerë në sy para se të ruhet.

## Rregullat e magarecit

Një shkronjë për raund, dhe shtatë shkronja e mbarojnë mbrëmjen:

| | |
| --- | --- |
| **E humbi raundin** | merr shkronjën e radhës nga „MAGAREC" |
| **E mbushi fjalën** | e humbi mbrëmjen; loja mbaron aty |

Shkronjat nuk ruhen askund: raundi shkruhet si `1` për humbësin e `0` për të
tjerët, dhe fjala del nga numri. Prandaj fshirja ose ndërrimi i një raundi të
mesit i rinumëron vetvetiu të gjitha shkronjat pas tij.

## Komandat

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # tsc --noEmit && vite build && vite build -c vite.punetori.config.ts
npm run preview
npm test          # node --test — 257 prova, pa framework provash
```

`npm test` para çdo commit-i.

## Struktura

```
src/
  main.tsx            pikënisja
  App.tsx             shpërndarja e rrugëve
  rruga.ts            rrugëtimi me hash
  tipet.ts            tipet e të dhënave
  lojerat.ts          regjistri i katër lojërave: kush fiton, me çka mbaron
                      mbrëmja, a ka llogaritës, a shlyhet — pa DOM, pa bazë
  llogaritjet.ts      totalet, renditja, matrica, gjatësia e lojës dhe kush
                      përzien — pa DOM, pa bazë;
                      `permbledhja` i jep totalet, raundet e luajtura dhe
                      barazinë e pjesëmarrjes me një kalim të vetëm
  pikezimi.ts         rregullat hant/normal — pa DOM, pa bazë
  magareci.ts         shkronjat, fjala dhe magareci i mbrëmjes — pa DOM, pa bazë
  parashikimi.ts      vendi më i mirë e më i keq i arritshëm, raundet që duhen
                      për vendin e parë, dhe sa raunde i kanë mbetur mbrëmjes —
                      pa DOM, pa bazë
  ruajtja.ts          IndexedDB përmes `idb`
  kopja.ts            nxjerrja dhe leximi i kopjes rezervë
  fusha.ts            teksti i fushës së pikëve, shenja e tij dhe data
  versioni.ts         versioni i `package.json`-it, i futur gjatë ndërtimit
  qr.ts               kodues QR i shkruar me dorë (byte, niveli L, v1–20)
  paketa.ts           base64 i sigurt për adresa, dhe nënshkrimi
  kodi.ts             kodi tetëkarakterësh i bashkimit — pa DOM, pa rrjetë
  ndarja.ts           rezultati i paketuar brenda një adrese
  sinjalizimi.ts      SDP-ja e ngjeshur brenda një adrese — pa DOM, pa WebRTC
  lidhja.ts           kanali WebRTC dhe rruga e sinjalit mes skedave
  lidhjaMeServer.ts   mënyra me kod, e vetmja që prek një server
  ngarko.ts           lexo-nga-baza si hook
  sherbimi.ts         çka ruhet për punë pa internet, dhe çka nuk preket —
                      pa DOM, pa `caches`
  analitika.ts        emri i rrugës që i shkon matjes, dhe pastrimi i adresës —
                      pa DOM, pa rrjetë
  matja.ts            numërimi i hapjeve te strehuesi: skripti dhe ndërrimi i
                      rrugës, asnjë vendim
  punetori.ts         punëtori i shërbimit: tri ngjarje, asnjë vendim
  instalimi.ts        regjistrimi, dhe njoftimi kur del një version i ri
  ikonat.tsx          ikonat SVG inline
  style.css           sistemi i stilit
  pamjet/             Grupet · Grupi · Loja · Shiko · Lidhu · Pergjigja
                      Bashkohu
  pjeset/             Renditja · Raundet · Shlyerja · TabelaEPergjithshme
                      FutjaERaundit · LojtaretELojes · PanelaEKopjes
                      RregullatELojes
                      Ndarja · Drejtperdrejt · PaServer · MeServer
                      PamjaERezultatit · KodiQR
                      FutjaEMagarecit · RrjetiIMagarecit · RaundetEMagarecit
                      PergjithshmetEMagarecit · Parashikimi
                      PermbledhjaEPamjes · Vetja

test/
  llogaritjet.test.mjs   totalet, renditja, matrica — kundër `logic.json`-it
  lojerat.test.mjs       regjistri: shkronjat e paketës, drejtimet, kufijtë
  fundi.test.mjs         kur mbaron mbrëmja e secilës lojë, dhe mbyllja me dorë
  fusha.test.mjs         futja e pikëve negative pa tastierë me minus, dhe
                         data ditë/muaj/vit sa shkruhet
  pikezimi.test.mjs      rregullat — kundër raundeve të vërteta
  magareci.test.mjs      shkronjat, fjala e mbushur dhe tabela e grupit
  parashikimi.test.mjs   kufijtë e një raundi, dhe ligjet që vendi i mundshëm
                         nuk i thyen dot — mbi totalet e `logic.json`-it
  kopja.test.mjs         nxjerrja dhe refuzimi i skedarëve të dëmtuar
  qr.test.mjs            matrica të ngrira, të verifikuara me një dekodues
  ndarja.test.mjs        paketimi, dhe refuzimi i adresave të prera
  sinjalizimi.test.mjs   SDP-ja e ngjeshur — kundër SDP-ve të vërteta, dhe
                         refuzimi i rreshtave të futur brenda një adrese
  kodi.test.mjs          kodi i bashkimit, dhe shkronjat që ngatërrohen
  sherbimi.test.mjs      lista e asaj që ruhet, koshët e vjetër, dhe kërkesat
                         që punëtori nuk i prek fare
  logic.json             fleta origjinale, si burim provash
  sdp.json               SDP të vërteta të Chromium-it, si burim provash
```

Arsyetimi pas zgjidhjeve rri te [`CLAUDE.md`](CLAUDE.md).

## Stili

Paleta, kartelat dhe tabelat vijnë nga
[Kujdestaria](https://github.com/rilindkycyku/kujdestaria) — e njëjta paletë
blu-nate me smerald e cian, dhe numrat tabelorë te kolonat. Dy gjëra ndryshojnë
me qëllim:

- **Fonti është [Quicksand](https://fonts.google.com/specimen/Quicksand)**, e
  vendosur brenda paketës te `public/shkronja/`. Nuk merret nga Google Fonts
  gjatë hapjes: faqja duhet të hapet e plotë pa internet.
- **Asnjë kalim ngjyre.** Veprimi kryesor, çelësat e shtypur dhe shenja e faqes
  marrin ngjyrë të plotë; sfondi rri i sheshtë.

Kontrasti mbetet **WCAG AA** në dritë e në terr: teksti mbi veprimin kryesor
del 5.5:1 dhe 7.6:1, dhe kufijtë e kontrolleve mbi 3:1 sipas WCAG 1.4.11.
