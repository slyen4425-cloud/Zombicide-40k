// Presentation only. Never rename, migrate or truncate saved session IDs.
export function adventureSaveDisplayNameV1({worldName,heroName}={}){
 const clean=(value,fallback)=>typeof value==='string'&&value.trim()
  ?value.trim().replace(/[\\/\u0000-\u001f\u007f]/g,' ').slice(0,80):fallback;
 return clean(worldName,'Monde local')+'_'+clean(heroName,'Héros');
}
