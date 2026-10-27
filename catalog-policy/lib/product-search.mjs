import { normalize, sizes, packageEvidence, sameSize } from './price-safety.mjs';
import { createProductIdMatcher, barcodeIdentity } from './product-identity.mjs';
import {reviewedCatalogEntry,oilUse,nonDrinkingWater} from './catalog-semantics.mjs';

const words={yogurt:'yogur',aceites:'aceite',aceitunas:'aceituna',acondicionadores:'acondicionador',aderezos:'aderezo',aguas:'agua',ajies:'aji',alfajores:'alfajor',alim:'alimento',alimentos:'alimento',anchoas:'anchoa',aritos:'arito',aromatizadores:'aromatizador',aromatizantes:'aromatizante',arroces:'arroz',arvejas:'arveja',asados:'asado',atunes:'atun',azucares:'azucar',bombones:'bombon',chocolates:'chocolate',libros:'libro',avellanas:'avellana',leches:'leche',barras:'barra',barrita:'barra',barritas:'barra',bebidas:'bebida',bizcoch:'bizcocho',bizcochos:'bizcocho',reposteria:'repostero',batidores:'batidor',mamaderas:'mamadera',bolsas:'bolsa',budines:'budin',bocad:'bocadito',bocaditos:'bocadito',madalena:'magdalena',madalenas:'magdalena',magdalenas:'magdalena',bananas:'banana',baguettes:'baguette',bifes:'bife',bondiolas:'bondiola',fideos:'fideo'};
Object.assign(words,{caramelos:'caramelo',cereales:'cereal',copos:'copo',chips:'chip',crackers:'cracker',cremas:'crema',croquetas:'croqueta',choritos:'chorito',caballas:'caballa',vinagres:'vinagre',licores:'licor',cucharas:'cuchara',pinzas:'pinza',filtros:'filtro',cafeteras:'cafetera',celulares:'celular',tostadas:'tostada',tortas:'torta',choclos:'choclo'});
Object.assign(words,{detergentes:'detergente',difusores:'difusor',discos:'disco',palitos:'palito',dispensadores:'dispensador',dispenser:'dispensador',dispensers:'dispensador',dosificadores:'dosificador',champu:'shampoo',shampoos:'shampoo',desodorantes:'desodorante'});
const productWord = word => Object.hasOwn(words,word)?words[word]:word;
const searchText=value=>normalize(value).replace(/\bbon o bon\b/g,'bonobon').replace(/\blay s\b/g,'lays');
// Search/filter spelling only; barcode identity and raw brand evidence stay exact.
export const matchesCatalogBrand=(actual,requested)=>searchText(actual)===searchText(requested);
const tokens = value => searchText(value).split(' ').filter(word => word && !['de','del','la','el','los','las','en'].includes(word)).map(productWord);
// The first named product defines its family: an ingredient, flavour or a
// container's intended beverage must not turn it into that other product.
const families = /\b(papel higienico|leche(?: de)? limp(?:ieza|iadora)|limpieza facial|dulce de leche|agua(?: de)? lavandina|arroz con leche|arroz inflado|bano(?: de)? repostero|aji no men|papas fritas|colita de cuadril|cuch(?:ar)? (?:de )?te|cuch fideo|lays|takis|cheetos|cerealitas|bonobon|difusor|disco|palito|dispensador|dosificador|shampoo|desodorante|dulce|cacao|choclo|torta|caramelo|cereal|copo|chip|cracker|crocante|croqueta|caballa|chorito|vinagre|licor|crema|complemento|cuchara|pinza|filtro|cafetera|celular|coloracion|maquillaje|calzado|cuadril|cuadrada|carre|pizza|pure|tostada|barra|bebida|bizcocho|budin|bocadito|magdalena|baguette|banana|batidor|mamadera|bolsa|bife|bondiola|alfajor(?:es)?|galletitas?|galletas?|helados?|chocolates?|bombon(?:es)?|libros?|avellanas?|aceitunas?|arvejas?|asados?|aji|aderezos?|atun|anchoas?|alimentos?|albondigas?|aritos?|condimentos?|acondicionador|antitranspirante|aromatiz(?:ante|ador)|algodon|espumador|envases?|vasos?|copas?|abridor|snacks?|leche|yogur(?:t)?|manteca|mayonesa|aceite|agua|azucar|sal|yerba|arroz|fideos?|harina|salsa|mermelada|cafe|te|queso|pan|jabon|detergente|lavandina|cerveza|vino|gaseosa|jugo|tomates?|postres?)\b/g;
const family = name => [...searchText(name).split(' ').map(productWord).join(' ').matchAll(families)][0]?.[0]?.replace(/^agua(?: de)? lavandina$/, 'lavandina').replace(/^bano de repostero$/, 'bano repostero').replace(/^(papas fritas|lays|takis|cheetos|chip|crocante)$/, 'snack').replace(/^cerealitas$/, 'galletita').replace(/^copo$/, 'cereal').replace(/^cuch(?:ar)? (?:de )?te$|^cuch fideo$/, 'cuchara').replace(/^(disco|palito)$/, 'snack').replace(/^antitranspirante$/, 'desodorante').replace(/^leche(?: de)? limp(?:ieza|iadora)$|^limpieza facial$/, 'leche limpiadora').replace(/^bonobon$/, 'bombon').replace(/^aji no men$/, 'fideo').replace(/^arroz con leche$/, 'postre').replace(/^arroz inflado$/, 'snack').replace(/^yogurt$/, 'yogur').replace(/^alfajores$/, 'alfajor').replace(/^(galletitas|galletas)$/, 'galletita').replace(/^(helados|chocolates|fideos|aderezos|anchoas|alimentos|albondigas|aritos|condimentos|envases|vasos|copas|snacks|tomates|postres)$/, value => value.slice(0,-1));
export const productSearchFamily=product=>{const review=reviewedCatalogEntry(product);return review?review.family:family(product.name);};
const vesselDiscoveryCapacity=product=>{
 if(!['dispensador','dosificador','copa','vaso','cafetera'].includes(productSearchFamily(product)))return null;
 const values=sizes(product.name);return values.length===1&&values[0].dimension==='volume'?values[0]:null;
};
const catalogWords=(product,review)=>tokens([product.name,product.brand,...(review?.aliases??[]),review?review.family:family(product.name),matchesCatalogBrand(product.brand,'Lays')?'papas fritas':''].filter(Boolean).join(' '));
const familyMatches=(product,query,review)=>{
 const specific=review?.rawPrefixes.some(prefix=>normalize(query).startsWith(normalize(prefix)));
 const expected=specific?review.family:family(query),actual=review?review.family:family(product.name);
 if(product.catalogReview?.code==='semantic_fingerprint_changed'&&expected&&normalize(query)!==normalize(product.name)&&!(tokens(query).length>1&&normalize(product.name).startsWith(normalize(query))))return false;
 if(!specific&&review?.blockedFamilies?.includes(expected))return false;
 return !expected||!actual||expected===actual||(expected==='dulce'&&['dulce de leche','mermelada'].includes(actual))||(expected==='aji'&&actual==='condimento')
   ||(expected==='chocolate'&&actual==='barra'&&/^barra(?: de)? chocolate\b/.test(searchText(product.name)))
   ||(tokens(query).length>1&&normalize(product.name).startsWith(normalize(query)));
};

