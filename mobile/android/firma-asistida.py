"""Interactive owner-side path selection; secrets remain in upload-key.py."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
from zipfile import BadZipFile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('donde_rinde_upload', HERE / 'upload-key.py')
upload = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upload)


def checked_bundle(bundle, release):
    if release.get('schemaVersion') != 1 or release.get('applicationId') != upload.APPLICATION_ID:
        raise ValueError('El comprobante no pertenece a esta app.')
    if upload.digest(bundle) != release.get('sha256'):
        raise ValueError('El AAB no coincide con la compilación revisada. No se crea ninguna clave.')
    upload.bundle_payload(bundle, unsigned=True)
    return bundle


def invoke(arguments):
    # No credentials in args/env/files: the existing child process prompts
    # directly on the owner's terminal with getpass and checks isatty().
    result = subprocess.run([sys.executable, str(HERE / 'upload-key.py'), *arguments], check=False)
    if result.returncode:
        raise ValueError('La operación se detuvo. Conservá claves y respaldos existentes antes de volver a intentar.')


def owner_sign(bundle, release, primary, backup, output, create, runner=invoke):
    checked_bundle(bundle, release)
    primary, backup, output = map(upload.private_path, (primary, backup, output))
    if primary == backup or primary in backup.parents or backup in primary.parents:
        raise ValueError('La clave y su respaldo requieren dos ubicaciones separadas.')
    if not output.parent.is_dir() or output.exists() or output.with_suffix('.verification.json').exists():
        raise ValueError('Elegí una carpeta de salida existente y un nombre de archivo nuevo.')
    if create and (primary.exists() or backup.exists()):
        raise ValueError('La creación requiere dos carpetas nuevas. No se reemplazan claves existentes.')
    common = ['--directory', str(primary), '--backup-directory', str(backup)]
    if create:
        runner(['create', *common])
    metadata = json.loads((primary / 'upload-metadata.json').read_text(encoding='utf-8'))
    if metadata.get('applicationId') != upload.APPLICATION_ID:
        raise ValueError('La clave existente no pertenece a esta app.')
    runner(['sign', *common, '--bundle', str(bundle), '--output', str(output),
            '--bundle-sha256', release['sha256'],
            '--upload-sha256', metadata['uploadCertificateSha256']])
    proof = json.loads(output.with_suffix('.verification.json').read_text(encoding='utf-8'))
    if (proof.get('signatureVerified') is not True or
            proof.get('unsignedBundleSha256') != release['sha256'] or
            proof.get('signedBundleSha256') != upload.digest(output)):
        raise ValueError('Falta la comprobación de firma y contenido. No se declara el paquete terminado.')
    return proof


def main():
    parser = argparse.ArgumentParser(description='Firma local asistida de Dónde Rinde. Sin conexión ni envío a Play.')
    parser.add_argument('--bundle', type=Path)
    parser.add_argument('--check-only', action='store_true', help='Verificar AAB y herramientas sin pedir ni crear claves.')
    args = parser.parse_args()
    try:
        if sys.version_info < (3, 11):
            raise ValueError('Se necesita Python 3.11 o superior.')
        if not args.check_only and not sys.stdin.isatty():
            raise ValueError('Abrí este asistente en tu propia terminal interactiva.')
        release = json.loads((HERE / 'reviewed-release.json').read_text(encoding='utf-8'))
        bundle = args.bundle
        if bundle is None:
            if args.check_only:
                raise ValueError('Indicá --bundle con la ruta del AAB que querés comprobar.')
            bundle = Path(input('Ruta completa del AAB sin firma: ').strip().strip('"')).expanduser()
        bundle = checked_bundle(bundle.resolve(), release)
        for tool in ('java', 'javac', 'keytool', 'jarsigner'):
            upload.tool(tool)
        print('AAB revisado: Dónde Rinde ' + release['versionName'] + ' / ' + release['applicationId'])
        print('SHA-256: ' + release['sha256'])
        if args.check_only:
            print('AAB y herramientas disponibles. No se crearon claves ni se firmó ningún archivo.')
            return 0
        print('\nUsá una computadora de confianza y una segunda unidad para el respaldo.')
        print('1: crear una clave nueva; 2: usar una clave ya creada. Nunca regeneres una clave usada en Play.')
        choice = input('Opción (1 o 2): ').strip()
        if choice not in ('1', '2'):
            raise ValueError('No se eligió una operación válida.')
        primary = Path(input('Ruta absoluta de la carpeta privada de la clave: ').strip().strip('"')).expanduser()
        backup = Path(input('Ruta absoluta de la carpeta de respaldo en otra unidad: ').strip().strip('"')).expanduser()
        output_dir = Path(input('Ruta absoluta de una carpeta existente para el AAB firmado: ').strip().strip('"')).expanduser()
        if input('Escribí FIRMAR para continuar en este equipo: ').strip() != 'FIRMAR':
            print('Operación cancelada. No se creó ninguna clave ni se firmó el paquete.')
            return 0
        os.umask(0o077)
        output = output_dir / ('Donde_Rinde_' + release['versionName'] + '_para_Google_Play.aab')
        owner_sign(bundle, release, primary, backup, output, create=choice == '1')
        print('\nAAB firmado y verificado: ' + str(output))
        print('Podés compartir el AAB, su informe .verification.json y upload-certificate.pem.')
        print('Conservá upload.p12 y la contraseña en privado. No se subió nada a Google Play.')
        return 0
    except (ValueError, OSError, KeyError, UnicodeError, BadZipFile) as error:
        print('Operación detenida: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
