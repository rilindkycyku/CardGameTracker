# Bridzh — pikët e mbrëmjes

Numërues pikësh për **bridzhin kosovar**, varianti i xhin-ramit që luhet me 14
letra dhe mbyllet me 51 pikë. Zëvendëson fletën e Google Sheets-it: shënon
pikët e secilit raund dhe nxjerr vetë totalet, renditjen dhe shlyerjen.

Fiton **totali më i vogël**.

## Çka bën

- **Grupe dhe lojtarë** — shoqëria futet një herë, e tërë me një shkrim
  («meri, lesa, lila, rila»), dhe radha e emrave ruhet.
- **Zgjedhje para lojës** — grupi mund të ketë gjashtë të rregullt dhe sonte të
  luajnë katër.
- **Shtim mes lojës** — kush ulet te tavolina në raundin e pestë shtohet aty për
  aty, nga grupi ose si emër krejt i ri; raundet e shkuara nuk i preken dhe
  totali i tij nis nga hera e parë që shënon.
- **Futje e raundit** — një numër për lojtar, ose përmes llogaritësit
  hant/normal.
- **Renditja** — ngjitshëm sipas totalit, i pari është ai me më pak pikë. Kur
  nuk kanë luajtur të gjithë njësoj, shtohet kolona „raunde" dhe një shënim.
- **Shlyerja** — matrica N×N e diferencave, `matrica[i][j] = total[i] − total[j]`,
  me lojtarët sipas renditjes.
- **Historik sipas ditës** — një grup ka shumë lojëra, edhe dy të njëjtën ditë,
  secila me renditjen e vet përfundimtare aty për aty.
- **Të përgjithshmet** — një tabelë për tërë grupin: lojëra, fitore dhe totali
  mesatar për lojë, e llogaritur nga vetë raundet.
- **Redaktim dhe fshirje** — çdo raund ndryshohet pas ruajtjes; gjithçka
  rillogaritet vetvetiu.
- **Pikët drejtpërdrejt** — kush rri rreth tavolinës i shikon pikët në
  telefonin e vet, dhe raundi i ri del vetë. Lidhja bëhet drejt mes telefonave
  me një kanal WebRTC, në dy mënyra:
  - **Pa server** (parazgjedhja) — sinjalizimi kalon nëpër dy kode QR dhe
    kamerën e telefonit, prandaj server nuk duhet as për t'u lidhur. Kërkon që
    telefonat të rrinë te e njëjta rrjetë.
  - **Me kod** — një kod i vetëm tetëkarakterësh, që diktohet me zë ose
    skanohet një herë. Punon edhe nëpër rrjeta të ndryshme, por i duhet
    internet dhe një server i huaj për t'i lidhur pajisjet. Nuk niset vetë
    kurrë, dhe ekrani e thotë çka del nga pajisja.
- **Ose një fotografi e çastit** — rezultati shkon brenda vetë adresës dhe
  adresa bëhet kod QR. Punon edhe atje ku rrjeta i ndan pajisjet nga
  njëra-tjetra, dhe edhe nëpër mesazh.

  Të dyja hapen edhe në një telefon që nuk e ka aplikacionin, dhe asnjëra nuk
  lexon as shkruan në bazën e tij.
- **Kopje rezervë** — nxjerrja dhe kthimi i tërë historikut si një skedar JSON.

Punon pa internet. Të dhënat rrinë vetëm në shfletuesin e pajisjes.

## Rregullat e pikëzimit

Çdo raund mbyllet nga një lojtar që arrin 51 pikë me kombinime prej një dore me
14 letra. Dy mbyllje:

| | Mbyllësi | Të tjerët që s’hapën | Të tjerët që kishin hapur |
| --- | --- | --- | --- |
| **Hant** — mbylli pa hedhur e pa shitur asnjë letër | −40 | +200 | 2 × pikët në dorë |
| **Normal** — kishte hapur më parë | −20 | +100 | pikët në dorë |

„I hapur" është lojtari që ka hedhur së paku një letër ose i ka shitur një letër
dikujt atë raund.

Llogaritësi i zbaton këto rregulla, por fushat e numrave mbeten gjithmonë të
redaktueshme: te fletët e vjetra ka raunde që nuk dalin nga rregullat, dhe një
aplikacion që pranon vetëm kombinimet e lejuara nuk do t’i shënonte dot.

## Komandat

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # tsc --noEmit && vite build
npm run preview
npm test          # node --test — 122 prova, pa framework provash
```

`npm test` para çdo commit-i.

## Struktura

```
src/
  main.tsx            pikënisja
  App.tsx             shpërndarja e rrugëve
  rruga.ts            rrugëtimi me hash
  tipet.ts            tipet e të dhënave
  llogaritjet.ts      totalet, renditja, matrica, rrjedha — pa DOM, pa bazë
  pikezimi.ts         rregullat hant/normal — pa DOM, pa bazë
  ruajtja.ts          IndexedDB përmes `idb`
  kopja.ts            nxjerrja dhe leximi i kopjes rezervë
  fusha.ts            teksti i fushës së pikëve dhe shenja e tij
  qr.ts               kodues QR i shkruar me dorë (byte, niveli L, v1–20)
  paketa.ts           base64 i sigurt për adresa, dhe nënshkrimi
  kodi.ts             kodi tetëkarakterësh i bashkimit — pa DOM, pa rrjetë
  ndarja.ts           rezultati i paketuar brenda një adrese
  sinjalizimi.ts      SDP-ja e ngjeshur brenda një adrese — pa DOM, pa WebRTC
  lidhja.ts           kanali WebRTC dhe rruga e sinjalit mes skedave
  lidhjaMeServer.ts   mënyra me kod, e vetmja që prek një server
  ngarko.ts           lexo-nga-baza si hook
  ikonat.tsx          ikonat SVG inline
  style.css           sistemi i stilit
  pamjet/             Grupet · Grupi · Loja · Shiko · Lidhu · Pergjigja
                      Bashkohu
  pjeset/             Renditja · Raundet · Shlyerja · TabelaEPergjithshme
                      FutjaERaundit · LojtaretELojes · PanelaEKopjes
                      Ndarja · Drejtperdrejt · PaServer · MeServer
                      PamjaERezultatit · KodiQR

test/
  llogaritjet.test.mjs   totalet, renditja, matrica — kundër `logic.json`-it
  fusha.test.mjs         futja e pikëve negative pa tastierë me minus
  pikezimi.test.mjs      rregullat — kundër raundeve të vërteta
  kopja.test.mjs         nxjerrja dhe refuzimi i skedarëve të dëmtuar
  qr.test.mjs            matrica të ngrira, të verifikuara me një dekodues
  ndarja.test.mjs        paketimi, dhe refuzimi i adresave të prera
  sinjalizimi.test.mjs   SDP-ja e ngjeshur — kundër SDP-ve të vërteta, dhe
                         refuzimi i rreshtave të futur brenda një adrese
  kodi.test.mjs          kodi i bashkimit, dhe shkronjat që ngatërrohen
  logic.json             fleta origjinale, si burim provash
  sdp.json               SDP të vërteta të Chromium-it, si burim provash
```

Arsyetimi pas zgjidhjeve rri te [`CLAUDE.md`](CLAUDE.md).

## Stili

Sistemi vizual është ai i [Kujdestarisë](https://github.com/rilindkycyku/kujdestaria):
të njëjtat tokena, e njëjta paletë blu-nate me smerald e cian, i njëjti font
sistemi me numra tabelorë, të njëjtat kartela dhe tabela.
