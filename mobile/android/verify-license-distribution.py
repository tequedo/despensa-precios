"""Fail if the reviewed dependency set or packaged licensing evidence changed."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('license_collector', Path(__file__).with_name('collect-licenses.py'))
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


def verify(bundle, report, evidence, notice):
    expected = {':'.join(row) for row in collector.coordinates(report.read_text())}
    audited = json.loads(evidence.read_text())
    reviewed = {row['coordinate'] for row in audited['dependencies']}
    if expected != reviewed:
        raise ValueError('Resolved dependencies differ from reviewed license evidence; review the new set')
    text = notice.read_bytes()
    if hashlib.sha256(text).hexdigest() != audited['noticeSha256']:
        raise ValueError('Notice content differs from retained licensing evidence')
    with ZipFile(bundle) as archive:
        paths = archive.namelist()
        if len(paths) != len(set(paths)):
            raise ValueError('Bundle contains duplicate entries')
        name = 'base/assets/legal/ANDROID_THIRD_PARTY_NOTICES.txt'
        if name not in paths or archive.read(name) != text:
            raise ValueError('Reviewed notices are missing or different in the actual AAB')
        if 'base/assets/legal/Outfit-OFL.txt' not in paths:
            raise ValueError('Existing Outfit license is missing from the AAB')
    return {'licenseDistributionCheck': 'passed', 'reviewedCoordinates': len(reviewed), 'noticeSha256': audited['noticeSha256'], 'limit': 'Packaging/inventory check only; no legal clearance, signature or physical test is certified.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--dependency-report', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    parser.add_argument('--notice', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(verify(args.bundle, args.dependency_report, args.evidence, args.notice)))
