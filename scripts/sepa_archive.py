#!/usr/bin/env python3
"""Extract SEPA safely and hash its payload, independently of ZIP/zstd packaging.

Integrity is not authenticity: this program makes no claim about who published
an archive. Only the replica's added root dataset-info.json is excluded from
the payload comparison; its bytes and parsed contents are recorded separately.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import tarfile
import tempfile
import unicodedata
import zipfile

REQUIRED = {"comercio.csv", "sucursales.csv", "productos.csv"}
MAX_BYTES = 24 * 1024**3
MAX_MEMBERS = 100_000


def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def member_name(name):
    if "\\" in name or "\x00" in name or name.startswith("/"):
        raise ValueError(f"Unsafe archive path: {name!r}")
    parts = PurePosixPath(name).parts
    if ".." in parts or (parts and ":" in parts[0]):
        raise ValueError(f"Unsafe archive path: {name!r}")
    return "/".join(parts)


class Extractor:
    def __init__(self, root):
        self.root = Path(root)
        self.seen = set()
        self.unpacked = 0
        self.members = 0

    def copy_member(self, name, source, size):
        name = member_name(name)
        if not name:
            raise ValueError("Empty file name")
        key = unicodedata.normalize("NFC", name).casefold()
        if key in self.seen:
            raise ValueError(f"Duplicate archive path: {name}")
        self.seen.add(key)
        self.members += 1
        self.unpacked += size
        if size < 0 or self.members > MAX_MEMBERS or self.unpacked > MAX_BYTES:
            raise ValueError("Archive exceeds extraction limits")
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        copied = 0
        with target.open("xb") as output:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                copied += len(chunk)
                if copied > size:
                    raise ValueError("Archive member exceeds declared size")
                output.write(chunk)
        if copied != size:
            raise ValueError(f"Truncated archive member: {name}")

    def unzip(self, archive, prefix=""):
        with zipfile.ZipFile(archive) as source:
            for item in source.infolist():
                name = member_name(item.filename)
                mode = item.external_attr >> 16
                if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                    raise ValueError(f"Unsupported ZIP member: {name}")
                if item.flag_bits & 1:
                    raise ValueError("Encrypted ZIP is not supported")
                if item.is_dir():
                    continue
                with source.open(item) as stream:
                    self.copy_member(f"{prefix}/{name}" if prefix else name, stream, item.file_size)

    def untar_zstd(self, archive):
        with tempfile.TemporaryFile() as errors:
            process = subprocess.Popen(["zstd", "-d", "-c", "--", str(archive)], stdout=subprocess.PIPE, stderr=errors)
            try:
                with tarfile.open(fileobj=process.stdout, mode="r|") as source:
                    for item in source:
                        name = member_name(item.name)
                        if item.isdir():
                            continue
                        if not item.isfile():
                            raise ValueError(f"Unsupported TAR member: {name}")
                        with source.extractfile(item) as stream:
                            self.copy_member(name, stream, item.size)
                # Drain so zstd checks the complete compressed frame/checksum.
                with open(os.devnull, "wb") as sink:
                    shutil.copyfileobj(process.stdout, sink)
                if process.wait() != 0:
                    raise ValueError("Invalid or truncated zstd archive")
            finally:
                process.stdout.close()
                if process.poll() is None:
                    process.kill()
                process.wait()

    def expand_nested(self):
        for depth in range(4):
            archives = [p for p in self.root.rglob("*") if p.is_file() and p.suffix.lower() == ".zip" and p.stat().st_size]
            if not archives:
                return
            if depth == 3:
                raise ValueError("Too many nested ZIP levels")
            for archive in sorted(archives):
                prefix = archive.relative_to(self.root).as_posix()[:-4]
                self.unzip(archive, prefix)
                archive.unlink()


def inspect_archive(archive, output, role):
    archive, output = Path(archive), Path(output)
    if output.exists() and any(output.iterdir()):
        raise ValueError("Extraction destination must be empty")
    output.mkdir(parents=True, exist_ok=True)
    extractor = Extractor(output)
    archive_info = {"bytes": archive.stat().st_size, "sha256": digest(archive)}
    if role == "replica":
        extractor.untar_zstd(archive)
        archive_info["format"] = "tar.zst"
    else:
        extractor.unzip(archive)
        archive_info["format"] = "zip"
    extractor.expand_nested()
    entries, groups, empty_zips = [], {}, []
    embedded = None
    for path in sorted(output.rglob("*")):
        if not path.is_file():
            continue
        name = path.relative_to(output).as_posix()
        entry = {"path": name, "bytes": path.stat().st_size, "sha256": digest(path)}
        if role == "replica" and name == "dataset-info.json":
            if entry["bytes"] > 5 * 1024 * 1024:
                raise ValueError("Embedded metadata exceeds limit")
            embedded = {**entry, "value": json.loads(path.read_text(encoding="utf-8"))}
            continue
        entries.append(entry)
        if path.suffix.lower() == ".zip" and not entry["bytes"]:
            empty_zips.append(name)
        if path.name.lower() in REQUIRED:
            if not entry["bytes"]:
                raise ValueError(f"Empty CSV: {name}")
            groups.setdefault(str(PurePosixPath(name).parent), set()).add(path.name.lower())
    if not groups:
        raise ValueError("No SEPA CSV groups found")
    incomplete = [name for name, files in groups.items() if files != REQUIRED]
    if incomplete:
        raise ValueError(f"Incomplete SEPA CSV groups: {incomplete}")
    if role == "replica" and embedded is None:
        raise ValueError("Replica is missing embedded dataset-info.json")
    # Length-framed JSON removes ambiguities caused by filenames or delimiters.
    encoded = json.dumps(entries, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return {
        "schemaVersion": 1, "role": role, "archive": archive_info,
        "payload": {"algorithm": "sha256-json-manifest-v1", "sha256": hashlib.sha256(encoded).hexdigest(),
                    "files": len(entries), "bytes": sum(x["bytes"] for x in entries),
                    "csvGroups": len(groups), "emptyZipMarkers": empty_zips},
        "files": entries, "embeddedMetadata": embedded,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--role", choices=["original", "replica"], required=True)
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()
    result = inspect_archive(args.archive, args.output, args.role)
    Path(args.manifest).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"archive": result["archive"], "payload": result["payload"]}))
