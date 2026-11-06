// Presentation-only URL adapter for the already published official Combat artwork.
// It never creates an asset catalogue or downloads from a moving Lab branch.
export function publishedCapturePortraitUrlV1({card,moduleUrl}={}){
 const file=card?.portrait?.file;
 if(typeof file!=='string'||
   !/^(?:capture|core)\/[a-zA-Z0-9_.\/-]+\.(?:png|webp|jpg|jpeg)$/i.test(file)||
   file.split('/').includes('..'))return null;
 const root=new URL('../../../vendor/exploration-lab/capture-assets/assets/library/',moduleUrl);
 const result=new URL(file,root);
 if(result.origin!==root.origin||!result.pathname.startsWith(root.pathname))return null;
 return result.href;
}
