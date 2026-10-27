import reviews from '../data/catalog-search-reviews.json' with {type:'json'};
import {normalize} from './price-safety.mjs';
import {barcodeIdentity} from './product-identity.mjs';

const entries=new Map(reviews.products.map(entry=>[barcodeIdentity(entry.barcode).gtin,entry]));
export const nonDrinkingWater = text => /\b(micelar|oxigenada|colonia|destilada|desmaquillante|limpiadora|facial|corporal|lavandina|hipoclorito|desinfectante)\b|\bpara (?:plancha|bateria|radiador)\b/.test(normalize(text));

// A reviewed alias is not a source edit or a new identity match. Require the
// verified barcode and the exact observed name/brand fingerprint together.
export function reviewedCatalogEntry(product){
 if(product.barcodeStatus!=='valid_format_and_checksum')return null;
 const raw=String(product.barcode??'').trim(),key=raw.padStart(14,'0'),entry=entries.get(key);
 if(!entry||barcodeIdentity(raw).gtin!==key)return null;
 if(!entry||!entry.names.some(name=>normalize(name)===normalize(product.name))
   ||!entry.brands.some(brand=>normalize(brand)===normalize(product.brand)))return null;
 return entry;
}

export function oilUse(value){
 const text=normalize(value);
 if(!/\baceite\b/.test(text))return null;
 if(/\b(bebe|baby|corporal|solar)\b/.test(text))return 'personal';
 if(/\b(citronella|hornillo|aromatizante|aromatizador)\b/.test(text))return 'household';
 if(/\b(motos?|motor|cadenas|lubricante)\b/.test(text))return 'mechanical';
 if(/\b(pescado|capsulas)\b/.test(text))return 'other';
 return null;
}
