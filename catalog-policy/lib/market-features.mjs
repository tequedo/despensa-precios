import { normalize, packageEvidence, roundMoney } from './price-safety.mjs';
import {reviewedCatalogEntry,oilUse,nonDrinkingWater} from './catalog-semantics.mjs';
import {productSearchFamily} from './product-search.mjs';
// Navigation labels are app classifications, never proof that two products match.
/** @type {Array<[string, RegExp]>} */
const categories = [
    ['Mascotas', /\b(perro|gato|mascota|pedigree|whiskas|dog chow|cat chow)\b/],
    ['Higiene', /\b(shampoo|champu|acondicionador|desodorante|dentifrico|dental|panal|toalla femenina|jabon de tocador)\b/],
    ['Limpieza', /\b(detergente|lavandina|limpiador|suavizante|jabon en polvo|papel higienico|servilleta|rollo de cocina|bolsa de residuos)\b/],
    ['Bebidas', /\b(agua|gaseosa|jugo|cerveza|vino|soda|coca cola|pepsi)\b/],
    ['Lácteos', /\b(leche|yogur|yogurt|manteca|queso|crema de leche)\b/],
    ['Carnes', /\b(asado|vacio|matambre|bife|carne|pollo|cerdo|pechuga|merluza|pescado)\b/],
    ['Almacén', /\b(aceite|arroz|fideo|fideos|harina|azucar|sal|yerba|te|cafe|alfajor|alfajores|galletita|galletitas|chocolate|mayonesa|dulce|mermelada|salsa|pan|atun|lenteja|poroto|garbanzo|papas fritas|lays|lay s|takis)\b/],
];
export const MARKET_CATEGORIES = categories.map(([label]) => label).concat('Otros');
export function marketCategory(product) {
    if(product.catalogReview?.code==='semantic_fingerprint_changed')return 'Otros';
    const reviewed=reviewedCatalogEntry(product);if(reviewed)return reviewed.category;
    const text=normalize(`${product.name??''} ${product.brand??''}`),main=productSearchFamily(product),use=oilUse(text);
    if(use)return use==='personal'?'Higiene':use==='household'?'Limpieza':'Otros';
    if(/\bagua\b/.test(text)&&nonDrinkingWater(text))return /\b(micelar|oxigenada|colonia|desmaquillante|limpiadora|facial|corporal)\b/.test(text)?'Higiene':/\b(lavandina|hipoclorito|desinfectante)\b|\bpara plancha\b/.test(text)?'Limpieza':'Otros';
    if(['copa','vaso','envase','cuchara','pinza','filtro','cafetera','celular','libro','mamadera','batidor','espumador','abridor','dispensador','dosificador','exprimidor','naranja'].includes(main)||/\bbolsa (?:de|para) vino\b/.test(text))return 'Otros';
    if(['coloracion','shampoo','desodorante','leche limpiadora'].includes(main))return 'Higiene';
    if(main==='difusor')return 'Limpieza';
    if(['licor','cocktail','espumante'].includes(main))return 'Bebidas';
    if(['cuadril','colita de cuadril','cuadrada','carre','bondiola'].includes(main))return 'Carnes';
    if(main==='crema'&&/\bcrema (?:de |d )?leche\b/.test(text))return 'Lácteos';
    if(main==='crema'&&/\b(?:p|para|de) cafe\b/.test(text))return 'Almacén';
    if(main==='jabon'&&/\bjabon (?:blanco|pan|para la ropa)\b/.test(text))return 'Limpieza';
    if(main==='jabon'&&/\b(intimo|manos|piel|antibacterial|exfoliant(?:e)?|humectacion)\b/.test(text))return 'Higiene';
    if(main==='tomate'&&/\b(triturado|cubeteado|conserva|extracto|concentrado)\b/.test(text))return 'Almacén';
    if(['empanada','ensalada','pasta de mani'].includes(main))return 'Almacén';
    if(main==='bebida')return /\bbebida (?:lact|leche)/.test(text)?'Lácteos':'Bebidas';
    if(['alfajor','galletita','chocolate','bombon','dulce de leche','dulce','bano repostero','barra','bizcocho','budin','bocadito','baguette','magdalena','cafe','cacao','choclo','torta','caramelo','cereal','snack','cracker','croqueta','caballa','chorito','vinagre','mayonesa','atun','anchoa','condimento','pizza','pure','tostada'].includes(main))return 'Almacén';
    return categories.find(([,pattern])=>pattern.test(text))?.[0]??'Otros';
}
export function comparableUnit(price, product) {
    // A vessel's capacity or an appliance's specification is not bought food
    // volume. Source sizes may still support discovery, never a price per litre.
    if(['copa','vaso','envase','cuchara','pinza','filtro','cafetera','celular','libro','mamadera','batidor','espumador','abridor','dispensador','dosificador','exprimidor'].includes(productSearchFamily(product))||(productSearchFamily(product)==='difusor'&&/\baparato\b/.test(normalize(product.name))))return null;
    const amount = Number(price), evidence = packageEvidence(product);
    if (!(amount > 0) || !Number.isFinite(amount) || !evidence)
        return null;
    if (evidence.content) {
        const quantity = evidence.content.amount * evidence.pack / 1000;
        if (!(quantity > 0))
            return null;
        return { price: roundMoney(amount / quantity), unit: evidence.content.dimension === 'mass' ? 'kg' : 'L', quantity, calculated: true };
    }
    // Counting an unspecified package does not establish equal roll length or quality.
    return null;
}
export function commonBasket(rows, items) {
    const active = rows.filter(row => Array.isArray(row.details));
    const ids = items.filter(item => active.length > 1 && active.every(row => row.details.some(detail => detail.id === item.id))).map(item => item.id);
    const common = new Set(ids);
    return { ids, excluded: items.filter(item => !common.has(item.id)).map(item => item.name), rows: active.map(row => ({ ...row, total: roundMoney(row.details.filter(detail => common.has(detail.id)).reduce((sum, detail) => sum + detail.subtotal, 0)) })).sort((a, b) => a.total - b.total) };
}
export function twoStorePlan(items, quotes, extraTravel = 0) {
    if (!items.length || !Number.isFinite(extraTravel) || extraTravel < 0)
        return null;
    const keys = [...new Set(items.flatMap(item => (quotes[item.id]?.options ?? []).map(q => q.storeId || q.store)))].slice(0, 12);
    const candidate = (stores) => {
        const lines = items.map(item => { const choices = (quotes[item.id]?.options ?? []).filter(q => stores.includes(q.storeId || q.store) && Number.isFinite(q.price) && q.price > 0).sort((a, b) => a.price - b.price); const q = choices[0]; return q ? { id: item.id, name: item.name, quantity: item.shoppingQuantity, store: q.store, storeId: q.storeId || q.store, subtotal: roundMoney(q.price * item.shoppingQuantity) } : null; });
        if (lines.some(line => !line))
            return null;
        return { stores: [...new Set(lines.map(line => line.storeId))], lines, total: roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0)) };
    };
    const singles = keys.map(key => candidate([key])).filter(Boolean).sort((a, b) => a.total - b.total);
    const pairs = [];
    for (let i = 0; i < keys.length; i++)
        for (let j = i + 1; j < keys.length; j++) {
            const result = candidate([keys[i], keys[j]]);
            if (result && result.stores.length === 2)
                pairs.push(result);
        }
    pairs.sort((a, b) => a.total - b.total);
    const best = pairs[0];
    if (!best)
        return null;
    return { ...best, single: singles[0] ?? null, grossSaving: singles[0] ? roundMoney(singles[0].total - best.total) : null, travel: extraTravel, netTotal: roundMoney(best.total + extraTravel), netSaving: singles[0] ? roundMoney(singles[0].total - best.total - extraTravel) : null };
}
export function shoppingText(items, quotes = {}, label = 'Mi lista', date = new Date().toISOString()) {
    const lines = items.map(item => { const q = quotes[item.id]; return `• ${item.shoppingQuantity ?? item.quantity} × ${[item.name, item.brand, item.presentation].filter(Boolean).join(' · ')}${q ? ` — $${roundMoney(q.price * (item.shoppingQuantity ?? item.quantity)).toLocaleString('es-AR')} · ${q.store} · precio del ${q.validDate ?? 'fecha no confirmada'}` : ' — sin precio informado'}`; });
    return `${label}\n${new Date(date).toLocaleDateString('es-AR')}\n\n${lines.join('\n')}\n\nPrecios informados sujetos a vigencia y disponibilidad. Las promociones sin verificar no están descontadas.`;
}
export function replacementCandidate(original, candidate) {
    if (normalize(original.brand) !== normalize(candidate.brand) || !original.brand || normalize(original.brand) === 'sin especificar')
        return false;
    const a = packageEvidence(original), b = packageEvidence(candidate);
    if (!a?.content || !b?.content || a.content.dimension !== b.content.dimension || a.pack !== b.pack)
        return false;
    const ratio = b.content.amount / a.content.amount;
    if (ratio < .8 || ratio > 1.25 || Math.abs(ratio - 1) < .00001)
        return false;
    const base = text => normalize(text).replace(/\b\d+(?:\s+\d+)?\s*(kg|gr|g|ml|cc|cm3|l|litro|litros)\b/g, '').replace(/\s+/g, ' ').trim();
    return base(original.name) === base(candidate.name);
}
export function replacementQuantity(original, candidate, quantity) {
    if (!replacementCandidate(original, candidate) || !Number.isInteger(quantity) || quantity < 1)
        return null;
    const from = packageEvidence(original), to = packageEvidence(candidate);
    const required = Math.ceil(quantity * from.content.amount / to.content.amount);
    return required <= 99 ? { quantity: required, originalContent: quantity * from.content.amount * from.pack / 1000, replacementContent: required * to.content.amount * to.pack / 1000, unit: from.content.dimension === 'mass' ? 'kg' : 'L' } : null;
}
export function replenishment(items, purchases, days = 14) {
    return items.map(item => {
        const history = purchases.filter(p => p.productId === item.id).sort((a, b) => Date.parse(a.purchasedAt) - Date.parse(b.purchasedAt));
        const span = history.length > 1 ? (Date.parse(history.at(-1).purchasedAt) - Date.parse(history[0].purchasedAt)) / 86400000 : 0;
        const rate = span >= 7 ? history.slice(0, -1).reduce((sum, p) => sum + p.quantity, 0) / span : null;
        const projected = rate ? rate * days : Math.max(1, item.minimumStock);
        const needed = Math.max(0, projected - item.stock);
        return { ...item, rate, observations: history.length, days, quantity: item.unit === 'kg' ? Math.ceil(needed * 4) / 4 : Math.ceil(needed), basis: rate ? 'Ritmo de compras registrado; revisá el consumo real' : 'Stock mínimo; aún faltan compras para estimar' };
    }).filter(item => item.quantity > 0);
}
