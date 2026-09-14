#!/usr/bin/env python3
"""Read-only 4.3/4.5 audit. Counts are rows per branch, not unique products."""
import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import unicodedata


def gtin_valid(value):
    if not re.fullmatch(r'(?:\d{8}|\d{12}|\d{13}|\d{14})', value) or not int(value):
        return False
    total = sum(int(x) * (3 if i % 2 == 0 else 1) for i, x in enumerate(reversed(value[:-1])))
    return (10 - total % 10) % 10 == int(value[-1])


def audit(root, selected_files=None):
    totals, examples, per_file = Counter(), {}, []
    seen, conflicting = {}, set()

    def issue(key, row, path):
        totals[key] += 1
        samples = examples.setdefault(key, [])
        if len(samples) < 3:
            samples.append({'file': path, **{k: row.get(k) for k in ['id_comercio', 'id_sucursal', 'id_producto', 'productos_ean', 'productos_descripcion', 'productos_marca', 'productos_cantidad_presentacion', 'productos_unidad_medida_presentacion', 'productos_precio_lista']}})

    for path in sorted(root.rglob('productos.csv')):
        relative = path.relative_to(root).as_posix()
        if selected_files is not None and relative not in selected_files:
            continue
        count = 0
        with path.open(encoding='utf-8-sig', newline='') as source:
            reader = csv.DictReader(source, delimiter='|')
            for row in reader:
                if all(not (value or '').replace('\x00', '').strip() for value in row.values() if not isinstance(value, list)) and None not in row:
                    totals['blank_or_nul_rows_excluded'] += 1
                    continue
                first = unicodedata.normalize('NFD', (row.get('id_comercio') or '')).encode('ascii', 'ignore').decode().lower()
                if first.startswith('ultima actualizacion:'):
                    totals['metadata_footer_rows_excluded'] += 1
                    continue
                count += 1
                totals['rows'] += 1
                if None in row:
                    issue('column_count_mismatch', row, relative)
                    continue
                product_id = (row.get('id_producto') or '').strip()
                flag = (row.get('productos_ean') or '').strip()
                totals['ean_flag_' + flag] += 1
                if flag == '1':
                    if gtin_valid(product_id):
                        totals['valid_declared_gtin_rows'] += 1
                        totals['gtin_currently_replaced_with_internal_key'] += 1
                    else:
                        issue('invalid_declared_gtin', row, relative)
                elif flag != '0':
                    issue('unexpected_ean_flag', row, relative)
                for field, issue_name in [('id_producto', 'missing_id'), ('productos_descripcion', 'missing_description'), ('productos_marca', 'missing_brand'), ('productos_cantidad_presentacion', 'missing_quantity'), ('productos_unidad_medida_presentacion', 'missing_unit')]:
                    if not (row.get(field) or '').strip():
                        issue(issue_name, row, relative)
                key = tuple((row.get(x) or '').strip() for x in ['id_comercio', 'id_bandera', 'id_producto'])
                identity = tuple((row.get(x) or '').strip() for x in ['productos_descripcion', 'productos_marca', 'productos_cantidad_presentacion', 'productos_unidad_medida_presentacion'])
                identity_hash = hashlib.sha256(json.dumps(identity, ensure_ascii=False).encode()).digest()
                if key in seen and seen[key] != identity_hash:
                    if key not in conflicting:
                        issue('identifier_with_different_identity', row, relative)
                        conflicting.add(key)
                else:
                    seen[key] = identity_hash
                price = (row.get('productos_precio_lista') or '').strip()
                if not re.fullmatch(r'-?(?:\d+(?:[.,]\d*)?|[.,]\d+)', price):
                    issue('unrecognized_price_format', row, relative)
                elif float(price.replace(',', '.')) <= 0:
                    issue('non_positive_price', row, relative)
                elif float(price.replace(',', '.')) < 100:
                    totals['positive_prices_below_current_import_threshold'] += 1
        per_file.append({'file': relative, 'rows': count})
        print(json.dumps({'file': relative, 'rows': count}), flush=True)
    return {'schemaVersion': 1, 'checkedAt': datetime.now(timezone.utc).isoformat(),
            'scope': 'Todos los productos.csv de la réplica del 12/09/2026; registros por sucursal, sin filtro de canasta ni geográfico.',
            'points': ['4.3', '4.5'], 'uniqueScopedIdentifiers': len(seen), 'counters': dict(totals), 'files': per_file, 'examples': examples,
            'limitations': ['La validez matemática de un GTIN no demuestra correspondencia física con el envase.', 'La comparación contra el original gubernamental permanece pendiente.', 'Identidades diferentes requieren revisión; variación textual no prueba que sean productos distintos.', 'No se modificaron precios, productos ni existencias con esta auditoría.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = audit(args.root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'counters': result['counters'], 'uniqueScopedIdentifiers': result['uniqueScopedIdentifiers']}))
