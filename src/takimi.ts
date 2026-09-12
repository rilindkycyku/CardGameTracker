/**
 * Takimi — sinjalizimi te vetë origjina e aplikacionit.
 *
 * Mënyra e tretë e lidhjes, dhe arsyeja pse ekziston rri te pika 1 e
 * `CLAUDE.md`-së: **ky është i vetmi vend te projekti ku pranohet një server i
 * yni**, dhe pranohet me kërkesë të shprehur të pronarit. Pa të, një kod i
 * vetëm tetëkarakterësh kërkonte një server të huaj (`peerjs.com`), dhe kur ai
 * binte binte bashkë me të e tërë mbrëmja.
 *
 * Çka e mban shmangjen të ngushtë, dhe asnjëra nuk guxon të hiqet:
 *
 * - **Serveri prek vetëm shtrëngimin e duarve.** Nëpër të kalojnë dy varga: ftesa
 *   dhe përgjigja, pra pikërisht ato që te mënyra pa server kalojnë nëpër dy
 *   kode QR. Pikët nuk e prekin kurrë — sapo kanali hapet, asnjë kërkesë nuk
 *   niset më. Kjo është ndryshe nga PeerJS-i, i cili e mban prizën hapur tërë
 *   mbrëmjen.
 * - **Asgjë nuk mbahet.** Vargu rri sa një kufi kohe (`JETA`) dhe pastaj
 *   zhduket vetë. Nuk ka llogari, nuk ka cookie, nuk ka regjistër.
 * - **Vargu nuk lexohet dot nga serveri si pikë.** Ftesa e përgjigja janë
 *   kredencialet ICE dhe gishtëza DTLS — emra, raunde e totale nuk hyjnë aty
 *   fare. Serveri sheh se dy anë u takuan, kur, dhe nga cila adresë.
 * - **Alfabeti është i ngushtë te të dyja anët.** Shtegu është i hapur për
 *   këdo, prandaj çka shkruhet kontrollohet si çdo gjë tjetër që vjen nga
 *   jashtë (pika 7): kodi tetë karaktere të alfabetit, roli një nga dy, trupi
 *   nën `KUFIRI` bajte dhe pa asnjë karakter që adresa a SDP-ja e lexon si
 *   ndarës.
 *
 * Nuk njeh as DOM, as `fetch`: adresat i ndërton si varg dhe vendimet i kthen
 * si vlera, që të provohen me `node --test`. Kërkesa rri te `lidhjaMeTakim.ts`
 * dhe te `api/sinjali.ts`, njësoj si `kodi.ts` krah `lidhjaMeServer.ts`.
 */

import { ALFABETI, GJATESIA } from './kodi.ts';

/** Shtegu i vetëm që prek serverin tonë. */
export const SHTEGU = '/api/sinjali';

/** Sa rri një varg te serveri para se të zhduket vetë, në sekonda. */
export const JETA = 180;

/**
 * Sa i gjatë lejohet trupi.
 *
 * Ftesa e mënyrës pa server del rreth 240 karaktere, dhe ajo është e njëjta
 * paketë që kalon këtu. Një mijë lë vend për kandidatë më shumë se çdo telefon
 * i vërtetë, dhe e mban shtegun të padobishëm për këdo që do ta përdorë si
 * vend ruajtjeje.
 */
export const KUFIRI = 1000;

/** Dy anët e shtrëngimit. Çdo emër tjetër refuzohet. */
export const ROLET = ['ftese', 'pergjigje'] as const;
export type Roli = (typeof ROLET)[number];

/**
 * Alfabeti i trupit.
 *
 * I njëjti si te `paketa.ts`: base64 i sigurt për adresa, plus ndarësit që
 * `sinjalizimi.ts` i përdor. Asgjë tjetër nuk kalon — as `\r`, as `\n`, as
 * hapësira — sepse një rresht i futur brenda një sinjali do të shpikte një
 * kandidat `relay` dhe do t'i çonte pikët te një server i huaj (pika 7).
 */
const TRUPI = /^[A-Za-z0-9\-_.~|,:%]+$/;

/** A është ky një kod i ligjshëm — tetë karaktere të alfabetit të kodit. */
export function kodIRregullt(kodi: unknown): kodi is string {
  if (typeof kodi !== 'string' || kodi.length !== GJATESIA) return false;
  for (const shkronja of kodi) if (!ALFABETI.includes(shkronja)) return false;
  return true;
}

/** A është ky një rol i ligjshëm. */
export function roliIRregullt(roli: unknown): roli is Roli {
  return typeof roli === 'string' && (ROLET as readonly string[]).includes(roli);
}