// A blend containing sunflower is not the same selection as sunflower oil.
// Generic oil searches still discover both, with exact SKU selection as needed.
const oilKind = value => {
  const text = normalize(value);
  if (!/\baceite\b/.test(text)) return null;
  const kinds = ['girasol','oliva','maiz','soja','canola','mani','cartamo','coco'].filter(kind => new RegExp(`\\b${kind}\\b`).test(text));
  return /\b(mezcla|mix|blend)\b/.test(text) || kinds.length > 1 ? 'mezcla' : kinds[0] ?? null;
};
const matchesOilKind = (name, query) => {
  const expected = oilKind(query), actual = oilKind(name);
  return !expected || !actual || expected === actual;
};
const matchesOilUse=(product,query)=>{
 const expected=oilUse(query),actual=oilUse(`${product.name} ${product.brand??''}`);
 return expected?expected===actual:!oilKind(query)||!actual;
};
const matchesWaterUse=(name,query)=>!(/\bagua\b/.test(normalize(query))&&/\bagua\b/.test(normalize(name)))||nonDrinkingWater(name)===nonDrinkingWater(query);

export function matchesProductQuery(product, query) {
  const review=reviewedCatalogEntry(product),wanted = tokens(query), available = catalogWords(product,review);
  if (!wanted.length || !wanted.every(word => available.includes(word))) return false;
  return familyMatches(product,query,review) && matchesOilKind(product.name, query) && matchesOilUse(product,query) && matchesWaterUse(product.name,query);
}

