/* GenSrpG Core Asset Resolver V1 — generic path/candidate resolution only.
   Module-specific roots, IDs, catalogs and visual fallbacks stay in their owning module. */
(function(root,factory){
"use strict";
const api=factory();
if(typeof module==="object"&&module.exports){module.exports=api;return}
if(root)root.GensAssetResolverV1=api;
})(typeof window!=="undefined"?window:null,function(){
"use strict";
const VERSION="1.0.0";

function clean(value){
  return typeof value==="string"?value.trim():"";
}

function first(candidates){
  const list=Array.isArray(candidates)?candidates:[candidates];
  for(const value of list){
    const normalized=clean(value);
    if(normalized)return normalized;
  }
  return "";
}

function join(root,file){
  const base=clean(root),leaf=clean(file);
  if(!base||!leaf)return "";
  return base.replace(/\/+$/,"")+"/"+leaf.replace(/^\/+/, "");
}

function resolve(options={}){
  const explicit=first(options.candidates||[]);
  if(explicit)return explicit;
  const generated=join(options.root,options.file);
  if(generated)return generated;
  return clean(options.fallback);
}

return Object.freeze({VERSION,clean,first,join,resolve});
});