/** A është ky një trup i ligjshëm — gjatësi dhe alfabet. */
export function trupiIRregullt(trupi: unknown): trupi is string {
  return (
    typeof trupi === 'string'
    && trupi.length > 0
    && trupi.length <= KUFIRI
    && TRUPI.test(trupi)
  );
}

/**
 * Çelësi te vendi i ruajtjes.
 *
 * Kodi dhe roli kontrollohen para se të vijnë këtu, prandaj asnjë karakter i
 * çuditshëm nuk hyn dot te çelësi — por parathënja rri gjithsesi, që kjo të mos
 * përplaset me çka tjetër mund të rrijë te i njëjti vend ruajtjeje.
 */
export function celesi(kodi: string, roli: Roli): string {
  return `takim:${kodi}:${roli}`;
}

/** Adresa e pyetjes ose e shkrimit, e ndërtuar nga rrënja e faqes. */
export function adresaESinjalit(rrenja: string, kodi: string, roli: Roli): string {
  const baza = rrenja.split('#')[0]!.replace(/\/+$/, '');
  return `${baza}${SHTEGU}?kodi=${kodi}&roli=${roli}`;
}

/** Adresa që hap pamjen dhe lidhet vetë, pa e shkruar kodin. */
export function adresaETakimit(rrenja: string, kodi: string): string {
  return `${rrenja.split('#')[0]!.replace(/\/+$/, '')}/#/takohu/${kodi}`;
}

/**
 * Sa pritet para pyetjes tjetër, në milisekonda.
 *
 * Nis shpejt sepse ana tjetër zakonisht sapo ka skanuar kodin dhe pret duke
 * parë ekranin; qetësohet pastaj, sepse një kod i lënë hapur mbi tavolinë nuk
 * ka pse t'i dërgojë serverit një kërkesë në sekondë tërë mbrëmjen.
 */
export function pritjaEPyetjes(prova: number): number {
  if (prova <= 20) return 1_000;
  if (prova <= 60) return 2_000;
  return 5_000;
}

/**
 * Sa gjatë pyetet për një përgjigje para se ftesa të përtërihet.
 *
 * Ftesa mban kredencialet ICE të një `RTCPeerConnection`-i që rri hapur; pas
 * disa minutash ajo lidhje nuk ia vlen më të mbahet, dhe një ftesë e re kushton
 * një kërkesë. Më e shkurtër se `JETA`, që vargu te serveri të mos zhduket nën
 * këmbët e një pyetjeje që ende pret.
 */
export const AFATI_I_FTESES = 150_000;

/**
 * Serverat ICE, nga `VITE_ICE_SERVERS`.
 *
 * E zbrazët — dhe kështu rri te prodhimi — do të thotë **asnjë**: pa STUN e pa
 * TURN mblidhen vetëm kandidatë `typ host`, prandaj asnjë server i tretë nuk
 * kontaktohet dhe lidhja del vetëm brenda së njëjtës rrjetë (pika 7). Kjo është
 * ajo që e mban mënyrën e takimit pa asnjë të tretë fare: serveri i vetëm që
 * preket është yni, dhe vetëm sa zgjat shtrëngimi i duarve.
 *
 * Ekziston sepse kush ka një TURN të vetin mund ta shtojë, dhe atëherë kjo
 * mënyrë punon edhe nëpër rrjeta të ndryshme. Asnjë adresë nuk vjen e shkruar
 * te kodi, për të njëjtën arsye si te serverat e sinjalizimit: një «parazgjedhje
 * e përshtatshme» do të ishte një i tretë i ri që nuk do të dukej te asnjë
 * ekran.
 *
 * Formati: adresa `stun:`/`turn:` të ndara me presje, dhe secila mund të mbajë
 * `përdorues:fjalëkalim@` përpara për një TURN që i kërkon.
 */
export function serveratEICE(thene: string | null | undefined): RTCIceServer[] {
  if (typeof thene !== 'string') return [];

  const lista: RTCIceServer[] = [];

  for (const copa of thene.split(/[,\s]+/)) {
    const pastruar = copa.trim();
    if (!/^(stun|turn|turns):/i.test(pastruar)) continue;

    const [skema, pjesa] = pastruar.split(/:(.*)/s) as [string, string];
    const ndarja = pjesa.lastIndexOf('@');

    if (ndarja === -1) {
      lista.push({ urls: `${skema}:${pjesa}` });
      continue;
    }

    const [perdoruesi, ...fjalekalimi] = pjesa.slice(0, ndarja).split(':');
    lista.push({
      urls: `${skema}:${pjesa.slice(ndarja + 1)}`,
      username: perdoruesi ?? '',
      credential: fjalekalimi.join(':'),
    });
  }

  return lista;
}
