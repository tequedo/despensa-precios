"""Real signing tests use disposable keys and synthetic ZIPs, never owner keys."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('upload_key', ROOT / 'mobile/android/upload-key.py')
upload = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upload)
PASSWORD = 'disposable-test-password-only-2026'
JAVA_SIGNING = bool(shutil.which('javac') and shutil.which('jarsigner'))
if os.environ.get('REQUIRE_JAVA_SIGNING_TESTS') == '1' and not JAVA_SIGNING:
    raise RuntimeError('CI must provide a complete JDK; signing tests cannot be skipped.')


def field(number, value):
    if len(value) >= 128:
        raise ValueError('Small synthetic fixture only.')
    return bytes([number * 8 + 2, len(value)]) + value


def manifest(package=upload.APPLICATION_ID):
    attribute = field(2, b'package') + field(3, package.encode())
    return field(1, field(3, b'manifest') + field(4, attribute))


def bundle(path, package=upload.APPLICATION_ID):
    with ZipFile(path, 'w') as archive:
        archive.writestr('BundleConfig.pb', b'synthetic configuration')
        archive.writestr('base/manifest/AndroidManifest.xml', manifest(package))
        archive.writestr('base/assets/test.txt', b'synthetic app payload')


class UploadKeyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix='donde-rinde-key-test-')
        cls.path = Path(cls.temporary.name)
        cls.primary, cls.backup = cls.path / 'key', cls.path / 'backup'
        cls.metadata = upload.create_key(cls.primary, cls.backup, PASSWORD)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def test_created_key_and_backup_are_identical_and_password_is_not_saved(self):
        for name in ['upload.p12', 'upload-certificate.pem', 'upload-metadata.json']:
            self.assertEqual(upload.digest(self.primary / name), upload.digest(self.backup / name))
            if os.name != 'nt':
                self.assertEqual((self.primary / name).stat().st_mode & 0o777, 0o600)
        self.assertFalse(self.metadata['isPlayDistributionCertificate'])
        self.assertNotIn(PASSWORD, json.dumps(self.metadata))
        self.assertEqual(set(p.name for p in self.primary.iterdir()),
                         {'upload.p12', 'upload-certificate.pem', 'upload-metadata.json'})

    def test_cannot_overwrite_or_create_in_the_source_repository(self):
        with self.assertRaises(ValueError):
            upload.create_key(self.primary, self.path / 'other', PASSWORD)
        with self.assertRaises(ValueError):
            upload.private_path(ROOT / 'private-upload-key')
        with self.assertRaises(ValueError):
            upload.private_path(Path('relative-folder'))

    def test_password_and_independent_backup_are_required(self):
        with self.assertRaises(ValueError):
            upload.create_key(self.path / 'short', self.path / 'short-backup', 'short')
        with self.assertRaises(ValueError):
            upload.create_key(self.path / 'same', self.path / 'same', PASSWORD)
        with self.assertRaises(ValueError):
            upload.create_key(self.path / 'nested', self.path / 'nested/backup', PASSWORD)

    def test_actual_bundle_package_and_protobuf_bounds_are_checked(self):
        self.assertEqual(upload.bundle_package(manifest()), upload.APPLICATION_ID)
        for data in [manifest('another.app'), b'\x0a\x7fshort', b'\x00\x00']:
            with self.assertRaises(ValueError):
                upload.bundle_package(data)


@unittest.skipUnless(JAVA_SIGNING, 'Full JDK required for signature integration tests.')
class SignatureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix='donde-rinde-signature-test-')
        cls.path = Path(cls.temporary.name)
        cls.primary, cls.backup = cls.path / 'key', cls.path / 'backup'
        cls.metadata = upload.create_key(cls.primary, cls.backup, PASSWORD)
        cls.unsigned = cls.path / 'unsigned.aab'
        bundle(cls.unsigned)
        cls.signed = cls.path / 'signed.aab'
        cls.proof = upload.sign_bundle(cls.primary, cls.backup, cls.unsigned, cls.signed,
                                     upload.digest(cls.unsigned), cls.metadata['uploadCertificateSha256'], PASSWORD)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def verify(self, path, fingerprint=None):
        return upload.run([upload.tool('java'), '--source', '17', str(upload.HELPER), str(path),
                           fingerprint or self.metadata['uploadCertificateSha256']])

    def test_valid_signature_matches_the_confirmed_certificate_and_payload(self):
        self.assertTrue(self.proof['signatureVerified'])
        self.assertFalse(self.proof['readyForPlaySubmission'])
        self.assertEqual(upload.bundle_payload(self.unsigned), upload.bundle_payload(self.signed))
        self.assertNotIn(PASSWORD, self.signed.with_suffix('.verification.json').read_text())

    def test_unsigned_or_wrong_certificate_is_rejected(self):
        for path, fingerprint in [(self.unsigned, None), (self.signed, 'ff' * 32)]:
            with self.assertRaises(ValueError):
                self.verify(path, fingerprint)

    def test_modified_payload_and_added_unsigned_entry_are_rejected(self):
        for changed in [True, False]:
            altered = self.path / ('tampered.aab' if changed else 'extra.aab')
            with ZipFile(self.signed) as source, ZipFile(altered, 'w') as target:
                for entry in source.infolist():
                    data = source.read(entry)
                    if changed and entry.filename == 'base/assets/test.txt':
                        data = b'modified payload'
                    target.writestr(entry, data)
                if not changed:
                    target.writestr('base/assets/unsigned.txt', b'unsigned addition')
            with self.assertRaises(ValueError):
                self.verify(altered)

    def test_wrong_artifact_hash_backup_and_package_do_not_produce_output(self):
        output = self.path / 'blocked.aab'
        with self.assertRaises(ValueError):
            upload.sign_bundle(self.primary, self.backup, self.unsigned, output, '00' * 32,
                               self.metadata['uploadCertificateSha256'], PASSWORD)
        self.assertFalse(output.exists())
        other = self.path / 'other-app.aab'
        bundle(other, 'another.app')
        with self.assertRaises(ValueError):
            upload.sign_bundle(self.primary, self.backup, other, output, upload.digest(other),
                               self.metadata['uploadCertificateSha256'], PASSWORD)
        with self.assertRaises(ValueError):
            upload.sign_bundle(self.primary, self.primary, self.unsigned, output, upload.digest(self.unsigned),
                               self.metadata['uploadCertificateSha256'], PASSWORD)
        self.assertFalse(output.exists())

    def test_wrong_password_cannot_create_a_signed_output_or_leak_into_errors(self):
        output = self.path / 'wrong-password.aab'
        with self.assertRaises(ValueError) as caught:
            upload.sign_bundle(self.primary, self.backup, self.unsigned, output, upload.digest(self.unsigned),
                               self.metadata['uploadCertificateSha256'], 'incorrect-test-password')
        self.assertFalse(output.exists())
        self.assertNotIn('incorrect-test-password', str(caught.exception))

    def test_existing_output_cannot_be_overwritten(self):
        before = upload.digest(self.signed)
        with self.assertRaises(ValueError):
            upload.sign_bundle(self.primary, self.backup, self.unsigned, self.signed, upload.digest(self.unsigned),
                               self.metadata['uploadCertificateSha256'], PASSWORD)
        self.assertEqual(upload.digest(self.signed), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
