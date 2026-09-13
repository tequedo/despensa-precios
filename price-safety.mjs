export const PROVINCES = [
 ["AR-C","02","Ciudad Autónoma de Buenos Aires"],["AR-B","06","Buenos Aires"],
 ["AR-K","10","Catamarca"],["AR-H","22","Chaco"],["AR-U","26","Chubut"],["AR-X","14","Córdoba"],
 ["AR-W","18","Corrientes"],["AR-E","30","Entre Ríos"],["AR-P","34","Formosa"],["AR-Y","38","Jujuy"],
 ["AR-L","42","La Pampa"],["AR-F","46","La Rioja"],["AR-M","50","Mendoza"],["AR-N","54","Misiones"],
 ["AR-Q","58","Neuquén"],["AR-R","62","Río Negro"],["AR-A","66","Salta"],["AR-J","70","San Juan"],
 ["AR-D","74","San Luis"],["AR-Z","78","Santa Cruz"],["AR-S","82","Santa Fe"],
 ["AR-G","86","Santiago del Estero"],["AR-V","94","Tierra del Fuego, Antártida e Islas del Atlántico Sur"],["AR-T","90","Tucumán"]
].map(([code,id,name])=>({code,id,name}));
export const normalize = value => String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function provinceFor(value) {
 const key=normalize(value);
 return PROVINCES.find(p=>[p.code,p.id,p.name,p.code.slice(3)].some(v=>normalize(v)===key))
  ?? (/^(caba|capital federal|ciudad de buenos aires)$/.test(key)?PROVINCES[0]:key==="tierra del fuego"?PROVINCES.find(p=>p.code==="AR-V"):undefined);
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
 const source=String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/,/g,".");
 return [...source.matchAll(/(\d+(?:\.\d+)?)\s*(kilogramos?|kgm|kgr|kilos?|kg|gramos?|grm|gr|g|litros?|lts?|l|ml|cc|cm3)(?![a-z])/g)].map(m=>{
 const volume=/^(litro|lt|l$|ml|cc|cm3)/.test(m[2]);
 const large=/^(k|litro|lt|l$)/.test(m[2]);
 return {amount:Number(m[1])*(large?1000:1),dimension:volume?"volume":"mass"};
 });
}
const packCount=value=>{const text=normalize(value);const m=text.match(/(?:pack|paquete)\s*(?:de|x)?\s*(\d+)|\b(\d+)\s*x\s*\d+\s*(?:l|lt|ml|g|gr|kg)\b/);return m?Number(m[1]??m[2]):1;};
export function sameSize(requested,...actual) {
 const expectedPack=packCount(requested);if(actual.some(a=>packCount(a)>1&&packCount(a)!==expectedPack))return false;
 const expected=sizes(requested)[0];
 if(!expected)return !requested||actual.some(a=>normalize(a)===normalize(requested));
 return actual.flatMap(sizes).some(s=>s.dimension===expected.dimension&&Math.abs(s.amount-expected.amount)<0.001);
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

