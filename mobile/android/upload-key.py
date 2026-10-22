"""Owner-operated upload-key creation and offline AAB signing (Python 3/JDK 17).

No network access, Play upload, credential files or passwords in command lines.
Run `python3 mobile/android/upload-key.py --help` from the checkout.
"""
import argparse
from datetime import datetime, timezone
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
from zipfile import BadZipFile, ZipFile

APPLICATION_ID = 'ar.rindecasa.app'
ALIAS = 'upload'
ROOT = Path(__file__).resolve().parents[2]
HELPER = Path(__file__).with_name('VerifyUploadBundle.java')
SECRET_ENV = 'DONDE_RINDE_KEY_PASSWORD'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def private_path(value):
    path = Path(value).expanduser()
    if not path.is_absolute():
        raise ValueError('Usá una ruta absoluta fuera del repositorio.')
    resolved = path.resolve()
    if resolved == ROOT or ROOT in resolved.parents:
        raise ValueError('Las claves y los paquetes de salida deben quedar fuera del repositorio.')
    if any((parent / '.git').exists() for parent in [resolved, *resolved.parents]):
        raise ValueError('No guardes claves ni paquetes de salida dentro de un repositorio Git.')
    return resolved


def tool(name):
    java_home = os.environ.get('JAVA_HOME')
    if java_home:
        candidate = Path(java_home) / 'bin' / (name + ('.exe' if os.name == 'nt' else ''))
        if candidate.is_file():
            return str(candidate)
    candidate = shutil.which(name)
    if not candidate:
        raise ValueError(f'Falta {name}. Instalá un JDK 17 completo desde un proveedor oficial.')
    return candidate


