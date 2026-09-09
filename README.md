# Bridzh — pikët e mbrëmjes

Numërues pikësh për **bridzhin kosovar**, varianti i xhin-ramit që luhet me 14
letra dhe mbyllet me 51 pikë. Zëvendëson fletën e Google Sheets-it: shënon
pikët e secilit raund dhe nxjerr vetë totalet, renditjen dhe shlyerjen.

Fiton **totali më i vogël**.

## Çka bën

- **Grupe dhe lojtarë** — shoqëria futet një herë, radha e emrave ruhet.
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
- **Historik sipas ditës** — një grup ka shumë lojëra, edhe dy të njëjtën ditë.
- **Redaktim dhe fshirje** — çdo raund ndryshohet pas ruajtjes; gjithçka
  rillogaritet vetvetiu.
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
npm test          # node --test — 52 prova, pa framework provash
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
  ngarko.ts           lexo-nga-baza si hook
  ikonat.tsx          ikonat SVG inline
  style.css           sistemi i stilit
  pamjet/             Grupet · Grupi · Loja
  pjeset/             Renditja · Raundet · Shlyerja
                      FutjaERaundit · LojtaretELojes · PanelaEKopjes

test/
  llogaritjet.test.mjs   totalet, renditja, matrica — kundër `logic.json`-it
  fusha.test.mjs         futja e pikëve negative pa tastierë me minus
  pikezimi.test.mjs      rregullat — kundër raundeve të vërteta
  kopja.test.mjs         nxjerrja dhe refuzimi i skedarëve të dëmtuar
  logic.json             fleta origjinale, si burim provash
```

Arsyetimi pas zgjidhjeve rri te [`CLAUDE.md`](CLAUDE.md).

## Stili

Sistemi vizual është ai i [Kujdestarisë](https://github.com/rilindkycyku/kujdestaria):
të njëjtat tokena, e njëjta paletë blu-nate me smerald e cian, i njëjti font
sistemi me numra tabelorë, të njëjtat kartela dhe tabela.
