export const PROVINCES = [
 ["AR-C","02","Ciudad Autónoma de Buenos Aires"],["AR-B","06","Buenos Aires"],
 ["AR-K","10","Catamarca"],["AR-H","22","Chaco"],["AR-U","26","Chubut"],["AR-X","14","Córdoba"],
 ["AR-W","18","Corrientes"],["AR-E","30","Entre Ríos"],["AR-P","34","Formosa"],["AR-Y","38","Jujuy"],
 ["AR-L","42","La Pampa"],["AR-F","46","La Rioja"],["AR-M","50","Mendoza"],["AR-N","54","Misiones"],
 ["AR-Q","58","Neuquén"],["AR-R","62","Río Negro"],["AR-A","66","Salta"],["AR-J","70","San Juan"],
 ["AR-D","74","San Luis"],["AR-Z","78","Santa Cruz"],["AR-S","82","Santa Fe"],
 ["AR-G","86","Santiago del Estero"],["AR-V","94","Tierra del Fuego, Antártida e Islas del Atlántico Sur"],["AR-T","90","Tucumán"]
].map(([code,id,name])=>({code,id,name}));
const normalizedTexts=new Map(),sizeResults=new Map(),packageResults=new Map();
const remember=(cache,key,value,limit=10000)=>{if(key.length<=2048){if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,value);}return value;};
export const normalize = value => {
 const text=String(value??''),cached=normalizedTexts.get(text);if(cached!==undefined)return cached;
 return remember(normalizedTexts,text,text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim());
};
// Every source row checks its province. Normalize the fixed aliases once,
// instead of scanning and normalizing all 24 provinces for every product.
const provinceKeys = new Map();
for (const province of PROVINCES) {
 for (const value of [province.code,province.id,province.name,province.code.slice(3)]) {
  const key=normalize(value);if(!provinceKeys.has(key))provinceKeys.set(key,province);
 }
}
for(const alias of ['caba','capital federal','ciudad de buenos aires'])provinceKeys.set(alias,PROVINCES[0]);
provinceKeys.set('tierra del fuego',provinceKeys.get('ar v'));
export function provinceFor(value) {
 return provinceKeys.get(normalize(value));
}
export function isoDate(value) {
 const s=String(value??"").slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const n=new Date(s+"T00:00:00Z");
 return Number.isFinite(n.getTime())&&n.toISOString().slice(0,10)===s?s:null;
}
export const argentinaDate = (now=Date.now())=>new Date(now-3*3600000).toISOString().slice(0,10);
export function freshDate(value,now=Date.now(),maxDays=3) {
 const date=isoDate(value);if(!date)return false;
 const age=(Date.parse(argentinaDate(now))-Date.parse(date))/86400000;
 return age>=0&&age<=maxDays;
}
export function coordinate(value,min,max) {
 if(value===null||value===undefined||value==="")return null;
 const n=Number(value);return Number.isFinite(n)&&n>=min&&n<=max?n:null;
}
export function distanceKm(aLat,aLon,bLat,bLon) {
 if([aLat,aLon,bLat,bLon].some(v=>v===null||v===undefined||!Number.isFinite(v)))return null;
 const rad=n=>n*Math.PI/180;
 const h=Math.sin(rad(bLat-aLat)/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(rad(bLon-aLon)/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function sizes(value) {
 const text=String(value??'');let result=sizeResults.get(text);
 if(result===undefined)result=remember(sizeResults,text,parseSizes(text),4096);
 return result.map(size=>({...size}));
}
function parseSizes(value) {
 const source=String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/,/g,".");
 // UNECE volume codes used by SEPA: CMQ = cm³ and LTR = litre.
 return [...source.matchAll(/(\d+(?:\.\d+)?|\.\d+)\s*(kilogramos?|kgm|kgr|kilos?|kg|gramos?|grm|grs?|g|litros?|ltr|lts?|l|ml|cc|cm3|cmq)(?![a-z])/g)].map(m=>{
 const volume=/^(litro|lt|l$|ml|cc|cm3|cmq)/.test(m[2]);
 const large=/^(k|litro|lt|l$)/.test(m[2]);
 return {amount:Number(m[1])*(large?1000:1),dimension:volume?"volume":"mass"};
 });
}
const packageText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/,/g, '.').replace(/[×✕]/g, 'x').replace(/(\d)\s*-\s*(?=[a-z])/g, '$1 ');
const sameAmount = (a,b) => a.dimension === b.dimension && Math.abs(a.amount - b.amount) < 0.001;
const packUnit = '(?:kilogramos?|kgm|kgr|kilos?|kg|gramos?|grm|grs?|g|litros?|ltr|lts?|l|ml|cc|cm3|cmq)(?![a-z])';
// "Doy pack x 950 GRS" and "caja x 500 g" state mass, not 950/500 units.
const namedPack = '\\b(?:pack|paquete|caja)\\s*(?:de|x)?\\s*(\\d+(?:\\.\\d+)?)(?![\\d.])\\b(?!\\s*'+packUnit+')';
const packCounts = new RegExp(namedPack+'|\\b(\\d+)\\s*x\\s*(?:\\d+(?:\\.\\d+)?|\\.\\d+)\\s*'+packUnit+'|(?<![a-z])'+packUnit+'\\.?\\s*x\\s*(\\d+)\\b|\\bx\\s*(\\d+)\\s*(?:unidad(?:es)?|uni|un|uds|u)\\b','g');

export function packageEvidence(product) {
 const key=JSON.stringify([String(product.presentation??''),String(product.name??''),String(product.brand??'')]);
 let result=packageResults.get(key);
 if(result===undefined)result=remember(packageResults,key,inspectPackage(product));
 // Callers retain fresh, independently mutable results. The memoized evidence
 // never escapes, and a changed source name/brand/size gets a different key.
 return result?{...result,...(result.content?{content:{...result.content}}:{})}:null;
}
function inspectPackage(product) {
  const presentation = packageText(product.presentation), name = packageText(product.name);
  // "1854 X 120 GRS" names the numeric brand 1854, not 1,854 packs.
  // Use the supplied brand field; do not guess a brand from a large number.
  const brand = normalize(product.brand);
  const countName = /^\d+$/.test(brand) ? name.replace(new RegExp('\\b'+brand+'\\b','g'), ' ') : name;
  if (!presentation.trim()) return null;
  const declared = sizes(presentation);
  let described = sizes(name);
  // Some retailers repeat the same content in a trailing packaging field:
  // "Shampoo 180 ml BOT-180-ml.". This is one package, not "180 ml + 180 ml".
  const suffix = name.match(/\s+[a-z]{3}-(\d+(?:\.\d+)?|\.\d+)\s+[a-z0-9]+\.?\s*$/);
  if (suffix && described.length === 2) {
    const main = sizes(name.slice(0, suffix.index)), trailing = sizes(suffix[0]);
    if (main.length === 1 && trailing.length === 1 && sameAmount(main[0], trailing[0])) described = main;
  }
  // A source label can repeat content as ", BRAND, 4000 cm3" after "4 L".
  // Require the supplied brand and a measurement-only final field. A bundle,
  // an extra item or a contradictory measurement still cannot pass this check.
  const parts=String(product.name??'').split(','),tail=packageText(parts.at(-1)),metadataBrand=parts.at(-2);
  if(described.length===2&&brand&&parts.length>=3&&normalize(metadataBrand)===brand
    &&new RegExp('^\\s*(?:\\d+(?:\\.\\d+)?|\\.\\d+)\\s*'+packUnit+'\\.?\\s*$').test(tail)){
    const body=packageText(parts.slice(0,-2).join(',')),main=sizes(body),trailing=sizes(tail);
    if(!/[+]/.test(body)&&main.length===1&&trailing.length===1&&sameAmount(main[0],trailing[0]))described=main;
  }
  // Multiple size mentions can describe a bundle, even when each amount is
  // identical ("1 L + 1 L"). They cannot establish one package automatically.
  if (declared.length > 1 || described.length > 1) return null;
  const dispenser = /^(?:dispensador|dispenser|dosificador)\b/.test(normalize(product.name));
  const countedCapacity = dispenser || /^exprimidor\b/.test(normalize(product.name));
  const unitCount = presentation.match(/^\s*(\d+(?:\.\d+)?)\s*(?:unidad(?:es)?|uni|un|uds?|u|ea)\.?\s*$/)?.[1]
    ?? (dispenser?presentation.match(/^\s*(\d+(?:\.\d+)?)\s*cu\.?\s*$/)?.[1]:undefined);
  const counts = [];
  for (const text of [presentation, countName]) {
    for (const match of text.matchAll(packCounts)) {
      counts.push(Number(match[1] ?? match[2] ?? match[3] ?? match[4]));
    }
  }
  if (unitCount && Number(unitCount) !== 1) counts.push(Number(unitCount));
  if (counts.some(count => !Number.isInteger(count) || count < 1 || count !== counts[0])) return null;
  const pack = counts[0] ?? 1;
  // A counted dispenser or juicer is bought as an object. Its stated volume is
  // a specification, not included food or detergent. Preserve the source count;
  // multiple capacities and contradictory declared contents still fail above.
  if(countedCapacity&&unitCount&&!declared.length&&described.length===1&&described[0].dimension==='volume')return {label:normalize(presentation),pack};
  // A generic "1 UNI" may describe one explicitly named bottle. An actual
  // mass/volume declaration (e.g. 1 gr versus 1000 gr in the name) is never
  // silently replaced by the description. Preserve the retailer's raw fields.
  const content = declared[0] ?? (Number(unitCount) === 1 ? described[0] : undefined);
  if (content) {
    if (!(content.amount > 0) || [...declared, ...described].some(size => !sameAmount(size, content))) return null;
    return {content, pack};
  }
  if (described.length) return null;
  return {label: normalize(presentation), pack};
}

export const compatiblePackages = (a,b) => Boolean(a && b && a.pack === b.pack && (a.content && b.content ? sameAmount(a.content,b.content) : !a.content && !b.content && a.label === b.label));

// Presentation is authoritative; the name may complete a generic "1 UNI".
export function sameSize(requested, presentation, name = '', requestedName = '', brand = '') {
  if (!requested) return false;
  return compatiblePackages(packageEvidence({presentation:requested,name:requestedName,brand}), packageEvidence({presentation,name,brand}));
}
export const roundMoney=value=>Math.round((value+Number.EPSILON)*100)/100;
export const conditionalPromotion=text=>/(tarjeta|banco|jubilad|anses|tope|reintegro|billetera|\bapp\b|cuenta|club|socio|membres|exclusiv|minim|m[ií]nim|superior|acumul|seleccionad|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i.test(text);
export function promotionTotal(quantity,price,verified=false) {
 const unit=Number(price.listPrice),base=roundMoney(unit*quantity);
 const unchanged={total:base,saved:0,promotion:""};
 if(!Number.isFinite(unit)||unit<=0||!Number.isFinite(quantity)||quantity<=0)throw new Error("Cantidad o precio inválido");
 const text=String(price.promoConditions??"");
 if(!verified||conditionalPromotion(text)||price.requiredBenefit||price.discountCap)return unchanged;
 let total=base;
 // Structured rules are mandatory. A bare percentage in prose is never enough.
 if(price.promoKind==="nxm") {
  const buy=Number(price.buyQuantity),pay=Number(price.payQuantity);
  if(!Number.isInteger(quantity)||!Number.isInteger(buy)||!Number.isInteger(pay)||pay<1||buy<=pay||buy>100)return unchanged;
  total=(Math.floor(quantity/buy)*pay+quantity%buy)*unit;
 } else if(price.promoKind==="second_unit") {
  const percent=Number(price.discountPercent);
  if(!Number.isInteger(quantity)||!(percent>0&&percent<=100))return unchanged;
  total=(Math.floor(quantity/2)*(2-percent/100)+quantity%2)*unit;
 } else if(price.promoKind==="percent") {
  const percent=Number(price.discountPercent);
  if(!(percent>0&&percent<=100))return unchanged;
  total=base*(1-percent/100);
 } else if(price.promoKind==="special_price") {
  const promotional=Number(price.promoPrice);
  if(!(promotional>0&&promotional<=unit))return unchanged;
  total=promotional*quantity;
 } else return unchanged;
 total=roundMoney(total);
 return {total,saved:roundMoney(base-total),promotion:text||"Promoción verificada"};
}
