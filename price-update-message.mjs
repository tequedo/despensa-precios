export function priceUpdateDetails(coverage, provenance, now = new Date()) {
  if (!coverage.geographyVerified) throw new Error('La cobertura nacional no tiene geografía validada');
  if (!['official_original_integrity_checked', 'replica_integrity_checked'].includes(provenance.status)) {
    throw new Error('No se puede anunciar una actualización sin adquisición validada');
  }
  const modified = provenance.officialResource?.last_modified;
  const modifiedMs = Date.parse(modified);
  if (!Number.isFinite(modifiedMs) || modifiedMs > +now) throw new Error('Fecha real de origen ausente o inválida');
  const hours = Math.floor((+now - modifiedMs) / 3600_000);
  const source = provenance.sourceType === 'official_original' ? 'descarga directa del catálogo oficial' : 'réplica de terceros; no es una descarga oficial directa';
  const date = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(modifiedMs));
  return [
    'La importación y su comprobación de lectura en la app terminaron correctamente.',
    `Archivo de origen publicado: ${date} (Argentina), hace ${hours} horas. Fuente: ${source}.`,
    ...(hours > 26 ? ['ATENCIÓN: el archivo tiene más de 26 horas; esta ejecución no acredita precios nuevos del día.'] : []),
    'La fecha del archivo no reemplaza la vigencia informada por cada sucursal y producto.',
    `Jurisdicciones con datos: ${coverage.provinces.filter(p => p.stores > 0).length}`,
    `Sucursales con provincia validada: ${coverage.provinces.reduce((n, p) => n + p.stores, 0)}`,
    `Registros de precios: ${coverage.provinces.reduce((n, p) => n + p.records, 0)}`,
  ];
}
