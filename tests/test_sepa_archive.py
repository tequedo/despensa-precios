import importlib.util
import io
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('sepa_archive', Path(__file__).resolve().parents[1] / 'scripts/sepa_archive.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.csv = {f'merchant/{name}': b'id|name\n1|example\n' for name in module.REQUIRED}

    def tearDown(self):
        self.temp.cleanup()

    def zip(self, files, name='source.zip'):
        target = self.root / name
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_STORED) as archive:
                for path, content in files:
                    archive.writestr(path, content)
        return target

    def replica(self, files, symlink=False):
        target = self.root / 'replica.tar'
        with tarfile.open(target, 'w') as archive:
            for path, content in files:
                entry = tarfile.TarInfo(path)
                entry.size = len(content)
                archive.addfile(entry, io.BytesIO(content))
            if symlink:
                entry = tarfile.TarInfo('link')
                entry.type = tarfile.SYMTYPE
                entry.linkname = '/tmp/outside'
                archive.addfile(entry)
        subprocess.run(['zstd', '-q', str(target)], check=True)
        return Path(str(target) + '.zst')

    def test_recompression_and_added_metadata_preserve_payload(self):
        original = module.inspect_archive(self.zip(list(self.csv.items())), self.root / 'a', 'original')
        files = list(self.csv.items()) + [('dataset-info.json', b'{"success":true}')]
        replica = module.inspect_archive(self.replica(files), self.root / 'b', 'replica')
        self.assertNotEqual(original['archive']['sha256'], replica['archive']['sha256'])
        self.assertEqual(original['payload']['sha256'], replica['payload']['sha256'])
        self.assertEqual(replica['payload']['csvGroups'], 1)
        self.assertTrue(replica['embeddedMetadata']['value']['success'])

    def test_nested_zip_matches_replica_directory_names(self):
        inner = self.zip([(Path(p).name, data) for p, data in self.csv.items()], 'inner.zip')
        outer = self.zip([('merchant.zip', inner.read_bytes()), ('empty.zip', b'')], 'outer.zip')
        result = module.inspect_archive(outer, self.root / 'output', 'original')
        self.assertEqual(result['payload']['csvGroups'], 1)
        self.assertEqual(result['payload']['emptyZipMarkers'], ['empty.zip'])
        self.assertIn('merchant/productos.csv', [f['path'] for f in result['files']])

    def test_rejects_path_traversal(self):
        for name in ['../escape.csv', '/absolute.csv', 'a/../../escape', 'a\\escape', 'C:/escape']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                module.member_name(name)

    def test_rejects_duplicate_entries(self):
        archive = self.zip(list(self.csv.items()) + [('merchant/productos.csv', b'changed')])
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            module.inspect_archive(archive, self.root / 'out', 'original')

    def test_rejects_zip_crc_corruption(self):
        archive = self.zip(list(self.csv.items()))
        archive.write_bytes(archive.read_bytes().replace(b'1|example', b'9|example', 1))
        with self.assertRaises(zipfile.BadZipFile):
            module.inspect_archive(archive, self.root / 'out', 'original')

    def test_rejects_nonempty_broken_nested_zip(self):
        archive = self.zip(list(self.csv.items()) + [('broken.zip', b'not a zip')])
        with self.assertRaises(zipfile.BadZipFile):
            module.inspect_archive(archive, self.root / 'out', 'original')

    def test_rejects_incomplete_merchant(self):
        archive = self.zip(list(self.csv.items()) + [('other/productos.csv', b'header\n')])
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            module.inspect_archive(archive, self.root / 'out', 'original')

    def test_rejects_tar_symlinks(self):
        archive = self.replica(list(self.csv.items()), symlink=True)
        with self.assertRaisesRegex(ValueError, 'Unsupported TAR'):
            module.inspect_archive(archive, self.root / 'out', 'replica')

    def test_rejects_replica_without_metadata(self):
        archive = self.replica(list(self.csv.items()))
        with self.assertRaisesRegex(ValueError, 'missing embedded'):
            module.inspect_archive(archive, self.root / 'out', 'replica')


if __name__ == '__main__':
    unittest.main()
