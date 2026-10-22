"""Guard the owner workflow without reading or generating a production key."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


assistant = load('signing_assistant', ROOT / 'mobile/android/firma-asistida.py')
fixtures = load('upload_fixtures', ROOT / 'tests/android-upload-key.test.py')


class OwnerWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='donde-rinde-assistant-test-')
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)
        self.bundle = self.path / 'unsigned.aab'
        fixtures.bundle(self.bundle)
        self.release = {'schemaVersion': 1, 'applicationId': assistant.upload.APPLICATION_ID,
                        'sha256': assistant.upload.digest(self.bundle)}

    def test_other_or_modified_bundle_is_rejected_before_any_key_operation(self):
        calls = []
        self.bundle.write_bytes(b'not the reviewed bundle')
        with self.assertRaises(ValueError):
            assistant.owner_sign(self.bundle, self.release, self.path / 'key', self.path / 'backup',
                                 self.path / 'signed.aab', True, calls.append)
        self.assertEqual(calls, [])
        self.assertFalse((self.path / 'key').exists())

    def test_existing_key_is_preserved_when_new_key_is_selected(self):
        primary = self.path / 'key'
        primary.mkdir()
        marker = primary / 'upload.p12'
        marker.write_bytes(b'existing key marker')
        calls = []
        with self.assertRaises(ValueError):
            assistant.owner_sign(self.bundle, self.release, primary, self.path / 'backup',
                                 self.path / 'signed.aab', True, calls.append)
        self.assertEqual(calls, [])
        self.assertEqual(marker.read_bytes(), b'existing key marker')

    def test_reuse_does_not_run_create_and_does_not_report_missing_signature_as_success(self):
        primary = self.path / 'key'
        primary.mkdir()
        (primary / 'upload-metadata.json').write_text(json.dumps({
            'applicationId': assistant.upload.APPLICATION_ID, 'uploadCertificateSha256': 'ab' * 32}))
        calls = []
        with self.assertRaises(OSError):
            assistant.owner_sign(self.bundle, self.release, primary, self.path / 'backup',
                                 self.path / 'signed.aab', False, calls.append)
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0], 'sign')
        self.assertIn(self.release['sha256'], calls[0])

    def test_redirected_input_cannot_start_interactive_key_workflow(self):
        with patch('sys.argv', ['firma-asistida.py']), patch('sys.stdin.isatty', return_value=False), \
                patch('builtins.input') as prompt, patch.object(assistant, 'owner_sign') as sign:
            self.assertEqual(assistant.main(), 1)
        prompt.assert_not_called()
        sign.assert_not_called()


if __name__ == '__main__':
    unittest.main(verbosity=2)
