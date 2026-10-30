// UI adapter to the unmodified Combat Lab editor and Bestiary transported from its pinned main SHA.
// It cannot author a creature, skill, combat rule, drop or XP; only the Lab's
// own published UI and export protocols may do that. This adapter has NO
// alternate editor model, combat runtime, storage, exporter or fallback.
const PAGE=Object.freeze({
 creature:{file:"examples/dom-demo/capture-editor-v2.html",tab:"creature"},
 skill:{file:"examples/dom-demo/capture-editor-v2.html",tab:"skills"},
 rules:{file:"examples/dom-demo/capture-editor-v2.html",tab:"combat"},
 bestiary:{file:"examples/dom-demo/bestiary.html",tab:null}
});
const REQUIRED_CAPABILITIES=Object.freeze(["creature-editor","skill-editor","combat-rules-editor","bestiary"]);

export function createCaptureLabAuthorUiProviderV1({labBaseUrl,hostOrigin,mountLabPage}={}){
 if(typeof labBaseUrl!=="string"||!labBaseUrl)throw new TypeError("Published Combat Lab author URL is required");
 if(typeof hostOrigin!=="string"||!hostOrigin)throw new TypeError("Host origin is required");
 if(typeof mountLabPage!=="function")throw new TypeError("Native Lab page host is required");
 const base=new URL(labBaseUrl);
 const host=new URL(hostOrigin);
 if(base.protocol!=="https:"||base.origin!==host.origin||
    base.pathname!=="/Zombicide-40k/vendor/combat-lab/"||
    base.search||base.hash) {
  throw new TypeError("Only the same-origin GenSrpg pinned Combat main vendor author is supported");
 }
 const handles=new WeakSet();
 function openAuthoring(kind,context={}){
  const page=PAGE[kind];
  if(!page)throw new RangeError("Unknown Combat Lab author domain");
  if(!context||typeof context!=="object"||Array.isArray(context))
   throw new TypeError("Author context must be an object");
  const url=new URL(page.file,base);
  if(page.tab)url.searchParams.set("tab",page.tab);
  const mounted=mountLabPage(Object.freeze({kind,url:url.href,tab:page.tab,context}));
  if(!mounted||typeof mounted!=="object"||typeof mounted.dispose!=="function")
   throw new TypeError("Actual Lab author view did not mount");
  handles.add(mounted);
  return mounted;
 }
 function closeAuthoring(handle){
  if(!handle||!handles.has(handle))return false;
  handles.delete(handle);
  handle.dispose();
  return true;
 }
 return Object.freeze({
  protocol:1,version:"1.2.0",capabilities:REQUIRED_CAPABILITIES,
  openAuthoring,closeAuthoring
 });
}