// Discovery understands content units without changing the stricter quote matcher.
const measurePattern = /(?:\d+(?:[.,]\d+)?|[.,]\d+)\s*(?:kilogramos?|kgm|kgr|kilos?|kg|gramos?|grm|grs?|g|litros?|lts?|l|ml|cc|cm3)(?![a-z])/gi;
function catalogQuery(value) {
  const source = String(value ?? '').replace(/\bun litro y medio\b/gi, '1,5 L').replace(/\bun litro\b/gi, '1 L')
    .replace(/(\d{1,3}(?:\.\d{3})+)\s*(?=mililitros?\b|ml\b|gramos?\b|grs?\b|g\b|cc\b|cm3\b)/gi, value => value.replace(/\./g,''))
    .replace(/\bmililitros?\b/gi,'ml');
  const measures = sizes(source);
  let text = source.replace(measurePattern, ' ');
  const trailing = measures.length ? null : text.match(/\s(\d+(?:[.,]\d+)?)\s*$/);
  const amount = trailing ? Number(trailing[1].replace(',', '.')) : null;
  if (trailing) text = text.slice(0, trailing.index);
  return { text, measures, amount };
}

// Autocomplete accepts words still being typed. Quotes retain exact matching.
export function matchesCatalogQuery(product, query) {
  const {text, measures, amount} = catalogQuery(query);
  const review=reviewedCatalogEntry(product),wanted = tokens(text), available = catalogWords(product,review);
  if (!wanted.length || !wanted.every(word => available.some(value => value.startsWith(word)))) return false;
  if (!familyMatches(product,query,review)) return false;
  if (!matchesOilKind(product.name, query)||!matchesOilUse(product,query)||!matchesWaterUse(product.name,query)) return false;
  // Discovery must still find an explicitly named source row whose package is
  // quarantined. This never authorizes its price or a different SKU/size.
  if(normalize(product.name)===normalize(query))return true;
  if (!measures.length && amount === null) return true;
  // A reviewed vessel capacity supports discovery only. It never becomes the
  // package contents used for quote identity or price-per-litre calculations.
  const content = packageEvidence(product)?.content ?? review?.discoveryCapacity ?? vesselDiscoveryCapacity(product);
  if (!content) return false;
  return measures.length
    ? measures.every(size => size.dimension === content.dimension && Math.abs(size.amount - content.amount) < 0.001)
    : amount > 0 && (Math.abs(content.amount - amount) < 0.001 || Math.abs(content.amount - amount * 1000) < 0.001);
}

export function searchLocalCatalog(catalog, query) {
  return catalog.flatMap(product => {
    const availableSizes = product.presentations ?? [''];
    const brands = product.brands.filter(brand => availableSizes.some(presentation => matchesCatalogQuery({...product, name:`${product.name} ${product.category}`, brand, presentation}, query)));
    const presentations = availableSizes.filter(presentation => (brands.length ? brands : ['']).some(brand => matchesCatalogQuery({...product, name:`${product.name} ${product.category}`, brand, presentation}, query)));
    return presentations.length ? [{...product, brands, presentations}] : [];
  });
}

