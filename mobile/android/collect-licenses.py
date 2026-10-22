"""Collect exact resolved Maven licensing evidence without executing artifacts.

Reads a Gradle releaseRuntimeClasspath report. Network is limited to the
official Google Maven and Maven Central repositories and Apache's license.
Review the resulting inventory before distribution; this is not legal clearance.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
from pathlib import Path
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from zipfile import ZipFile

NS = {'m': 'http://maven.apache.org/POM/4.0.0'}
APACHE = 'https://www.apache.org/licenses/LICENSE-2.0.txt'
GOOGLE = 'https://dl.google.com/dl/android/maven2/'
CENTRAL = 'https://repo.maven.apache.org/maven2/'


def coordinates(report):
    result = set()
    for line in report.splitlines():
        if '(c)' in line or '(n)' in line:
            continue
        match = re.search(r'(?:\+---|\\---) ([\w.-]+):([\w.-]+)(?::([\w.+-]+))?(?: -> ([\w.+-]+))?', line)
        if match:
            group, artifact, original, selected = match.groups()
            version = selected or original
            if not version:
                raise ValueError('Unresolved version: ' + line)
            result.add((group, artifact, version))
    if not result:
        raise ValueError('No resolved dependencies found')
    return sorted(result)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def download(url, cache):
    if not url.startswith((GOOGLE, CENTRAL)) and url != APACHE:
        raise ValueError('Unapproved evidence origin')
    target = cache / sha(url.encode())
    if target.exists():
        return target.read_bytes()
    request = urllib.request.Request(url, headers={'User-Agent': 'DondeRinde-license-evidence/1'})
    with urllib.request.urlopen(request, timeout=40) as response:
        if not response.url.startswith((GOOGLE, CENTRAL, 'https://www.apache.org/')):
            raise ValueError('Unexpected evidence redirect')
        data = response.read(40 * 1024 * 1024 + 1)
    if len(data) > 40 * 1024 * 1024:
        raise ValueError('Evidence artifact too large')
    target.write_bytes(data)
    return data


def pom(group, artifact, version, cache):
    base = GOOGLE if group.startswith(('androidx.', 'com.google.androidbrowserhelper')) else CENTRAL
    url = base + group.replace('.', '/') + '/' + artifact + '/' + version + '/' + artifact + '-' + version + '.pom'
    data = download(url, cache)
    return ET.fromstring(data), url, sha(data)


def license_metadata(root, cache, depth=0):
    if depth > 8:
        raise ValueError('POM parent depth exceeded')
    licenses = [{'name': node.findtext('m:name', '', NS), 'url': node.findtext('m:url', '', NS)} for node in root.findall('m:licenses/m:license', NS)]
    if licenses:
        return licenses, []
    parent = root.find('m:parent', NS)
    if parent is None:
        return [], []
    coord = tuple(parent.findtext('m:' + key, '', NS) for key in ('groupId', 'artifactId', 'version'))
    if not all(re.fullmatch(r'[\w.+-]+', value) for value in coord):
        raise ValueError('Unresolved POM parent')
    inherited, url, digest = pom(*coord, cache)
    licenses, chain = license_metadata(inherited, cache, depth + 1)
    return licenses, [{'url': url, 'sha256': digest}] + chain


def notices(data, prefix=''):
    found = []
    with ZipFile(io.BytesIO(data)) as archive:
        for item in archive.infolist():
            filename = item.filename.rsplit('/', 1)[-1]
            if item.file_size < 1024 * 1024 and re.match(r'^(licen[sc]e|notice|copying|copyright|third.party.readme)([._-]|$)', filename, re.I):
                content = archive.read(item)
                found.append({'path': prefix + item.filename, 'sha256': sha(content), 'text': content.decode('utf-8')})
            elif item.filename == 'classes.jar' and item.file_size < 30 * 1024 * 1024:
                found.extend(notices(archive.read(item), prefix + 'classes.jar!/'))
    return found


def collect(coordinate, cache):
    group, artifact, version = coordinate
    root, url, digest = pom(group, artifact, version, cache)
    licenses, parent = license_metadata(root, cache)
    packaging = root.findtext('m:packaging', 'jar', NS)
    result = {'coordinate': ':'.join(coordinate), 'pom': {'url': url, 'sha256': digest}, 'parentLicenseEvidence': parent, 'declaredLicenses': licenses, 'packaging': packaging}
    if packaging == 'pom':
        result.update(role='metadata-only', notices=[])
    elif packaging in ('jar', 'aar', 'bundle'):
        extension = 'jar' if packaging == 'bundle' else packaging
        artifact_url = url[:-3] + extension
        data = download(artifact_url, cache)
        result.update(role='resolved-runtime-artifact', artifact={'url': artifact_url, 'sha256': sha(data)}, notices=notices(data))
    else:
        raise ValueError('Unsupported packaging ' + packaging)
    if not licenses:
        raise ValueError('Missing license metadata: ' + result['coordinate'])
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dependency-report', type=Path, required=True)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    report = args.dependency_report.read_bytes()
    with ThreadPoolExecutor(max_workers=6) as pool:
        dependencies = list(pool.map(lambda row: collect(row, args.cache), coordinates(report.decode())))
    # The current resolved set declares Apache 2.0. A future different license
    # requires an explicit review instead of silently reusing this notice.
    for entry in dependencies:
        if not all('apache' in row['name'].lower() and '2' in row['name'] for row in entry['declaredLicenses']):
            raise ValueError('New license requires review: ' + entry['coordinate'])
    apache = download(APACHE, args.cache)
    unique = {}
    for entry in dependencies:
        for notice in entry['notices']:
            target = unique.setdefault(notice['sha256'], {'text': notice['text'], 'origins': []})
            target['origins'].append(entry['coordinate'] + ' — ' + notice['path'])
    text = 'Dónde Rinde — Android third-party notices\n\nResolved versions from the retained Gradle report.\nDependency metadata is evidence, not a legal clearance or proof of build inclusion.\n\n'
    text += '\n'.join(entry['coordinate'] for entry in dependencies if entry['role'] != 'metadata-only')
    text += '\n\nApache License 2.0 (canonical text)\n' + apache.decode()
    for entry in unique.values():
        text += '\n\n' + '=' * 60 + '\n' + '\n'.join(entry['origins']) + '\n\n' + entry['text']
    encoded = text.encode()
    evidence = {'schemaVersion': 1, 'dependencyReportSha256': sha(report), 'dependencies': dependencies, 'canonicalLicense': {'url': APACHE, 'sha256': sha(apache)}, 'noticeSha256': sha(encoded), 'reviewStatus': 'collected-pending-distribution-review', 'claim': 'Maven licensing evidence only; no title, trademark or permission for price datasets is certified.'}
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'ANDROID_THIRD_PARTY_NOTICES.txt').write_bytes(encoded)
    (args.output / 'android-license-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'resolvedCoordinates': len(dependencies), 'runtimeArtifacts': sum(row['role'] != 'metadata-only' for row in dependencies), 'retainedNoticeTexts': len(unique), 'noticeSha256': sha(encoded)}))


if __name__ == '__main__':
    main()