def run(arguments, password=None):
    environment = dict(os.environ)
    if password is not None:
        environment[SECRET_ENV] = password
    result = subprocess.run(arguments, env=environment, stdin=subprocess.DEVNULL,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise ValueError('Falló una herramienta de Java. Revisá JDK, contraseña y archivos; no se muestran datos privados.')
    return result.stdout


def write_new(path, content):
    with path.open('xb') as stream:
        stream.write(content)
    path.chmod(0o600)


def create_key(directory, backup_directory, password):
    primary, backup = private_path(directory), private_path(backup_directory)
    if primary == backup or primary in backup.parents or backup in primary.parents:
        raise ValueError('El respaldo debe estar en una ubicación distinta, fuera de la carpeta principal.')
    if primary.exists() or backup.exists():
        raise ValueError('Elegí dos carpetas nuevas. No se reemplazan claves o respaldos existentes.')
    if len(password) < 16 or not all(32 <= ord(character) <= 126 for character in password):
        raise ValueError('Usá al menos 16 caracteres ASCII visibles para la contraseña PKCS12.')
    keytool = tool('keytool')
    primary.mkdir(mode=0o700)
    backup.mkdir(mode=0o700)
    keystore = primary / 'upload.p12'
    run([keytool, '-genkeypair', '-keystore', str(keystore), '-storetype', 'PKCS12',
         '-alias', ALIAS, '-keyalg', 'RSA', '-keysize', '3072', '-sigalg', 'SHA256withRSA',
         '-validity', '10000', '-dname', 'CN=Donde Rinde Upload',
         '-storepass:env', SECRET_ENV, '-keypass:env', SECRET_ENV], password)
    keystore.chmod(0o600)
    pem = run([keytool, '-exportcert', '-rfc', '-keystore', str(keystore), '-alias', ALIAS,
               '-storepass:env', SECRET_ENV], password)
    certificate_sha = hashlib.sha256(ssl.PEM_cert_to_DER_cert(pem.decode())).hexdigest()
    metadata = {'schemaVersion': 1, 'applicationId': APPLICATION_ID, 'alias': ALIAS,
                'createdAt': datetime.now(timezone.utc).isoformat(),
                'uploadCertificateSha256': certificate_sha, 'keystoreSha256': digest(keystore),
                'isPlayDistributionCertificate': False}
    write_new(primary / 'upload-certificate.pem', pem)
    write_new(primary / 'upload-metadata.json', (json.dumps(metadata, indent=2) + '\n').encode())
    for path in primary.iterdir():
        write_new(backup / path.name, path.read_bytes())
        if digest(path) != digest(backup / path.name):
            raise ValueError('No se pudo comprobar el respaldo. Conservá los archivos y no firmes todavía.')
    return metadata


def protobuf_fields(data):
    position = 0

    def integer():
        nonlocal position
        value = shift = 0
        while position < len(data) and shift < 70:
            byte = data[position]
            position += 1
            value |= (byte & 127) << shift
            if byte < 128:
                return value
            shift += 7
        raise ValueError('Manifiesto protobuf inválido.')

    while position < len(data):
        tag = integer()
        number, wire = tag >> 3, tag & 7
        if not number:
            raise ValueError('Manifiesto protobuf inválido.')
        if wire == 0:
            yield number, integer()
            continue
        if wire not in (1, 2, 5):
            raise ValueError('Manifiesto protobuf no admitido.')
        size = integer() if wire == 2 else (8 if wire == 1 else 4)
        end = position + size
        if end > len(data):
            raise ValueError('Manifiesto protobuf truncado.')
        yield number, data[position:end]
        position = end


def bundle_package(data):
    # AOSP Resources.proto: XmlNode.element=1, XmlElement.attribute=4,
    # XmlAttribute.namespace_uri=1, name=2, value=3. No app code is executed.
    roots = [value for number, value in protobuf_fields(data) if number == 1]
    if len(roots) != 1 or not isinstance(roots[0], bytes):
        raise ValueError('No se pudo leer el manifiesto del bundle.')
    packages = []
    for number, encoded in protobuf_fields(roots[0]):
        if number != 4:
            continue
        attribute = dict(protobuf_fields(encoded))
        if attribute.get(2) == b'package' and not attribute.get(1):
            packages.append(attribute.get(3, b'').decode())
    if packages != [APPLICATION_ID]:
        raise ValueError('El bundle no pertenece al paquete confirmado ar.rindecasa.app.')
    return packages[0]


def signature_metadata(name):
    upper = name.upper()
    return upper == 'META-INF/MANIFEST.MF' or bool(re.fullmatch(r'META-INF/[^/]+\.(SF|RSA|EC|DSA)', upper))


def bundle_payload(path, unsigned=False):
    with ZipFile(path) as bundle:
        names = bundle.namelist()
        if len(names) != len(set(names)):
            raise ValueError('El bundle contiene entradas duplicadas.')
        if 'BundleConfig.pb' not in names or 'base/manifest/AndroidManifest.xml' not in names:
            raise ValueError('No es un Android App Bundle reconocible.')
        package = bundle_package(bundle.read('base/manifest/AndroidManifest.xml'))
        if unsigned and any(signature_metadata(name) and name.upper() != 'META-INF/MANIFEST.MF' for name in names):
            raise ValueError('El bundle de entrada ya contiene una firma. No se reemplaza.')
        entries = {entry.filename: hashlib.sha256(bundle.read(entry)).hexdigest()
                   for entry in bundle.infolist() if not entry.is_dir() and not signature_metadata(entry.filename)}
    return package, entries


def sign_bundle(directory, backup_directory, bundle, output, expected_sha, upload_sha, password):
    primary, backup = private_path(directory), private_path(backup_directory)
    if primary == backup or primary in backup.parents or backup in primary.parents:
        raise ValueError('Falta un respaldo separado de la clave.')
    metadata = json.loads((primary / 'upload-metadata.json').read_text())
    if metadata.get('applicationId') != APPLICATION_ID or metadata.get('alias') != ALIAS:
        raise ValueError('La clave no tiene los datos esperados del proyecto.')
    expected_sha = expected_sha.lower()
    upload_sha = upload_sha.replace(':', '').lower()
    if not re.fullmatch(r'[0-9a-f]{64}', expected_sha) or not re.fullmatch(r'[0-9a-f]{64}', upload_sha):
        raise ValueError('Falta una huella SHA-256 completa del bundle o del certificado de carga.')
    if metadata.get('uploadCertificateSha256') != upload_sha:
        raise ValueError('El certificado no coincide con la huella de carga confirmada.')
    for name in ['upload.p12', 'upload-certificate.pem', 'upload-metadata.json']:
        a, b = primary / name, backup / name
        if a.is_symlink() or b.is_symlink() or not a.is_file() or not b.is_file() or digest(a) != digest(b):
            raise ValueError('La clave y su copia de respaldo no coinciden o no están disponibles.')
    if digest(primary / 'upload.p12') != metadata.get('keystoreSha256'):
        raise ValueError('El almacén cambió desde su creación. No se continúa.')
    output = private_path(output)
    report = output.with_suffix('.verification.json')
    if output.exists() or report.exists():
        raise ValueError('El AAB de salida o su informe ya existen. No se reemplazan.')
    signer, java = tool('jarsigner'), tool('java')
    with tempfile.TemporaryDirectory(prefix='donde-rinde-sign-', dir=output.parent) as temporary:
        staged = Path(temporary) / 'unsigned.aab'
        shutil.copyfile(bundle, staged)
        if digest(staged) != expected_sha:
            raise ValueError('El SHA-256 del AAB no coincide con el artefacto revisado.')
        package, payload = bundle_payload(staged, unsigned=True)
        signed = Path(temporary) / 'signed.aab'
        run([signer, '-keystore', str(primary / 'upload.p12'), '-storetype', 'PKCS12',
             '-storepass:env', SECRET_ENV, '-keypass:env', SECRET_ENV, '-digestalg', 'SHA-256',
             '-sigalg', 'SHA256withRSA', '-signedjar', str(signed), str(staged), ALIAS], password)
        proof = json.loads(run([java, '--source', '17', str(HELPER), str(signed), upload_sha]))
        if bundle_payload(signed) != (package, payload):
            raise ValueError('El contenido del bundle cambió al firmar. No se entrega.')
        proof.update({'applicationId': package, 'unsignedBundleSha256': expected_sha,
                      'signedBundleSha256': digest(signed), 'readyForPlaySubmission': False,
                      'verifiedAt': datetime.now(timezone.utc).isoformat()})
        with signed.open('rb') as source, output.open('xb') as target:
            shutil.copyfileobj(source, target)
        output.chmod(0o600)
        write_new(report, (json.dumps(proof, indent=2) + '\n').encode())
    return proof


def main():
    parser = argparse.ArgumentParser(description='Clave de carga y firma local de Dónde Rinde. Sin subidas a Play.')
    commands = parser.add_subparsers(dest='command', required=True)
    create = commands.add_parser('create', help='Crear una clave de carga y verificar su respaldo.')
    sign = commands.add_parser('sign', help='Firmar una copia del AAB de CI y comprobar su integridad.')
    for command in [create, sign]:
        command.add_argument('--directory', required=True, type=Path)
        command.add_argument('--backup-directory', required=True, type=Path)
    sign.add_argument('--bundle', required=True, type=Path)
    sign.add_argument('--output', required=True, type=Path)
    sign.add_argument('--bundle-sha256', required=True)
    sign.add_argument('--upload-sha256', required=True)
    args = parser.parse_args()
    if not sys.stdin.isatty():
        parser.error('Ejecutá esta operación en tu propia terminal interactiva; no pases contraseñas por archivos o CI.')
    password = getpass.getpass('Contraseña de la clave de carga (no se muestra): ')
    if args.command == 'create' and getpass.getpass('Repetí la contraseña: ') != password:
        parser.error('Las contraseñas no coinciden.')
    os.umask(0o077)
    try:
        if args.command == 'create':
            result = create_key(args.directory, args.backup_directory, password)
            print('Clave y respaldo comprobados. Guardá la contraseña en tu gestor de contraseñas.')
            print('Huella pública del certificado de carga: ' + result['uploadCertificateSha256'])
        else:
            result = sign_bundle(args.directory, args.backup_directory, args.bundle, args.output,
                                 args.bundle_sha256, args.upload_sha256, password)
            print('Firma de carga y contenido comprobados. No se subió nada a Play.')
            print('SHA-256 del AAB firmado: ' + result['signedBundleSha256'])
    except (ValueError, OSError, KeyError, UnicodeError, BadZipFile) as error:
        print('Operación detenida: ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
