// One immutable official Monster InvoC art catalogue.
// Publisher transports the original and three new images from Combat (global-assets).
// Do not duplicate binary artwork or mutate player files or game rules.
const DIR='../../../vendor/combat-lab/assets/library/capture/';
const HISTORICAL='file_0000000089ec81f4a7bdfd03220f487c.png';
export const CAPTURE_OFFICIAL_BACKGROUND_ART_V1=Object.freeze([
 Object.freeze({id:'polocendre',assetId:'gensrpg:wallpaper:polocendre',label:'Polocendre · Volcan',file:'file_00000000ee088210a7c5cb3bea4d5068.png'}),
 Object.freeze({id:'givre',assetId:'gensrpg:wallpaper:givre',label:'Gorice et Veldra · Givre',file:'file_0000000090d481f48cc94001c7925590.png'}),
 Object.freeze({id:'raiiven',assetId:'gensrpg:wallpaper:raiiven',label:'Raiiven · Lune violette',file:'raiiven_sous_la_lune_violette.png'})
]);
export function captureOfficialArtByIdV1(assetId){
 return CAPTURE_OFFICIAL_BACKGROUND_ART_V1.find(a=>a.assetId===assetId)??null;
}
export function captureOfficialArtUrlV1(art,base=import.meta.url){
 if(!art||captureOfficialArtByIdV1(art.assetId)!==art)
  throw new RangeError('Illustration officielle Monster InvoC inconnue');
 return new URL(DIR+art.file,base).href;
}
export function captureOfficialLoadingArtUrlsV1(base=import.meta.url){
 return Object.freeze([
  new URL(DIR+HISTORICAL,base).href,
  ...CAPTURE_OFFICIAL_BACKGROUND_ART_V1.map(art=>captureOfficialArtUrlV1(art,base))
 ]);
}
