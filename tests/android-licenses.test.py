import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('verify_android_licenses', ROOT / 'mobile/android/verify-license-distribution.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class DistributionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.report = self.root / 'dependencies.txt'
        self.report.write_text('+--- sample:runtime:1.0 -> 2.0\n|    +--- sample:constraint:9.0 (c)\n\\--- sample:runtime:2.0 (*)\n')
        self.notice = self.root / 'notices.txt'
        self.notice.write_text('Retained exact licensing text\n')
        self.evidence = self.root / 'evidence.json'
        self.evidence.write_text(json.dumps({'dependencies': [{'coordinate': 'sample:runtime:2.0'}], 'noticeSha256': hashlib.sha256(self.notice.read_bytes()).hexdigest()}))
        self.bundle = self.root / 'bundle.aab'

    def make_bundle(self, notice=True, outfit=True, changed=False):
        with ZipFile(self.bundle, 'w') as archive:
            if notice:
                archive.writestr('base/assets/legal/ANDROID_THIRD_PARTY_NOTICES.txt', b'Changed bytes' if changed else self.notice.read_bytes())
            if outfit:
                archive.writestr('base/assets/legal/Outfit-OFL.txt', 'Existing font license')

    def check(self):
        return checker.verify(self.bundle, self.report, self.evidence, self.notice)

    def test_resolved_versions_ignore_constraints_and_repeated_subtrees(self):
        self.make_bundle()
        self.assertEqual(self.check()['reviewedCoordinates'], 1)

    def test_previous_bundle_without_notices_is_rejected(self):
        self.make_bundle(notice=False)
        with self.assertRaisesRegex(ValueError, 'missing or different'):
            self.check()

    def test_bundle_bytes_and_preserved_font_license_are_checked(self):
        self.make_bundle(changed=True)
        with self.assertRaisesRegex(ValueError, 'missing or different'):
            self.check()
        self.make_bundle(outfit=False)
        with self.assertRaisesRegex(ValueError, 'Outfit'):
            self.check()

    def test_new_runtime_version_requires_new_review(self):
        self.make_bundle()
        self.report.write_text('+--- sample:runtime:3.0\n')
        with self.assertRaisesRegex(ValueError, 'dependencies differ'):
            self.check()

    def test_modified_source_notice_is_rejected(self):
        self.make_bundle()
        self.notice.write_text('Changed source notice')
        with self.assertRaisesRegex(ValueError, 'Notice content differs'):
            self.check()


if __name__ == '__main__':
    unittest.main(verbosity=2)