// Local retailer IDs can repeat an identical catalog option. Collapse only
// verified, internally consistent packages with identical displayed metadata.
// Keep the first concrete local ID; quote matching still uses its exact identity.
export function deduplicateCatalogChoices(choices) {
  const seen = new Set();
  return choices.filter(choice => {
    const identity = barcodeIdentity(choice.barcode);
    const brand = choice.brands?.[0], presentation = choice.presentations?.[0];
    if (choice.barcodeStatus !== 'valid_format_and_checksum' || !identity.gtin
      || choice.brands?.length !== 1 || choice.presentations?.length !== 1
      || !(choice.catalogPrice > 0) || !choice.priceDate || !choice.priceStore
      || !sameSize(presentation,presentation,choice.name,choice.name,brand)) return true;
    const {ean,barcode,barcodeStatus,...shown} = choice;
    const key = JSON.stringify([identity.gtin,Object.keys(shown).sort().map(key => [key,shown[key]])]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Familiar choices are available immediately; they do not claim a local price.
export function quickCatalogChoices(catalog, query, includeUnpriced = false) {
  if (String(query).trim().length < 2) return [];
  return searchLocalCatalog(catalog,query).filter(product => includeUnpriced || (!product.manualOnly && !product.bulkUnit)).slice(0,8);
}

// Suggest a spelling correction for discovery only. Price identity stays exact,
// and the query changes only after the person accepts the suggestion.
export function suggestedCatalogQuery(catalog, query) {
  const source=String(query??'').trim();
  if (source.length<4 || searchLocalCatalog(catalog,source).length) return null;
  const words=[...new Set(catalog.flatMap(product=>tokens([product.name,...product.brands].join(' '))))];
  const distance=(a,b)=>{
    const rows=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)rows[i][0]=i;
    for(let j=0;j<=b.length;j++)rows[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
      rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+Number(a[i-1]!==b[j-1]));
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1);
    }
    return rows[a.length][b.length];
  };
  let changes=0;
  const corrected=source.replace(/\p{L}+/gu,word=>{
    const normal=normalize(word);
    if(normal.length<4||words.includes(normal))return word;
    const limit=normal.length>=6?2:1;
    const candidates=words.filter(value=>Math.abs(value.length-normal.length)<=limit)
      .map(value=>({value,distance:distance(normal,value)})).filter(value=>value.distance<=limit).sort((a,b)=>a.distance-b.distance);
    if(!candidates.length||(candidates[1]&&candidates[1].distance===candidates[0].distance))return word;
    changes++;return candidates[0].value;
  });
  return changes>0&&changes<=2&&searchLocalCatalog(catalog,corrected).length ? corrected : null;
}

export function presentationLabel(value) {
  const content=sizes(value);
  if (content.length===1 && content[0].dimension==='volume' && content[0].amount>=1000 && /\bl(?:itros?|ts?)?\b/i.test(value)) {
    return `${value} (${new Intl.NumberFormat('es-AR').format(content[0].amount)} ml)`;
  }
  return value;
}

// Build the short product → brand → size flow from actual priced records.
// Unverified IDs, ambiguous varieties and packs keep their concrete SKU rows.
export function guidedCatalogChoices(catalog, products, query) {
  const represented = new Set(), choices = [];
  const matchesId = createProductIdMatcher(products.map(product => ({product})));
  for (const template of searchLocalCatalog(catalog, query)) {
    if (template.manualOnly || template.bulkUnit) continue;
    const matching = products.filter(product => matchesProductQuery(product, template.name)
      && template.brands.some(brand => matchesCatalogBrand(brand,product.brand))
      && template.presentations.some(size => sameSize(size, product.presentation, product.name, '', product.brand)));
    if (!matching.length) continue;
    const pairs = new Map(), combinations = [];
    for (const product of matching) {
      const evidence = packageEvidence(product);
      if (!evidence?.content || evidence.pack !== 1 || product.barcodeStatus !== 'valid_format_and_checksum' || !barcodeIdentity(product.barcode).gtin) continue;
      const brand = template.brands.find(value => matchesCatalogBrand(value,product.brand));
      const presentation = template.presentations.find(size => sameSize(size, product.presentation, product.name, '', product.brand));
      const key = `${brand}|${presentation}`;
      if (!pairs.has(key)) pairs.set(key, {brand,presentation,products:[]});
      pairs.get(key).products.push(product);
    }
    for (const {brand,presentation,products:peers} of pairs.values()) {
      const anchor=peers[0];
      if (!peers.every(product => matchesId(anchor.ean,product) && matchesId(product.ean,anchor))) continue;
      combinations.push({brand,presentation,ean:anchor.ean,name:anchor.name});
      peers.forEach(product => represented.add(product));
    }
    if (combinations.length) choices.push({...template, variants:undefined,packagings:undefined,brands:[...new Set(combinations.map(pair => pair.brand))], presentations:[...new Set(combinations.map(pair => pair.presentation))], availableCombinations:combinations});
  }
  return {choices, remaining:products.filter(product => !represented.has(product))};
}

export function productForChoice(choice, brand, presentation) {
  return choice?.availableCombinations?.find(pair => pair.brand === brand && pair.presentation === presentation);
}

export function presentationsForChoice(choice, brand) {
  return choice?.availableCombinations && brand
    ? [...new Set(choice.availableCombinations.filter(pair => pair.brand === brand).map(pair => pair.presentation))]
    : choice?.presentations ?? [];
}
