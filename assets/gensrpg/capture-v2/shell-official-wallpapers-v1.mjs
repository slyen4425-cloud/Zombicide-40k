// Author-approved Monster InvoC art: one read-only catalog for menu and loading.
// Exact PNG binaries remain canonically owned by Combat/global-assets.
// The PWA publisher transports the three exact verified blobs once.
const ROOT=new URL('../../../',import.meta.url);
export const CAPTURE_OFFICIAL_WALLPAPERS_V1=Object.freeze([
 Object.freeze({
  id:'gensrpg:wallpaper:raiiven-lune-violette',
  label:'Raiiven · Lune violette',
  path:'vendor/combat-lab/assets/library/capture/raiiven_sous_la_lune_violette.png',
  blobSha:'1bce6ae819d19e64370f65e1f6dc811eb063d2f3',
  bytes:2530477
 }),
 Object.freeze({
  id:'gensrpg:wallpaper:polocendre-volcan',
  label:'Polocendre · Volcan',
  path:'vendor/combat-lab/assets/library/capture/file_00000000ee088210a7c5cb3bea4d5068.png',
  blobSha:'8b4cf837d74643abf6e7d6246db716691f941222',
  bytes:2272467
 }),
 Object.freeze({
  id:'gensrpg:wallpaper:gorice-veldra-givre',
  label:'Gorice et Veldra · Givre',
  path:'vendor/combat-lab/assets/library/capture/file_0000000090d481f48cc94001c7925590.png',
  blobSha:'f3a8f75eed0d8d0f1f670d343107f53ec9bfc83b',
  bytes:2936672
 })
]);
export function captureOfficialWallpaperByIdV1(id){
 return CAPTURE_OFFICIAL_WALLPAPERS_V1.find(item=>item.id===id)??null;
}
export function captureOfficialWallpaperUrlV1(id){
 const item=captureOfficialWallpaperByIdV1(id);
 return item?new URL(item.path,ROOT).href:null;
}
export function captureOfficialLoadingArtUrlsV1(){
 return Object.freeze(CAPTURE_OFFICIAL_WALLPAPERS_V1.map(item=>
  new URL(item.path,ROOT).href));
}
