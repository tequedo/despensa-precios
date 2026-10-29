const partName = /^[a-f0-9]{24}\.json$/;
const count = value => Number.isSafeInteger(value) && value >= 0;

// The branch remains one quotation source even when its catalogue needs
// several bounded files. Never expose an incomplete or mixed generation.
export async function readPriceShard(header, loadPart, expected = {}) {
  if (!header || ![1, 2].includes(header.version) || !header.store?.externalId)
    throw new Error('Archivo de sucursal inválido');
  if ((expected.storeId && header.store.externalId !== expected.storeId)
    || (expected.generatedAt && header.generatedAt !== expected.generatedAt)
    || (expected.sourceDate && header.sourceDate !== expected.sourceDate))
    throw new Error('Sucursal pendiente de actualización');
  let prices;
  if (header.version === 1) {
    if (!Array.isArray(header.prices) || header.prices.some(row => !Array.isArray(row)))
      throw new Error('Precios de sucursal inválidos');
    prices = header.prices;
  } else {
    const parts = header.parts;
    if (!count(header.records) || !header.records || !Array.isArray(parts) || !parts.length
      || header.prices !== undefined || parts.some(part => !partName.test(part?.file ?? '')
        || !count(part.records) || !part.records)
      || new Set(parts.map(part => part.file)).size !== parts.length
      || parts.reduce((sum, part) => sum + part.records, 0) !== header.records)
      throw new Error('Índice de partes de sucursal inválido');
    prices = [];
    const seen = new Set();
    for (const part of parts) {
      const piece = await loadPart(part.file);
      if (piece?.version !== 1 || piece.kind !== 'price-part'
        || piece.storeId !== header.store.externalId || piece.generatedAt !== header.generatedAt
        || piece.sourceDate !== header.sourceDate || !Array.isArray(piece.prices)
        || piece.prices.length !== part.records)
        throw new Error('Parte de sucursal ausente o de otra actualización');
      for (const row of piece.prices) {
        if (!Array.isArray(row) || !row[0] || row[6] !== header.sourceDate || seen.has(String(row[0])))
          throw new Error('Precios incompletos o repetidos entre partes de sucursal');
        seen.add(String(row[0]));
        prices.push(row);
      }
    }
  }
  if (count(expected.records) && prices.length !== expected.records)
    throw new Error('La cantidad de precios no coincide con la sucursal');
  return header.version === 1 ? header : {...header, version: 1, prices};
}
