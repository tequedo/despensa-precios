"""Offline fixtures only: these addresses are not deployed SEPA servers."""

import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    "sepa_egress_probe", Path(__file__).resolve().parents[1] / "scripts/sepa_egress_probe.py")
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)


def valid_metadata():
    return {"status": 200, "body": json.dumps({"success": True, "result": {
        "id": probe.DATASET_ID, "name": "sepa-precios", "resources": []}})}


class EgressProbeTests(unittest.TestCase):
    def fixture(self, ips=("1.1.1.1", "1.1.1.1"), metadata=None):
        calls = []
        def fetch(url):
            calls.append(url)
            if url in probe.IP_ENDPOINTS:
                return {"status": 200, "body": ips[probe.IP_ENDPOINTS.index(url)]}
            return metadata if metadata is not None else valid_metadata()
        return fetch, calls

    def test_two_ip_observations_never_prove_reservation_or_authorization(self):
        fetch, calls = self.fixture()
        report = probe.diagnose("1.1.1.1", fetch)
        self.assertEqual(calls, [*probe.IP_ENDPOINTS, probe.OFFICIAL_METADATA])
        self.assertTrue(report["expectedEgressObserved"])
        self.assertTrue(report["officialMetadata"]["metadataValid"])
        for field in ("fixedIpVerified", "operatorAuthorizationConfirmed",
                      "officialArchiveDownloaded", "productionUpdated"):
            self.assertFalse(report[field])

    def test_mismatched_or_unavailable_ip_stops_before_contacting_sepa(self):
        for ips in (("1.1.1.1", "8.8.8.8"), ("1.1.1.1", "<html>blocked</html>")):
            fetch, calls = self.fixture(ips)
            report = probe.diagnose("1.1.1.1", fetch)
            self.assertFalse(report["expectedEgressObserved"])
            self.assertIsNone(report["officialMetadata"])
            self.assertEqual(calls, list(probe.IP_ENDPOINTS))

    def test_denial_is_not_retried_and_raw_content_is_not_preserved(self):
        rejection = {"status": 403, "headers": "set-cookie: private=secret\r\n",
                     "body": "BunkerWeb private content 192.0.2.8 Request ID: <code>" + "a" * 32 + "</code>"}
        fetch, calls = self.fixture(metadata=rejection)
        report = probe.diagnose("1.1.1.1", fetch)
        self.assertEqual(calls.count(probe.OFFICIAL_METADATA), 1)
        self.assertEqual(report["officialMetadata"]["status"], 403)
        self.assertEqual(report["officialMetadata"]["requestId"], "a" * 32)
        self.assertEqual(report["officialMetadata"]["protection"], "BunkerWeb")
        self.assertFalse(report["officialMetadata"]["metadataValid"])
        for private in ("set-cookie", "secret", "private content", "192.0.2.8"):
            self.assertNotIn(private, json.dumps(report))

    def test_http_200_requires_the_expected_dataset(self):
        for body in ("<html>Login</html>", "[]", "null", '{"success":false}',
                     '{"success":true,"result":{"id":"other","name":"sepa-precios","resources":[]}}'):
            self.assertFalse(probe.metadata_evidence({"status": 200, "body": body})["metadataValid"])
        self.assertFalse(probe.metadata_evidence({"status": 302, "body": ""})["metadataValid"])

    def test_expected_ip_must_be_public_ipv4(self):
        for address in ("127.0.0.1", "10.0.0.1", "192.0.2.1", "::1", "2606:4700:4700::1111", "bad"):
            with self.assertRaises(ValueError):
                probe.diagnose(address, lambda url: self.fail("No network request expected"))

    def test_transport_never_enables_redirects_proxy_retries_or_tls_bypass(self):
        with patch.object(probe.subprocess, "run", return_value=type("Result", (), {
            "returncode": 7, "stderr": "private error", "stdout": "000"})()) as run:
            result = probe.request(probe.OFFICIAL_METADATA)
        arguments = run.call_args.args[0]
        self.assertEqual(arguments[:2], ["curl", "--disable"])
        self.assertIn("--ipv4", arguments)
        self.assertEqual(arguments[arguments.index("--noproxy") + 1], "*")
        for option in ("--location", "-L", "--insecure", "-k", "--retry", "--proxy"):
            self.assertNotIn(option, arguments)
        self.assertNotIn("private error", json.dumps(result))

    def test_private_report_cannot_replace_an_existing_file_or_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "report.json"
            probe.write_report(path, {"fixture": True})
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            with self.assertRaises(FileExistsError):
                probe.write_report(path, {"replacement": True})
            link = Path(directory) / "link.json"
            os.symlink(path, link)
            with self.assertRaises(FileExistsError):
                probe.write_report(link, {})
            self.assertEqual(json.loads(path.read_text()), {"fixture": True})


if __name__ == "__main__":
    unittest.main()
