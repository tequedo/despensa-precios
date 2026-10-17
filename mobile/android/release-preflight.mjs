import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const APPLICATION_ID = 'ar.rindecasa.app';
export const ORIGIN = 'https://despensa-inteligente.f0d9cc43-9db2-41a1-8976-25cea8b73f32.chatgpt.site';
const KEYS = ['RINDECASA_UPLOAD_KEYSTORE', 'RINDECASA_UPLOAD_STORE_PASSWORD', 'RINDECASA_UPLOAD_KEY_ALIAS', 'RINDECASA_UPLOAD_KEY_PASSWORD'];

export function releasePreflight({ env, assetLinks = null, fileExists = existsSync }) {
  const blockers = [];
  for (const key of KEYS) if (!env[key]) blockers.push(`Falta ${key}.`);
  if (env.RINDECASA_UPLOAD_KEYSTORE && !fileExists(env.RINDECASA_UPLOAD_KEYSTORE)) blockers.push('No está disponible el almacén de la clave de carga.');
  if (/^androiddebugkey$/i.test(env.RINDECASA_UPLOAD_KEY_ALIAS ?? '')) blockers.push('No se acepta la clave de depuración para publicación.');
  if (env.RINDECASA_APPLICATION_ID_CONFIRMED !== APPLICATION_ID) blockers.push('Falta confirmar el identificador definitivo de la aplicación.');
  const fingerprint = String(env.RINDECASA_PLAY_SIGNING_SHA256 ?? '').toUpperCase();
  const validFingerprint = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fingerprint) && new Set(fingerprint.replaceAll(':', '')).size > 1;
  if (!validFingerprint) blockers.push('Falta una huella SHA-256 real del certificado de firma de Play, no de la clave de carga.');
  const associated = validFingerprint && Array.isArray(assetLinks) && assetLinks.some(link =>
    Array.isArray(link?.relation) && link.relation.includes('delegate_permission/common.handle_all_urls') &&
    link.target?.namespace === 'android_app' && link.target.package_name === APPLICATION_ID &&
    Array.isArray(link.target.sha256_cert_fingerprints) && link.target.sha256_cert_fingerprints.some(value => typeof value === 'string' && value.toUpperCase() === fingerprint));
  if (!associated) blockers.push('Falta comprobar assetlinks.json del origen público con el paquete y certificado de Play correctos.');
  return { applicationId: APPLICATION_ID, origin: ORIGIN, readyForSignedBuild: blockers.length === 0,
    readyForPlaySubmission: false, blockers,
    pendingBeyondBuild: ['Privacidad y eliminación de cuenta probadas.', 'Pruebas físicas en Android y acceso del revisor.', 'Marca según la condición del titular.', 'Ficha, Seguridad de los datos y revisión de Play.'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let assetLinks = null;
  try { if (process.env.RINDECASA_ASSETLINKS_FILE) assetLinks = JSON.parse(readFileSync(process.env.RINDECASA_ASSETLINKS_FILE, 'utf8')); }
  catch { /* An unreadable or invalid proof cannot authorize release. */ }
  const result = releasePreflight({env: process.env, assetLinks});
  // Never print credential values, paths, certificates or private key material.
  console.log(JSON.stringify(result, null, 2));
  if (!result.readyForSignedBuild) process.exitCode = 1;
}
